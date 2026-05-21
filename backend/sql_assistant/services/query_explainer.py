import logging
from django.conf import settings
from groq import Groq

logger = logging.getLogger('sql_assistant')

EXPLAIN_PROMPT = """You are a data analyst explaining SQL queries to non-technical business users.

Given a SQL query, provide:
1. A brief plain-English summary (2-3 sentences) of what the query does.
2. A step-by-step breakdown where each step explains one clause (FROM, JOIN, WHERE, GROUP BY, ORDER BY, LIMIT, etc.).

Format your response exactly like this:
SUMMARY: <your summary here>

STEPS:
- Step 1: <explanation>
- Step 2: <explanation>
- Step 3: <explanation>

Do not include the SQL itself in the explanation. Use business-friendly language."""


class QueryExplainer:

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

    def explain(self, sql):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {'role': 'system', 'content': EXPLAIN_PROMPT},
                {'role': 'user', 'content': f"Explain this SQL query:\n\n{sql}"},
            ],
            temperature=0.2,
            max_tokens=512,
        )

        raw = response.choices[0].message.content.strip()
        return self._parse_explanation(raw)

    def _parse_explanation(self, raw):
        summary = raw
        steps = []

        if 'SUMMARY:' in raw:
            parts = raw.split('STEPS:', 1)
            summary_part = parts[0].replace('SUMMARY:', '').strip()
            summary = summary_part

            if len(parts) > 1:
                step_lines = parts[1].strip().split('\n')
                for line in step_lines:
                    line = line.strip().lstrip('- ').strip()
                    if line:
                        steps.append(line)

        return {
            'summary': summary,
            'steps': steps,
        }
