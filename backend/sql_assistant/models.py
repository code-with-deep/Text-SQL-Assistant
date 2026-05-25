import uuid
from django.conf import settings
from django.db import models


class QueryHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='query_history',
    )
    question = models.TextField()
    generated_sql = models.TextField()
    explanation = models.TextField(blank=True)
    result_preview = models.JSONField(default=dict, blank=True)
    chart_type = models.CharField(max_length=20, blank=True)
    chart_config = models.JSONField(default=dict, blank=True)
    safety_report = models.JSONField(default=dict, blank=True)
    result_rows = models.IntegerField(default=0)
    execution_ms = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    is_successful = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    conversation_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'query_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='query_histo_user_id_2f4f6b_idx'),
            models.Index(fields=['is_favorite']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.question[:80]}..."


class ConversationSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='conversation_sessions',
    )
    context = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversation_sessions'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Session {str(self.id)[:8]}"
