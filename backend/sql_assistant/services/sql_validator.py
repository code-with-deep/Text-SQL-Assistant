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

# Tables that have a user_id column and MUST be filtered
USER_SCOPED_TABLES = {'customers', 'products', 'orders', 'reviews'}

# order_items inherits scope via JOIN to orders — not directly filtered
# categories are shared — no user_id filter


class SQLValidator:

    def validate(self, sql, user_id=None):
        checks = []

        raw_sql = sql.strip()
        if not raw_sql:
            return self._fail('SQL query is empty', checks, sql, 'parse_check')

        clean = sqlparse.format(raw_sql, strip_comments=True).strip()
        stripped = clean.rstrip(';').strip()
        if ';' in stripped:
            return self._fail('Stacked queries are not permitted', checks, sql, 'injection_check')

        parsed = sqlparse.parse(clean)
        if not parsed or not parsed[0].tokens:
            return self._fail('SQL could not be parsed', checks, sql, 'parse_check')

        checks.append({'name': 'Parse Check', 'status': 'pass', 'detail': 'Valid SQL syntax'})

        if len(parsed) != 1:
            return self._fail('Only one SQL statement is permitted', checks, sql, 'injection_check')

        statement = parsed[0]
        if statement.get_type() != 'SELECT':
            return self._fail('Only SELECT queries are allowed', checks, sql, 'query_type_check')

        checks.append({'name': 'Query Type Check', 'status': 'pass', 'detail': 'SELECT statement'})

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

        if re.search(r'\bUNION\b\s+(ALL\s+)?\bSELECT\b', clean, re.IGNORECASE):
            return self._fail('UNION-based pattern detected', checks, sql, 'injection_check')

        checks.append({'name': 'Injection Check', 'status': 'pass', 'detail': 'No injection patterns'})

        # LIMIT enforcement
        limit_match = re.search(r'\bLIMIT\b\s+(\d+)', clean, re.IGNORECASE)
        if not limit_match:
            clean = f"{stripped} LIMIT {settings.MAX_QUERY_ROWS}"
            checks.append({
                'name': 'Limit Check', 'status': 'pass',
                'detail': f'LIMIT {settings.MAX_QUERY_ROWS} auto-appended',
            })
        else:
            requested_limit = int(limit_match.group(1))
            if requested_limit > settings.MAX_QUERY_ROWS:
                clean = (
                    clean[:limit_match.start(1)]
                    + str(settings.MAX_QUERY_ROWS)
                    + clean[limit_match.end(1):]
                )
                checks.append({
                    'name': 'Limit Check',
                    'status': 'pass',
                    'detail': f'LIMIT reduced from {requested_limit} to {settings.MAX_QUERY_ROWS}',
                })
            else:
                checks.append({'name': 'Limit Check', 'status': 'pass', 'detail': 'LIMIT clause present'})

        if re.search(r'\bCROSS\s+JOIN\b', clean, re.IGNORECASE):
            return self._fail(
                'CROSS JOIN detected — potential cartesian product',
                checks, sql, 'resource_check',
            )

        checks.append({'name': 'Resource Check', 'status': 'pass', 'detail': 'No dangerous patterns'})

        # ------------------------------------------------------------------
        # USER_ID ENFORCEMENT: The critical security sieve
        # ------------------------------------------------------------------
        if user_id is not None:
            clean = self._enforce_user_id(clean, user_id)
            checks.append({
                'name': 'User Isolation Check', 'status': 'pass',
                'detail': f'user_id = {user_id} enforced on all scoped tables',
            })

        tables_accessed = self._extract_tables(clean)

        report = {
            'query_type': 'SELECT',
            'tables_accessed': tables_accessed,
            'passed': True,
            'is_safe': True,
            'is_select_only': True,
            'has_limit': True,
            'no_blocked_keywords': True,
            'no_sql_injection': True,
            'details': {},
            'checks': checks,
        }

        logger.info("SQL validation passed — tables: %s", tables_accessed)
        return True, clean, '', report

    def _enforce_user_id(self, sql, user_id):
        """
        Safety net: ensures every user-scoped table in the query has a
        WHERE user_id = <user_id> filter. If the LLM forgot one, inject it.

        Strategy:
        1. Find all tables referenced in the query that are user-scoped.
        2. For each, check if user_id = <user_id> already appears.
        3. If not, inject it into the WHERE clause.
        """
        tables_in_query = self._extract_tables_with_aliases(sql)
        user_id_str = str(user_id)

        for table_name, alias in tables_in_query:
            if table_name.lower() not in USER_SCOPED_TABLES:
                continue

            # The prefix to look for in the WHERE clause
            prefix = f"{alias}." if alias else ""
            col_ref = f"{prefix}user_id"

            # Check if user_id filter already exists for this table/alias
            # Match patterns like: alias.user_id = 123 or user_id = 123
            pattern = re.compile(
                rf'\b{re.escape(col_ref)}\s*=\s*{re.escape(user_id_str)}\b',
                re.IGNORECASE,
            )
            if pattern.search(sql):
                continue  # Already filtered

            # Also check without alias if there's only one user-scoped table
            if not alias:
                bare_pattern = re.compile(
                    rf'\buser_id\s*=\s*{re.escape(user_id_str)}\b',
                    re.IGNORECASE,
                )
                if bare_pattern.search(sql):
                    continue

            # Need to inject user_id filter
            injection = f"{col_ref} = {user_id_str}"

            # Check if WHERE clause exists
            where_match = re.search(r'\bWHERE\b', sql, re.IGNORECASE)
            if where_match:
                # Inject after WHERE as an AND condition
                insert_pos = where_match.end()
                sql = sql[:insert_pos] + f" {injection} AND" + sql[insert_pos:]
            else:
                # Need to add WHERE before GROUP BY, ORDER BY, HAVING, LIMIT, or end
                end_clause = re.search(
                    r'\b(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT)\b',
                    sql, re.IGNORECASE,
                )
                if end_clause:
                    insert_pos = end_clause.start()
                    sql = sql[:insert_pos] + f"WHERE {injection} " + sql[insert_pos:]
                else:
                    # Append before LIMIT if it was auto-appended
                    limit_match = re.search(r'\bLIMIT\b', sql, re.IGNORECASE)
                    if limit_match:
                        insert_pos = limit_match.start()
                        sql = sql[:insert_pos] + f"WHERE {injection} " + sql[insert_pos:]
                    else:
                        sql += f" WHERE {injection}"

            logger.info("Injected user_id filter for table %s (alias=%s)", table_name, alias)

        return sql

    def _extract_tables_with_aliases(self, sql):
        """
        Extract (table_name, alias_or_empty) tuples from FROM and JOIN clauses.
        Returns list of (table_name, alias) tuples.
        """
        results = []

        # Pattern matches: FROM/JOIN "tablename" [AS] alias
        pattern = re.compile(
            r'\b(?:FROM|JOIN)\s+"?(\w+)"?'
            r'(?:\s+(?:AS\s+)?(\w+))?',
            re.IGNORECASE,
        )
        for match in pattern.finditer(sql):
            table_name = match.group(1)
            alias = match.group(2) or ''
            # Skip keywords that might match as alias
            if alias.upper() in ('ON', 'WHERE', 'SET', 'JOIN', 'LEFT', 'RIGHT',
                                 'INNER', 'OUTER', 'CROSS', 'FULL', 'GROUP',
                                 'ORDER', 'HAVING', 'LIMIT', 'AND', 'OR'):
                alias = ''
            results.append((table_name, alias))

        return results

    def _fail(self, reason, checks, sql, failed_check_name):
        checks.append({'name': failed_check_name.replace('_', ' ').title(), 'status': 'fail', 'detail': reason})
        report = {
            'query_type': 'UNKNOWN',
            'tables_accessed': [],
            'passed': False,
            'is_safe': False,
            'is_select_only': failed_check_name != 'query_type_check',
            'has_limit': False,
            'no_blocked_keywords': failed_check_name != 'keyword_check',
            'no_sql_injection': failed_check_name != 'injection_check',
            'details': {
                'reason': reason,
            },
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
