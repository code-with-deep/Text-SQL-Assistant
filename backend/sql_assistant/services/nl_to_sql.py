import re
import logging
from django.conf import settings
from groq import Groq

logger = logging.getLogger('sql_assistant')

SYSTEM_PROMPT = """You are an expert PostgreSQL query generator. Given a database schema and a user question, generate the correct SQL query.

CRITICAL — USER DATA ISOLATION:
- Every ecommerce table (customers, products, orders, order_items, reviews) has a "user_id" column.
- You will be given the current USER_ID. You MUST include WHERE user_id = {{USER_ID}} on every table that has a user_id column.
- The "categories" table does NOT have a user_id column — do not filter it.
- For JOINs across user-scoped tables, ensure EACH table in the JOIN has user_id filtered.
- For ORDER_ITEMS: filter via JOIN to orders (order_items does not have its own user_id, but orders does).
- NEVER omit the user_id filter. This is a hard security requirement.

Rules:
- Output ONLY the raw SQL query. No markdown fences, no explanation, no comments.
- Only SELECT statements. Never use DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, GRANT, REVOKE.
- Always include LIMIT (default 100 unless the user specifies a number).
- Use table aliases for multi-table queries (c for customers, p for products, o for orders, oi for order_items, r for reviews, cat for categories).
- Use COALESCE for potentially null aggregations.
- For date grouping use TO_CHAR (e.g. TO_CHAR(order_date, 'YYYY-MM')).
- For case-insensitive text matching use ILIKE (e.g. name ILIKE '%search%').
- Compute relative dates with CURRENT_DATE (e.g. CURRENT_DATE - INTERVAL '90 days').
- Prefer explicit JOIN ... ON over implicit joins.
- Always alias computed columns (e.g. SUM(total_amount) AS total_revenue).
- Use PostgreSQL syntax: ::type casts, INTERVAL, ILIKE, DATE_TRUNC, EXTRACT, etc.
- Do not use SQLite syntax (no strftime, no date('now'), no CAST AS REAL).
- Do not include a trailing semicolon."""


class NLToSQL:

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    def generate(self, question, schema_summary, user_id, conversation_context=None):
        """Generate SQL from natural language. user_id is ALWAYS from JWT."""
        prompt = self._build_prompt(question, schema_summary, user_id, conversation_context)

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

    def _build_prompt(self, question, schema_summary, user_id, conversation_context=None):
        user_context = f"\n--- CURRENT USER ---\nUSER_ID = {user_id}\nAll queries MUST filter by user_id = {user_id} on every user-scoped table.\n"

        if conversation_context and conversation_context.get('previous_sql'):
            return (
                f"--- DATABASE SCHEMA ---\n{schema_summary}\n"
                f"{user_context}\n"
                f"--- PREVIOUS CONTEXT ---\n"
                f"Previous question: {conversation_context['previous_question']}\n"
                f"Previous SQL: {conversation_context['previous_sql']}\n"
                f"Previous result summary: {conversation_context.get('result_summary', 'N/A')}\n\n"
                f"--- FOLLOW-UP QUESTION ---\n{question}\n\n"
                f"Modify the previous SQL to address the follow-up. Return only the new SQL. "
                f"IMPORTANT: Keep the WHERE user_id = {user_id} filter in all tables."
            )

        return (
            f"--- DATABASE SCHEMA ---\n{schema_summary}\n"
            f"{user_context}\n"
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
