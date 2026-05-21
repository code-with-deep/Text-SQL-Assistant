import re
import logging
from django.conf import settings
from groq import Groq

logger = logging.getLogger('sql_assistant')

SYSTEM_PROMPT = """You are an expert PostgreSQL query generator. Given a database schema and a user question, generate the correct SQL query.

Rules:
- Output ONLY the raw SQL query. No markdown fences, no explanation, no comments.
- Only SELECT statements. Never use DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, GRANT, REVOKE.
- Always include LIMIT (default 100 unless the user specifies a number).
- Use table aliases for multi-table queries (c for customers, p for products, o for orders, oi for order_items, r for reviews, cat for categories).
- Use COALESCE for potentially null aggregations.
- Use DATE_TRUNC for date grouping.
- Use ILIKE for case-insensitive text matching.
- Compute relative dates with CURRENT_DATE (e.g. CURRENT_DATE - INTERVAL '90 days').
- Prefer explicit JOIN ... ON over implicit joins.
- Always alias computed columns (e.g. SUM(total_amount) AS total_revenue).
- Do not include a trailing semicolon."""


class NLToSQL:

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    def generate(self, question, schema_summary, conversation_context=None):
        prompt = self._build_prompt(question, schema_summary, conversation_context)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt},
            ],
            temperature=0.0,
            max_tokens=1024,
        )

        raw = response.choices[0].message.content.strip()
        sql = self._extract_sql(raw)
        logger.info("Generated SQL for question: %s", question[:80])
        return sql

    def fix_sql(self, original_sql, error_message, schema_summary):
        prompt = (
            f"The following SQL query failed.\n\n"
            f"Error: {error_message}\n\n"
            f"Failed SQL:\n{original_sql}\n\n"
            f"Database Schema:\n{schema_summary}\n\n"
            f"Fix the query to resolve the error. Return ONLY the corrected SQL."
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt},
            ],
            temperature=0.0,
            max_tokens=1024,
        )

        raw = response.choices[0].message.content.strip()
        return self._extract_sql(raw)

    def _build_prompt(self, question, schema_summary, conversation_context=None):
        if conversation_context and conversation_context.get('previous_sql'):
            return (
                f"--- DATABASE SCHEMA ---\n{schema_summary}\n\n"
                f"--- PREVIOUS CONTEXT ---\n"
                f"Previous question: {conversation_context['previous_question']}\n"
                f"Previous SQL: {conversation_context['previous_sql']}\n"
                f"Previous result summary: {conversation_context.get('result_summary', 'N/A')}\n\n"
                f"--- FOLLOW-UP QUESTION ---\n{question}\n\n"
                f"Modify the previous SQL to address the follow-up. Return only the new SQL."
            )

        return (
            f"--- DATABASE SCHEMA ---\n{schema_summary}\n\n"
            f"--- QUESTION ---\n{question}"
        )

    def _extract_sql(self, raw):
        raw = raw.strip()

        fence_pattern = re.compile(r'```(?:sql)?\s*\n?(.*?)\n?```', re.DOTALL | re.IGNORECASE)
        match = fence_pattern.search(raw)
        if match:
            raw = match.group(1).strip()

        raw = raw.rstrip(';').strip()
        return raw
