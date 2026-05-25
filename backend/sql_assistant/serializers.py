from rest_framework import serializers
from sql_assistant.models import QueryHistory, ConversationSession


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128, write_only=True)


class QueryRequestSerializer(serializers.Serializer):
    question = serializers.CharField(
        max_length=2000,
        required=True,
        error_messages={'required': 'A query question is required.'}
    )
    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None
    )


class ManualSQLRequestSerializer(serializers.Serializer):
    sql = serializers.CharField(
        max_length=5000,
        required=True,
        error_messages={'required': 'SQL query string is required.'}
    )
    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None
    )


class QueryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QueryHistory
        fields = [
            'id',
            'question',
            'generated_sql',
            'explanation',
            'result_preview',
            'chart_type',
            'chart_config',
            'safety_report',
            'result_rows',
            'execution_ms',
            'is_favorite',
            'is_successful',
            'error_message',
            'conversation_id',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'generated_sql',
            'explanation',
            'result_preview',
            'chart_type',
            'chart_config',
            'safety_report',
            'result_rows',
            'execution_ms',
            'is_successful',
            'error_message',
            'created_at',
        ]


class ConversationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationSession
        fields = ['id', 'context', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
