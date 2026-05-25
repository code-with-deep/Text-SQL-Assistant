import time
import logging
from decimal import Decimal
from datetime import date, datetime
from django.conf import settings
from django.db import connections

logger = logging.getLogger('sql_assistant')


def _serialize_value(val):
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    return val


def _readonly_alias():
    """Return the alias to use for read-only queries."""
    return 'readonly' if 'readonly' in settings.DATABASES else 'default'


class QueryExecutor:

    def execute(self, sql):
        start = time.perf_counter()
        alias = _readonly_alias()

        with connections[alias].cursor() as cursor:
            # Enforce PostgreSQL statement timeout
            cursor.execute(f"SET statement_timeout = '{settings.QUERY_TIMEOUT_SECONDS}s'")
            cursor.execute(sql)

            columns = [col[0] for col in cursor.description]
            raw_rows = cursor.fetchmany(settings.MAX_QUERY_ROWS)

        elapsed_ms = int((time.perf_counter() - start) * 1000)

        rows = [
            {columns[i]: _serialize_value(v) for i, v in enumerate(row)}
            for row in raw_rows
        ]

        logger.info("Query executed — %d rows in %dms", len(rows), elapsed_ms)
        return {
            'columns': columns,
            'rows': rows,
            'row_count': len(rows),
            'execution_ms': elapsed_ms,
        }
