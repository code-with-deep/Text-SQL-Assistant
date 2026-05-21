import logging
from django.conf import settings
from django.core.cache import cache
from django.db import connections

logger = logging.getLogger('sql_assistant')

SCHEMA_CACHE_KEY = 'introspected_schema'
SUMMARY_CACHE_KEY = 'schema_prompt_summary'


class SchemaInspector:

    def get_schema(self, force_refresh=False):
        if not force_refresh:
            cached = cache.get(SCHEMA_CACHE_KEY)
            if cached:
                return cached

        schema = self._introspect()
        cache.set(SCHEMA_CACHE_KEY, schema, settings.SCHEMA_CACHE_TTL)
        cache.set(SUMMARY_CACHE_KEY, self._build_summary(schema), settings.SCHEMA_CACHE_TTL)
        return schema

    def get_prompt_summary(self, force_refresh=False):
        if not force_refresh:
            cached = cache.get(SUMMARY_CACHE_KEY)
            if cached:
                return cached

        schema = self.get_schema(force_refresh=True)
        return cache.get(SUMMARY_CACHE_KEY)

    def refresh(self):
        return self.get_schema(force_refresh=True)

    def get_table_detail(self, table_name):
        schema = self.get_schema()
        table = schema.get('tables', {}).get(table_name)
        if not table:
            return None

        with connections['readonly'].cursor() as cursor:
            cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 10')
            columns = [col[0] for col in cursor.description]
            preview_rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

            stats = {}
            for col_info in table['columns']:
                col_name = col_info['name']
                col_type = col_info['type']
                try:
                    if col_type in ('integer', 'bigint', 'smallint', 'numeric', 'double precision', 'real'):
                        cursor.execute(
                            f'SELECT MIN("{col_name}"), MAX("{col_name}"), '
                            f'AVG("{col_name}"::numeric), COUNT(*) - COUNT("{col_name}"), '
                            f'COUNT(DISTINCT "{col_name}") FROM "{table_name}"'
                        )
                        row = cursor.fetchone()
                        stats[col_name] = {
                            'min': float(row[0]) if row[0] is not None else None,
                            'max': float(row[1]) if row[1] is not None else None,
                            'avg': round(float(row[2]), 2) if row[2] is not None else None,
                            'null_count': row[3],
                            'unique_count': row[4],
                        }
                    else:
                        cursor.execute(
                            f'SELECT COUNT(*) - COUNT("{col_name}"), '
                            f'COUNT(DISTINCT "{col_name}") FROM "{table_name}"'
                        )
                        row = cursor.fetchone()
                        stats[col_name] = {
                            'null_count': row[0],
                            'unique_count': row[1],
                        }
                except Exception:
                    stats[col_name] = {}

        table['preview_rows'] = preview_rows
        table['column_stats'] = stats
        return table

    def _introspect(self):
        tables = {}
        relationships = []

        with connections['readonly'].cursor() as cursor:
            cursor.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                AND table_name NOT IN ('django_migrations', 'django_content_type',
                    'auth_group', 'auth_group_permissions', 'auth_permission',
                    'auth_user', 'auth_user_groups', 'auth_user_user_permissions',
                    'django_admin_log', 'django_session',
                    'query_history', 'conversation_sessions')
                ORDER BY table_name
            """)
            table_names = [row[0] for row in cursor.fetchall()]

            for table_name in table_names:
                columns = self._get_columns(cursor, table_name)
                pk = self._get_primary_key(cursor, table_name)
                fks = self._get_foreign_keys(cursor, table_name)
                row_count = self._get_row_count(cursor, table_name)
                sample_rows = self._get_sample_rows(cursor, table_name)
                enum_values = self._get_enum_values(cursor, table_name, columns)

                for col in columns:
                    if col['name'] in enum_values:
                        col['enum_values'] = enum_values[col['name']]
                    if col['name'] == pk:
                        col['pk'] = True

                tables[table_name] = {
                    'columns': columns,
                    'primary_key': pk,
                    'foreign_keys': fks,
                    'row_count': row_count,
                    'sample_rows': sample_rows,
                }

                for fk in fks:
                    relationships.append({
                        'from_table': table_name,
                        'from_column': fk['column'],
                        'to_table': fk['references_table'],
                        'to_column': fk['references_column'],
                        'cardinality': 'N:1',
                    })

        logger.info("Schema introspected: %d tables, %d relationships", len(tables), len(relationships))
        return {'tables': tables, 'relationships': relationships}

    def _get_columns(self, cursor, table_name):
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, [table_name])
        return [
            {
                'name': row[0],
                'type': row[1],
                'nullable': row[2] == 'YES',
                'default': row[3],
                'pk': False,
            }
            for row in cursor.fetchall()
        ]

    def _get_primary_key(self, cursor, table_name):
        cursor.execute("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public'
            AND tc.table_name = %s
            AND tc.constraint_type = 'PRIMARY KEY'
            LIMIT 1
        """, [table_name])
        row = cursor.fetchone()
        return row[0] if row else None

    def _get_foreign_keys(self, cursor, table_name):
        cursor.execute("""
            SELECT
                kcu.column_name,
                ccu.table_name AS references_table,
                ccu.column_name AS references_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
                AND tc.table_schema = ccu.table_schema
            WHERE tc.table_schema = 'public'
            AND tc.table_name = %s
            AND tc.constraint_type = 'FOREIGN KEY'
        """, [table_name])
        return [
            {
                'column': row[0],
                'references_table': row[1],
                'references_column': row[2],
            }
            for row in cursor.fetchall()
        ]

    def _get_row_count(self, cursor, table_name):
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        return cursor.fetchone()[0]

    def _get_sample_rows(self, cursor, table_name, limit=5):
        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT {limit}')
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def _get_enum_values(self, cursor, table_name, columns):
        enum_values = {}
        for col in columns:
            if col['type'] in ('character varying', 'text') and not col['name'].endswith(('_id', 'email', 'name', 'description', 'comment')):
                try:
                    cursor.execute(
                        f'SELECT DISTINCT "{col["name"]}" FROM "{table_name}" '
                        f'WHERE "{col["name"]}" IS NOT NULL LIMIT 20'
                    )
                    values = [row[0] for row in cursor.fetchall()]
                    if 1 < len(values) <= 15:
                        enum_values[col['name']] = values
                except Exception:
                    pass
        return enum_values

    def _build_summary(self, schema):
        lines = []
        tables = schema['tables']

        for table_name, table_info in tables.items():
            col_parts = []
            for col in table_info['columns']:
                part = f"{col['name']} {col['type'].upper()}"
                if col.get('pk'):
                    part += ' PK'
                fk_match = next(
                    (fk for fk in table_info['foreign_keys'] if fk['column'] == col['name']),
                    None,
                )
                if fk_match:
                    part += f" FK→{fk_match['references_table']}.{fk_match['references_column']}"
                if col.get('enum_values'):
                    part += f" [{'/'.join(str(v) for v in col['enum_values'])}]"
                col_parts.append(part)

            line = f"Table: {table_name} ({', '.join(col_parts)}). Rows: {table_info['row_count']}."
            lines.append(line)

        if schema['relationships']:
            rel_parts = []
            for rel in schema['relationships']:
                rel_parts.append(
                    f"{rel['from_table']}.{rel['from_column']} → "
                    f"{rel['to_table']}.{rel['to_column']} ({rel['cardinality']})"
                )
            lines.append(f"Relationships: {'; '.join(rel_parts)}.")

        sample_lines = []
        for table_name, table_info in tables.items():
            if table_info['sample_rows']:
                row = table_info['sample_rows'][0]
                sample_str = ', '.join(f"{k}={v}" for k, v in list(row.items())[:6])
                sample_lines.append(f"Sample {table_name}: {sample_str}")

        lines.extend(sample_lines[:6])
        return '\n'.join(lines)
