import logging
from sql_assistant.models import ConversationSession, QueryHistory

logger = logging.getLogger('sql_assistant')


class ConversationManager:

    def get_context(self, conversation_id):
        """
        Retrieves the conversation context to provide to the NLToSQL service.
        Returns a dict with previous query details, or None if no history exists.
        """
        if not conversation_id:
            return None

        try:
            # Verify or create the conversation session
            session, created = ConversationSession.objects.get_or_create(id=conversation_id)
            if created:
                logger.info("Created new conversation session: %s", conversation_id)
                return None

            # Get the last successful query in this conversation
            last_query = QueryHistory.objects.filter(
                conversation_id=conversation_id,
                is_successful=True
            ).order_by('-created_at').first()

            if not last_query:
                return None

            # Build result summary (e.g., "12 rows. Columns: month, total_revenue")
            col_list = last_query.result_preview.get('columns', [])
            row_count = last_query.result_rows
            result_summary = f"{row_count} rows. Columns: {', '.join(col_list)}"

            context = {
                'previous_question': last_query.question,
                'previous_sql': last_query.generated_sql,
                'result_summary': result_summary,
            }
            logger.info("Loaded conversation context for conversation: %s", conversation_id)
            return context

        except Exception as e:
            logger.error("Error retrieving conversation context for session %s: %s", conversation_id, str(e))
            return None

    def get_or_create_session(self, conversation_id=None):
        """
        Gets or creates a ConversationSession instance.
        """
        if conversation_id:
            session, _ = ConversationSession.objects.get_or_create(id=conversation_id)
            return session
        return ConversationSession.objects.create()
