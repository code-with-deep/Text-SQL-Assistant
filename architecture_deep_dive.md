# Text-to-SQL AI Database Assistant — Complete Architectural Deep Dive

---

## Table of Contents

1. [Project Overview & Business Problem](#1-project-overview--business-problem)
2. [How the Entire System Works](#2-how-the-entire-system-works)
3. [Core Features & Advanced Features](#3-core-features--advanced-features)
4. [Why This Is a Production-Level AI Application](#4-why-this-is-a-production-level-ai-application)
5. [Complete Tech Stack & Rationale](#5-complete-tech-stack--rationale)
6. [System Architecture](#6-system-architecture)
7. [Detailed Architecture Deep Dives](#7-detailed-architecture-deep-dives)
8. [Workflow Flowcharts](#8-workflow-flowcharts)
9. [Phased Implementation Roadmap](#9-phased-implementation-roadmap)
10. [How Production Companies Build Similar Systems](#10-how-production-companies-build-similar-systems)

---

## 1. Project Overview & Business Problem

### What Is This Project?

The **Text-to-SQL AI Database Assistant** is a full-stack AI-powered platform that lets **non-technical business users** (sales managers, marketing leads, product managers, executives) query databases using **plain English** instead of writing SQL.

A user types: *"What were our top 10 products by revenue last quarter?"*

The system:
1. **Understands** the database schema (tables, columns, relationships)
2. **Generates** the correct SQL query using an LLM
3. **Validates** the SQL for safety (no destructive operations, no resource hogs)
4. **Executes** the query against the database
5. **Presents** results in an interactive table
6. **Auto-generates** the most appropriate chart (bar, line, pie, scatter)
7. **Explains** the SQL in plain English so the user understands what was queried

### The Real-World Business Problem

| Problem | Impact |
|---|---|
| **< 5% of employees** in most companies can write SQL | 95%+ of people who need data insights cannot access them directly |
| Data requests go to engineering/data teams | Days or weeks of delay for simple questions |
| Self-service BI tools (Tableau, Power BI) still require training | Steep learning curve, expensive licenses |
| Manual report generation | Static, outdated, doesn't answer ad-hoc questions |
| **Data democratization gap** | Decisions made on gut feeling instead of data |

### The Solution

This system is the bridge: it lets anyone with a question and access to the system get instant, accurate, verified answers from the database — **without writing a single line of SQL**.

> [!IMPORTANT]
> This is one of the **highest-ROI AI applications** in enterprise software. Every company has databases full of valuable data. This system unlocks that data for 100% of employees.

### Expected Outcomes

- A **fully functional** NL-to-SQL assistant with a pre-loaded e-commerce database
- **Accurate SQL generation** across diverse query types (aggregations, filters, JOINs, rankings, trends)
- **Safe execution** — destructive queries are blocked, resources are bounded
- **Beautiful visualizations** — auto-detected chart types with professional rendering
- **Conversational interface** — follow-up queries refine previous results
- **Schema explorer** — visual database understanding with ER diagrams
- **Production-ready** architecture with Docker, proper error handling, and security

---

## 2. How the Entire System Works

### The Complete Query Lifecycle (Bird's-Eye View)

```mermaid
flowchart TB
    subgraph USER["👤 User (Browser)"]
        A["Types: 'Top 10 products by revenue'"]
    end

    subgraph FRONTEND["🖥️ Next.js Frontend"]
        B["QueryInput Component"]
        C["API Client (fetch/axios)"]
        D["Results Display"]
        E["AutoChart Component"]
        F["SQL Display + Explanation"]
    end

    subgraph BACKEND["⚙️ Django Backend"]
        G["DRF API View"]
        H["Conversation Manager"]
        I["Schema Inspector (Cached)"]
        J["NL-to-SQL Engine"]
        K["SQL Validator"]
        L["Query Executor"]
        M["Chart Detector"]
        N["Query Explainer"]
        O["Error Recovery"]
    end

    subgraph LLM["🤖 LLM (Gemini/OpenAI)"]
        P["SQL Generation"]
        Q["SQL Explanation"]
        R["Error Fix Suggestion"]
    end

    subgraph DB["🗄️ PostgreSQL"]
        S["E-Commerce Database"]
        T["Schema Information"]
    end

    A --> B --> C
    C -->|"POST /api/query/"| G
    G --> H
    H --> I
    I -->|"Schema + Sample Data"| J
    J -->|"Prompt: Schema + Question"| P
    P -->|"Generated SQL"| J
    J --> K
    K -->|"Safe? ✅"| L
    K -->|"Unsafe? ❌"| G
    L -->|"Execute SELECT"| S
    S -->|"Result Rows"| L
    L --> M
    L --> N
    N -->|"Explain SQL"| Q
    Q -->|"Plain English"| N
    M -->|"Chart Config"| G
    L -->|"Results JSON"| G
    N -->|"Explanation"| G
    G -->|"JSON Response"| C
    C --> D
    C --> E
    C --> F
    L -->|"SQL Error"| O
    O -->|"Error + SQL"| R
    R -->|"Fixed SQL"| O
    O --> K
    I -->|"Introspect"| T
```

### Step-by-Step Walkthrough

| Step | Component | What Happens |
|------|-----------|-------------|
| 1 | **User** | Types "Top 10 products by revenue last quarter" in the query bar |
| 2 | **Frontend** | Sends `POST /api/query/` with `{question: "...", conversation_id: "..."}` |
| 3 | **Conversation Manager** | Checks if this is a new question or a follow-up. Loads previous context if follow-up |
| 4 | **Schema Inspector** | Retrieves the cached schema (tables, columns, types, FKs, sample values) |
| 5 | **NL-to-SQL Engine** | Builds a prompt: `[System Role] + [Schema Summary] + [Conversation History] + [User Question] + [Rules]` |
| 6 | **LLM** | Receives the prompt and generates: `SELECT p.name, SUM(oi.subtotal) AS revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.order_date >= '2025-01-01' GROUP BY p.name ORDER BY revenue DESC LIMIT 10` |
| 7 | **SQL Validator** | Checks: ✅ SELECT only, ✅ Has LIMIT, ✅ No injection patterns, ✅ No CROSS JOIN, ✅ Estimated rows < 100K |
| 8 | **Query Executor** | Executes the SQL with a 10-second timeout on a read-only connection |
| 9 | **Chart Detector** | Analyzes result: 1 text column (name) + 1 numeric column (revenue) → **Bar Chart** |
| 10 | **Query Explainer** | LLM translates SQL to: "This finds the top 10 products ranked by total revenue. It joins products with order items, sums up the subtotals per product, and returns the 10 highest, filtered to orders from last quarter." |
| 11 | **Response** | JSON with: `{sql, results, columns, chart_config, explanation, safety_report}` |
| 12 | **Frontend** | Renders: interactive table, bar chart, syntax-highlighted SQL, and plain English explanation |

---

## 3. Core Features & Advanced Features

### Must-Have Features (Core)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Schema Introspection** | Auto-detect all tables, columns, types, PKs, FKs, relationships, row counts, sample data |
| 2 | **NL-to-SQL Conversion** | LLM generates SQL from natural language, using full schema context |
| 3 | **SQL Safety Validation** | Block destructive queries, enforce LIMIT, timeout, read-only connection |
| 4 | **Query Execution** | Execute validated SQL, return structured JSON results with column metadata |
| 5 | **Interactive Results Table** | Sortable, paginated table using TanStack Table |
| 6 | **Auto-Chart Generation** | Detect best chart type and render with Recharts |
| 7 | **SQL Display** | Syntax-highlighted SQL with copy functionality |
| 8 | **Query Explanation** | LLM translates SQL to plain English |
| 9 | **Question Suggestions** | Auto-generated clickable example questions from schema |
| 10 | **Query History** | Save all queries with re-run capability |
| 11 | **CSV Export** | Download results as CSV |
| 12 | **Error Recovery** | Auto-retry failed SQL with LLM correction (up to 2 attempts) |
| 13 | **Schema Explorer** | Visual table/column browser |
| 14 | **Sample Database** | Pre-loaded e-commerce DB with 10K+ rows |

### Good-to-Have Features (Intermediate)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Conversational Follow-ups** | "Now break that down by region" modifies previous SQL |
| 2 | **Manual SQL Editing** | Edit generated SQL in Monaco editor before execution |
| 3 | **Chart Type Toggle** | Switch between bar/line/pie/table for same results |
| 4 | **ER Diagram** | Visual relationship map using React Flow |
| 5 | **Table Statistics** | Min, max, avg, null count, unique count per column |
| 6 | **Value Distributions** | Mini bar charts for enum-like columns |
| 7 | **Step-by-Step Explanation** | Clause-by-clause SQL breakdown |
| 8 | **Query Favorites** | Bookmark and quick-access saved queries |
| 9 | **Excel Export** | .xlsx download with openpyxl |
| 10 | **Safety Check Display** | Pre-execution validation summary with user confirmation |

### Bonus Features (Advanced)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-Database Support** | Connect to PostgreSQL AND SQLite |
| 2 | **Query Optimization** | LLM suggests indexes or query rewrites |
| 3 | **EXPLAIN Plan Visualization** | Visual query execution plan tree |
| 4 | **Dashboard Builder** | Save queries as dashboard widgets |
| 5 | **KPI Cards** | Single-row aggregates rendered as large metric cards |
| 6 | **SQL Clause Highlighting** | Color-code SELECT/FROM/JOIN/WHERE |
| 7 | **Full Docker Setup** | docker-compose with auto-seeded PostgreSQL |

---

## 4. Why This Is a Production-Level AI Application

This isn't a toy demo. Here's what makes it production-grade:

| Aspect | Why It Matters |
|--------|---------------|
| **Safety Layer** | LLMs hallucinate. Without validation, a generated `DROP TABLE` could destroy production data. The multi-layer safety system (parsing, whitelisting, read-only connections, timeouts) is what separates a demo from a real system |
| **Error Recovery** | Production systems don't crash on the first error. Auto-retry with LLM correction mimics how a human developer would debug a failing query |
| **Schema-Aware Prompting** | Naive text-to-SQL fails constantly because the LLM doesn't know your schema. Injecting full schema context (tables, columns, types, FKs, sample values) is the key to accuracy |
| **Conversational Context** | Real users don't ask isolated questions. They drill down, refine, and explore. Supporting follow-ups is critical for usability |
| **Resource Bounding** | Without LIMIT enforcement and timeouts, a single query could lock the database for minutes and crash the application |
| **Auto-Visualization** | Raw data tables are not actionable. Auto-detecting the right chart type and rendering it instantly is what makes the system genuinely useful |
| **Read-Only Isolation** | Defense in depth. Even if all software validation fails, the database connection itself cannot modify data |

> [!NOTE]
> Companies like **Databricks (Genie)**, **Snowflake (Cortex)**, **AWS (QuickSight Q)**, and **ThoughtSpot** have built billion-dollar products around this exact concept. You're building a simplified but architecturally similar system.

---

## 5. Complete Tech Stack & Rationale

### Backend

| Technology | Role | Why This Choice |
|-----------|------|-----------------|
| **Django 4.2+** | Web framework | Batteries-included, ORM for models (QueryHistory, Favorites), admin panel for data inspection, database introspection APIs built-in |
| **Django REST Framework** | API layer | Standard for building REST APIs in Django. Serializers, viewsets, authentication, pagination all built-in |
| **PostgreSQL** | Primary database | Production-grade RDBMS. Rich `information_schema` for introspection, supports `EXPLAIN`, read-only roles, excellent for complex queries |
| **sqlparse** | SQL parsing | Parse SQL to detect query type (SELECT/DROP/DELETE), extract clauses, validate structure. Lightweight, Python-native |
| **Google Gemini / OpenAI GPT** | LLM | SQL generation, query explanation, error correction. Gemini has a generous free tier; GPT-4 is best for SQL accuracy |
| **openpyxl** | Excel export | Industry-standard Python library for creating .xlsx files |
| **Docker** | Containerization | Reproducible environment. PostgreSQL runs in a container so reviewers don't need to install it locally |
| **Gunicorn** | WSGI server | Production-grade Python HTTP server (not Django's dev server) |

### Frontend

| Technology | Role | Why This Choice |
|-----------|------|-----------------|
| **Next.js 14+** | React framework | Server-side rendering for SEO, file-based routing, API routes, excellent DX with TypeScript |
| **TypeScript** | Type safety | Catches bugs at compile time, better IDE support, self-documenting code |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid UI development (user's assignment specifies this) |
| **shadcn/ui** | Component library | Beautiful, accessible, customizable components. Not a dependency — copies components into your project |
| **Recharts** | Charts | React-native charting library. Bar, line, pie, scatter, area. Built on D3 but with a React API |
| **TanStack Table** | Data tables | Headless table library. Sorting, pagination, column resizing, virtualization for large datasets |
| **React Flow** | ER diagrams | Node-based graph visualization. Perfect for showing table relationships |
| **Zustand** | State management | Lightweight, simple. No boilerplate like Redux. Perfect for schema cache, conversation state, query history |
| **Monaco Editor** | SQL editing | VS Code's editor component. Syntax highlighting, autocomplete, perfect for SQL editing |
| **react-syntax-highlighter** | SQL display | Read-only SQL display with syntax highlighting. Lighter than Monaco for display-only use |

### Infrastructure

| Technology | Role | Why This Choice |
|-----------|------|-----------------|
| **Docker Compose** | Orchestration | Define Django + PostgreSQL as services. One command to start everything |
| **Nginx** | Reverse proxy | Serves static files, proxies API requests, TLS termination in production |
| **PostgreSQL (Docker)** | Database container | Isolated, reproducible, no local installation needed |

---

## 6. System Architecture

### High-Level Architecture

```mermaid
flowchart LR
    subgraph Client["🌐 Browser"]
        FE["Next.js Frontend\n(TypeScript + Tailwind)"]
    end

    subgraph Server["🖥️ Backend Server"]
        NGINX["Nginx\n(Reverse Proxy)"]
        DJANGO["Django + DRF\n(API Server)"]
        SERVICES["Service Layer\n(Business Logic)"]
    end

    subgraph AI["🤖 AI Layer"]
        LLM["Gemini / OpenAI\n(LLM API)"]
    end

    subgraph Data["🗄️ Data Layer"]
        PG["PostgreSQL\n(E-Commerce DB)"]
        CACHE["Schema Cache\n(In-Memory / Redis)"]
    end

    FE <-->|"REST API\n(JSON)"| NGINX
    NGINX <-->|"Proxy"| DJANGO
    DJANGO <--> SERVICES
    SERVICES <-->|"API Calls"| LLM
    SERVICES <-->|"Read-Only SQL"| PG
    SERVICES <-->|"Schema Data"| CACHE
```

### Backend Architecture (Layered)

```mermaid
flowchart TB
    subgraph API["API Layer (DRF Views)"]
        V1["SchemaViewSet"]
        V2["QueryViewSet"]
        V3["HistoryViewSet"]
        V4["ExportView"]
        V5["DatabaseViewSet"]
    end

    subgraph SVC["Service Layer (Business Logic)"]
        S1["SchemaInspector"]
        S2["NLToSQL"]
        S3["SQLValidator"]
        S4["QueryExecutor"]
        S5["QueryExplainer"]
        S6["ChartDetector"]
        S7["ConversationManager"]
        S8["SuggestionGenerator"]
    end

    subgraph MODEL["Model Layer (Django ORM)"]
        M1["QueryHistory"]
        M2["Favorite"]
        M3["DatabaseConnection"]
        M4["ConversationSession"]
    end

    subgraph ECOM["E-Commerce Models"]
        E1["Customer"]
        E2["Product"]
        E3["Category"]
        E4["Order"]
        E5["OrderItem"]
        E6["Review"]
    end

    API --> SVC
    SVC --> MODEL
    SVC --> ECOM
```

### Frontend Architecture

```mermaid
flowchart TB
    subgraph Pages["Pages (Next.js App Router)"]
        P1["/ (Query Interface)"]
        P2["/schema (Schema Explorer)"]
        P3["/history (Query History)"]
        P4["/databases (Connection Manager)"]
    end

    subgraph Components["Components"]
        C1["QueryInput"]
        C2["SQLDisplay"]
        C3["ResultsTable"]
        C4["AutoChart"]
        C5["QueryExplanation"]
        C6["ConversationThread"]
        C7["SchemaExplorer"]
        C8["ERDiagram"]
        C9["TablePreview"]
        C10["SafetyCheck"]
        C11["ChartTypeSelector"]
        C12["ExportPanel"]
    end

    subgraph State["State (Zustand Stores)"]
        Z1["queryStore"]
        Z2["schemaStore"]
        Z3["conversationStore"]
        Z4["historyStore"]
    end

    subgraph API["API Client"]
        A1["apiClient.ts\n(fetch wrapper)"]
    end

    Pages --> Components
    Components --> State
    Components --> API
    API -->|"HTTP"| BACKEND["Django Backend"]
```

### Database Architecture

```mermaid
erDiagram
    categories ||--o{ categories : "parent_category"
    categories ||--o{ products : "has"
    customers ||--o{ orders : "places"
    customers ||--o{ reviews : "writes"
    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "included_in"
    products ||--o{ reviews : "receives"

    categories {
        int id PK
        string name
        int parent_category_id FK
        string description
    }

    customers {
        int id PK
        string name
        string email
        string city
        string country
        string tier
        date joined_date
    }

    products {
        int id PK
        string name
        int category_id FK
        string brand
        decimal price
        int stock_qty
        date created_date
    }

    orders {
        int id PK
        int customer_id FK
        date order_date
        string status
        decimal total_amount
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    reviews {
        int id PK
        int product_id FK
        int customer_id FK
        int rating
        text comment
        date created_date
    }
```

### Application Models (Metadata)

```mermaid
erDiagram
    DatabaseConnection ||--o{ QueryHistory : "used_by"
    QueryHistory ||--o{ Favorite : "bookmarked_as"
    ConversationSession ||--o{ QueryHistory : "contains"

    DatabaseConnection {
        int id PK
        string name
        string db_type
        string connection_string
        boolean is_active
        json cached_schema
        datetime last_introspected
    }

    QueryHistory {
        int id PK
        int database_id FK
        int conversation_id FK
        text nl_question
        text generated_sql
        text explanation
        json results_preview
        json chart_config
        json safety_report
        int row_count
        float execution_time
        boolean is_successful
        string error_message
        datetime created_at
    }

    Favorite {
        int id PK
        int query_id FK
        string label
        datetime created_at
    }

    ConversationSession {
        int id PK
        int database_id FK
        json context
        datetime created_at
        datetime updated_at
    }
```

---

## 7. Detailed Architecture Deep Dives

### 7.1 Schema Introspection Engine

**Purpose:** Understand the database structure so the LLM can generate accurate SQL.

**Why it matters:** Without knowing that `orders.customer_id` is a foreign key to `customers.id`, the LLM cannot generate correct JOIN queries. Without knowing that `orders.status` contains values like `'pending'`, `'shipped'`, `'delivered'`, the LLM generates incorrect WHERE clauses.

**Internal Workflow:**

```mermaid
flowchart TB
    A["Request: Get Schema"] --> B{"Schema Cached?"}
    B -->|"Yes"| C["Return Cached Schema"]
    B -->|"No"| D["Connect to Database"]
    D --> E["Query information_schema.tables\n(Get all table names)"]
    E --> F["For each table:\nQuery information_schema.columns\n(names, types, nullable, defaults)"]
    F --> G["Query information_schema.key_column_usage\n+ table_constraints\n(PKs and FKs)"]
    G --> H["Query referential_constraints\n(FK target tables and columns)"]
    H --> I["For each table:\nSELECT COUNT(*) for row counts"]
    I --> J["For each table:\nSELECT * LIMIT 5 for sample data"]
    J --> K["For enum-like columns:\nSELECT DISTINCT value LIMIT 20"]
    K --> L["Build Schema Object:\n{tables, columns, pks, fks, relationships,\nrow_counts, sample_data, value_enums}"]
    L --> M["Generate Text Summary\nfor LLM Context Window"]
    M --> N["Cache Schema\n(with TTL or manual refresh)"]
    N --> C
```

**Implementation Approach:**
- Use Django's `connection.introspection` module or raw `information_schema` queries
- Build a `SchemaInspector` service class that returns a structured Python dict
- Cache the result in Django's cache framework (memory or Redis)
- The text summary is formatted as a compact string that fits in the LLM's context window

**Best Practices:**
- Cache aggressively — schema rarely changes, but introspection is expensive
- Include sample values for enum-like columns (status, tier, category) — this dramatically improves LLM accuracy
- Include relationship descriptions — "customers.id → orders.customer_id (one-to-many)"
- Truncate sample data for very wide tables (don't send 50-column rows to the LLM)

---

### 7.2 NL-to-SQL Engine

**Purpose:** Convert natural language questions into syntactically correct, semantically accurate SQL.

**This is the heart of the system.** Everything else is infrastructure to support this.

**Prompt Structure:**

```
┌──────────────────────────────────────────────┐
│ SYSTEM ROLE                                  │
│ "You are an expert SQL query generator.      │
│  You generate PostgreSQL-compatible SQL."    │
├──────────────────────────────────────────────┤
│ DATABASE SCHEMA                              │
│ Table: customers (id INT PK, name VARCHAR,   │
│   email VARCHAR, city VARCHAR, country       │
│   VARCHAR, tier VARCHAR [bronze/silver/gold],│
│   joined_date DATE). Row count: 500.         │
│ Table: orders (id INT PK, customer_id INT FK │
│   → customers.id, order_date DATE, status    │
│   VARCHAR [pending/shipped/delivered/        │
│   cancelled], total_amount DECIMAL).         │
│   Row count: 5000.                           │
│ ... (all tables)                             │
│                                              │
│ Relationships:                               │
│ - customers.id → orders.customer_id (1:N)    │
│ - orders.id → order_items.order_id (1:N)     │
│ - products.id → order_items.product_id (1:N) │
│ - ... (all FKs)                              │
├──────────────────────────────────────────────┤
│ RULES                                        │
│ - Generate ONLY SELECT statements            │
│ - Always include LIMIT (default 100)         │
│ - Use proper JOINs based on FK relationships │
│ - Handle NULLs with COALESCE where needed    │
│ - Use appropriate date functions             │
│ - Alias columns for readability              │
│ - Return ONLY the SQL, no explanation        │
├──────────────────────────────────────────────┤
│ CONVERSATION HISTORY (if follow-up)          │
│ Previous question: "Show monthly revenue"    │
│ Previous SQL: "SELECT ... GROUP BY month"    │
│ Previous result summary: "12 rows, ..."      │
├──────────────────────────────────────────────┤
│ USER QUESTION                                │
│ "Top 10 products by revenue last quarter"    │
└──────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Schema in every prompt**: The LLM has no persistent memory. Every request must include the full schema context
- **Sample values matter**: Telling the LLM that `tier` contains `[bronze, silver, gold]` prevents it from guessing wrong values
- **Rules enforcement**: Explicit rules about LIMIT, SELECT-only, and JOIN usage dramatically reduce errors
- **Response format**: Ask for SQL-only output to avoid parsing issues

---

### 7.3 SQL Validation & Security Layer

**Purpose:** Ensure no generated SQL can harm the database or consume excessive resources.

> [!CAUTION]
> This is the most critical safety component. LLMs can and do hallucinate destructive SQL. Without this layer, a single hallucinated `DROP TABLE` could destroy production data.

**Multi-Layer Defense:**

```mermaid
flowchart TB
    SQL["Generated SQL"] --> L1

    subgraph LAYER1["Layer 1: Query Type Whitelist"]
        L1["Parse SQL with sqlparse"]
        L1 --> L1a{"Statement type\n== SELECT?"}
        L1a -->|"No"| BLOCK1["❌ BLOCK\n'Only SELECT queries allowed'"]
        L1a -->|"Yes"| L2
    end

    subgraph LAYER2["Layer 2: Keyword Blacklist"]
        L2["Scan for blocked keywords:\nDROP, DELETE, UPDATE, INSERT,\nALTER, CREATE, TRUNCATE,\nGRANT, REVOKE, EXEC"]
        L2 --> L2a{"Blocked keyword\nfound?"}
        L2a -->|"Yes"| BLOCK2["❌ BLOCK\n'Destructive operation detected'"]
        L2a -->|"No"| L3
    end

    subgraph LAYER3["Layer 3: Injection Detection"]
        L3["Check for:\n- Stacked queries (;)\n- UNION injection\n- Comment bypass (--)\n- Encoded attacks"]
        L3 --> L3a{"Injection\npattern?"}
        L3a -->|"Yes"| BLOCK3["❌ BLOCK\n'SQL injection pattern detected'"]
        L3a -->|"No"| L4
    end

    subgraph LAYER4["Layer 4: Resource Limits"]
        L4["Check:\n- Has LIMIT clause?\n- CROSS JOIN present?\n- Estimated row count"]
        L4 --> L4a{"LIMIT\nmissing?"}
        L4a -->|"Yes"| L4b["Add LIMIT 1000"]
        L4a -->|"No"| L4c{"CROSS JOIN\non large tables?"}
        L4b --> L4c
        L4c -->|"Yes"| BLOCK4["❌ BLOCK\n'Potential cartesian product'"]
        L4c -->|"No"| L5
    end

    subgraph LAYER5["Layer 5: Read-Only Connection"]
        L5["Execute on read-only\nDB user/role"]
        L5 --> L5a{"DB rejects\nwrite operation?"}
        L5a -->|"Yes"| BLOCK5["❌ BLOCK\n'Permission denied'"]
        L5a -->|"No"| PASS["✅ EXECUTE"]
    end

    style BLOCK1 fill:#ff4444,color:#fff
    style BLOCK2 fill:#ff4444,color:#fff
    style BLOCK3 fill:#ff4444,color:#fff
    style BLOCK4 fill:#ff4444,color:#fff
    style BLOCK5 fill:#ff4444,color:#fff
    style PASS fill:#44ff44,color:#000
```

**Implementation Details:**

| Layer | How It Works |
|-------|-------------|
| **Query Type Whitelist** | Use `sqlparse.parse(sql)` → check `statement.get_type() == 'SELECT'` |
| **Keyword Blacklist** | Regex scan for `\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b` (case-insensitive) |
| **Injection Detection** | Check for semicolons (stacked queries), `UNION SELECT`, `--` comments, `/**/` block comments |
| **Resource Limits** | Parse SQL for LIMIT clause; if missing, append `LIMIT 1000`. Check for `CROSS JOIN` keyword |
| **Read-Only Connection** | Create a PostgreSQL user with `GRANT SELECT ON ALL TABLES` only. Use this connection for all query execution |

---

### 7.4 Auto-Visualization Engine

**Purpose:** Automatically detect the best chart type for query results and render it.

**Decision Logic:**

```mermaid
flowchart TB
    R["Query Results"] --> A["Analyze Column Types"]
    A --> B{"Single row with\nnamed metrics?"}
    B -->|"Yes"| KPI["📊 KPI Cards"]
    B -->|"No"| C{"1 text column +\n1 numeric column?"}
    C -->|"Yes"| D{"Text column is\ndate/time?"}
    D -->|"Yes"| LINE["📈 Line Chart"]
    D -->|"No"| BAR["📊 Bar Chart"]
    C -->|"No"| E{"1 text column +\n1 percentage column?"}
    E -->|"Yes"| PIE["🥧 Pie/Donut Chart"]
    E -->|"No"| F{"2 numeric columns?"}
    F -->|"Yes"| SCATTER["⚬ Scatter Plot"]
    F -->|"No"| G{"Date column +\nmultiple numeric?"}
    G -->|"Yes"| AREA["📈 Multi-Line/Area"]
    G -->|"No"| TABLE["📋 Table Only"]
```

**Chart Configuration Object (returned by API):**

```json
{
  "chart_type": "bar",
  "title": "Top 10 Products by Revenue",
  "x_axis": {"key": "name", "label": "Product Name"},
  "y_axis": {"key": "revenue", "label": "Revenue ($)"},
  "data": [...],
  "alternatives": ["line", "pie", "table"],
  "color_scheme": "blues"
}
```

---

### 7.5 Conversational Follow-Up System

**Purpose:** Allow users to refine queries through natural conversation instead of starting over.

**How Context Is Maintained:**

```mermaid
flowchart TB
    subgraph Session["Conversation Session"]
        CTX["Context Object"]
        CTX --> PREV_Q["Previous Question:\n'Show monthly revenue'"]
        CTX --> PREV_SQL["Previous SQL:\n'SELECT date_trunc(month,...) ...'"]
        CTX --> PREV_SUMMARY["Result Summary:\n'12 rows, columns: month, revenue'"]
        CTX --> TABLES["Tables Referenced:\norders, order_items"]
    end

    NEW_Q["New Question:\n'Break that down by category'"] --> PROMPT["Build Prompt:\nPrevious SQL + Previous Summary\n+ New Instruction"]
    CTX --> PROMPT
    PROMPT --> LLM["LLM: Modify SQL\n(add GROUP BY category)"]
    LLM --> MODIFIED["Modified SQL:\nSELECT date_trunc(month,...),\nc.name as category, ...\nGROUP BY month, category"]
    MODIFIED --> UPDATE["Update Context\nwith new SQL + results"]
    UPDATE --> CTX
```

**Conversation Flow Example:**

| Turn | User Says | System Does |
|------|----------|-------------|
| 1 | "Show monthly revenue" | Generates `SELECT date_trunc('month', order_date), SUM(total_amount) FROM orders GROUP BY 1 ORDER BY 1` |
| 2 | "Break that down by product category" | Modifies to add `JOIN products` and `GROUP BY category` |
| 3 | "Only for electronics" | Adds `WHERE category = 'Electronics'` |
| 4 | "Compare with last year" | Adds year column and expands date range |

**"New Question" resets the context entirely.**

---

### 7.6 Error Recovery Flow

```mermaid
flowchart TB
    SQL["Generated SQL"] --> EXEC["Execute Query"]
    EXEC --> R{"Execution\nResult?"}
    R -->|"Success"| DONE["✅ Return Results"]
    R -->|"Error"| ERR["Capture Error Message"]
    ERR --> COUNT{"Retry\nCount < 2?"}
    COUNT -->|"No"| FAIL["❌ Show Error to User\n+ LLM Suggestion"]
    COUNT -->|"Yes"| FIX["Send to LLM:\n'Fix this SQL.\nError: column X not found.\nOriginal SQL: ...\nSchema: ...'"]
    FIX --> NEW_SQL["LLM Returns Fixed SQL"]
    NEW_SQL --> VALIDATE["Re-validate Fixed SQL"]
    VALIDATE --> EXEC
```

---

### 7.7 Export System

```mermaid
flowchart LR
    RESULTS["Query Results\n(JSON)"] --> FORMAT{"Format?"}
    FORMAT -->|"CSV"| CSV["Python csv module\n→ StreamingHttpResponse"]
    FORMAT -->|"Excel"| XLSX["openpyxl workbook\n→ HttpResponse\n(application/xlsx)"]
    CSV --> DL["Browser Download"]
    XLSX --> DL
```

---

## 8. Workflow Flowcharts

### 8.1 Complete User Query Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant API as Django API
    participant CM as Conversation Manager
    participant SI as Schema Inspector
    participant NL as NL-to-SQL Engine
    participant LLM as LLM (Gemini/OpenAI)
    participant SV as SQL Validator
    participant QE as Query Executor
    participant DB as PostgreSQL
    participant CD as Chart Detector
    participant QX as Query Explainer

    User->>FE: Types question + clicks "Ask"
    FE->>API: POST /api/query/ {question, conversation_id}
    API->>CM: Get conversation context
    CM-->>API: {previous_sql, previous_summary}
    API->>SI: Get cached schema
    SI-->>API: {tables, columns, fks, samples}
    API->>NL: Generate SQL(schema, context, question)
    NL->>LLM: Prompt(system + schema + context + question)
    LLM-->>NL: Generated SQL string
    NL-->>API: SQL
    API->>SV: Validate(sql)
    SV-->>API: {is_safe, report, modified_sql}
    
    alt SQL is unsafe
        API-->>FE: {error: "Unsafe query", details}
        FE-->>User: Show safety error
    else SQL is safe
        API->>QE: Execute(validated_sql, timeout=10s)
        QE->>DB: SELECT ... (read-only connection)
        DB-->>QE: Result rows
        QE-->>API: {columns, rows, row_count, exec_time}
        
        par Parallel Processing
            API->>CD: Detect chart type(columns, rows)
            CD-->>API: {chart_type, chart_config}
        and
            API->>QX: Explain SQL(sql)
            QX->>LLM: "Explain this SQL in plain English: ..."
            LLM-->>QX: Plain English explanation
            QX-->>API: explanation
        end
        
        API->>CM: Update context(sql, results_summary)
        API-->>FE: {sql, results, chart_config, explanation, safety_report}
        FE-->>User: Render table + chart + SQL + explanation
    end
```

### 8.2 Schema Introspection Workflow

```mermaid
flowchart TB
    START["Schema Request"] --> CHECK{"Cached\nSchema?"}
    CHECK -->|"Yes + Fresh"| RETURN["Return Cache"]
    CHECK -->|"No or Stale"| CONNECT["Connect to DB"]
    CONNECT --> TABLES["SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public'"]
    TABLES --> COLS["For each table:\nSELECT column_name, data_type,\nis_nullable, column_default\nFROM information_schema.columns"]
    COLS --> PKS["SELECT constraint_name, column_name\nFROM information_schema.key_column_usage\nWHERE constraint_type = 'PRIMARY KEY'"]
    PKS --> FKS["SELECT tc.table_name, kcu.column_name,\nccu.table_name AS ref_table,\nccu.column_name AS ref_column\nFROM information_schema... (FK query)"]
    FKS --> COUNTS["For each table:\nSELECT COUNT(*) FROM table"]
    COUNTS --> SAMPLES["For each table:\nSELECT * FROM table LIMIT 5"]
    SAMPLES --> ENUMS["For text columns with\nlow cardinality:\nSELECT DISTINCT col\nFROM table LIMIT 20"]
    ENUMS --> BUILD["Build Schema Object"]
    BUILD --> SUMMARY["Generate LLM-Friendly\nText Summary"]
    SUMMARY --> CACHE["Store in Cache\n(TTL: 1 hour)"]
    CACHE --> RETURN
```

### 8.3 Frontend ↔ Backend API Communication

```mermaid
flowchart LR
    subgraph Frontend["Next.js Frontend"]
        QI["QueryInput\nPOST /api/query/"]
        SE["SchemaExplorer\nGET /api/schema/"]
        QH["QueryHistory\nGET /api/history/"]
        ER["ERDiagram\nGET /api/schema/relationships/"]
        EX["ExportPanel\nPOST /api/export/"]
        FU["Follow-Up\nPOST /api/query/followup/"]
        FAV["Favorites\nPOST /api/query/{id}/favorite/"]
        EDIT["SQL Editor\nPOST /api/query/execute-sql/"]
    end

    subgraph Backend["Django REST API"]
        direction TB
        V_QUERY["QueryViewSet"]
        V_SCHEMA["SchemaViewSet"]
        V_HISTORY["HistoryViewSet"]
        V_EXPORT["ExportView"]
    end

    QI --> V_QUERY
    SE --> V_SCHEMA
    QH --> V_HISTORY
    ER --> V_SCHEMA
    EX --> V_EXPORT
    FU --> V_QUERY
    FAV --> V_QUERY
    EDIT --> V_QUERY
```

### 8.4 Docker & Deployment Architecture

```mermaid
flowchart TB
    subgraph Docker["Docker Compose"]
        subgraph PG_C["PostgreSQL Container"]
            PG["PostgreSQL 15\nPort 5432\nVolume: pgdata"]
        end

        subgraph DJ_C["Django Container"]
            DJ["Django + Gunicorn\nPort 8000\nDependsOn: postgres"]
            SEED["Entrypoint:\nmigrate → seed → serve"]
        end

        subgraph NX_C["Next.js Container (Optional)"]
            NX["Next.js\nPort 3000"]
        end

        subgraph NG_C["Nginx Container"]
            NG["Nginx\nPort 80/443\nReverse Proxy"]
        end
    end

    CLIENT["🌐 Browser"] --> NG
    NG -->|"/api/*"| DJ
    NG -->|"/*"| NX
    DJ --> PG
    DJ --> SEED
```

---

## 9. Phased Implementation Roadmap

### PHASE 1 — Project Planning (Day 0.5)

#### 1.1 Requirement Analysis

| Category | Key Requirements |
|----------|-----------------|
| **Functional** | NL-to-SQL, schema introspection, safety validation, auto-charts, query explanation, conversational follow-up, schema explorer, query history, export |
| **Non-Functional** | Query response < 5 seconds, handle 10K+ row results, secure (no data modification), responsive UI |
| **Data** | Pre-loaded e-commerce DB with 500+ customers, 200+ products, 5K+ orders, 10K+ items, 2K+ reviews |

#### 1.2 Feature Breakdown & Prioritization

Build in this order (dependency-driven):

```mermaid
flowchart LR
    A["1. DB + Models\n+ Seed Data"] --> B["2. Schema\nIntrospection"]
    B --> C["3. NL-to-SQL\nEngine"]
    C --> D["4. SQL\nValidation"]
    D --> E["5. Query\nExecution"]
    E --> F["6. Chart\nDetection"]
    E --> G["7. Query\nExplanation"]
    F --> H["8. Frontend:\nQuery Interface"]
    G --> H
    H --> I["9. Schema\nExplorer UI"]
    I --> J["10. History\n+ Favorites"]
    J --> K["11. Export\n+ Polish"]
    K --> L["12. Conversational\nFollow-ups"]
    L --> M["13. ER Diagram\n+ Bonus"]
```

#### 1.3 Database Planning

**Two categories of tables:**

1. **E-Commerce Models** (the data users query):
   - `categories`, `customers`, `products`, `orders`, `order_items`, `reviews`
   - These live in the `ecommerce` Django app

2. **Application Models** (system metadata):
   - `QueryHistory`, `Favorite`, `DatabaseConnection`, `ConversationSession`
   - These live in the `sql_assistant` Django app

#### 1.4 API Planning

| Priority | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Core | `GET` | `/api/schema/` | Full introspected schema |
| Core | `GET` | `/api/schema/tables/{name}/` | Table details + preview + stats |
| Core | `GET` | `/api/schema/relationships/` | FK relationships (for ER diagram) |
| Core | `GET` | `/api/schema/suggestions/` | Auto-generated example questions |
| Core | `POST` | `/api/query/` | NL question → SQL → validate → execute |
| Core | `POST` | `/api/query/execute-sql/` | Execute manually edited SQL |
| Core | `GET` | `/api/query/{id}/explain/` | Plain English explanation |
| Core | `GET` | `/api/query/{id}/chart-config/` | Chart type + config |
| Core | `GET` | `/api/history/` | Query history (search, filter, paginate) |
| Core | `POST` | `/api/export/` | Export results (CSV, Excel) |
| Core | `GET` | `/api/health/` | Health check |
| Good | `POST` | `/api/query/followup/` | Conversational follow-up |
| Good | `POST` | `/api/query/{id}/favorite/` | Toggle favorite |
| Good | `GET` | `/api/favorites/` | Favorited queries |
| Good | `GET` | `/api/databases/` | List connected databases |
| Good | `POST` | `/api/databases/connect/` | Connect new database |

#### 1.5 Folder Structure

```
text-to-sql-assistant/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py          # Django settings + DB config
│   │   ├── urls.py              # Root URL conf
│   │   └── wsgi.py
│   ├── sql_assistant/           # Main Django app
│   │   ├── __init__.py
│   │   ├── models.py            # QueryHistory, Favorite, DatabaseConnection
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # API ViewSets
│   │   ├── urls.py              # App URLs
│   │   ├── admin.py             # Register models in admin
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── schema_inspector.py    # DB introspection + caching
│   │   │   ├── nl_to_sql.py           # LLM-powered SQL generation
│   │   │   ├── sql_validator.py       # Safety checks + resource limits
│   │   │   ├── query_executor.py      # Safe execution with timeout
│   │   │   ├── query_explainer.py     # SQL to plain English
│   │   │   ├── chart_detector.py      # Auto-detect chart type
│   │   │   ├── conversation_mgr.py    # Conversational follow-up
│   │   │   └── suggestion_generator.py # Auto-generate questions
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── seed_ecommerce.py  # Seed 10K+ rows
│   │   └── migrations/
│   ├── ecommerce/               # Sample e-commerce models
│   │   ├── __init__.py
│   │   ├── models.py            # Customer, Product, Order, etc.
│   │   ├── admin.py
│   │   └── migrations/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main query interface
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── schema/page.tsx      # Schema explorer
│   │   │   ├── history/page.tsx     # Query history
│   │   │   └── databases/page.tsx   # Connection manager
│   │   ├── components/
│   │   │   ├── QueryInput.tsx
│   │   │   ├── SQLDisplay.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── AutoChart.tsx
│   │   │   ├── QueryExplanation.tsx
│   │   │   ├── ConversationThread.tsx
│   │   │   ├── SchemaExplorer.tsx
│   │   │   ├── ERDiagram.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── SafetyCheck.tsx
│   │   │   ├── ChartTypeSelector.tsx
│   │   │   └── ExportPanel.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               # API client
│   │   │   └── types.ts             # TypeScript types
│   │   └── stores/
│   │       ├── queryStore.ts
│   │       ├── schemaStore.ts
│   │       ├── conversationStore.ts
│   │       └── historyStore.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

### PHASE 2 — Backend Development (Day 1 - Day 2)

#### 2.1 Django Project Setup

**What:** Initialize Django project, configure settings, set up PostgreSQL, install dependencies.

**Implementation Approach:**
```
1. Create virtualenv → install Django, DRF, psycopg2, sqlparse, openpyxl, google-generativeai
2. django-admin startproject config backend/
3. python manage.py startapp ecommerce
4. python manage.py startapp sql_assistant
5. Configure settings.py: INSTALLED_APPS, DATABASES (PostgreSQL), REST_FRAMEWORK, CORS
6. Set up docker-compose.yml with PostgreSQL service
```

**Best Practices:**
- Use `python-decouple` or `django-environ` for environment variables
- Split settings into `base.py`, `development.py`, `production.py`
- Configure CORS for frontend origin
- Set `DEFAULT_PAGINATION_CLASS` in DRF settings

---

#### 2.2 E-Commerce Models (ecommerce/models.py)

**Purpose:** Define the sample database schema that users will query.

**Implementation:**
- 6 models: `Category`, `Customer`, `Product`, `Order`, `OrderItem`, `Review`
- Proper foreign keys with `on_delete=CASCADE` or `PROTECT`
- Indexes on frequently queried columns (order_date, customer_id, product_id)
- Choices fields for `tier` and `status`
- `__str__` methods for admin readability

**Key Design Decisions:**
- Self-referential FK on `Category` (parent_category_id) for subcategories
- `subtotal` on `OrderItem` is computed (quantity × unit_price) — stored for query performance
- `total_amount` on `Order` is denormalized sum — avoids expensive JOINs for common queries
- Date ranges spanning 2 years for time-series queries

---

#### 2.3 Seed Data Command (seed_ecommerce.py)

**Purpose:** Generate realistic data so reviewers can test immediately.

**Data Volume:**
| Table | Rows | Notes |
|-------|------|-------|
| Categories | 15-20 | 10 top-level + subcategories |
| Customers | 500+ | Diverse cities, countries, tiers |
| Products | 200+ | Across all categories, varied prices |
| Orders | 5,000+ | Over 2-year date range |
| OrderItems | 10,000+ | 1-5 items per order |
| Reviews | 2,000+ | Ratings 1-5, realistic comments |

**Implementation Approach:**
- Use `Faker` library for realistic names, emails, cities, countries
- Use `random` for statistically distributed data (normal distribution for prices, ratings)
- Use `bulk_create()` for performance (not one-by-one)
- Distribute dates over 24 months with realistic patterns (more orders on weekends, seasonal spikes)
- Ensure referential integrity (each order_item references a valid order and product)

---

#### 2.4 Schema Introspection Service

**Purpose:** Automatically understand any connected database's structure.

**Module:** `services/schema_inspector.py`

**Internal Workflow:**
1. Connect to database via Django's `connection`
2. Query `information_schema.tables` for table names
3. Query `information_schema.columns` for column details
4. Query constraints for PKs and FKs
5. Execute `COUNT(*)` per table
6. Fetch 3-5 sample rows per table
7. Detect enum-like columns (low cardinality text columns)
8. Build structured schema dict
9. Generate compact text summary for LLM
10. Cache everything

**Output Format:**
```python
{
    "tables": {
        "customers": {
            "columns": [
                {"name": "id", "type": "integer", "pk": True, "nullable": False},
                {"name": "name", "type": "varchar(255)", "pk": False, "nullable": False},
                {"name": "tier", "type": "varchar(10)", "pk": False, "nullable": False,
                 "sample_values": ["bronze", "silver", "gold"]}
            ],
            "row_count": 500,
            "primary_key": "id",
            "foreign_keys": [],
            "sample_rows": [...]
        },
        "orders": {
            "columns": [...],
            "foreign_keys": [
                {"column": "customer_id", "references_table": "customers", "references_column": "id"}
            ]
        }
    },
    "relationships": [
        {"from_table": "orders", "from_column": "customer_id",
         "to_table": "customers", "to_column": "id", "type": "many-to-one"}
    ],
    "text_summary": "Table: customers (id INT PK, name VARCHAR, ...)\n..."
}
```

---

#### 2.5 NL-to-SQL Service

**Module:** `services/nl_to_sql.py`

**Implementation Approach:**
1. Build the prompt from: system role + schema summary + conversation context + user question + rules
2. Call LLM API (Gemini or OpenAI)
3. Parse the response to extract SQL (strip markdown code blocks if present)
4. Return the raw SQL string

**Token Optimization:**
- Compact schema format (no unnecessary whitespace)
- Include only relevant tables if the question is clearly about specific tables
- Limit sample data to 3 rows per table
- Use abbreviations: PK, FK, VARCHAR, INT

**Context Window Management:**
- Gemini Pro: ~30K tokens, GPT-4: ~8K-128K tokens
- With 6 tables, schema summary is ~500-800 tokens
- Conversation history: last 3 turns only (~300 tokens)
- Total prompt: ~1,500-2,000 tokens — well within limits

---

#### 2.6 SQL Validator Service

**Module:** `services/sql_validator.py`

**Implementation:**
```python
class SQLValidator:
    BLOCKED_KEYWORDS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER',
                        'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC']
    
    def validate(self, sql: str) -> ValidationResult:
        # 1. Parse with sqlparse
        # 2. Check statement type
        # 3. Scan for blocked keywords
        # 4. Check for injection patterns
        # 5. Enforce LIMIT
        # 6. Estimate resource usage
        # Return: {is_safe, issues, modified_sql, report}
```

---

#### 2.7 Query Executor Service

**Module:** `services/query_executor.py`

**Key Features:**
- Uses Django's `connection.cursor()` with a read-only database alias
- Sets `statement_timeout` (PostgreSQL) before execution
- Wraps execution in try/except for graceful error handling
- Returns structured results: `{columns: [...], rows: [...], row_count, execution_time_ms}`
- Limits result size for browser performance

**Best Practices:**
- **Never** use string formatting to build SQL (parameterize where possible)
- Always close cursors in `finally` blocks
- Log every query execution (for audit trail)
- Measure execution time with `time.perf_counter()`

---

#### 2.8 Query Explainer Service

**Module:** `services/query_explainer.py`

**Implementation:**
- Send SQL to LLM with prompt: "Explain this SQL query in plain English for a non-technical business user. Also provide a step-by-step breakdown of each clause."
- Return both: summary explanation + step-by-step list

---

#### 2.9 Chart Detector Service

**Module:** `services/chart_detector.py`

**Implementation:**
- Analyze column types (text, numeric, date) and value counts
- Apply the decision tree from section 7.4
- Return chart configuration JSON

---

#### 2.10 Conversation Manager Service

**Module:** `services/conversation_mgr.py`

**Implementation:**
- Store conversation sessions in the database
- Each session holds: `previous_sql`, `previous_result_summary`, `tables_referenced`, `turn_count`
- On follow-up: inject previous context into the LLM prompt
- On "New Question": clear the session context
- Limit to last 5 turns to avoid context overflow

---

#### 2.11 Suggestion Generator

**Module:** `services/suggestion_generator.py`

**Implementation:**
- Analyze the schema to generate diverse example questions
- Template-based + LLM-enhanced:
  - "Total {numeric_column} by {text_column}" → "Total revenue by product category"
  - "Top 10 {table} by {numeric_column}" → "Top 10 customers by total order value"
  - "Monthly trend of {numeric_column}" → "Monthly trend of order count"
  - "{table} where {condition}" → "Orders that are still pending"
- Generate 15-20 suggestions, return as clickable chips

---

#### 2.12 Error Handling & Recovery

**Strategy:**
1. SQL generation error → Return helpful message
2. SQL execution error → Auto-retry with LLM correction (up to 2 attempts)
3. LLM API error → Return graceful fallback message
4. Timeout → Return "Query took too long" with suggestion to add filters
5. All errors logged with full context for debugging

---

### PHASE 3 — Frontend Development (Day 2 - Day 3)

#### 3.1 Next.js Setup

```
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
```

Then install:
- `shadcn/ui` components (button, input, card, tabs, dialog, etc.)
- `recharts` for charts
- `@tanstack/react-table` for data tables
- `zustand` for state management
- `react-syntax-highlighter` for SQL display
- `reactflow` for ER diagram
- `@monaco-editor/react` for SQL editing (good-to-have)

#### 3.2 Component Architecture

| Component | Purpose | Key Interactions |
|-----------|---------|-----------------|
| **QueryInput** | NL question input bar + suggestion chips | Calls `POST /api/query/`, updates conversationStore |
| **SQLDisplay** | Syntax-highlighted SQL with copy button | Reads from queryStore, optional edit mode |
| **ResultsTable** | TanStack Table with sort, paginate, resize | Reads results from queryStore |
| **AutoChart** | Recharts visualization (bar/line/pie/scatter) | Reads chart_config from queryStore |
| **QueryExplanation** | Plain English explanation card | Reads explanation from queryStore |
| **ConversationThread** | Chat-style history of Q&A in current session | Reads from conversationStore |
| **SchemaExplorer** | Table list + column details sidebar | Calls `GET /api/schema/`, stores in schemaStore |
| **ERDiagram** | React Flow relationship visualization | Calls `GET /api/schema/relationships/` |
| **TablePreview** | Sample rows + column statistics | Calls `GET /api/schema/tables/{name}/` |
| **SafetyCheck** | Pre-execution validation display | Reads safety_report from queryStore |
| **ChartTypeSelector** | Toggle between chart types | Updates chart_type in queryStore |
| **ExportPanel** | CSV/Excel download buttons | Calls `POST /api/export/` |

#### 3.3 State Management (Zustand)

```typescript
// queryStore: current query state
{
  question: string,
  sql: string,
  results: { columns: Column[], rows: any[], rowCount: number },
  chartConfig: ChartConfig | null,
  explanation: string,
  safetyReport: SafetyReport,
  isLoading: boolean,
  error: string | null,
}

// schemaStore: cached database schema
{
  tables: Table[],
  relationships: Relationship[],
  suggestions: string[],
  isLoaded: boolean,
}

// conversationStore: current conversation
{
  sessionId: string,
  turns: ConversationTurn[],
  isFollowUp: boolean,
}

// historyStore: query history
{
  queries: QueryHistory[],
  filters: { search, dateRange, favorites },
  pagination: { page, pageSize },
}
```

#### 3.4 Page Layouts

**Main Query Interface (`/`):**
```
┌─────────────────────────────────────────────────────┐
│  🔍 Ask a question about your data...    [Ask]      │
├─────────────────────────────────────────────────────┤
│  💡 Top 10 products  │ Monthly revenue │ Gold custs │
├──────────┬──────────────────────────────────────────┤
│          │  ┌─────────────────────────────────┐      │
│ Chat     │  │  📊 Results  │ 📈 Chart │ 🔤 SQL │    │
│ Thread   │  ├─────────────────────────────────┤      │
│          │  │                                 │      │
│ Q: ...   │  │    Results Table / Chart / SQL   │      │
│ SQL: ... │  │                                 │      │
│ Q: ...   │  └─────────────────────────────────┘      │
│          │  ┌─────────────────────────────────┐      │
│          │  │ 💬 Explanation: "This query..."  │      │
│          │  └─────────────────────────────────┘      │
│          │  ┌─────────────────────────────────┐      │
│          │  │ ✅ Safety: SELECT | ~50 rows     │      │
│          │  └─────────────────────────────────┘      │
└──────────┴──────────────────────────────────────────┘
```

**Schema Explorer (`/schema`):**
```
┌──────────┬──────────────────────────────────────────┐
│          │  ┌─────────────────────────────────┐      │
│ Tables   │  │  ER Diagram (React Flow)        │      │
│          │  └─────────────────────────────────┘      │
│ ▸ customers (500)│  ┌──────────────────────────┐     │
│ ▸ products (200) │  │ Table: customers          │     │
│ ▸ orders (5000)  │  │ ┌─────────┬────────┬───┐ │     │
│ ▸ order_items    │  │ │ Column  │ Type   │PK │ │     │
│ ▸ reviews (2000) │  │ ├─────────┼────────┼───┤ │     │
│ ▸ categories     │  │ │ id      │ INT    │ ✓ │ │     │
│                  │  │ │ name    │ VARCHAR│   │ │     │
│                  │  │ │ ...     │ ...    │   │ │     │
│                  │  │ └─────────┴────────┴───┘ │     │
│                  │  │ Preview: first 10 rows    │     │
│                  │  └──────────────────────────┘     │
└──────────┴──────────────────────────────────────────┘
```

#### 3.5 Responsive Design Strategy

- **Mobile (< 768px):** Single column, tabs for navigation, collapsible panels
- **Tablet (768-1024px):** Two columns, conversation thread hidden behind toggle
- **Desktop (> 1024px):** Full three-column layout as designed above

#### 3.6 Loading & Error States

Every component must handle:
- **Loading:** Skeleton placeholders (shadcn Skeleton component)
- **Error:** Error message with retry button
- **Empty:** Helpful empty state with suggestion to get started
- **Success:** Smooth transition with subtle animation

---

### PHASE 4 — AI & LLM Integration (Interwoven with Phase 2)

#### 4.1 Prompt Engineering

**This is where SQL accuracy is won or lost.**

**System Prompt (crafted carefully):**
```
You are an expert SQL query generator for PostgreSQL databases.
Given a database schema and a natural language question, generate
the correct SQL query.

Rules:
1. Generate ONLY valid PostgreSQL SELECT statements
2. NEVER use DROP, DELETE, UPDATE, INSERT, ALTER, or any DDL/DML
3. Always include a LIMIT clause (default 100 unless the user asks for all)
4. Use proper JOIN syntax based on foreign key relationships
5. Use table aliases for readability (e.g., c for customers, o for orders)
6. Handle NULL values with COALESCE where appropriate
7. Use date_trunc() for date grouping, not string formatting
8. Return ONLY the SQL query, no explanation or markdown
9. If the question is ambiguous, make a reasonable assumption
10. Use meaningful column aliases in SELECT (e.g., total_revenue, customer_name)
```

**Key Prompting Techniques:**

| Technique | Example | Why It Works |
|-----------|---------|-------------|
| **Schema injection** | Include full table definitions in prompt | LLM knows exact column names and types |
| **Sample value injection** | `tier VARCHAR [bronze/silver/gold]` | LLM generates correct WHERE values |
| **Relationship injection** | `customers.id → orders.customer_id` | LLM generates correct JOINs |
| **Few-shot examples** | Include 2-3 example Q→SQL pairs | Demonstrates expected output format |
| **Negative constraints** | "NEVER use DROP" | Prevents destructive hallucinations |
| **Output format constraint** | "Return ONLY the SQL" | Prevents wrapper text that breaks parsing |

#### 4.2 SQL Correction Strategy

When SQL fails:
1. Capture the exact error message from PostgreSQL
2. Send to LLM: "The following SQL failed with error: `{error}`. Fix the SQL. Schema: `{schema}`. Original question: `{question}`. Failed SQL: `{sql}`"
3. The LLM typically fixes: column name typos, incorrect table aliases, missing JOINs, syntax errors
4. Re-validate the fixed SQL through the safety pipeline
5. Maximum 2 retry attempts, then report error to user

#### 4.3 Context Window Management

```
Total context budget: ~30,000 tokens (Gemini Pro)

Allocation:
├── System prompt:        ~300 tokens
├── Schema summary:       ~800 tokens (6 tables, compact format)
├── Sample values:        ~200 tokens
├── Relationships:        ~150 tokens
├── Rules:                ~200 tokens
├── Conversation history: ~500 tokens (last 3 turns)
├── User question:        ~50 tokens
├── Few-shot examples:    ~400 tokens
└── Reserved for output:  ~2,000 tokens
                          ─────────
Total:                    ~4,600 tokens (well within limits)
```

---

### PHASE 5 — Security & Production Readiness (Throughout)

#### 5.1 Security Layers

| Layer | Implementation |
|-------|---------------|
| **SQL Validation** | sqlparse parsing + keyword blacklist + injection detection |
| **Read-Only DB** | Separate PostgreSQL user with `SELECT`-only permissions |
| **Query Timeout** | `SET statement_timeout = '10s'` before each query |
| **LIMIT Enforcement** | Auto-append `LIMIT 1000` if missing |
| **CORS** | Restrict to frontend origin only |
| **Rate Limiting** | Django REST Framework throttling (e.g., 60 queries/min) |
| **Input Sanitization** | Validate all API inputs with DRF serializers |
| **Environment Variables** | API keys, DB credentials in `.env`, never in code |
| **HTTPS** | TLS termination at Nginx (production) |

#### 5.2 Read-Only Database Connection

```sql
-- PostgreSQL: Create read-only user
CREATE USER sql_reader WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE ecommerce_db TO sql_reader;
GRANT USAGE ON SCHEMA public TO sql_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sql_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sql_reader;
```

```python
# Django settings.py
DATABASES = {
    'default': {  # For Django ORM (QueryHistory, etc.)
        'ENGINE': 'django.db.backends.postgresql',
        'USER': 'django_admin',
        # ...
    },
    'readonly': {  # For user query execution
        'ENGINE': 'django.db.backends.postgresql',
        'USER': 'sql_reader',
        # ...
    }
}
```

#### 5.3 Caching Strategy

| What | Cache | TTL | Invalidation |
|------|-------|-----|-------------|
| Schema introspection | Django cache (memory/Redis) | 1 hour | Manual "Refresh Schema" button |
| Question suggestions | Django cache | 1 hour | On schema refresh |
| LLM responses | Not cached | N/A | Each query is unique |
| Query results | Not cached | N/A | Data changes; re-run for fresh results |

---

### PHASE 6 — Testing & Optimization (Day 3)

#### 6.1 Backend Testing

| Test Category | What to Test |
|---------------|-------------|
| **Schema Introspection** | All tables detected, FKs correct, sample data fetched |
| **SQL Validation** | Block DROP/DELETE/ALTER, allow SELECT, enforce LIMIT, detect injection |
| **Query Execution** | Correct results, timeout works, read-only enforced |
| **API Endpoints** | All endpoints return correct status codes and response shapes |
| **Seed Data** | Command creates correct row counts, referential integrity maintained |

**Critical SQL Validation Tests:**
```python
# Must BLOCK these:
"DROP TABLE customers"
"DELETE FROM orders WHERE 1=1"
"SELECT * FROM customers; DROP TABLE customers"
"SELECT * FROM customers UNION SELECT * FROM pg_catalog.pg_shadow"

# Must ALLOW these:
"SELECT * FROM customers LIMIT 10"
"SELECT c.name, COUNT(o.id) FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name"
```

#### 6.2 Frontend Testing

- Component rendering tests
- API integration tests (mock responses)
- Chart rendering for different data shapes
- Table pagination and sorting
- Responsive layout at different breakpoints

#### 6.3 Query Accuracy Testing

Test with 10+ diverse queries:

| # | Query | Expected SQL Pattern |
|---|-------|---------------------|
| 1 | "Total revenue by month" | `SELECT date_trunc, SUM ... GROUP BY` |
| 2 | "Top 10 customers by order value" | `SELECT ... JOIN ... GROUP BY ... ORDER BY ... DESC LIMIT 10` |
| 3 | "Orders from gold customers in 2025" | `SELECT ... JOIN ... WHERE tier = 'gold' AND date >= '2025'` |
| 4 | "Average product rating by category" | `SELECT ... JOIN ... JOIN ... GROUP BY ... AVG(rating)` |
| 5 | "Monthly order count trend" | `SELECT date_trunc, COUNT ... GROUP BY ... ORDER BY` |
| 6 | "Find customers named John in New York" | `SELECT ... WHERE name ILIKE '%John%' AND city = 'New York'` |
| 7 | "Compare revenue this month vs last month" | Subquery or CASE WHEN with date ranges |
| 8 | "Products with no reviews" | `LEFT JOIN ... WHERE review.id IS NULL` |
| 9 | "Order status distribution" | `SELECT status, COUNT(*) ... GROUP BY status` |
| 10 | "Customer acquisition by month" | `SELECT date_trunc(joined_date), COUNT(*)` |

---

### PHASE 7 — Deployment & DevOps (Day 3-4)

#### 7.1 Docker Compose Setup

```yaml
# docker-compose.yml structure
services:
  postgres:
    image: postgres:15
    volumes: [pgdata:/var/lib/postgresql/data]
    environment: [POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD]
    ports: ["5432:5432"]
    healthcheck: pg_isready

  backend:
    build: ./backend
    depends_on: [postgres]
    environment: [DATABASE_URL, LLM_API_KEY]
    ports: ["8000:8000"]
    command: >
      sh -c "python manage.py migrate &&
             python manage.py seed_ecommerce --skip-if-exists &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000"

  frontend:
    build: ./frontend
    depends_on: [backend]
    ports: ["3000:3000"]
    environment: [NEXT_PUBLIC_API_URL]
```

#### 7.2 Environment Variables (.env.example)

```env
# Database
POSTGRES_DB=ecommerce_db
POSTGRES_USER=django_admin
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql://django_admin:changeme@postgres:5432/ecommerce_db

# Read-only DB user
READONLY_DB_USER=sql_reader
READONLY_DB_PASSWORD=readonly_password

# LLM
LLM_PROVIDER=gemini  # or openai
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Django
DJANGO_SECRET_KEY=your_secret_key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

### PHASE 8 — Final Polish & Submission (Day 4)

#### 8.1 README Requirements

- Architecture diagram (Mermaid or image)
- Setup instructions: `docker-compose up -d` → `seed_ecommerce` → ready
- 10+ sample queries with expected results
- Screenshots of: query → SQL → table → chart → explanation flow
- Schema explorer + ER diagram screenshot
- API documentation (endpoints, request/response formats)
- Environment variable documentation

#### 8.2 Demo Video Outline (5-7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00 | Introduction, show the app loaded with sample data |
| 0:30 | Ask "What is the total revenue by month?" → Show table + line chart + explanation |
| 1:30 | Ask "Top 10 products by sales" → Show table + bar chart |
| 2:30 | Conversational follow-up: "Break that down by category" |
| 3:30 | Show schema explorer + ER diagram |
| 4:30 | Try a dangerous query: "DROP TABLE customers" → Show safety block |
| 5:00 | Show query history, favorites, export |
| 5:30 | Show the generated SQL explanation |
| 6:00 | Show chart type switching |
| 6:30 | Wrap up |

#### 8.3 Production Checklist

- [ ] All 14 core features working
- [ ] Sample database seeded with 10K+ rows
- [ ] 10+ diverse queries produce correct SQL
- [ ] Safety validation blocks all destructive queries
- [ ] Auto-chart correctly selects chart type for different result shapes
- [ ] Query explanation is clear and accurate
- [ ] Schema explorer shows all tables, columns, relationships
- [ ] Error recovery works (SQL error → auto-fix → retry)
- [ ] Query history persists and supports re-run
- [ ] CSV export works
- [ ] Docker Compose works end-to-end
- [ ] README is complete with samples and screenshots
- [ ] .env.example includes all required variables

---

## 10. How Production Companies Build Similar Systems

### Industry Examples

| Company | Product | Key Differentiators |
|---------|---------|-------------------|
| **Databricks** | Genie | Lakehouse-native, enterprise SSO, fine-tuned SQL model |
| **Snowflake** | Cortex Analyst | Snowflake-native, semantic models, embedded in data platform |
| **AWS** | QuickSight Q | Integrated with AWS ecosystem, ML-powered NLU |
| **ThoughtSpot** | Sage | Search-based analytics, fine-tuned models, caching layer |
| **Defog.ai** | Defog | Open-source, fine-tuned models (SQLCoder), self-hosted |

### How They Differ from Our System

| Aspect | Enterprise Systems | Our System |
|--------|-------------------|------------|
| **LLM** | Fine-tuned models on SQL datasets | General-purpose LLM with prompt engineering |
| **Schema** | Semantic layers with business glossaries | Direct database introspection |
| **Security** | Row-level security, data masking, audit logs | Read-only connection + SQL validation |
| **Scale** | Millions of queries/day, distributed execution | Single-user, single-database |
| **Caching** | Query result caching, materialized views | Schema caching only |
| **Monitoring** | Full observability stack (traces, metrics, alerts) | Basic logging |

### What We Can Learn

1. **Schema enrichment matters**: Adding business descriptions ("revenue = order total amount") to columns dramatically improves accuracy
2. **Fine-tuning > prompting**: For production, companies fine-tune models on SQL datasets (Spider, WikiSQL, CoSQL)
3. **Guardrails are essential**: Multiple layers of validation, not just keyword blocking
4. **User feedback loop**: Let users rate query results (thumbs up/down) to improve over time
5. **Query caching**: Cache common queries to reduce LLM calls and latency

---

## Summary

This project is a **complete end-to-end AI application** that combines:
- **Backend engineering** (Django, DRF, PostgreSQL, service architecture)
- **AI/LLM integration** (prompt engineering, schema-aware SQL generation, error recovery)
- **Security engineering** (multi-layer validation, read-only access, resource bounding)
- **Data visualization** (auto-chart detection, interactive Recharts, TanStack Tables)
- **Frontend development** (Next.js, TypeScript, state management, responsive design)
- **DevOps** (Docker, docker-compose, environment management)

The system architecture follows a clean **layered pattern**: API Layer → Service Layer → Data Layer, with the LLM as an external service called by the NL-to-SQL and Query Explainer services.

> [!TIP]
> The most critical success factor is **prompt engineering**. The accuracy of SQL generation depends entirely on how well you inject schema context, sample values, and relationship information into the LLM prompt. Spend extra time crafting and testing the prompt.
