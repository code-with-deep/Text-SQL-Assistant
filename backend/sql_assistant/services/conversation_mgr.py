import logging
from sql_assistant.models import ConversationSession, QueryHistory

logger = logging.getLogger('sql_assistant')


class ConversationManager:

    def get_context(self, conversation_id, user=None):
        """
        Retrieves the conversation context to provide to the NLToSQL service.
        Returns a dict with previous query details, or None if no history exists.
        """
        if not conversation_id:
            return None

        try:
            session, created = ConversationSession.objects.get_or_create(
                id=conversation_id,
                defaults={'user': user if user and user.is_authenticated else None},
            )
            if created:
                logger.info("Created new conversation session: %s", conversation_id)
                return None

            if user and user.is_authenticated and session.user_id and session.user_id != user.id:
                logger.warning("Conversation session %s does not belong to user %s", conversation_id, user.id)
                return None

            # Get the last successful query in this conversation
            history_filter = {
                'conversation_id': conversation_id,
                'is_successful': True,
            }
            if user and user.is_authenticated:
                history_filter['user'] = user

            last_query = QueryHistory.objects.filter(**history_filter).order_by('-created_at').first()

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
                'user_id': user.id if user and user.is_authenticated else None,
            }
            logger.info("Loaded conversation context for conversation: %s", conversation_id)
            return context

        except Exception as e:
            logger.error("Error retrieving conversation context for session %s: %s", conversation_id, str(e))
            return None

    def get_or_create_session(self, conversation_id=None, user=None):
        """
        Gets or creates a ConversationSession instance.
        """
        session_user = user if user and user.is_authenticated else None
        if conversation_id:
            session, _ = ConversationSession.objects.get_or_create(
                id=conversation_id,
                defaults={'user': session_user},
            )
            if session_user and session.user_id != session_user.id:
                session.user = session_user
                session.save(update_fields=['user', 'updated_at'])
            return session
        return ConversationSession.objects.create(user=session_user)
