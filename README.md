<div align="center">

# text-to-sql-assistant

**Natural language → validated SQL → auto-visualization, in under 10 seconds.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)

</div>

---

A full-stack AI application that converts plain English questions into safe, validated SQL queries, executes them against a PostgreSQL database, and renders the results as interactive charts — with a plain English explanation of what was queried. Ships with a pre-seeded 10K+ row e-commerce database so you can query on day one.

> **Non-technical user benchmark:** A marketing manager who has never written SQL should get an accurate, visualized answer to a multi-table question in under 10 seconds.

---

## Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Reference](#environment-reference)
- [Database](#database)
- [Backend](#backend)
- [Frontend](#frontend)
- [Security Model](#security-model)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Decision Log](#decision-log)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### System overview

```
                        ┌─────────────────────────────────────────────────┐
                        │               Next.js 14 (App Router)            │
                        │                                                  │
                        │  QueryInput  SQLDisplay  AutoChart  ERDiagram    │
                        │  ResultsTable  SchemaExplorer  ConversationThread│
                        └──────────────────────┬──────────────────────────┘
                                               │ REST / JSON
                                               ▼
                        ┌─────────────────────────────────────────────────┐
                        │              Django 4.2 + DRF                   │
                        │                                                  │
                        │  ┌────────────────┐   ┌─────────────────────┐   │
                        │  │ SchemaInspector│   │    NLtoSQL          │   │
                        │  │ + schema cache │   │ (schema-aware LLM)  │   │
                        │  └────────────────┘   └─────────────────────┘   │
                        │  ┌────────────────┐   ┌─────────────────────┐   │
                        │  │  SQLValidator  │   │   QueryExecutor     │   │
                        │  │  (sqlparse AST)│   │ (read-only, 10s TTL)│   │
                        │  └────────────────┘   └─────────────────────┘   │
                        │  ┌────────────────┐   ┌─────────────────────┐   │
                        │  │  ChartDetector │   │   QueryExplainer    │   │
                        │  │  (dtype rules) │   │   (LLM → English)   │   │
                        │  └────────────────┘   └─────────────────────┘   │
                        │  ┌────────────────┐   ┌─────────────────────┐   │
                        │  │  ConvManager   │   │    ExportEngine     │   │
                        │  │  (session ctx) │   │    (CSV / xlsx)     │   │
                        │  └────────────────┘   └─────────────────────┘   │
                        └───────────────┬─────────────────┬───────────────┘
                                        │                 │
                          SQL execute   │                 │  LLM API calls
                                        ▼                 ▼
               ┌─────────────────────────────┐   ┌───────────────────────┐
               │  PostgreSQL 15              │   │  Gemini 1.5 Flash     │
               │  readonly_user (SELECT only)│   │  or GPT-4o            │
               │  statement_timeout = 10s    │   │  SQL gen · explain    │
               │  LIMIT 1000 enforced        │   │  · error recovery     │
               └─────────────────────────────┘   └───────────────────────┘
```

### Request lifecycle

```
POST /api/query/  { "question": "Top 10 customers by revenue?" }

  1. SchemaInspector.get_prompt_summary()      → cached schema string (HIT: 0ms, MISS: ~80ms)
  2. NLtoSQL.generate(question, schema)        → raw LLM response (~800–1500ms)
  3. NLtoSQL._extract_sql(response)            → strips markdown, validates output format
  4. SQLValidator.validate(sql)                → AST parse → keyword check → injection check → LIMIT
  5. QueryExecutor.execute(sql)                → read-only cursor, statement_timeout, fetchmany(1000)
  6. ChartDetector.detect(columns, rows)       → dtype inference → chart config
  7. QueryExplainer.explain(sql)               → second LLM call (~600ms)
  8. QueryHistory.save(...)                    → persists to Django DB
  9. Response serialized → JSON → frontend

  Total: ~1.5–3s on cold LLM, ~10ms on cached schema re-run
```

### Service boundaries

Each service in `sql_assistant/services/` is a stateless class with one public method. They do not import each other — the view layer composes them. This makes each service independently testable and replaceable.

```
services/
├── schema_inspector.py   → get_schema(), get_prompt_summary()
├── nl_to_sql.py          → generate(question, schema, conversation_ctx?)
├── sql_validator.py      → validate(sql) → (bool, cleaned_sql, reason)
├── query_executor.py     → execute(sql) → {columns, rows, row_count}
├── query_explainer.py    → explain(sql) → str
├── chart_detector.py     → detect(columns, rows) → ChartConfig
├── conversation_mgr.py   → get_context(session), save_turn(session, turn)
├── suggestion_generator.py → generate(schema) → list[str]
└── export_engine.py      → to_csv(results), to_xlsx(results) → bytes
```

---

## Quick Start

### Requirements

- Docker ≥ 24 and Docker Compose v2
- An LLM API key: [Gemini](https://aistudio.google.com/app/apikey) (free tier) or [OpenAI](https://platform.openai.com/api-keys)

### One-command setup

```bash
git clone https://github.com/your-org/text-to-sql-assistant.git
cd text-to-sql-assistant

cp .env.example .env
# Edit .env — at minimum set LLM_PROVIDER and your API key

docker-compose up -d
docker-compose exec backend python manage.py seed_ecommerce

# Frontend:  http://localhost:3000
# API:       http://localhost:8000/api/
# Admin:     http://localhost:8000/admin  (user: admin / pass: from .env)
```

> **Seed time:** ~45 seconds to generate 500 customers, 200 products, 5K orders, 10K items, 2K reviews with realistic randomised data spanning 2 years.

### Manual setup (no Docker)

```bash
# --- PostgreSQL ---
createdb ecommerce_db
psql ecommerce_db -c "
  CREATE USER readonly_user WITH PASSWORD 'readonly_pass';
  GRANT CONNECT ON DATABASE ecommerce_db TO readonly_user;
  GRANT USAGE ON SCHEMA public TO readonly_user;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly_user;
"

# --- Django backend ---
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp ../.env.example ../.env  # fill in values
python manage.py migrate
python manage.py seed_ecommerce
python manage.py runserver 8000

# --- Next.js frontend (separate terminal) ---
cd frontend
npm ci
npm run dev  # http://localhost:3000
```

### Verify the install

```bash
# Schema introspection works
curl http://localhost:8000/api/schema/ | python -m json.tool | head -40

# A real NL → SQL query
curl -s -X POST http://localhost:8000/api/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "How many customers do we have?"}' \
  | python -m json.tool

# Expected: sql contains "SELECT COUNT(*)", results.rows contains [[523]] (or similar)
```

---

## Environment Reference

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `LLM_PROVIDER` | `gemini` \| `openai` | ✅ | — | Which LLM backend to use |
| `GEMINI_API_KEY` | string | if Gemini | — | Google AI Studio key |
| `OPENAI_API_KEY` | string | if OpenAI | — | OpenAI platform key |
| `POSTGRES_DB` | string | ✅ | `ecommerce_db` | Database name |
| `POSTGRES_USER` | string | ✅ | `django_admin` | Admin DB user (Django ORM) |
| `POSTGRES_PASSWORD` | string | ✅ | — | Admin DB user password |
| `POSTGRES_HOST` | string | ✅ | `db` | DB host (docker service name or IP) |
| `POSTGRES_PORT` | int | — | `5432` | DB port |
| `READONLY_DB_USER` | string | ✅ | `readonly_user` | Read-only user for query execution |
| `READONLY_DB_PASSWORD` | string | ✅ | — | Read-only user password |
| `DJANGO_SECRET_KEY` | string | ✅ | — | 50+ char random string |
| `DJANGO_DEBUG` | bool | — | `True` | Set `False` in production |
| `DJANGO_ALLOWED_HOSTS` | csv | prod only | `localhost` | Comma-separated allowed hosts |
| `NEXT_PUBLIC_API_URL` | url | ✅ | `http://localhost:8000` | API base URL (browser-visible) |
| `REDIS_URL` | url | — | in-memory | Schema cache backend |
| `MAX_QUERY_ROWS` | int | — | `1000` | Hard cap on returned rows |
| `QUERY_TIMEOUT_SECONDS` | int | — | `10` | PostgreSQL statement timeout |
| `LLM_MAX_RETRIES` | int | — | `2` | Auto-fix attempts on SQL error |
| `SCHEMA_CACHE_TTL` | int | — | `3600` | Schema cache lifetime (seconds) |
| `RATE_LIMIT_PER_MIN` | int | — | `30` | Max queries per IP per minute |

---

## Database

### Schema

```sql
-- customers
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(254) UNIQUE NOT NULL,
    city        VARCHAR(100),
    country     VARCHAR(100),
    tier        VARCHAR(10) CHECK (tier IN ('bronze', 'silver', 'gold')) DEFAULT 'bronze',
    joined_date DATE NOT NULL
);

-- categories (self-referential for parent/child)
CREATE TABLE categories (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    parent_category_id INTEGER REFERENCES categories(id),
    description        TEXT
);

-- products
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    category_id  INTEGER REFERENCES categories(id),
    brand        VARCHAR(100),
    price        DECIMAL(10, 2) NOT NULL,
    stock_qty    INTEGER DEFAULT 0,
    created_date DATE NOT NULL
);

-- orders
CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    order_date   DATE NOT NULL,
    status       VARCHAR(20) CHECK (status IN ('pending','shipped','delivered','cancelled')),
    total_amount DECIMAL(12, 2) NOT NULL
);

-- order_items
CREATE TABLE order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES orders(id),
    product_id  INTEGER NOT NULL REFERENCES products(id),
    quantity    INTEGER NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    subtotal    DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- reviews
CREATE TABLE reviews (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(id),
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_date DATE NOT NULL
);
```

### Seeded data volumes

| Table | Rows | Date range |
|---|---|---|
| `customers` | 500–600 | `joined_date`: 2 years back → today |
| `categories` | 15 (3-level hierarchy) | — |
| `products` | 200–250 | `created_date`: 2 years back → today |
| `orders` | 5,000–6,000 | `order_date`: 2 years back → today |
| `order_items` | 10,000–12,000 | — |
| `reviews` | 2,000–2,500 | `created_date`: follows order dates |

### Read-only connection setup

The application maintains two separate Django database connections:

```python
# config/settings.py
DATABASES = {
    # Django ORM: migrations, QueryHistory, Favorites, etc.
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('POSTGRES_USER'),
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST': env('POSTGRES_HOST'),
    },
    # User query execution: SELECT-only, hard timeout
    'readonly': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('READONLY_DB_USER'),
        'PASSWORD': env('READONLY_DB_PASSWORD'),
        'HOST': env('POSTGRES_HOST'),
        'OPTIONS': {
            'options': '-c default_transaction_read_only=on'
        },
    },
}
```

The `readonly` connection has `default_transaction_read_only=on` set at the PostgreSQL session level. This is a second layer of protection — even if the Django validator somehow passes a `DELETE`, the session rejects it.

### Schema cache

The `SchemaInspector` stores its output in Django's cache framework. On a cold start it runs introspection queries against `information_schema` (~80ms). Subsequent calls within `SCHEMA_CACHE_TTL` seconds return the cached object instantly.

```bash
# Force a schema refresh (after ALTER TABLE, new migration, etc.)
curl -X POST http://localhost:8000/api/schema/refresh/ \
  -H "Authorization: Bearer <token>"

# Or via management command
python manage.py refresh_schema
```

---

## Backend

### Project layout

```
backend/
├── config/
│   ├── settings.py          # base settings; environment via django-environ
│   ├── settings_prod.py     # production overrides
│   └── urls.py
├── sql_assistant/           # core app: models, views, services
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── services/            # see Service boundaries above
├── ecommerce/               # sample data models only (no business logic)
│   ├── models.py
│   └── migrations/
├── management/
│   └── commands/
│       ├── seed_ecommerce.py
│       └── refresh_schema.py
├── requirements.txt
├── requirements-dev.txt     # pytest, factory-boy, coverage
└── Dockerfile
```

### Key models

```python
# sql_assistant/models.py

class QueryHistory(models.Model):
    """Every executed query — the source of truth for history and favorites."""
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4)
    question       = models.TextField()
    generated_sql  = models.TextField()
    result_rows    = models.IntegerField()
    chart_type     = models.CharField(max_length=20)   # bar/line/pie/scatter/kpi/table
    execution_ms   = models.IntegerField()
    is_favorite    = models.BooleanField(default=False)
    conversation_id = models.UUIDField(null=True, blank=True)  # groups follow-up turns
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [models.Index(fields=['conversation_id']), models.Index(fields=['is_favorite'])]


class DatabaseConnection(models.Model):
    """Registered database connections (beyond the default)."""
    name        = models.CharField(max_length=100, unique=True)
    engine      = models.CharField(max_length=50)   # postgresql / sqlite
    host        = models.CharField(max_length=255)
    port        = models.IntegerField(default=5432)
    db_name     = models.CharField(max_length=100)
    is_active   = models.BooleanField(default=True)
    last_pinged = models.DateTimeField(null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
```

### LLM prompt structure

```python
# Exact structure sent to the LLM for every query
SYSTEM_PROMPT = """
You are an expert PostgreSQL assistant. Your only job is to generate correct
SELECT queries based on a user's question and the schema provided.

Rules (non-negotiable):
- Output ONLY the raw SQL query. No markdown. No explanation. No trailing semicolon.
- Only SELECT statements. Never generate DROP, DELETE, UPDATE, INSERT, ALTER,
  CREATE, TRUNCATE, GRANT, REVOKE, or EXECUTE.
- Always include LIMIT (default: 100 unless user specifies a different number).
- Use table aliases for all multi-table queries.
- Use COALESCE for potentially null values in aggregations.
- Use DATE_TRUNC for date grouping (PostgreSQL syntax).
- Use ILIKE instead of LIKE for case-insensitive string matching.
""".strip()

def build_prompt(schema_summary: str, question: str) -> str:
    return f"""
{SYSTEM_PROMPT}

--- SCHEMA ---
{schema_summary}

--- QUESTION ---
{question}
""".strip()
```

### Error recovery flow

```python
def generate_with_retry(self, question: str, schema: str) -> str:
    sql = self.generate(question, schema)

    for attempt in range(settings.LLM_MAX_RETRIES):
        is_valid, cleaned_sql, reason = SQLValidator().validate(sql)
        if not is_valid:
            raise ValidationError(reason)  # safety block — do not retry

        try:
            result = QueryExecutor().execute(cleaned_sql)
            return cleaned_sql, result
        except DatabaseError as e:
            if attempt == settings.LLM_MAX_RETRIES - 1:
                raise
            # Send error back to LLM for self-correction
            sql = self._fix_sql(sql, str(e), schema)

    raise MaxRetriesExceeded()
```

---

## Frontend

### State management

Global state lives in a single Zustand store. No context providers, no prop drilling.

```typescript
// src/store/queryStore.ts
interface QueryState {
  // conversation
  conversationId:   string | null;
  turns:            QueryTurn[];
  isLoading:        boolean;

  // current result
  currentSQL:       string | null;
  currentResults:   QueryResult | null;
  currentChart:     ChartConfig | null;
  currentExplain:   string | null;

  // schema (fetched once, cached in memory)
  schema:           Schema | null;
  suggestions:      string[];

  // actions
  ask:              (question: string) => Promise<void>;
  followUp:         (question: string) => Promise<void>;
  runSQL:           (sql: string) => Promise<void>;
  resetConversation:() => void;
  toggleFavorite:   (queryId: string) => Promise<void>;
  refreshSchema:    () => Promise<void>;
}
```

### Chart type mapping

```typescript
// src/components/AutoChart.tsx
const CHART_COMPONENTS: Record<ChartType, React.FC<ChartProps>> = {
  bar:     BarChartView,
  line:    LineChartView,
  pie:     PieChartView,
  scatter: ScatterChartView,
  kpi:     KPICardView,
  table:   null,   // falls through to ResultsTable
};
```

All charts are wrapped in `<ResponsiveContainer width="100%" height={320}>` and share a common `CustomTooltip` component for consistent hover formatting.

### Page structure

```
src/app/
├── page.tsx                 # /         — query interface (main)
├── schema/
│   └── page.tsx             # /schema   — schema explorer + ER diagram
└── history/
    └── page.tsx             # /history  — query history + favorites
```

### Key component contracts

```typescript
// Every component that renders query output accepts the same shape
interface QueryResult {
  columns:   string[];
  rows:      (string | number | null)[][];
  row_count: number;
}

interface ChartConfig {
  type:   'bar' | 'line' | 'pie' | 'scatter' | 'kpi' | 'table';
  x?:     string;    // column name for x-axis / name
  y?:     string;    // column name for y-axis / value
  metrics?: string[]; // column names for KPI cards
}

interface QueryTurn {
  id:          string;
  question:    string;
  sql:         string;
  results:     QueryResult;
  chart:       ChartConfig;
  explanation: string;
  timestamp:   string;
}
```

---

## Security Model

### SQL validation pipeline

The validator runs five independent stages. Any failure immediately rejects the query and returns a reason string — it does not attempt partial fixes at the validation stage (only the LLM retry loop does that).

```
Input SQL
    │
    ▼
[1] sqlparse.parse()           → reject if unparseable
    │
    ▼
[2] token.ttype in (DDL, DML)  → reject if DROP / DELETE / ALTER / INSERT etc.
    │
    ▼
[3] ';' present in SQL body    → reject stacked queries
    UNION + injection patterns → reject
    comment-based bypass (--)  → strip, re-validate
    │
    ▼
[4] LIMIT clause present?      → auto-append LIMIT {MAX_QUERY_ROWS} if missing
    │
    ▼
[5] EXPLAIN {sql}              → reject if estimated rows > 100K
                                  reject CROSS JOIN on tables with > 1K rows each
    │
    ▼
Execute on readonly connection  (read_only = on at session level)
```

### Implementation

```python
# sql_assistant/services/sql_validator.py
import sqlparse
from sqlparse.tokens import DDL, DML, Keyword

BLOCKED_TYPES  = {DDL, DML}
BLOCKED_VALUES = {
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER',
    'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
}

def validate(sql: str) -> tuple[bool, str, str]:
    """Returns (passed, cleaned_sql, rejection_reason)."""
    parsed = sqlparse.parse(sql.strip())
    if not parsed:
        return False, sql, "SQL could not be parsed"

    for statement in parsed:
        for token in statement.flatten():
            if token.ttype in BLOCKED_TYPES and token.normalized.upper() in BLOCKED_VALUES:
                return False, sql, f"Blocked operation: {token.normalized.upper()}"

    # Stacked query check (strip comments first)
    clean = sqlparse.format(sql, strip_comments=True).strip()
    if ';' in clean[:-1]:   # allow trailing semicolon
        return False, sql, "Stacked queries are not permitted"

    # LIMIT enforcement
    if not _has_limit(parsed[0]):
        sql = f"{clean.rstrip(';')} LIMIT {settings.MAX_QUERY_ROWS}"

    return True, sql, ""
```

### Threat model

| Threat | Mitigation |
|---|---|
| LLM hallucinates `DROP TABLE` | Keyword blocklist in validator (stage 2) |
| Stacked query injection (`;DROP`) | Semicolon detection in stage 3 |
| UNION-based data exfil | UNION keyword detection in stage 3 |
| Full-table scan (no LIMIT) | Auto-append in stage 4 |
| Long-running query (DoS via CPU) | `statement_timeout = 10s` at session level |
| Cartesian product explosion | CROSS JOIN + row estimate check in stage 5 |
| Validator bypass via whitespace tricks | `sqlparse` normalises tokens before check |
| Validator bypass at DB level | `readonly_user` has no WRITE grants; `read_only=on` at session |
| LLM API key leakage | Key stored in env var; never logged or returned in responses |
| Brute-force LLM API cost | Rate limiting (30 req/min/IP via `django-ratelimit`) |

---

## API Reference

All endpoints return `Content-Type: application/json`. Errors return `{"error": "...", "code": "..."}`.

### Query

#### `POST /api/query/`

Convert a natural language question to SQL, execute it, and return results.

```bash
curl -X POST http://localhost:8000/api/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Top 5 products by total revenue"}'
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `question` | string | ✅ | Natural language question |
| `conversation_id` | UUID | — | Omit to start a new conversation |

**Response `200`**

```jsonc
{
  "query_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "conversation_id": "7e9a1234-...",
  "sql": "SELECT p.name, SUM(oi.subtotal) AS revenue\nFROM products p\nJOIN order_items oi ON p.id = oi.product_id\nGROUP BY p.name\nORDER BY revenue DESC\nLIMIT 5",
  "results": {
    "columns": ["name", "revenue"],
    "rows": [["Laptop Pro 15", 245000.00], ["..."]],
    "row_count": 5
  },
  "chart_config": {
    "type": "bar",
    "x": "name",
    "y": "revenue"
  },
  "explanation": "This finds the 5 products that generated the most revenue. It joins the products and order items tables, sums the subtotal per product, and returns the top 5 sorted highest first.",
  "safety_report": {
    "query_type": "SELECT",
    "estimated_rows": 5,
    "tables_accessed": ["products", "order_items"],
    "passed": true
  },
  "execution_ms": 38
}
```

**Response `400` — validation failure**

```jsonc
{
  "error": "Query blocked by safety validator",
  "code": "VALIDATION_FAILED",
  "reason": "Blocked operation: DROP",
  "sql": "DROP TABLE customers"
}
```

#### `POST /api/query/followup/`

Modify the previous query in a conversation based on new instructions.

```bash
curl -X POST http://localhost:8000/api/query/followup/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Only show electronics", "conversation_id": "7e9a1234-..."}'
```

#### `POST /api/query/execute-sql/`

Execute manually edited SQL (goes through full validation pipeline).

```bash
curl -X POST http://localhost:8000/api/query/execute-sql/ \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM customers WHERE tier = '\''gold'\''", "conversation_id": "7e9a1234-..."}'
```

### Schema

#### `GET /api/schema/`

Returns full introspected schema. Served from cache after first call.

```bash
curl http://localhost:8000/api/schema/
```

```jsonc
{
  "tables": {
    "customers": {
      "columns": [
        {"name": "id", "type": "integer", "pk": true, "nullable": false},
        {"name": "tier", "type": "varchar", "pk": false, "nullable": true,
         "enum_values": ["bronze", "silver", "gold"]}
      ],
      "row_count": 523,
      "foreign_keys": [],
      "referenced_by": [{"table": "orders", "column": "customer_id"}],
      "sample_rows": [...]
    }
  },
  "relationships": [
    {"from": "orders.customer_id", "to": "customers.id", "cardinality": "N:1"}
  ]
}
```

#### `GET /api/schema/tables/{name}/`

Table detail with column statistics and 10-row preview.

#### `GET /api/schema/relationships/`

All FK relationships formatted for the ER diagram renderer.

#### `GET /api/schema/suggestions/`

Auto-generated example questions based on detected schema.

#### `POST /api/schema/refresh/`

Invalidates the schema cache and re-introspects. Use after migrations or schema changes.

### History & favorites

```bash
# Paginated query history
GET /api/history/?page=1&page_size=20&search=revenue&favorites=true

# Toggle favorite
POST /api/query/{id}/favorite/

# Re-run a saved query
GET /api/query/{id}/rerun/
```

### Export

```bash
# CSV
curl -X POST http://localhost:8000/api/export/ \
  -H "Content-Type: application/json" \
  -d '{"query_id": "3fa85f64-...", "format": "csv"}' \
  --output results.csv

# Excel
curl -X POST http://localhost:8000/api/export/ \
  -H "Content-Type: application/json" \
  -d '{"query_id": "3fa85f64-...", "format": "xlsx"}' \
  --output results.xlsx
```

### Health

```bash
GET /api/health/

# 200 → {"status": "ok", "db": "connected", "schema_cached": true}
# 503 → {"status": "degraded", "db": "unreachable"}
```

---

## Testing

### Backend

```bash
cd backend
pip install -r requirements-dev.txt

# Full suite
pytest

# With coverage report
pytest --cov=sql_assistant --cov-report=term-missing

# Specific modules
pytest tests/test_validator.py -v
pytest tests/test_nl_to_sql.py -v
pytest tests/test_chart_detector.py -v
```

### SQL validation test matrix

These are the minimum cases the test suite must cover before submission:

| Input | Expected outcome |
|---|---|
| `SELECT COUNT(*) FROM customers` | pass, SQL unchanged |
| `SELECT * FROM customers` (no LIMIT) | pass, `LIMIT 1000` appended |
| `DROP TABLE customers` | fail, `BLOCKED_OPERATION` |
| `DELETE FROM orders WHERE id = 1` | fail, `BLOCKED_OPERATION` |
| `SELECT * FROM customers; DROP TABLE orders` | fail, `STACKED_QUERY` |
| `SELECT * FROM customers UNION SELECT * FROM orders` | fail, `INJECTION_PATTERN` |
| `SELECT * FROM customers -- WHERE 1=0` | pass (comment stripped) |
| Invalid SQL (`SELEKT * FORM foo`) | fail, `PARSE_ERROR` |

### SQL generation accuracy test matrix

Test the LLM with these reference queries and assert the generated SQL is structurally correct (correct tables, correct GROUP BY, correct JOINs):

```python
QUERY_ACCURACY_CASES = [
    ("How many customers do we have?",
     lambda sql: "COUNT" in sql.upper() and "customers" in sql.lower()),

    ("Top 5 products by total revenue",
     lambda sql: all(t in sql.lower() for t in ["products", "order_items", "group by", "limit 5"])),

    ("Monthly order count trend in 2024",
     lambda sql: "date_trunc" in sql.lower() and "orders" in sql.lower()),

    ("Customers who have never placed an order",
     lambda sql: "left join" in sql.lower() and "is null" in sql.lower()),

    ("Average review rating per product category",
     lambda sql: all(t in sql.lower() for t in ["reviews", "products", "categories", "avg", "group by"])),
]
```

### Frontend

```bash
cd frontend

# Unit + component tests
npm run test

# End-to-end (requires backend running)
npx playwright test

# Type checking
npx tsc --noEmit
```

### Load testing

```bash
# Install k6 (https://k6.io/)
k6 run tests/load/query_endpoint.js

# Target: p95 < 3s at 20 concurrent users
```

---

## Deployment

### Production docker-compose

```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_ecommerce
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --no-input
```

### Production checklist

**Django**
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_SECRET_KEY` is 50+ random characters (never reused across environments)
- [ ] `DJANGO_ALLOWED_HOSTS` set to your actual domain
- [ ] `CONN_MAX_AGE` set to `60` (persistent DB connections)
- [ ] Static files served by Nginx, not Django

**PostgreSQL**
- [ ] `POSTGRES_PASSWORD` and `READONLY_DB_PASSWORD` are strong, unique passwords
- [ ] Daily backups configured (`pg_dump` or managed service snapshot)
- [ ] Connection pooling via PgBouncer if > 50 concurrent users expected

**LLM API**
- [ ] API key stored in a secrets manager (AWS SSM, GCP Secret Manager, Vault), not plain `.env`
- [ ] Billing alert set on the LLM provider dashboard
- [ ] `RATE_LIMIT_PER_MIN` tuned to expected traffic × your API tier limit

**Networking**
- [ ] HTTPS enforced (Nginx + Let's Encrypt or load balancer termination)
- [ ] `X-Frame-Options: DENY` header set
- [ ] CORS restricted to your frontend domain (not `*`)

**Observability**
- [ ] Sentry (or equivalent) configured for Django exception tracking
- [ ] Slow query log enabled in PostgreSQL (`log_min_duration_statement = 1000`)
- [ ] `/api/health/` endpoint wired to uptime monitor

---

## Decision Log

Significant technical decisions and their rationale, for future contributors.

**Why `sqlparse` instead of regex for SQL validation?**
Regex is trivially bypassed: `DRO/**/P TABLE` or `DE` + `LETE` break keyword matching. `sqlparse` normalises the SQL into a token tree before inspection, so keyword detection is reliable regardless of whitespace, casing, or comment tricks.

**Why two PostgreSQL connections (`default` + `readonly`) instead of one?**
A single connection with validation-only protection means a bug in the validator exposes write access to user-generated queries. The readonly connection enforces `read_only=on` at the PostgreSQL session level — even a connection.execute() call from Django code cannot write. The default connection is exclusively for Django's own ORM (migrations, QueryHistory, etc.).

**Why Gemini Flash as the default LLM instead of GPT-4?**
Gemini 1.5 Flash is free tier with generous rate limits, making the project accessible to reviewers and developers without an OpenAI subscription. GPT-4o is a one-line config swap for production use where accuracy on complex JOINs justifies the cost.

**Why Zustand instead of Redux or React Query?**
This app has one primary mutation pattern (submit question, update conversation state) and one primary fetch pattern (schema, loaded once). Redux is significantly more boilerplate for this use case. React Query handles server state well but the conversation context is local UI state that doesn't need invalidation. Zustand covers both cleanly in ~100 lines.

**Why TanStack Table instead of a pre-built grid component (AG Grid, MUI DataGrid)?**
Pre-built grids add 200–400KB to the bundle and impose opinionated styling that's hard to override with Tailwind. TanStack Table is headless — you own the rendering — so it integrates cleanly with shadcn/ui and performs identically for 10-row and 10,000-row results thanks to row virtualisation.

**Why cache the schema in Django's cache framework and not re-introspect per request?**
Schema introspection involves ~8 `information_schema` queries per table. With 6 tables that's 48 queries per user request, adding ~80ms of latency. The schema changes rarely (only on migrations). A 1-hour cache TTL with a manual refresh endpoint is the correct tradeoff.

**Why is the seed data generated at runtime (management command) instead of committed as a fixture?**
A Django fixture (`loaddata`) for 10K+ rows is a 20–30MB JSON file. It bloats the repo, slows `git clone`, and is a pain to regenerate with different parameters. A management command using `faker` + `bulk_create` generates the same realistic dataset in ~45 seconds and supports `--customers`, `--orders` flags for customisation.

---

## Known Limitations

- **LLM accuracy on ambiguous questions:** Queries with ambiguous column references (e.g. "show orders from last year" when `order_date`, `created_at`, and `shipped_date` all exist) will have the LLM pick one. The current prompt does not ask clarifying questions; it states its assumption in the explanation.
- **No authentication:** The API has no auth layer. For internal tools this is acceptable. For multi-tenant or public deployments, add Django's token auth or session auth before the rate limiter.
- **Conversation context window:** The `ConversationManager` retains the full SQL of each turn in the LLM context. After ~10 turns, the accumulated context may approach the model's context limit. A sliding window (last 5 turns only) is the intended fix but not yet implemented.
- **PostgreSQL only for user queries:** The schema inspector and read-only execution path are tested against PostgreSQL 15. SQLite support is present as a secondary connection but date functions (`DATE_TRUNC`, `EXTRACT`) in the LLM prompt are PostgreSQL-specific and will need dialect switching.
- **No streaming:** LLM responses are awaited fully before returning. On slow API responses this means the UI is blocked for up to 3 seconds. Streaming via Server-Sent Events is the intended improvement.

---

## Troubleshooting

**`seed_ecommerce` fails with `IntegrityError: duplicate key`**

The seed command is not idempotent by default. Run `python manage.py flush --no-input` first, or add `--reset` flag support to the command.

**Schema suggestions are empty or generic**

The suggestion generator runs on first schema load. If it returns generic questions, the schema cache may contain a partial introspection from a failed startup. Run `python manage.py refresh_schema` to force a full re-introspection.

**Generated SQL uses wrong date syntax**

The system prompt specifies PostgreSQL date functions. If you connect a SQLite database, override the prompt dialect via the `DatabaseConnection.dialect` field (add to model + pass to `NLtoSQL`).

**`statement_timeout` error on a slow query**

Increase `QUERY_TIMEOUT_SECONDS` in `.env` for complex analytical queries, or add a database index. The `EXPLAIN` output in the safety report will show which table scan is slow.

**Chart renders as a table when you expected a bar chart**

The chart detector infers column types from the first 10 rows. If a numeric column contains `None` values in those rows, it may be classified as `text`. Check `chart_config` in the API response to see what was detected, and verify the column has non-null values near the top of the result.

**LLM returns SQL wrapped in markdown fences**

`NLtoSQL._extract_sql()` strips ` ```sql ` and ` ``` ` wrappers. If the model returns a different wrapper format, add it to the extraction regex in `nl_to_sql.py`.

---

<div align="center">

</div>