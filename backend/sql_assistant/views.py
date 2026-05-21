import logging
import uuid
from rest_framework import viewsets, status, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import exception_handler
from django.http import HttpResponse
from django.db import connections

from sql_assistant.models import QueryHistory
from sql_assistant.serializers import (
    QueryRequestSerializer,
    ManualSQLRequestSerializer,
    QueryHistorySerializer
)
from sql_assistant.services import (
    SchemaInspector,
    NLToSQL,
    SQLValidator,
    QueryExecutor,
    QueryExplainer,
    ChartDetector,
    ConversationManager,
    SuggestionGenerator,
    ExportEngine
)

logger = logging.getLogger('sql_assistant')


def custom_exception_handler(exc, context):
    """
    Standardizes error responses across all API endpoints, logging unhandled exceptions.
    """
    response = exception_handler(exc, context)
    if response is not None:
        response.data['status_code'] = response.status_code
    else:
        logger.error("Unhandled server exception: %s", str(exc), exc_info=True)
        response = Response(
            {
                'detail': 'An unexpected server error occurred.',
                'error': str(exc)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return response


class SchemaViewSet(viewsets.ViewSet):
    """
    Provides introspection endpoints to access schema summaries,
    table details, statistics, and example question suggestions.
    """
    
    def list(self, request):
        """
        GET /api/schema/
        Returns cached, introspected tables and relationships.
        """
        inspector = SchemaInspector()
        schema = inspector.get_schema()
        return Response(schema)

    @action(detail=False, methods=['get'], url_path='tables/(?P<table_name>[^/.]+)')
    def get_table_details(self, request, table_name=None):
        """
        GET /api/schema/tables/{table_name}/
        Returns specific column statistics and preview rows for the specified table.
        """
        inspector = SchemaInspector()
        table_detail = inspector.get_table_detail(table_name)
        if not table_detail:
            return Response(
                {'detail': f"Table '{table_name}' was not found in schema."},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(table_detail)

    @action(detail=False, methods=['get'], url_path='suggestions')
    def suggestions(self, request):
        """
        GET /api/schema/suggestions/
        Returns contextually generated example question chips.
        """
        generator = SuggestionGenerator()
        suggestions = generator.generate()
        return Response({'suggestions': suggestions})


class QueryViewSet(viewsets.ViewSet):
    """
    Coordinates the natural language to SQL generation, validation, 
    execution, explanation, and visualization pipeline.
    """

    def create(self, request):
        """
        POST /api/query/
        Translates NL question → SQL → Validates → Executes → Auto-Visualizes → Explains.
        """
        serializer = QueryRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data['question']
        conversation_id = serializer.validated_data['conversation_id']

        # Initialize services
        schema_inspector = SchemaInspector()
        nl_to_sql = NLToSQL()
        sql_validator = SQLValidator()
        query_executor = QueryExecutor()
        chart_detector = ChartDetector()
        query_explainer = QueryExplainer()
        conversation_mgr = ConversationManager()

        # Load context
        schema_summary = schema_inspector.get_prompt_summary()
        conversation_context = conversation_mgr.get_context(conversation_id)

        # 1. Generate SQL
        try:
            generated_sql = nl_to_sql.generate(question, schema_summary, conversation_context)
        except Exception as e:
            logger.error("LLM SQL generation failed: %s", str(e), exc_info=True)
            return Response(
                {'detail': 'Failed to translate question into SQL using the AI engine.', 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 2. Validate SQL
        is_safe, validated_sql, safety_error, safety_report = sql_validator.validate(generated_sql)
        if not is_safe:
            # Log failed validation attempt
            QueryHistory.objects.create(
                question=question,
                generated_sql=generated_sql,
                is_successful=False,
                error_message=f"Safety violation: {safety_error}",
                safety_report=safety_report,
                conversation_id=conversation_id
            )
            return Response(
                {
                    'detail': 'The generated SQL failed our multi-layer safety check.',
                    'error': safety_error,
                    'sql': generated_sql,
                    'safety_report': safety_report
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Execute SQL (with auto-retry block)
        execution_results = None
        db_error_message = ""
        is_successful = True

        try:
            execution_results = query_executor.execute(validated_sql)
        except Exception as first_error:
            logger.warning("Query execution failed. Attempting LLM self-correction: %s", str(first_error))
            db_error_message = str(first_error)
            
            # Retry mechanism: Ask LLM to correct its own query
            try:
                fixed_sql = nl_to_sql.fix_sql(validated_sql, db_error_message, schema_summary)
                is_safe, re_validated_sql, safety_error, safety_report = sql_validator.validate(fixed_sql)
                
                if is_safe:
                    validated_sql = re_validated_sql
                    execution_results = query_executor.execute(validated_sql)
                    is_successful = True
                    db_error_message = ""
                    logger.info("LLM self-correction succeeded!")
                else:
                    is_successful = False
                    db_error_message = f"Correction validation failed: {safety_error}"
            except Exception as retry_error:
                is_successful = False
                db_error_message = f"Query failed after self-correction: {str(retry_error)}"
                logger.error("LLM self-correction failed: %s", db_error_message)

        # If execution ultimately failed
        if not is_successful or not execution_results:
            QueryHistory.objects.create(
                question=question,
                generated_sql=validated_sql,
                is_successful=False,
                error_message=db_error_message,
                safety_report=safety_report,
                conversation_id=conversation_id
            )
            return Response(
                {
                    'detail': 'Database execution failed.',
                    'error': db_error_message,
                    'sql': validated_sql
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Generate Explanations and Chart Recommendations in parallel (logical)
        columns = execution_results['columns']
        rows = execution_results['rows']
        row_count = execution_results['row_count']
        exec_ms = execution_results['execution_ms']

        try:
            chart_config = chart_detector.detect(columns, rows)
        except Exception as e:
            logger.error("Chart detection failed: %s", str(e))
            chart_config = {'chart_type': 'table', 'x_axis': None, 'y_axis': None, 'metrics': None, 'title': 'Data Table'}

        try:
            explanation_data = query_explainer.explain(validated_sql)
            explanation = explanation_data.get('summary', '')
        except Exception as e:
            logger.error("Query explanation failed: %s", str(e))
            explanation = "This query fetches the requested data from the database."

        # Keep a preview subset for QueryHistory (to avoid database bloating)
        preview_limit = 100
        result_preview = {
            'columns': columns,
            'rows': rows[:preview_limit],
            'truncated': row_count > preview_limit
        }

        # 5. Save History & Session
        history_record = QueryHistory.objects.create(
            question=question,
            generated_sql=validated_sql,
            explanation=explanation,
            result_preview=result_preview,
            chart_type=chart_config['chart_type'],
            chart_config=chart_config,
            safety_report=safety_report,
            result_rows=row_count,
            execution_ms=exec_ms,
            is_successful=True,
            conversation_id=conversation_id
        )

        # Ensure ConversationSession is linked
        if conversation_id:
            conversation_mgr.get_or_create_session(conversation_id)

        # Build response payload
        return Response(
            {
                'query_id': history_record.id,
                'sql': validated_sql,
                'explanation': explanation_data if 'explanation_data' in locals() else {'summary': explanation, 'steps': []},
                'results': {
                    'columns': columns,
                    'rows': rows,
                    'row_count': row_count
                },
                'chart_config': chart_config,
                'safety_report': safety_report,
                'execution_ms': exec_ms,
                'conversation_id': conversation_id or history_record.conversation_id
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='execute-sql')
    def execute_sql(self, request):
        """
        POST /api/query/execute-sql/
        Executes manual custom SQL queries directly against the read-only DB after validation.
        """
        serializer = ManualSQLRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sql_input = serializer.validated_data['sql']
        conversation_id = serializer.validated_data['conversation_id']

        sql_validator = SQLValidator()
        query_executor = QueryExecutor()
        chart_detector = ChartDetector()
        query_explainer = QueryExplainer()

        # 1. Validate SQL
        is_safe, validated_sql, safety_error, safety_report = sql_validator.validate(sql_input)
        if not is_safe:
            return Response(
                {
                    'detail': 'Safety validation failed.',
                    'error': safety_error,
                    'safety_report': safety_report
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Execute SQL
        try:
            execution_results = query_executor.execute(validated_sql)
        except Exception as e:
            return Response(
                {
                    'detail': 'Database execution error.',
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        columns = execution_results['columns']
        rows = execution_results['rows']
        row_count = execution_results['row_count']
        exec_ms = execution_results['execution_ms']

        # 3. Detect and explain
        chart_config = chart_detector.detect(columns, rows)
        explanation_data = query_explainer.explain(validated_sql)
        explanation = explanation_data.get('summary', '')

        # Keep subset preview
        preview_limit = 100
        result_preview = {
            'columns': columns,
            'rows': rows[:preview_limit],
            'truncated': row_count > preview_limit
        }

        # 4. Save to QueryHistory
        history_record = QueryHistory.objects.create(
            question="Manual SQL Query Execution",
            generated_sql=validated_sql,
            explanation=explanation,
            result_preview=result_preview,
            chart_type=chart_config['chart_type'],
            chart_config=chart_config,
            safety_report=safety_report,
            result_rows=row_count,
            execution_ms=exec_ms,
            is_successful=True,
            conversation_id=conversation_id
        )

        return Response(
            {
                'query_id': history_record.id,
                'sql': validated_sql,
                'explanation': explanation_data,
                'results': {
                    'columns': columns,
                    'rows': rows,
                    'row_count': row_count
                },
                'chart_config': chart_config,
                'safety_report': safety_report,
                'execution_ms': exec_ms,
                'conversation_id': conversation_id
            },
            status=status.HTTP_200_OK
        )


class HistoryViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    Exposes paginated endpoints to inspect past query history logs, 
    with capabilities to search and bookmark favorites.
    """
    queryset = QueryHistory.objects.all()
    serializer_class = QueryHistorySerializer

    def get_queryset(self):
        queryset = QueryHistory.objects.all()
        
        # Apply filters
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(question__icontains=search) | queryset.filter(generated_sql__icontains=search)
            
        is_favorite = self.request.query_params.get('is_favorite')
        if is_favorite is not None:
            queryset = queryset.filter(is_favorite=is_favorite.lower() == 'true')
            
        is_successful = self.request.query_params.get('is_successful')
        if is_successful is not None:
            queryset = queryset.filter(is_successful=is_successful.lower() == 'true')

        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        return queryset

    @action(detail=True, methods=['post'], url_path='favorite')
    def favorite(self, request, pk=None):
        """
        POST /api/history/{id}/favorite/
        Toggles the bookmark favorite status of a logged query.
        """
        try:
            query_log = self.get_object()
            query_log.is_favorite = not query_log.is_favorite
            query_log.save()
            return Response(
                {
                    'id': query_log.id,
                    'is_favorite': query_log.is_favorite,
                    'detail': 'Favorite status updated successfully.'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ExportView(APIView):
    """
    Generates high-performance CSV and styled Excel downloads from executed queries.
    """

    def post(self, request):
        """
        POST /api/export/
        Params:
        - sql (string, required)
        - format (string: 'csv' | 'excel', default: 'csv')
        """
        sql = request.data.get('sql')
        export_format = request.data.get('format', 'csv').lower()

        if not sql:
            return Response({'detail': 'SQL query string is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validate SQL
        sql_validator = SQLValidator()
        is_safe, validated_sql, safety_error, _ = sql_validator.validate(sql)
        if not is_safe:
            return Response({'detail': f"SQL safety check failed: {safety_error}"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Execute SQL
        query_executor = QueryExecutor()
        try:
            results = query_executor.execute(validated_sql)
        except Exception as e:
            return Response({'detail': f"Database execution error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        columns = results['columns']
        rows = results['rows']

        # 3. Formulate file response
        export_engine = ExportEngine()
        
        if export_format == 'excel':
            try:
                excel_bytes = export_engine.export_excel(columns, rows)
                response = HttpResponse(
                    excel_bytes,
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="query_results.xlsx"'
                return response
            except Exception as e:
                return Response({'detail': f"Excel build failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                csv_bytes = export_engine.export_csv(columns, rows)
                response = HttpResponse(csv_bytes, content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="query_results.csv"'
                return response
            except Exception as e:
                return Response({'detail': f"CSV build failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HealthView(APIView):
    """
    Performs quick heartbeats on primary and read-only connections.
    """

    def get(self, request):
        """
        GET /api/health/
        Returns connectivity status of the system.
        """
        services_status = {}
        overall_status = "ok"

        # Check default DB connection
        try:
            connections['default'].ensure_connection()
            services_status['postgres_default'] = 'connected'
        except Exception as e:
            services_status['postgres_default'] = f"failed: {str(e)}"
            overall_status = "error"

        # Check read-only DB connection
        try:
            connections['readonly'].ensure_connection()
            services_status['postgres_readonly'] = 'connected'
        except Exception as e:
            services_status['postgres_readonly'] = f"failed: {str(e)}"
            overall_status = "error"

        http_status = status.HTTP_200_OK if overall_status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                'status': overall_status,
                'services': services_status
            },
            status=http_status
        )
