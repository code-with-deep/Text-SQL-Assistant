import re
import logging
import sqlparse
from sqlparse.tokens import DDL, DML
from django.conf import settings

logger = logging.getLogger('sql_assistant')

BLOCKED_KEYWORDS = {
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER',
    'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
}


class SQLValidator:

    def validate(self, sql):
        checks = []

        parsed = sqlparse.parse(sql.strip())
        if not parsed or not parsed[0].tokens:
            return self._fail('SQL could not be parsed', checks, sql, 'parse_check')

        checks.append({'name': 'Parse Check', 'status': 'pass', 'detail': 'Valid SQL syntax'})

        for statement in parsed:
            for token in statement.flatten():
                if token.ttype in (DDL, DML):
                    word = token.normalized.upper()
                    if word in BLOCKED_KEYWORDS:
                        return self._fail(
                            f'Blocked operation: {word}',
                            checks, sql, 'keyword_check',
                        )

        checks.append({'name': 'Keyword Check', 'status': 'pass', 'detail': 'No blocked keywords found'})

        clean = sqlparse.format(sql, strip_comments=True).strip()

        stripped = clean.rstrip(';')
        if ';' in stripped:
            return self._fail('Stacked queries are not permitted', checks, sql, 'injection_check')

        if re.search(r'\bUNION\b\s+(ALL\s+)?\bSELECT\b', clean, re.IGNORECASE):
            return self._fail('UNION-based pattern detected', checks, sql, 'injection_check')

        checks.append({'name': 'Injection Check', 'status': 'pass', 'detail': 'No injection patterns'})

        has_limit = bool(re.search(r'\bLIMIT\b\s+\d+', clean, re.IGNORECASE))
        if not has_limit:
            clean = f"{stripped} LIMIT {settings.MAX_QUERY_ROWS}"
            checks.append({
                'name': 'Limit Check', 'status': 'pass',
                'detail': f'LIMIT {settings.MAX_QUERY_ROWS} auto-appended',
            })
        else:
            checks.append({'name': 'Limit Check', 'status': 'pass', 'detail': 'LIMIT clause present'})

        if re.search(r'\bCROSS\s+JOIN\b', clean, re.IGNORECASE):
            return self._fail(
                'CROSS JOIN detected — potential cartesian product',
                checks, sql, 'resource_check',
            )

        checks.append({'name': 'Resource Check', 'status': 'pass', 'detail': 'No dangerous patterns'})

        tables_accessed = self._extract_tables(clean)

        report = {
            'query_type': 'SELECT',
            'tables_accessed': tables_accessed,
            'passed': True,
            'checks': checks,
        }

        logger.info("SQL validation passed — tables: %s", tables_accessed)
        return True, clean, '', report

    def _fail(self, reason, checks, sql, failed_check_name):
        checks.append({'name': failed_check_name.replace('_', ' ').title(), 'status': 'fail', 'detail': reason})
        report = {
            'query_type': 'UNKNOWN',
            'tables_accessed': [],
            'passed': False,
            'checks': checks,
        }
        logger.warning("SQL validation failed: %s", reason)
        return False, sql, reason, report

    def _extract_tables(self, sql):
        tables = set()
        pattern = re.compile(
            r'\b(?:FROM|JOIN)\s+"?(\w+)"?',
            re.IGNORECASE,
        )
        for match in pattern.finditer(sql):
            tables.add(match.group(1))
        return sorted(tables)
