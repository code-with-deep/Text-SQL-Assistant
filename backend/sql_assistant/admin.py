from django.contrib import admin
from sql_assistant.models import QueryHistory, ConversationSession


@admin.register(QueryHistory)
class QueryHistoryAdmin(admin.ModelAdmin):
    list_display = ('short_question', 'chart_type', 'result_rows', 'execution_ms', 'is_favorite', 'is_successful', 'created_at')
    list_filter = ('is_favorite', 'is_successful', 'chart_type')
    search_fields = ('question', 'generated_sql')
    readonly_fields = ('id', 'created_at')
    date_hierarchy = 'created_at'

    def short_question(self, obj):
        return obj.question[:100]
    short_question.short_description = 'Question'


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'updated_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
