<div align="center">

# 🧠 Text-to-SQL AI Database Assistant

**Ask questions in plain English. Get instant SQL, validated results, auto-generated charts, and human-readable explanations — in under 10 seconds.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

A full-stack AI-powered platform that converts **natural language questions** into safe, validated SQL queries, executes them against a PostgreSQL database, and renders results as **interactive charts** — with a **plain English explanation** of what was queried. Ships with a **pre-seeded 10K+ row e-commerce database** so you can query from day one.

> **🎯 The Non-Technical User Benchmark:** A marketing manager who has never written SQL should get an accurate, visualized answer to a complex multi-table question in under 10 seconds.

[Quick Start](#-quick-start) · [Architecture](#-system-architecture) · [API Reference](#-api-reference) · [Example Queries](#-example-queries--expected-outputs) · [Deployment](#-deployment--devops)

</div>

---

## 📑 Table of Contents

- [Project Overview & Purpose](#-project-overview--purpose)
- [Problem Statement](#-problem-statement)
- [Features & Capabilities](#-features--capabilities)
- [System Architecture](#-system-architecture)
- [Complete Tech Stack & Rationale](#-complete-tech-stack--rationale)
- [Project Structure](#-project-structure)
- [Backend Architecture & Workflow](#-backend-architecture--workflow)
- [Frontend Architecture & Workflow](#-frontend-architecture--workflow)
- [Database Architecture](#-database-architecture)
- [API Reference](#-api-reference)
- [Authentication & Security Flow](#-authentication--security-flow)
- [SQL Safety & Validation Pipeline](#-sql-safety--validation-pipeline)
- [AI/LLM Workflow & Prompt Engineering](#-aillm-workflow--prompt-engineering)
- [Query Execution Lifecycle (End-to-End)](#-query-execution-lifecycle-end-to-end)
- [Auto-Visualization Engine](#-auto-visualization-engine)
- [Conversational Query System](#-conversational-query-system)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [Docker Setup](#-docker-setup)
- [Database Seeding](#-database-seeding)
- [Development Workflow](#-development-workflow)
- [Deployment & DevOps](#-deployment--devops)
- [Error Handling Strategy](#-error-handling-strategy)
- [Testing Strategy](#-testing-strategy)
- [Scalability Considerations](#-scalability-considerations)
- [Future Improvements](#-future-improvements)
- [Example Queries & Expected Outputs](#-example-queries--expected-outputs)
- [UI Screens & Layout](#-ui-screens--layout)
- [Decision Log](#-decision-log)
- [Known Limitations](#-known-limitations)
- [Troubleshooting](#-troubleshooting)
- [Contribution Guidelines](#-contribution-guidelines)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🎯 Project Overview & Purpose

### What Is This?

The **Text-to-SQL AI Database Assistant** is a production-grade, full-stack application that empowers **non-technical business users** — sales managers, marketing leads, product managers, C-suite executives — to query relational databases using **plain English** instead of writing SQL.

**A user types:**
> *"What were our top 10 products by revenue last quarter?"*

**The system automatically:**

1. 🔍 **Understands** the database schema (tables, columns, relationships, sample values)
2. 🤖 **Generates** the correct SQL query using an LLM with schema-aware prompting
3. 🛡️ **Validates** the SQL for safety (blocks destructive operations, enforces resource limits)
4. ⚡ **Executes** the query against a read-only database connection with timeouts
5. 📊 **Auto-visualizes** results with the most appropriate chart type (bar, line, pie, scatter)
6. 💬 **Explains** the SQL in plain English so the user understands exactly what was queried
7. 🔄 **Supports follow-ups** — "Now break that down by region" modifies the previous query

### Who Is This For?

| User Type | How They Use It |
|-----------|----------------|
| **Sales Manager** | "Which customers haven't ordered in 90 days?" → Instant churn analysis |
| **Marketing Lead** | "What's our revenue trend by month this year?" → Campaign performance |
| **Product Manager** | "Top 10 products by average review rating" → Product insights |
| **Executive** | "Total revenue, total orders, and average order value" → KPI dashboard |
| **Data Analyst** | Edit generated SQL, export CSV/Excel, explore schema → Power-user mode |

---

## 📋 Problem Statement

### The Data Access Gap

In most organizations, a critical asymmetry exists:

```
┌──────────────────────────────────────────────────────────────────┐
│                    THE DATA ACCESS GAP                           │
│                                                                  │
│   📊 100% of employees NEED data to make decisions               │
│   💻 < 5% of employees CAN write SQL                             │
│                                                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│   Current workflow:                                              │
│   Employee → Files ticket → Data team queue (2-5 days)           │
│             → Analyst writes query → Sends back CSV              │
│             → Employee: "Can you also add..." → Back to queue    │
│                                                                  │
│   With Text-to-SQL:                                              │
│   Employee → Types question → Instant answer + chart + export    │
│                                                                  │
│   ⏱️ From DAYS to SECONDS                                        │
└──────────────────────────────────────────────────────────────────┘
```

### What This Project Solves

| Problem | Impact | This System's Solution |
|---------|--------|----------------------|
| 95% of employees can't write SQL | Critical data insights locked behind technical skills | Natural language interface — type English, get SQL |
| Data requests queue for days | Decisions delayed, opportunities missed | Instant query execution with results in <5 seconds |
| BI tools require training | Tableau/Power BI have steep learning curves | Zero training needed — if you can type a question, you can query |
| No visibility into what was queried | Users get CSVs without understanding the logic | Every query comes with a plain English explanation |
| Risk of destructive queries | One wrong `DELETE` or `DROP` can destroy data | 5-layer safety validation + read-only database connection |
| Raw data isn't actionable | Tables of numbers don't communicate insights | Auto-generated charts (bar, line, pie) with smart type detection |

---

## ✨ Features & Capabilities

### Core Features (Must-Have)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Natural Language to SQL** | LLM converts English questions to valid PostgreSQL queries using full schema context | ✅ |
| 2 | **Schema Introspection** | Auto-detect all tables, columns, types, PKs, FKs, relationships, row counts, sample values | ✅ |
| 3 | **SQL Safety Validation** | 5-layer pipeline: type whitelist → keyword blocklist → injection detection → LIMIT enforcement → resource estimation | ✅ |
| 4 | **Query Execution** | Execute validated SQL on read-only connection with configurable timeout (default 10s) | ✅ |
| 5 | **Interactive Results Table** | Sortable, paginated, resizable columns via TanStack Table | ✅ |
| 6 | **Auto-Chart Generation** | Detect best chart type (bar/line/pie/scatter/KPI) and render with Recharts | ✅ |
| 7 | **SQL Syntax Highlighting** | Display generated SQL with syntax highlighting and copy-to-clipboard | ✅ |
| 8 | **Query Explanation** | LLM translates SQL back to plain English + step-by-step clause breakdown | ✅ |
| 9 | **Smart Suggestions** | Auto-generated clickable example questions based on detected schema (15+ suggestions) | ✅ |
| 10 | **Query History** | Full history with search, filter, re-run, timestamps, and row counts | ✅ |
| 11 | **CSV Export** | Download query results as CSV with proper column headers | ✅ |
| 12 | **Error Recovery** | On SQL error, auto-send error to LLM for correction, retry up to 2x | ✅ |
| 13 | **Schema Explorer** | Visual table/column browser with data types, PK/FK badges, and statistics | ✅ |
| 14 | **Sample Database** | Pre-loaded e-commerce DB with 10K+ rows across 6 tables, seeded via management command | ✅ |

### Good-to-Have Features (Intermediate)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Conversational Follow-ups** | "Now break that down by region" modifies the previous SQL contextually | ✅ |
| 2 | **Manual SQL Editing** | Edit generated SQL in Monaco editor before execution | ✅ |
| 3 | **Chart Type Toggle** | Switch between bar/line/pie/table for the same result set | ✅ |
| 4 | **ER Diagram** | Visual relationship map of all tables using React Flow | ✅ |
| 5 | **Table Statistics** | Min, max, avg, null count, unique count per column | ✅ |
| 6 | **Value Distributions** | Mini bar charts for enum-like columns (e.g., order status breakdown) | ✅ |
| 7 | **Step-by-Step Explanation** | Clause-by-clause SQL breakdown (SELECT → FROM → JOIN → WHERE → GROUP BY) | ✅ |
| 8 | **Query Favorites** | Bookmark queries for quick re-access | ✅ |
| 9 | **Excel Export** | .xlsx download via openpyxl | ✅ |
| 10 | **Safety Check Display** | Pre-execution validation summary with user confirmation | ✅ |

### Bonus Features (Advanced)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Multi-Database Support** | Connect to PostgreSQL AND SQLite, query either | 🔧 |
| 2 | **KPI Cards** | Single-row aggregates rendered as large metric cards | ✅ |
| 3 | **SQL Clause Highlighting** | Color-code SELECT/FROM/JOIN/WHERE/GROUP BY/ORDER BY | ✅ |
| 4 | **Full Docker Setup** | docker-compose with PostgreSQL + auto-seeded data on startup | ✅ |
| 5 | **Query Optimization Suggestions** | LLM suggests indexes or query rewrites for slow queries | 🔧 |
| 6 | **EXPLAIN Plan Visualization** | Show database query execution plan as a visual tree | 🔧 |
| 7 | **Dashboard Builder** | Save multiple queries as widgets on a custom dashboard | 🔧 |
| 8 | **Scheduled Queries** | Run a query on schedule and export results (mock) | 🔧 |

> ✅ = Implemented | 🔧 = Planned / In Progress

---

## 🏗️ System Architecture

### High-Level Architecture Overview

```
                    ┌──────────────────────────────────────────────────────┐
                    │                 CLIENT (Browser)                      │
                    │                                                      │
                    │     Next.js 14 (App Router) + TypeScript              │
                    │     Tailwind CSS + shadcn/ui                         │
                    │     Recharts · TanStack Table · React Flow            │
                    │     Zustand (State) · Monaco Editor                   │
                    │                                                      │
                    │  ┌──────────┬──────────┬──────────┬──────────────┐   │
                    │  │QueryInput│AutoChart │SQLDisplay│SchemaExplorer│   │
                    │  │ResultTab │ChartToggle│Explain  │ERDiagram     │   │
                    │  │ConvThread│SafetyChk │Export   │TablePreview  │   │
                    │  └──────────┴──────────┴──────────┴──────────────┘   │
                    └────────────────────────┬─────────────────────────────┘
                                             │
                                      REST API (JSON)
                                      CORS Protected
                                             │
                    ┌────────────────────────┴─────────────────────────────┐
                    │                 BACKEND SERVER                        │
                    │                                                      │
                    │     Django 4.2+ · Django REST Framework               │
                    │     Gunicorn (Production WSGI)                        │
                    │                                                      │
                    │  ┌─────────────────────────────────────────────────┐ │
                    │  │              API LAYER (DRF Views)               │ │
                    │  │  SchemaViewSet · QueryViewSet · HistoryViewSet   │ │
                    │  │  ExportView · DatabaseViewSet · HealthView       │ │
                    │  └─────────────────────┬───────────────────────────┘ │
                    │                        │                             │
                    │  ┌─────────────────────┴───────────────────────────┐ │
                    │  │             SERVICE LAYER (Business Logic)       │ │
                    │  │                                                  │ │
                    │  │  ┌────────────────┐   ┌─────────────────────┐   │ │
                    │  │  │ SchemaInspector│   │    NLtoSQL          │   │ │
                    │  │  │ + schema cache │   │ (schema-aware LLM)  │   │ │
                    │  │  └────────────────┘   └─────────────────────┘   │ │
                    │  │  ┌────────────────┐   ┌─────────────────────┐   │ │
                    │  │  │  SQLValidator  │   │   QueryExecutor     │   │ │
                    │  │  │  (sqlparse AST)│   │ (read-only, 10s TO) │   │ │
                    │  │  └────────────────┘   └─────────────────────┘   │ │
                    │  │  ┌────────────────┐   ┌─────────────────────┐   │ │
                    │  │  │  ChartDetector │   │   QueryExplainer    │   │ │
                    │  │  │  (dtype rules) │   │   (LLM → English)  │   │ │
                    │  │  └────────────────┘   └─────────────────────┘   │ │
                    │  │  ┌────────────────┐   ┌─────────────────────┐   │ │
                    │  │  │  ConvManager   │   │   SuggestionGen     │   │ │
                    │  │  │  (session ctx) │   │   (schema→questions)│   │ │
                    │  │  └────────────────┘   └─────────────────────┘   │ │
                    │  │  ┌────────────────┐                             │ │
                    │  │  │  ExportEngine  │                             │ │
                    │  │  │  (CSV / xlsx)  │                             │ │
                    │  │  └────────────────┘                             │ │
                    │  └────────────────────────────────────────────────┘  │
                    │                                                      │
                    │  ┌─────────────────────────────────────────────────┐ │
                    │  │              MODEL LAYER (Django ORM)            │ │
                    │  │  QueryHistory · Favorite · DatabaseConnection    │ │
                    │  │  ConversationSession                             │ │
                    │  └─────────────────────────────────────────────────┘ │
                    └───────────┬──────────────────────────┬───────────────┘
                                │                          │
                     SQL Execute│(read-only)     LLM API  │ Calls
                                │                          │
               ┌────────────────┴──────────┐    ┌─────────┴──────────────┐
               │  PostgreSQL 15             │    │  Google Gemini 1.5     │
               │                            │    │  (or OpenAI GPT-4o)    │
               │  ┌──────────────────────┐  │    │                        │
               │  │ E-Commerce Database   │  │    │  • SQL Generation      │
               │  │ 6 tables · 10K+ rows  │  │    │  • Query Explanation   │
               │  │ 2-year date range     │  │    │  • Error Correction    │
               │  └──────────────────────┘  │    │  • Suggestion Gen      │
               │                            │    │                        │
               │  readonly_user (SELECT)    │    │  Schema-aware prompts  │
               │  statement_timeout = 10s   │    │  Context retention     │
               │  LIMIT 1000 enforced       │    │  Retry on failure      │
               └────────────────────────────┘    └────────────────────────┘
```

### Service Boundaries

Each service in `sql_assistant/services/` is a **stateless class with one public method**. Services do not import each other — the **view layer composes them**. This makes each service independently testable, mockable, and replaceable.

```
services/
├── schema_inspector.py    → get_schema(), get_prompt_summary(), refresh()
├── nl_to_sql.py           → generate(question, schema, conversation_ctx?)
├── sql_validator.py       → validate(sql) → (bool, cleaned_sql, reason)
├── query_executor.py      → execute(sql) → {columns, rows, row_count, exec_ms}
├── query_explainer.py     → explain(sql) → {summary, steps[]}
├── chart_detector.py      → detect(columns, rows) → ChartConfig
├── conversation_mgr.py    → get_context(session), save_turn(session, turn)
├── suggestion_generator.py → generate(schema) → list[str]
└── export_engine.py       → to_csv(results), to_xlsx(results) → bytes
```

### Communication Flow

```
┌──────────┐    HTTP/JSON     ┌──────────────┐    SQL (readonly)    ┌──────────────┐
│          │ ◄──────────────► │              │ ──────────────────► │              │
│  Next.js │                  │    Django     │                     │  PostgreSQL  │
│ Frontend │                  │   Backend    │ ◄────────────────── │   Database   │
│          │                  │              │   Result Rows        │              │
└──────────┘                  └──────┬───────┘                     └──────────────┘
                                     │
                                     │  HTTPS API Calls
                                     │  (Prompt + Schema)
                                     │
                              ┌──────┴───────┐
                              │              │
                              │   LLM API    │
                              │  (Gemini /   │
                              │   OpenAI)    │
                              │              │
                              └──────────────┘
```

---

## 🛠️ Complete Tech Stack & Rationale

### Backend

| Technology | Version | Role | Why This Choice |
|-----------|---------|------|-----------------|
| **Django** | 4.2+ | Web framework | Batteries-included: ORM for models, admin panel for data inspection, built-in database introspection APIs, migration system, management commands |
| **Django REST Framework** | 3.14+ | API layer | Industry-standard for Django REST APIs. Built-in serializers, viewsets, pagination, throttling, content negotiation |
| **PostgreSQL** | 15 | Primary database | Production-grade RDBMS. Rich `information_schema` for introspection, `EXPLAIN` for query cost estimation, native read-only roles, excellent for complex analytical queries |
| **sqlparse** | 0.5+ | SQL parsing & validation | Parses SQL into an AST for reliable keyword detection. Handles whitespace, casing, and comment tricks that break regex-based validation |
| **Google Gemini** | 1.5 Flash | LLM (default) | Generous free tier (60 RPM), strong SQL generation accuracy, large context window (~30K tokens). One-line swap to GPT-4o for production |
| **OpenAI GPT-4** | 4o (optional) | LLM (premium) | Best-in-class SQL accuracy for complex JOINs and subqueries. Higher cost but justified for enterprise use |
| **openpyxl** | 3.1+ | Excel export | Industry-standard Python library for creating `.xlsx` files with proper formatting |
| **Faker** | 20+ | Seed data generation | Realistic names, emails, cities, countries for the sample database. Better than hand-written test data |
| **python-decouple** | 3.8+ | Environment management | Clean separation of settings from code. Reads from `.env` files with type casting |
| **Gunicorn** | 21+ | WSGI server | Production-grade HTTP server. Handles concurrent requests via worker processes (not Django's single-threaded dev server) |
| **django-cors-headers** | 4.3+ | CORS | Secure cross-origin requests from the Next.js frontend |

### Frontend

| Technology | Version | Role | Why This Choice |
|-----------|---------|------|-----------------|
| **Next.js** | 14+ | React framework | App Router for file-based routing, server components for performance, excellent TypeScript support, built-in optimization |
| **TypeScript** | 5.0+ | Type safety | Catches bugs at compile time, self-documenting interfaces, better IDE support. Essential for a project with complex data shapes |
| **Tailwind CSS** | 3.4+ | Styling | Utility-first CSS for rapid development. No context-switching between files. Consistent design system |
| **shadcn/ui** | Latest | Component library | Beautiful, accessible, **non-dependency** components (copied into your project). Full Tailwind integration, easy to customize |
| **Recharts** | 2.10+ | Charts | React-native charting built on D3. Bar, line, pie, scatter, area charts with responsive containers and tooltips |
| **TanStack Table** | 8.11+ | Data tables | Headless table library: sorting, pagination, column resizing, row virtualization for 10K+ rows. Zero styling opinions |
| **React Flow** | 11+ | ER diagrams | Node-based graph visualization. Perfect for showing table relationships with interactive drag, zoom, and pan |
| **Zustand** | 4.5+ | State management | Minimal boilerplate (~100 lines). Handles both server state (schema) and UI state (conversation context) cleanly. No Redux overhead |
| **Monaco Editor** | 0.45+ | SQL editing | VS Code's editor component. Syntax highlighting, bracket matching, minimap. Overkill for display but perfect for editing |
| **react-syntax-highlighter** | 15+ | SQL display | Lightweight read-only code display with theme support. Used for non-editable SQL rendering |

### Infrastructure & DevOps

| Technology | Role | Why This Choice |
|-----------|------|-----------------|
| **Docker** | Containerization | Reproducible environment. No "works on my machine" issues. Reviewers don't need to install PostgreSQL locally |
| **Docker Compose** | Orchestration | Define Django + PostgreSQL + Frontend as services. One command (`docker-compose up`) to start everything |
| **Nginx** | Reverse proxy (production) | Serves static files efficiently, proxies API requests, TLS termination, compression |
| **PostgreSQL (Docker)** | Database container | Isolated, versioned, reproducible. Volume-mounted for data persistence |

---

## 📁 Project Structure

```
text-to-sql-assistant/
│
├── backend/                                # Django Backend Application
│   ├── manage.py                           # Django management entry point
│   ├── config/                             # Project configuration
│   │   ├── __init__.py
│   │   ├── settings.py                     # Base settings (DB, apps, middleware, DRF, cache, CORS)
│   │   ├── settings_prod.py                # Production overrides (DEBUG=False, security headers)
│   │   ├── urls.py                         # Root URL configuration → includes sql_assistant.urls
│   │   ├── wsgi.py                         # WSGI entry for Gunicorn
│   │   └── asgi.py                         # ASGI entry (for future WebSocket/streaming support)
│   │
│   ├── sql_assistant/                      # Core application — all business logic lives here
│   │   ├── __init__.py
│   │   ├── models.py                       # QueryHistory, Favorite, DatabaseConnection, ConversationSession
│   │   ├── serializers.py                  # DRF serializers for all API request/response shapes
│   │   ├── views.py                        # DRF ViewSets — composes services, returns JSON
│   │   ├── urls.py                         # App-level URL routing → maps to views
│   │   ├── admin.py                        # Django Admin registrations for all models
│   │   ├── apps.py                         # App configuration
│   │   │
│   │   ├── services/                       # ⭐ Business logic layer — stateless, composable services
│   │   │   ├── __init__.py
│   │   │   ├── schema_inspector.py         # DB introspection: tables, columns, types, PKs, FKs, samples
│   │   │   ├── nl_to_sql.py                # LLM-powered SQL generation with schema-aware prompting
│   │   │   ├── sql_validator.py            # 5-layer safety validation pipeline
│   │   │   ├── query_executor.py           # Read-only SQL execution with timeout and error handling
│   │   │   ├── query_explainer.py          # SQL → plain English translation via LLM
│   │   │   ├── chart_detector.py           # Auto-detect chart type from result column types
│   │   │   ├── conversation_mgr.py         # Conversational follow-up context management
│   │   │   ├── suggestion_generator.py     # Auto-generate example questions from schema
│   │   │   └── export_engine.py            # CSV and Excel export with proper formatting
│   │   │
│   │   ├── management/
│   │   │   └── commands/
│   │   │       ├── seed_ecommerce.py       # Generate 10K+ rows of realistic e-commerce data
│   │   │       └── refresh_schema.py       # Force schema cache invalidation and re-introspection
│   │   │
│   │   ├── tests/                          # Test suite
│   │   │   ├── test_validator.py           # SQL validation edge cases
│   │   │   ├── test_chart_detector.py      # Chart type detection accuracy
│   │   │   ├── test_schema_inspector.py    # Introspection correctness
│   │   │   └── test_nl_to_sql.py           # SQL generation accuracy
│   │   │
│   │   └── migrations/                     # Django auto-generated migration files
│   │
│   ├── ecommerce/                          # Sample e-commerce data models (no business logic)
│   │   ├── __init__.py
│   │   ├── models.py                       # Customer, Product, Category, Order, OrderItem, Review
│   │   ├── admin.py                        # Admin registrations for e-commerce models
│   │   └── migrations/
│   │
│   ├── requirements.txt                    # Production dependencies
│   ├── requirements-dev.txt                # Dev dependencies (pytest, factory-boy, coverage, flake8)
│   └── Dockerfile                          # Backend container definition
│
├── frontend/                               # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                            # Next.js App Router pages
│   │   │   ├── layout.tsx                  # Root layout (fonts, metadata, navigation)
│   │   │   ├── page.tsx                    # / → Main query interface
│   │   │   ├── schema/
│   │   │   │   └── page.tsx                # /schema → Schema explorer + ER diagram
│   │   │   ├── history/
│   │   │   │   └── page.tsx                # /history → Query history + favorites
│   │   │   └── databases/
│   │   │       └── page.tsx                # /databases → Connection manager (admin)
│   │   │
│   │   ├── components/                     # Reusable UI components
│   │   │   ├── QueryInput.tsx              # NL question input bar + suggestion chips
│   │   │   ├── SQLDisplay.tsx              # Syntax-highlighted SQL with copy button
│   │   │   ├── ResultsTable.tsx            # TanStack Table with sort, paginate, resize
│   │   │   ├── AutoChart.tsx               # Auto-generated Recharts visualization
│   │   │   ├── QueryExplanation.tsx        # Plain English explanation card
│   │   │   ├── ConversationThread.tsx      # Chat-style query history in current session
│   │   │   ├── SchemaExplorer.tsx          # Table list + column details sidebar
│   │   │   ├── ERDiagram.tsx               # React Flow relationship visualization
│   │   │   ├── TablePreview.tsx            # Sample rows + column statistics
│   │   │   ├── SafetyCheck.tsx             # Pre-execution validation display
│   │   │   ├── ChartTypeSelector.tsx       # Toggle between bar/line/pie/table
│   │   │   ├── ExportPanel.tsx             # CSV/Excel download buttons
│   │   │   └── KPICards.tsx                # Large metric cards for single-row results
│   │   │
│   │   ├── lib/                            # Utility modules
│   │   │   ├── api.ts                      # API client (fetch wrapper with error handling)
│   │   │   └── types.ts                    # TypeScript type definitions for all data shapes
│   │   │
│   │   └── stores/                         # Zustand state management
│   │       ├── queryStore.ts               # Current query, results, chart, explanation
│   │       ├── schemaStore.ts              # Cached schema, suggestions
│   │       ├── conversationStore.ts        # Conversation context, turns, session ID
│   │       └── historyStore.ts             # Query history, filters, pagination
│   │
│   ├── public/                             # Static assets
│   ├── package.json                        # Frontend dependencies
│   ├── tailwind.config.ts                  # Tailwind configuration
│   ├── tsconfig.json                       # TypeScript configuration
│   ├── next.config.js                      # Next.js configuration
│   └── Dockerfile                          # Frontend container definition
│
├── docker-compose.yml                      # Development: Django + PostgreSQL + Frontend
├── docker-compose.prod.yml                 # Production: + Nginx, optimized builds
├── .env.example                            # Environment variable template
├── .gitignore                              # Git ignore rules
├── LICENSE                                 # MIT License
└── README.md                               # This file
```

### Why This Structure?

| Decision | Rationale |
|----------|-----------|
| **Separate `sql_assistant/` and `ecommerce/` apps** | Separation of concerns: business logic (query processing) vs. sample data (e-commerce models). The ecommerce app could be swapped for any other domain |
| **`services/` directory with single-responsibility classes** | Each service does one thing. No circular imports. Easy to test with mocks. Easy to swap implementations (e.g., change LLM provider) |
| **`config/` separate from apps** | Django best practice: settings, URLs, and WSGI entry isolated from application code |
| **Zustand stores split by domain** | Each store manages one concern. No monolithic store. Components import only what they need |
| **`lib/api.ts` as a central API client** | One place to configure base URL, headers, error handling. All components use the same client |

---

## ⚙️ Backend Architecture & Workflow

### Layered Architecture

The backend follows a strict **3-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    API LAYER (Views)                      │
│  Handles HTTP concerns: request parsing, serialization,  │
│  status codes, pagination. NO business logic here.       │
├─────────────────────────────────────────────────────────┤
│                  SERVICE LAYER (Services)                 │
│  All business logic: SQL generation, validation,         │
│  execution, chart detection, explanation. Stateless.     │
│  Services do NOT import each other.                      │
├─────────────────────────────────────────────────────────┤
│                   DATA LAYER (Models + DB)                │
│  Django ORM models, database connections, migrations.    │
│  Raw SQL execution via cursor (for user queries).        │
└─────────────────────────────────────────────────────────┘
```

### Backend Request Flow

```
HTTP Request
    │
    ▼
urls.py (route matching)
    │
    ▼
views.py (DRF ViewSet)
    │
    ├──► serializers.py (validate input, shape output)
    │
    ├──► services/schema_inspector.py (get schema)
    ├──► services/nl_to_sql.py (generate SQL)
    ├──► services/sql_validator.py (validate SQL)
    ├──► services/query_executor.py (execute SQL)
    ├──► services/chart_detector.py (detect chart type)
    ├──► services/query_explainer.py (explain SQL)
    ├──► services/conversation_mgr.py (manage context)
    │
    ├──► models.py (save QueryHistory)
    │
    ▼
JSON Response
```

### Key Models

```python
# sql_assistant/models.py

class QueryHistory(models.Model):
    """Every executed query — the source of truth for history and favorites."""
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4)
    question        = models.TextField()                    # Original NL question
    generated_sql   = models.TextField()                    # Generated (or edited) SQL
    explanation     = models.TextField(blank=True)          # Plain English explanation
    result_preview  = models.JSONField(default=dict)        # First 10 rows (for history display)
    chart_type      = models.CharField(max_length=20)       # bar/line/pie/scatter/kpi/table
    chart_config    = models.JSONField(default=dict)        # Full chart configuration
    safety_report   = models.JSONField(default=dict)        # Validation results
    result_rows     = models.IntegerField()                 # Total row count
    execution_ms    = models.IntegerField()                 # Query execution time
    is_favorite     = models.BooleanField(default=False)    # Bookmarked?
    is_successful   = models.BooleanField(default=True)     # Did execution succeed?
    error_message   = models.TextField(blank=True)          # Error details if failed
    conversation_id = models.UUIDField(null=True, blank=True)  # Groups follow-up turns
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['conversation_id']),
            models.Index(fields=['is_favorite']),
            models.Index(fields=['created_at']),
        ]


class DatabaseConnection(models.Model):
    """Registered database connections (supports multi-DB)."""
    name        = models.CharField(max_length=100, unique=True)
    engine      = models.CharField(max_length=50)      # postgresql / sqlite
    host        = models.CharField(max_length=255)
    port        = models.IntegerField(default=5432)
    db_name     = models.CharField(max_length=100)
    username    = models.CharField(max_length=100)
    is_active   = models.BooleanField(default=True)
    last_pinged = models.DateTimeField(null=True)
    created_at  = models.DateTimeField(auto_now_add=True)


class ConversationSession(models.Model):
    """Tracks conversation context for follow-up queries."""
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    database_id = models.ForeignKey(DatabaseConnection, null=True, on_delete=models.SET_NULL)
    context     = models.JSONField(default=dict)       # {previous_sql, result_summary, tables}
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
```

### LLM Prompt Structure

```python
# Exact prompt structure sent to the LLM for every query
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
- For 'last quarter', 'last month', etc., compute dates relative to CURRENT_DATE.
- Prefer explicit JOINs (JOIN ... ON) over implicit joins (WHERE table1.col = table2.col).
""".strip()

def build_prompt(schema_summary: str, question: str, conversation_ctx: dict = None) -> str:
    prompt = f"""
{SYSTEM_PROMPT}

--- DATABASE SCHEMA ---
{schema_summary}

--- USER QUESTION ---
{question}
""".strip()

    if conversation_ctx:
        prompt = f"""
{SYSTEM_PROMPT}

--- DATABASE SCHEMA ---
{schema_summary}

--- PREVIOUS CONTEXT ---
Previous question: {conversation_ctx['previous_question']}
Previous SQL: {conversation_ctx['previous_sql']}
Previous result summary: {conversation_ctx['result_summary']}

--- FOLLOW-UP QUESTION ---
{question}

Modify the previous SQL to address the follow-up question.
""".strip()

    return prompt
```

### Error Recovery Flow

```python
def generate_with_retry(self, question: str, schema: str) -> tuple[str, dict]:
    """Generate SQL with automatic error recovery (up to LLM_MAX_RETRIES attempts)."""
    sql = self.generate(question, schema)

    for attempt in range(settings.LLM_MAX_RETRIES):
        # Step 1: Validate
        is_valid, cleaned_sql, reason = SQLValidator().validate(sql)
        if not is_valid:
            raise ValidationError(reason)  # Safety block — never retry destructive SQL

        # Step 2: Execute
        try:
            result = QueryExecutor().execute(cleaned_sql)
            return cleaned_sql, result
        except DatabaseError as e:
            if attempt == settings.LLM_MAX_RETRIES - 1:
                raise  # Final attempt failed — surface error to user

            # Step 3: Ask LLM to fix the SQL
            sql = self._fix_sql(
                original_sql=sql,
                error_message=str(e),
                schema=schema
            )

    raise MaxRetriesExceeded()
```

---

## 🖥️ Frontend Architecture & Workflow

### State Management (Zustand)

```typescript
// src/stores/queryStore.ts — Central query state
interface QueryState {
  // Conversation
  conversationId:   string | null;
  turns:            QueryTurn[];
  isLoading:        boolean;

  // Current result
  currentSQL:       string | null;
  currentResults:   QueryResult | null;
  currentChart:     ChartConfig | null;
  currentExplain:   string | null;
  safetyReport:     SafetyReport | null;

  // Schema (fetched once, cached in memory)
  schema:           Schema | null;
  suggestions:      string[];

  // Actions
  ask:              (question: string) => Promise<void>;
  followUp:         (question: string) => Promise<void>;
  runSQL:           (sql: string) => Promise<void>;
  resetConversation:() => void;
  toggleFavorite:   (queryId: string) => Promise<void>;
  refreshSchema:    () => Promise<void>;
}
```

### Component Architecture

```
Page (page.tsx)
  │
  ├── QueryInput          → User types question, clicks "Ask"
  │     └── SuggestionChips  → Clickable example questions
  │
  ├── ConversationThread  → Chat-style history (left panel)
  │     └── QueryTurnCard → Individual Q&A pair
  │
  ├── Results Area (tabs)
  │     ├── ResultsTable  → TanStack Table (sortable, paginated)
  │     ├── AutoChart     → Recharts (bar/line/pie/scatter)
  │     │     └── ChartTypeSelector → Toggle chart type
  │     └── SQLDisplay    → Syntax-highlighted SQL
  │           └── SQLEditor (Monaco) → Edit mode
  │
  ├── QueryExplanation    → Plain English card
  │
  ├── SafetyCheck         → Validation summary
  │
  └── ExportPanel         → CSV/Excel download buttons
```

### Key Component Contracts

```typescript
// Shared data shapes used by all components

interface QueryResult {
  columns:   string[];                      // Column names
  rows:      (string | number | null)[][];  // Row data as 2D array
  row_count: number;                        // Total rows returned
}

interface ChartConfig {
  type:      'bar' | 'line' | 'pie' | 'scatter' | 'kpi' | 'table';
  x?:        string;     // Column name for x-axis / name
  y?:        string;     // Column name for y-axis / value
  title?:    string;     // Auto-generated chart title
  metrics?:  string[];   // Column names for KPI cards
}

interface SafetyReport {
  query_type:      string;     // "SELECT"
  estimated_rows:  number;     // e.g., 50
  tables_accessed: string[];   // e.g., ["products", "order_items"]
  passed:          boolean;    // true if all checks passed
  checks:          SafetyCheck[];
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

### Chart Type Mapping

```typescript
// src/components/AutoChart.tsx
const CHART_COMPONENTS: Record<ChartType, React.FC<ChartProps>> = {
  bar:     BarChartView,     // Recharts BarChart
  line:    LineChartView,    // Recharts LineChart
  pie:     PieChartView,     // Recharts PieChart
  scatter: ScatterChartView, // Recharts ScatterChart
  kpi:     KPICardView,      // Custom metric cards
  table:   null,             // Falls through to ResultsTable
};

// All charts wrapped in <ResponsiveContainer width="100%" height={320}>
// Shared CustomTooltip component for consistent hover formatting
```

---

## 🗄️ Database Architecture

### E-Commerce Schema (Sample Data)

```sql
-- ═══════════════════════════════════════════════════════════════════
-- CUSTOMERS — Business users, segmented by tier
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)  NOT NULL,
    email       VARCHAR(254)  UNIQUE NOT NULL,
    city        VARCHAR(100),
    country     VARCHAR(100),
    tier        VARCHAR(10)   CHECK (tier IN ('bronze', 'silver', 'gold')) DEFAULT 'bronze',
    joined_date DATE          NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- CATEGORIES — Hierarchical product categories (self-referential FK)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE categories (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    parent_category_id INTEGER      REFERENCES categories(id),
    description        TEXT
);

-- ═══════════════════════════════════════════════════════════════════
-- PRODUCTS — Items in the catalog
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200)   NOT NULL,
    category_id  INTEGER        REFERENCES categories(id),
    brand        VARCHAR(100),
    price        DECIMAL(10, 2) NOT NULL,
    stock_qty    INTEGER        DEFAULT 0,
    created_date DATE           NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- ORDERS — Customer purchases with status tracking
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    customer_id  INTEGER        NOT NULL REFERENCES customers(id),
    order_date   DATE           NOT NULL,
    status       VARCHAR(20)    CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(12, 2) NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- ORDER ITEMS — Line items within each order
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER        NOT NULL REFERENCES orders(id),
    product_id  INTEGER        NOT NULL REFERENCES products(id),
    quantity    INTEGER        NOT NULL,
    unit_price  DECIMAL(10, 2) NOT NULL,
    subtotal    DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ═══════════════════════════════════════════════════════════════════
-- REVIEWS — Customer product reviews with ratings
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE reviews (
    id           SERIAL PRIMARY KEY,
    product_id   INTEGER  NOT NULL REFERENCES products(id),
    customer_id  INTEGER  NOT NULL REFERENCES customers(id),
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_date DATE     NOT NULL
);
```

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  categories  │       │   products   │       │   reviews    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)      │◄──────│ product_id(FK)│
│ name         │   │   │ name         │       │ customer_id(FK)──┐
│ parent_id(FK)│───┘   │ category_id(FK)──────│ rating       │   │
│ description  │       │ brand        │       │ comment      │   │
└──────────────┘       │ price        │       │ created_date │   │
                       │ stock_qty    │       └──────────────┘   │
                       │ created_date │                          │
                       └──────┬───────┘                          │
                              │                                  │
                              │ product_id (FK)                  │
                              │                                  │
┌──────────────┐       ┌──────┴───────┐       ┌──────────────┐  │
│  customers   │       │ order_items  │       │   orders     │  │
├──────────────┤       ├──────────────┤       ├──────────────┤  │
│ id (PK)      │◄──┐   │ id (PK)      │       │ id (PK)      │  │
│ name         │   │   │ order_id (FK)│───────│◄─            │  │
│ email        │   │   │ product_id(FK)│       │ customer_id(FK)│◄┘
│ city         │   │   │ quantity     │       │ order_date   │
│ country      │   │   │ unit_price   │       │ status       │
│ tier         │   │   │ subtotal     │       │ total_amount │
│ joined_date  │   │   └──────────────┘       └──────────────┘
└──────────────┘   │                                  │
                   └──────────────────────────────────┘
                           customer_id (FK)
```

### Seeded Data Volumes

| Table | Rows | Key Characteristics |
|-------|------|-------------------|
| `categories` | 15 (3-level hierarchy) | Electronics → Laptops → Gaming Laptops |
| `customers` | 500–600 | `joined_date` spanning 2 years, mixed tiers (bronze/silver/gold) |
| `products` | 200–250 | Across all 15 categories, prices from $5 to $2000, varied stock |
| `orders` | 5,000–6,000 | `order_date` spanning 2 years, all 4 statuses represented |
| `order_items` | 10,000–12,000 | 1–5 items per order, referential integrity maintained |
| `reviews` | 2,000–2,500 | Ratings 1–5 (normal distribution centered at 3.8), realistic comments |

### Dual Database Connection Strategy

```python
# config/settings.py — Two separate connections with different permissions
DATABASES = {
    # DEFAULT: Django ORM operations (migrations, QueryHistory, admin)
    # Full read/write access — used ONLY by Django's internal ORM
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     env('POSTGRES_DB'),
        'USER':     env('POSTGRES_USER'),          # django_admin (full access)
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST':     env('POSTGRES_HOST'),
        'PORT':     env('POSTGRES_PORT', default=5432),
    },

    # READONLY: User query execution — SELECT-only, hard timeout
    # Even if a destructive query bypasses all validation, this connection CANNOT write
    'readonly': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     env('POSTGRES_DB'),
        'USER':     env('READONLY_DB_USER'),       # readonly_user (SELECT only)
        'PASSWORD': env('READONLY_DB_PASSWORD'),
        'HOST':     env('POSTGRES_HOST'),
        'PORT':     env('POSTGRES_PORT', default=5432),
        'OPTIONS': {
            'options': '-c default_transaction_read_only=on'
        },
    },
}
```

> **Why two connections?** A single connection with validation-only protection means a bug in the validator exposes write access. The `readonly` connection enforces `read_only=on` at the PostgreSQL session level — even `connection.execute('DROP TABLE')` is rejected by PostgreSQL itself. Defense in depth.

---

## 📡 API Reference

All endpoints return `Content-Type: application/json`. Error responses follow the format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

### Query Endpoints

#### `POST /api/query/` — Natural Language Query

Convert a natural language question to SQL, validate, execute, and return results with chart + explanation.

```bash
curl -X POST http://localhost:8000/api/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Top 5 products by total revenue"}'
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | ✅ | Natural language question |
| `conversation_id` | UUID | — | Omit to start a new conversation; include to follow up |

**Response `200 OK`**

```json
{
  "query_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "conversation_id": "7e9a1234-abcd-5678-efgh-9012ijkl3456",
  "sql": "SELECT p.name, SUM(oi.subtotal) AS revenue\nFROM products p\nJOIN order_items oi ON p.id = oi.product_id\nGROUP BY p.name\nORDER BY revenue DESC\nLIMIT 5",
  "results": {
    "columns": ["name", "revenue"],
    "rows": [
      ["Laptop Pro 15", 245000.00],
      ["Wireless Headphones", 189500.00],
      ["Smart Watch Ultra", 156200.00],
      ["Gaming Mouse RGB", 134800.00],
      ["USB-C Hub Dock", 98700.00]
    ],
    "row_count": 5
  },
  "chart_config": {
    "type": "bar",
    "x": "name",
    "y": "revenue",
    "title": "Top 5 Products by Revenue"
  },
  "explanation": "This finds the 5 products that generated the most revenue. It joins the products and order items tables, sums the subtotal per product, and returns the top 5 sorted from highest to lowest revenue.",
  "safety_report": {
    "query_type": "SELECT",
    "estimated_rows": 5,
    "tables_accessed": ["products", "order_items"],
    "passed": true,
    "checks": [
      {"name": "Query Type", "status": "pass", "detail": "SELECT (safe)"},
      {"name": "Keyword Check", "status": "pass", "detail": "No blocked keywords"},
      {"name": "Injection Check", "status": "pass", "detail": "No injection patterns"},
      {"name": "LIMIT Check", "status": "pass", "detail": "LIMIT 5 present"},
      {"name": "Resource Check", "status": "pass", "detail": "Estimated rows: 5"}
    ]
  },
  "execution_ms": 38
}
```

**Response `400 Bad Request` — Validation Failure**

```json
{
  "error": "Query blocked by safety validator",
  "code": "VALIDATION_FAILED",
  "reason": "Blocked operation: DROP",
  "sql": "DROP TABLE customers"
}
```

**Response `500 Internal Server Error` — LLM Failure**

```json
{
  "error": "Failed to generate SQL after 2 retry attempts",
  "code": "GENERATION_FAILED",
  "details": {
    "original_error": "column 'total_revenue' does not exist",
    "attempts": 2
  }
}
```

---

#### `POST /api/query/followup/` — Conversational Follow-Up

Modify the previous query based on a new instruction. Requires `conversation_id`.

```bash
curl -X POST http://localhost:8000/api/query/followup/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Only show electronics category", "conversation_id": "7e9a1234-..."}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | ✅ | Follow-up instruction (modifies previous SQL) |
| `conversation_id` | UUID | ✅ | Session ID from previous query response |

Response format is identical to `POST /api/query/`.

---

#### `POST /api/query/execute-sql/` — Execute Manual SQL

Execute manually edited SQL (goes through full validation pipeline).

```bash
curl -X POST http://localhost:8000/api/query/execute-sql/ \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM customers WHERE tier = '\''gold'\''"}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sql` | string | ✅ | Raw SQL to validate and execute |
| `conversation_id` | UUID | — | Optional: associate with a conversation |

---

#### `GET /api/query/{id}/explain/` — Get Query Explanation

```bash
curl http://localhost:8000/api/query/3fa85f64-5717.../explain/
```

```json
{
  "summary": "This finds the 5 products that generated the most revenue...",
  "steps": [
    "Step 1: Join products with order_items using product ID",
    "Step 2: Group results by product name",
    "Step 3: Calculate total revenue (sum of subtotals) per product",
    "Step 4: Sort from highest to lowest revenue",
    "Step 5: Return only the top 5 results"
  ]
}
```

---

#### `GET /api/query/{id}/chart-config/` — Get Chart Configuration

```bash
curl http://localhost:8000/api/query/3fa85f64-5717.../chart-config/
```

```json
{
  "type": "bar",
  "x": "name",
  "y": "revenue",
  "title": "Top 5 Products by Revenue",
  "alternatives": ["line", "pie", "table"]
}
```

---

#### `POST /api/query/{id}/favorite/` — Toggle Favorite

```bash
curl -X POST http://localhost:8000/api/query/3fa85f64-5717.../favorite/
```

```json
{
  "query_id": "3fa85f64-...",
  "is_favorite": true
}
```

---

### Schema Endpoints

#### `GET /api/schema/` — Full Introspected Schema

Returns complete database schema (cached after first call).

```json
{
  "tables": {
    "customers": {
      "columns": [
        {"name": "id", "type": "integer", "pk": true, "nullable": false},
        {"name": "name", "type": "varchar(200)", "pk": false, "nullable": false},
        {"name": "tier", "type": "varchar(10)", "pk": false, "nullable": true,
         "enum_values": ["bronze", "silver", "gold"]}
      ],
      "row_count": 523,
      "foreign_keys": [],
      "referenced_by": [
        {"table": "orders", "column": "customer_id"},
        {"table": "reviews", "column": "customer_id"}
      ],
      "sample_rows": [
        {"id": 1, "name": "Alice Johnson", "email": "alice@example.com",
         "city": "New York", "country": "USA", "tier": "gold", "joined_date": "2024-03-15"}
      ]
    }
  },
  "relationships": [
    {"from": "orders.customer_id", "to": "customers.id", "cardinality": "N:1"},
    {"from": "order_items.order_id", "to": "orders.id", "cardinality": "N:1"},
    {"from": "order_items.product_id", "to": "products.id", "cardinality": "N:1"},
    {"from": "products.category_id", "to": "categories.id", "cardinality": "N:1"},
    {"from": "reviews.product_id", "to": "products.id", "cardinality": "N:1"},
    {"from": "reviews.customer_id", "to": "customers.id", "cardinality": "N:1"},
    {"from": "categories.parent_category_id", "to": "categories.id", "cardinality": "N:1"}
  ]
}
```

#### `GET /api/schema/tables/{name}/` — Table Detail + Preview

```bash
curl http://localhost:8000/api/schema/tables/orders/
```

Returns: column details + 10-row preview + column statistics (min, max, avg, null count, unique count).

#### `GET /api/schema/relationships/` — FK Relationships (for ER Diagram)

Returns all foreign key relationships in React Flow-compatible format.

#### `GET /api/schema/suggestions/` — Auto-Generated Questions

```json
{
  "suggestions": [
    "Total revenue by month",
    "Top 10 customers by total order value",
    "Average product rating by category",
    "Order status distribution",
    "Monthly customer acquisition trend",
    "Products with no reviews",
    "Gold tier customers with highest spending",
    "Most popular product categories",
    "Orders pending for more than 7 days",
    "Revenue comparison: this month vs last month",
    "Customers who ordered in both 2024 and 2025",
    "Average order value by customer tier",
    "Top 5 cities by number of customers",
    "Products with rating above 4.5",
    "Monthly trend of cancelled orders"
  ]
}
```

#### `POST /api/schema/refresh/` — Force Schema Re-Introspection

Invalidates cache and re-introspects. Use after migrations or schema changes.

---

### History & Favorites Endpoints

```bash
# Paginated query history with search and filters
GET /api/history/?page=1&page_size=20&search=revenue&favorites_only=true

# Get favorited queries
GET /api/favorites/

# Re-run a saved query (fresh execution)
GET /api/query/{id}/rerun/
```

### Export Endpoints

```bash
# CSV export
POST /api/export/
  {"query_id": "3fa85f64-...", "format": "csv"}
  → Content-Disposition: attachment; filename="query_results.csv"

# Excel export
POST /api/export/
  {"query_id": "3fa85f64-...", "format": "xlsx"}
  → Content-Disposition: attachment; filename="query_results.xlsx"
```

### Database Management Endpoints

```bash
# List connected databases
GET /api/databases/

# Connect a new database
POST /api/databases/connect/
  {"name": "analytics_db", "engine": "postgresql", "host": "...", "port": 5432, "db_name": "..."}

# Test connection
POST /api/databases/{id}/test/
```

### Health Check

```bash
GET /api/health/

# 200 → {"status": "ok", "db": "connected", "schema_cached": true, "llm": "reachable"}
# 503 → {"status": "degraded", "db": "unreachable", "details": "..."}
```

---

## 🔐 Authentication & Security Flow

### Security Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Layer 1: CORS                                           │  │
│  │  Only requests from the configured frontend origin are   │  │
│  │  allowed. All other origins are rejected at Nginx/Django.│  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 2: Rate Limiting                                   │  │
│  │  30 requests/minute per IP (configurable via .env).       │  │
│  │  Prevents brute-force LLM API cost attacks.               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 3: Input Validation (DRF Serializers)              │  │
│  │  All request payloads validated for type, length, format. │  │
│  │  Rejects malformed requests before any processing.        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 4: SQL Validation Pipeline (5 stages)              │  │
│  │  See "SQL Safety & Validation Pipeline" section.          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 5: Read-Only Database Connection                   │  │
│  │  PostgreSQL session-level read_only=on. Even if all       │  │
│  │  software validation fails, the database rejects writes.  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 6: Query Timeout                                   │  │
│  │  statement_timeout = 10s at session level. Prevents       │  │
│  │  long-running queries from consuming resources.           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │  Layer 7: Environment Isolation                           │  │
│  │  API keys, DB passwords stored in .env (never in code).  │  │
│  │  Secrets manager recommended for production.              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|------------|
| LLM hallucinates `DROP TABLE` | LLM generates destructive SQL | Keyword blocklist in SQL validator (Layer 4, Stage 2) |
| Stacked query injection | `SELECT * FROM x; DROP TABLE y` | Semicolon detection in SQL validator (Layer 4, Stage 3) |
| UNION-based data exfiltration | `... UNION SELECT * FROM pg_shadow` | UNION keyword detection (Layer 4, Stage 3) |
| Full-table scan (DoS) | `SELECT * FROM orders` (no LIMIT) | Auto-append `LIMIT 1000` (Layer 4, Stage 4) |
| Long-running query (DoS) | Complex analytical query consumes CPU | `statement_timeout = 10s` at PostgreSQL session level (Layer 6) |
| Cartesian product explosion | `CROSS JOIN` on large tables | CROSS JOIN + row estimate check (Layer 4, Stage 5) |
| Validator bypass via encoding | Whitespace tricks, comment injection | `sqlparse` normalizes tokens before checking (Layer 4) |
| Validator bypass at DB level | All software layers compromised | `readonly_user` has no WRITE grants + `read_only=on` session (Layer 5) |
| LLM API key leakage | Key exposed in logs or responses | Key in env var; never logged, never returned in API responses |
| Brute-force LLM API cost | Rapid-fire requests to exhaust API quota | Rate limiting: 30 req/min/IP via `django-ratelimit` (Layer 2) |
| CSRF attacks | Cross-site request forgery | Django CSRF middleware + CORS restriction |

### Authentication Note

> **Current state:** The API has no authentication layer. This is intentional for the current internal-tool / demo scope.
>
> **For production / multi-tenant deployment:** Add Django REST Framework's `TokenAuthentication` or `SessionAuthentication` before the rate limiter. The architecture supports this — add an auth middleware to `settings.py` and `DEFAULT_AUTHENTICATION_CLASSES` to DRF settings.

---

## 🛡️ SQL Safety & Validation Pipeline

This is the **most critical safety component** in the entire system. LLMs can and do hallucinate destructive SQL. Without this pipeline, a single hallucinated `DROP TABLE` could destroy production data.

### 5-Stage Validation Pipeline

```
                            INPUT SQL
                               │
                               ▼
                 ┌──────────────────────────────┐
            ┌────│  STAGE 1: Parse SQL           │
            │    │  sqlparse.parse(sql)           │
            │    │  Can it be parsed at all?      │
            │    └──────────────┬─────────────────┘
            │                   │ ✅
            │                   ▼
            │    ┌──────────────────────────────┐
            │    │  STAGE 2: Query Type Check    │
            ├────│  Is it a SELECT statement?    │
            │    │  Check token types for         │
            │    │  DDL/DML (DROP, DELETE, etc.)  │
            │    └──────────────┬─────────────────┘
            │                   │ ✅
            │                   ▼
            │    ┌──────────────────────────────┐
            │    │  STAGE 3: Injection Detection │
            ├────│  • Semicolons (stacked queries)│
            │    │  • UNION SELECT patterns       │
            │    │  • Comment-based bypass (--)   │
            │    │  • Encoded attack patterns     │
            │    └──────────────┬─────────────────┘
            │                   │ ✅
            │                   ▼
            │    ┌──────────────────────────────┐
            │    │  STAGE 4: Resource Limits     │
            ├────│  • LIMIT clause present?       │
            │    │    → Auto-append LIMIT 1000    │
            │    │  • CROSS JOIN on large tables? │
            │    └──────────────┬─────────────────┘
            │                   │ ✅
            │                   ▼
            │    ┌──────────────────────────────┐
            │    │  STAGE 5: Cost Estimation     │
            ├────│  EXPLAIN → estimated rows      │
            │    │  Reject if > 100K rows         │
            │    │  Warn on expensive operations  │
            │    └──────────────┬─────────────────┘
            │                   │ ✅
     ❌     │                   ▼
  REJECTED  │         ✅ APPROVED — EXECUTE
  (reason   │         on readonly connection
   string)  │         with statement_timeout
            │
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
    """
    Returns (passed, cleaned_sql, rejection_reason).

    Stage 1: Parse with sqlparse
    Stage 2: Check for blocked DDL/DML tokens
    Stage 3: Detect injection patterns
    Stage 4: Enforce LIMIT clause
    Stage 5: Estimate query cost
    """
    # Stage 1: Parse
    parsed = sqlparse.parse(sql.strip())
    if not parsed:
        return False, sql, "SQL could not be parsed"

    # Stage 2: Blocked operations
    for statement in parsed:
        for token in statement.flatten():
            if token.ttype in BLOCKED_TYPES and token.normalized.upper() in BLOCKED_VALUES:
                return False, sql, f"Blocked operation: {token.normalized.upper()}"

    # Stage 3: Injection detection
    clean = sqlparse.format(sql, strip_comments=True).strip()
    if ';' in clean[:-1]:   # allow trailing semicolon
        return False, sql, "Stacked queries are not permitted"

    if re.search(r'\bUNION\b.*\bSELECT\b', clean, re.IGNORECASE):
        return False, sql, "UNION-based injection detected"

    # Stage 4: LIMIT enforcement
    if not _has_limit(parsed[0]):
        sql = f"{clean.rstrip(';')} LIMIT {settings.MAX_QUERY_ROWS}"

    # Stage 5: Cost estimation (via EXPLAIN)
    estimated_rows = _estimate_rows(sql)
    if estimated_rows and estimated_rows > 100000:
        return False, sql, f"Query would scan ~{estimated_rows:,} rows (limit: 100K)"

    return True, sql, ""
```

### Validation Test Matrix

| Input | Expected Result | Stage |
|-------|----------------|-------|
| `SELECT COUNT(*) FROM customers` | ✅ Pass, SQL unchanged | — |
| `SELECT * FROM customers` (no LIMIT) | ✅ Pass, `LIMIT 1000` appended | Stage 4 |
| `DROP TABLE customers` | ❌ Fail: `BLOCKED_OPERATION` | Stage 2 |
| `DELETE FROM orders WHERE id = 1` | ❌ Fail: `BLOCKED_OPERATION` | Stage 2 |
| `SELECT * FROM customers; DROP TABLE orders` | ❌ Fail: `STACKED_QUERY` | Stage 3 |
| `SELECT * FROM a UNION SELECT * FROM b` | ❌ Fail: `INJECTION_PATTERN` | Stage 3 |
| `SELECT * FROM customers -- WHERE 1=0` | ✅ Pass (comment stripped, re-validated) | Stage 3 |
| `SELEKT * FORM foo` (invalid SQL) | ❌ Fail: `PARSE_ERROR` | Stage 1 |
| `SELECT * FROM orders CROSS JOIN customers` | ❌ Fail: `CARTESIAN_PRODUCT` | Stage 5 |

---

## 🤖 AI/LLM Workflow & Prompt Engineering

### How the LLM Is Used

The LLM is called in **three distinct contexts**, each with a different prompt:

| Context | Purpose | Prompt Strategy |
|---------|---------|----------------|
| **SQL Generation** | Convert NL question → SQL query | System role + full schema + relationships + sample values + rules + question |
| **Query Explanation** | Translate SQL → plain English | System role + SQL + "explain for a non-technical user" |
| **Error Correction** | Fix failed SQL | Previous SQL + error message + schema + "fix this error" |

### Prompt Engineering Deep Dive

#### SQL Generation Prompt

```
┌────────────────────────────────────────────────────────────┐
│  SYSTEM ROLE (~300 tokens)                                 │
│  "You are an expert PostgreSQL assistant..."               │
│  Rules: SELECT only, always LIMIT, use JOINs, COALESCE,   │
│  DATE_TRUNC, ILIKE, table aliases                          │
├────────────────────────────────────────────────────────────┤
│  DATABASE SCHEMA (~800 tokens)                             │
│  Table: customers (id INT PK, name VARCHAR, email VARCHAR, │
│    city VARCHAR, country VARCHAR,                          │
│    tier VARCHAR [bronze/silver/gold],                      │
│    joined_date DATE). Row count: 523.                      │
│  Table: orders (id INT PK, customer_id INT FK → customers, │
│    order_date DATE,                                        │
│    status VARCHAR [pending/shipped/delivered/cancelled],    │
│    total_amount DECIMAL). Row count: 5,234.                │
│  ... (all 6 tables in compact format)                      │
│                                                            │
│  Relationships:                                            │
│  - customers.id → orders.customer_id (1:N)                 │
│  - orders.id → order_items.order_id (1:N)                  │
│  - products.id → order_items.product_id (1:N)              │
│  - categories.id → products.category_id (1:N)              │
│  - products.id → reviews.product_id (1:N)                  │
│  - customers.id → reviews.customer_id (1:N)                │
├────────────────────────────────────────────────────────────┤
│  CONVERSATION CONTEXT (if follow-up, ~500 tokens)          │
│  Previous question: "Show monthly revenue"                 │
│  Previous SQL: "SELECT date_trunc('month', ...)..."        │
│  Previous result: "12 rows: month, revenue"                │
├────────────────────────────────────────────────────────────┤
│  USER QUESTION (~50 tokens)                                │
│  "Top 10 products by revenue last quarter"                 │
└────────────────────────────────────────────────────────────┘

Total prompt: ~1,700 tokens (well within 30K context window)
```

#### Key Prompting Techniques

| Technique | Example | Impact on Accuracy |
|-----------|---------|-------------------|
| **Schema injection** | Full table definitions in every prompt | LLM knows exact column names → correct SQL |
| **Sample value injection** | `tier VARCHAR [bronze/silver/gold]` | LLM generates correct WHERE values instead of guessing |
| **Relationship injection** | `customers.id → orders.customer_id` | LLM generates correct JOINs |
| **Negative constraints** | "NEVER use DROP, DELETE, ..." | Prevents destructive hallucinations |
| **Output format constraint** | "Return ONLY the SQL" | Prevents wrapper text that breaks parsing |
| **Dialect specification** | "PostgreSQL syntax" | Generates `DATE_TRUNC` not `DATE_FORMAT`, `ILIKE` not `LIKE` |
| **Row count injection** | "Row count: 5,234" | LLM can make smarter decisions about LIMIT and subqueries |

#### Token Budget Allocation

```
Total context budget:    ~30,000 tokens (Gemini 1.5 Flash)
                         ~128,000 tokens (GPT-4o)
┌─────────────────────────────────────────────────────────┐
│  System prompt:           ~300 tokens                   │
│  Schema summary:          ~800 tokens (6 tables)        │
│  Sample values:           ~200 tokens                   │
│  Relationships:           ~150 tokens                   │
│  Rules:                   ~200 tokens                   │
│  Conversation history:    ~500 tokens (last 3 turns)    │
│  User question:            ~50 tokens                   │
│  Reserved for output:   ~2,000 tokens                   │
│                         ────────                        │
│  Total:                 ~4,200 tokens                   │
│                                                         │
│  ✅ Well within limits for both Gemini and GPT-4        │
└─────────────────────────────────────────────────────────┘
```

#### SQL Correction Prompt

When a generated query fails to execute:

```
The following SQL query failed with an error.

Error: column "total_revenue" does not exist
Hint: Perhaps you meant "total_amount" in table "orders"

Original SQL:
SELECT customer_id, SUM(total_revenue) FROM orders GROUP BY customer_id

Database Schema:
{schema_summary}

Please fix the SQL query to resolve this error. Return ONLY the corrected SQL.
```

---

## 🔄 Query Execution Lifecycle (End-to-End)

This is the complete step-by-step flow from user question to rendered response:

```
STEP 1: USER INPUT
┌─────────────────────────────────────────────────────────────┐
│  User types: "Top 10 products by revenue last quarter"     │
│  Clicks "Ask" button                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 2: FRONTEND → API
┌─────────────────────────────────────────────────────────────┐
│  Next.js sends POST /api/query/                             │
│  Body: { question: "...", conversation_id: null }           │
│  Zustand sets isLoading = true, shows skeleton              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 3: CONVERSATION CONTEXT
┌─────────────────────────────────────────────────────────────┐
│  ConversationManager checks:                                │
│  - Is conversation_id provided? → Load previous context     │
│  - New conversation? → Create new session, return empty ctx │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 4: SCHEMA RETRIEVAL
┌─────────────────────────────────────────────────────────────┐
│  SchemaInspector.get_prompt_summary()                       │
│  - Cache HIT: Return cached summary (0ms)                   │
│  - Cache MISS: Run ~48 information_schema queries (~80ms)   │
│    → Build schema dict → Generate text summary → Cache it   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 5: SQL GENERATION (LLM Call #1)
┌─────────────────────────────────────────────────────────────┐
│  NLtoSQL.generate(question, schema_summary, context)        │
│  - Build prompt: system + schema + context + question       │
│  - Call Gemini/OpenAI API (~800–1500ms)                     │
│  - Extract SQL from response (strip markdown fences)        │
│  - Result: "SELECT p.name, SUM(oi.subtotal) AS revenue..."  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 6: SQL VALIDATION (5 stages)
┌─────────────────────────────────────────────────────────────┐
│  SQLValidator.validate(sql)                                 │
│  [1] Parse → ✅ valid SQL                                   │
│  [2] Type check → ✅ SELECT only                            │
│  [3] Injection check → ✅ No stacked queries, no UNION      │
│  [4] LIMIT check → ✅ Has LIMIT 10                          │
│  [5] Cost estimate → ✅ ~200 rows estimated                  │
│  → Returns: (True, cleaned_sql, safety_report)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 7: QUERY EXECUTION
┌─────────────────────────────────────────────────────────────┐
│  QueryExecutor.execute(validated_sql)                        │
│  - Open cursor on 'readonly' database connection            │
│  - SET statement_timeout = '10s'                            │
│  - Execute SQL                                              │
│  - Fetch results (up to MAX_QUERY_ROWS)                     │
│  - Measure execution time: 38ms                             │
│  - Returns: {columns, rows, row_count, execution_ms}        │
│                                                             │
│  ON ERROR → Error Recovery (see Step 7a)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┤ (parallel)
         │                 │
         ▼                 ▼
STEP 8: CHART DETECTION     STEP 9: QUERY EXPLANATION (LLM Call #2)
┌──────────────────┐       ┌────────────────────────────────────┐
│ ChartDetector     │       │ QueryExplainer.explain(sql)        │
│ .detect(cols,rows)│       │ - Call LLM: "Explain this SQL..." │
│                   │       │ - ~600ms                           │
│ 1 text + 1 num   │       │ - Returns: summary + step list     │
│ → BAR CHART ✅    │       │                                    │
│                   │       │ "This finds the top 10 products    │
│ {type: "bar",     │       │  ranked by total revenue..."       │
│  x: "name",      │       │                                    │
│  y: "revenue"}   │       └──────────┬─────────────────────────┘
└────────┬─────────┘                  │
         │                            │
         └──────────┬─────────────────┘
                    │
                    ▼
STEP 10: PERSIST & RESPOND
┌─────────────────────────────────────────────────────────────┐
│  - Save to QueryHistory model (question, sql, results, etc.)│
│  - Update conversation context (for future follow-ups)      │
│  - Serialize response JSON                                  │
│  - Return HTTP 200 with full payload                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
STEP 11: FRONTEND RENDERING
┌─────────────────────────────────────────────────────────────┐
│  Zustand store updated → React re-renders:                  │
│  - ResultsTable: TanStack Table with 10 rows, sortable      │
│  - AutoChart: Recharts BarChart (name vs revenue)            │
│  - SQLDisplay: Syntax-highlighted SQL with copy button       │
│  - QueryExplanation: "This finds the top 10 products..."    │
│  - SafetyCheck: "SELECT ✅ | ~200 rows ✅ | 38ms ✅"         │
│  - ConversationThread: New turn appended to chat             │
│                                                             │
│  Total time: ~1.5–3 seconds                                 │
└─────────────────────────────────────────────────────────────┘

STEP 7a: ERROR RECOVERY (if Step 7 fails)
┌─────────────────────────────────────────────────────────────┐
│  If SQL execution throws DatabaseError:                     │
│  - Capture error message: "column 'total_revenue' not found"│
│  - If retry_count < LLM_MAX_RETRIES (default: 2):           │
│    → Send error + SQL + schema back to LLM                  │
│    → LLM returns corrected SQL                              │
│    → Re-validate through Stage 6                            │
│    → Re-execute through Stage 7                             │
│  - If max retries exhausted:                                │
│    → Return error to user with LLM's fix suggestion         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Auto-Visualization Engine

### Chart Type Detection Logic

The `ChartDetector` analyzes the **column types** and **value shapes** of query results to select the most appropriate visualization:

```
                        Query Results
                             │
                             ▼
                    ┌─────────────────┐
                    │ Analyze columns: │
                    │ count types     │
                    │ (text, numeric, │
                    │  date, boolean) │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────────────────┐
                │            │                        │
                ▼            ▼                        ▼
         Single row?   1 text + 1 num?        2+ numeric cols?
         Named metrics    │                        │
                │         │                        │
                ▼         ▼                        ▼
          ┌─────────┐  ┌─────────────┐      ┌─────────────┐
          │   KPI   │  │ Is text col │      │  2 numeric   │
          │  CARDS  │  │ a date?     │      │  only?       │
          │  📊     │  └──────┬──────┘      └──────┬──────┘
          └─────────┘     Yes │  No                │
                              │   │                 ▼
                         ┌────┘   └────┐     ┌──────────┐
                         ▼             ▼     │ SCATTER  │
                   ┌──────────┐  ┌─────────┐ │  PLOT    │
                   │  LINE    │  │  BAR    │ │  ⚬      │
                   │  CHART   │  │  CHART  │ └──────────┘
                   │  📈      │  │  📊     │
                   └──────────┘  └─────────┘

        If 1 text + 1 percentage/proportion → PIE CHART 🥧
        If date + multiple numeric          → MULTI-LINE / AREA 📈
        If none of the above match          → TABLE ONLY 📋
```

### Chart Decision Rules (Detailed)

| Result Shape | Chart Type | Example Query |
|-------------|-----------|---------------|
| 1 text + 1 numeric | **Bar Chart** | "Revenue by product category" |
| 1 date + 1 numeric | **Line Chart** | "Monthly order count trend" |
| 1 text + 1 percentage | **Pie/Donut** | "Order status distribution" |
| 2 numeric columns | **Scatter Plot** | "Price vs average rating" |
| 1 date + multiple numeric | **Multi-Line** | "Monthly revenue and order count" |
| Single row, named metrics | **KPI Cards** | "Total revenue, total orders, avg order value" |
| Multiple text + numeric | **Table Only** | "All customer details" |

### Chart Configuration Output

```json
{
  "type": "bar",
  "x": "category",
  "y": "revenue",
  "title": "Revenue by Product Category",
  "color_scheme": "blues",
  "alternatives": ["line", "pie", "table"]
}
```

The `alternatives` array lets the frontend render a **chart type toggle** so users can switch visualizations.

---

## 💬 Conversational Query System

### How Follow-Up Queries Work

```
Turn 1: "Show monthly revenue"
    │
    │  LLM generates:
    │  SELECT date_trunc('month', order_date) AS month,
    │         SUM(total_amount) AS revenue
    │  FROM orders GROUP BY 1 ORDER BY 1
    │
    │  Context saved: {sql, result_summary: "12 rows", tables: ["orders"]}
    │
    ▼
Turn 2: "Break that down by product category"
    │
    │  Prompt includes previous SQL + "add category breakdown"
    │  LLM modifies to add JOIN + GROUP BY:
    │  SELECT date_trunc('month', o.order_date) AS month,
    │         c.name AS category,
    │         SUM(o.total_amount) AS revenue
    │  FROM orders o
    │  JOIN order_items oi ON o.id = oi.order_id
    │  JOIN products p ON oi.product_id = p.id
    │  JOIN categories c ON p.category_id = c.id
    │  GROUP BY 1, 2 ORDER BY 1, 3 DESC
    │
    │  Context updated with new SQL + results
    │
    ▼
Turn 3: "Only for electronics"
    │
    │  LLM adds WHERE clause:
    │  ... WHERE c.name = 'Electronics' ...
    │
    ▼
Turn 4: "Compare with last year"
    │
    │  LLM adds year column + expands date range
    │
    ▼
"New Question" → Resets context, starts fresh session
```

### Context Object Structure

```python
{
    "session_id": "7e9a1234-...",
    "turns": [
        {
            "question": "Show monthly revenue",
            "sql": "SELECT date_trunc(...) ...",
            "result_summary": "12 rows: month (date), revenue (numeric)",
            "tables_referenced": ["orders"]
        },
        {
            "question": "Break that down by category",
            "sql": "SELECT date_trunc(...), c.name, ...",
            "result_summary": "48 rows: month, category, revenue",
            "tables_referenced": ["orders", "order_items", "products", "categories"]
        }
    ],
    "max_turns_in_prompt": 3  # Only last 3 turns sent to LLM (context window management)
}
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Required For |
|------|---------|-------------|
| Docker | ≥ 24 | Container runtime |
| Docker Compose | v2 | Service orchestration |
| LLM API Key | — | [Gemini](https://aistudio.google.com/app/apikey) (free) or [OpenAI](https://platform.openai.com/api-keys) |

### One-Command Setup (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/text-to-sql-assistant.git
cd text-to-sql-assistant

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set LLM_PROVIDER and your API key

# 3. Start all services
docker-compose up -d

# 4. Seed the sample database (~45 seconds)
docker-compose exec backend python manage.py seed_ecommerce

# 5. Open the application
# Frontend:  http://localhost:3000
# API:       http://localhost:8000/api/
# Admin:     http://localhost:8000/admin  (admin / password from .env)
```

### Manual Setup (Without Docker)

```bash
# ─── STEP 1: PostgreSQL ──────────────────────────────────────
createdb ecommerce_db
psql ecommerce_db -c "
  CREATE USER readonly_user WITH PASSWORD 'readonly_pass';
  GRANT CONNECT ON DATABASE ecommerce_db TO readonly_user;
  GRANT USAGE ON SCHEMA public TO readonly_user;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly_user;
"

# ─── STEP 2: Django Backend ──────────────────────────────────
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example ../.env   # Fill in values
python manage.py migrate
python manage.py seed_ecommerce
python manage.py createsuperuser
python manage.py runserver 8000

# ─── STEP 3: Next.js Frontend (separate terminal) ───────────
cd frontend
npm ci
npm run dev   # → http://localhost:3000
```

### Verify Installation

```bash
# 1. Schema introspection works
curl http://localhost:8000/api/schema/ | python -m json.tool | head -40

# 2. A real NL → SQL query
curl -s -X POST http://localhost:8000/api/query/ \
  -H "Content-Type: application/json" \
  -d '{"question": "How many customers do we have?"}' \
  | python -m json.tool

# Expected: sql contains "SELECT COUNT(*)", results.rows contains [[523]]

# 3. Health check
curl http://localhost:8000/api/health/
# Expected: {"status": "ok", "db": "connected", "schema_cached": true}
```

---

## ⚙️ Environment Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| **LLM** |||||
| `LLM_PROVIDER` | `gemini` \| `openai` | ✅ | — | Which LLM backend to use |
| `GEMINI_API_KEY` | string | if Gemini | — | Google AI Studio API key |
| `OPENAI_API_KEY` | string | if OpenAI | — | OpenAI platform API key |
| **Database** |||||
| `POSTGRES_DB` | string | ✅ | `ecommerce_db` | Database name |
| `POSTGRES_USER` | string | ✅ | `django_admin` | Admin DB user (Django ORM) |
| `POSTGRES_PASSWORD` | string | ✅ | — | Admin DB user password |
| `POSTGRES_HOST` | string | ✅ | `db` | DB host (Docker service name or IP) |
| `POSTGRES_PORT` | int | — | `5432` | DB port |
| `READONLY_DB_USER` | string | ✅ | `readonly_user` | Read-only user for query execution |
| `READONLY_DB_PASSWORD` | string | ✅ | — | Read-only user password |
| **Django** |||||
| `DJANGO_SECRET_KEY` | string | ✅ | — | 50+ char random string |
| `DJANGO_DEBUG` | bool | — | `True` | Set `False` in production |
| `DJANGO_ALLOWED_HOSTS` | csv | prod | `localhost` | Comma-separated allowed hosts |
| **Frontend** |||||
| `NEXT_PUBLIC_API_URL` | url | ✅ | `http://localhost:8000` | API base URL (browser-visible) |
| **Performance** |||||
| `REDIS_URL` | url | — | in-memory | Schema cache backend (optional) |
| `MAX_QUERY_ROWS` | int | — | `1000` | Hard cap on returned rows |
| `QUERY_TIMEOUT_SECONDS` | int | — | `10` | PostgreSQL statement timeout |
| `LLM_MAX_RETRIES` | int | — | `2` | Auto-fix attempts on SQL error |
| `SCHEMA_CACHE_TTL` | int | — | `3600` | Schema cache lifetime (seconds) |
| `RATE_LIMIT_PER_MIN` | int | — | `30` | Max queries per IP per minute |

---

## 🐳 Docker Setup

### docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-ecommerce_db}
      POSTGRES_USER: ${POSTGRES_USER:-django_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-django_admin}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - POSTGRES_HOST=db
      - LLM_PROVIDER=${LLM_PROVIDER}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  pgdata:
```

### Common Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f db

# Run management commands
docker-compose exec backend python manage.py seed_ecommerce
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py refresh_schema

# Access PostgreSQL shell
docker-compose exec db psql -U django_admin -d ecommerce_db

# Rebuild after dependency changes
docker-compose build --no-cache backend
docker-compose up -d

# Stop and clean up
docker-compose down
docker-compose down -v   # Also remove database volume
```

---

## 🌱 Database Seeding

### Seed Command

```bash
# Default: 500 customers, 200 products, 5K orders, 10K items, 2K reviews
python manage.py seed_ecommerce

# Custom volumes
python manage.py seed_ecommerce --customers 1000 --products 500 --orders 10000

# Reset existing data first
python manage.py seed_ecommerce --reset

# Skip if data already exists
python manage.py seed_ecommerce --skip-if-exists
```

### What Gets Generated

| Table | Count | Generation Strategy |
|-------|-------|-------------------|
| **Categories** | 15 | 10 top-level + 5 subcategories (3-level hierarchy) |
| **Customers** | 500+ | Faker: realistic names, emails, cities across 20+ countries. Tier distribution: 60% bronze, 30% silver, 10% gold |
| **Products** | 200+ | Across all categories. Prices: normal distribution $10–$2000. Stock: 0–500 units |
| **Orders** | 5,000+ | 2-year date range. Status distribution: 10% pending, 25% shipped, 55% delivered, 10% cancelled |
| **Order Items** | 10,000+ | 1–5 items per order. `bulk_create()` for performance |
| **Reviews** | 2,000+ | Ratings: normal distribution centered at 3.8. Comments via Faker sentences |

> **Seed time:** ~45 seconds on a modern machine. Uses `bulk_create()` with batch sizes of 1000 for optimal performance.

---

## 👨‍💻 Development Workflow

### Backend Development

```bash
cd backend
source .venv/bin/activate

# Run development server
python manage.py runserver 8000

# Create new migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Run tests
pytest
pytest --cov=sql_assistant --cov-report=term-missing
pytest tests/test_validator.py -v

# Lint
flake8 .
black . --check

# Shell access
python manage.py shell_plus
```

### Frontend Development

```bash
cd frontend

# Run development server (hot reload)
npm run dev

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Run tests
npm run test

# Build production bundle
npm run build
```

### Adding a New Service

1. Create `sql_assistant/services/your_service.py`
2. Implement as a stateless class with one public method
3. Import and compose in `views.py` (not in other services)
4. Add tests in `sql_assistant/tests/test_your_service.py`
5. Register any new models in `admin.py`

### Adding a New API Endpoint

1. Add serializer in `serializers.py`
2. Add view/viewset in `views.py`
3. Add URL pattern in `urls.py`
4. Update this README's API Reference section
5. Test with `curl` or the frontend

---

## 🚢 Deployment & DevOps

### Production Docker Compose

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations and seed
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py seed_ecommerce --skip-if-exists
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --no-input
```

### Production Architecture

```
                    ┌───────────────────────────────────┐
                    │           Nginx (Port 80/443)      │
                    │                                    │
                    │  /api/*  → proxy to Django:8000    │
                    │  /*      → proxy to Next.js:3000   │
                    │  /static → serve from filesystem   │
                    │  TLS termination (Let's Encrypt)   │
                    └─────────┬──────────┬───────────────┘
                              │          │
                    ┌─────────┴──┐  ┌────┴──────────────┐
                    │  Django    │  │  Next.js           │
                    │  Gunicorn  │  │  (Node production) │
                    │  4 workers │  │                    │
                    │  Port 8000 │  │  Port 3000         │
                    └─────┬──────┘  └───────────────────┘
                          │
                    ┌─────┴──────────────────────────────┐
                    │  PostgreSQL 15                       │
                    │  Volume: /var/lib/postgresql/data    │
                    │  Daily pg_dump backups               │
                    └─────────────────────────────────────┘
```

### Production Checklist

**Django**
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_SECRET_KEY` is 50+ random characters (unique per environment)
- [ ] `DJANGO_ALLOWED_HOSTS` set to your actual domain
- [ ] `CONN_MAX_AGE=60` for persistent DB connections
- [ ] Static files served by Nginx, not Django
- [ ] `SECURE_SSL_REDIRECT=True`, `SECURE_HSTS_SECONDS=31536000`

**PostgreSQL**
- [ ] Strong, unique passwords for both admin and readonly users
- [ ] Daily backups configured (`pg_dump` or managed service snapshots)
- [ ] Connection pooling via PgBouncer if > 50 concurrent users
- [ ] `log_min_duration_statement = 1000` for slow query logging

**LLM API**
- [ ] API key stored in secrets manager (AWS SSM, GCP Secret Manager, Vault)
- [ ] Billing alert set on LLM provider dashboard
- [ ] `RATE_LIMIT_PER_MIN` tuned to expected traffic × API tier limit

**Networking**
- [ ] HTTPS enforced (Nginx + Let's Encrypt or load balancer)
- [ ] `X-Frame-Options: DENY` header set
- [ ] CORS restricted to frontend domain (not `*`)
- [ ] CSP headers configured

**Observability**
- [ ] Sentry (or equivalent) for exception tracking
- [ ] Slow query log enabled in PostgreSQL
- [ ] `/api/health/` wired to uptime monitor
- [ ] Structured logging (JSON format) to log aggregator

---

## 🚨 Error Handling Strategy

### Error Categories & Response Strategy

| Error Type | Where It Occurs | Strategy | User Experience |
|-----------|----------------|----------|----------------|
| **Input validation error** | DRF Serializer | Return 400 with field-level errors | Red inline error on form field |
| **SQL generation failure** | NLtoSQL service | Return LLM's error + suggestion | "Couldn't understand your question. Try rephrasing..." |
| **SQL validation failure** | SQLValidator | Return 400 with specific reason | Safety panel shows red ❌ with reason |
| **SQL execution error** | QueryExecutor | Auto-retry 2x with LLM correction | Loading → "Fixing query..." → results (or error) |
| **Query timeout** | PostgreSQL | Return 408 with suggestion | "Query took too long. Try adding filters to narrow results." |
| **LLM API error** | External API | Return 503 with retry hint | "AI service temporarily unavailable. Please try again." |
| **LLM rate limit** | External API | Return 429 with wait time | "Too many requests. Please wait X seconds." |
| **Database connection error** | Django | Return 503, log critical | "Database is temporarily unreachable." |
| **Unknown/unexpected** | Anywhere | Log full stack trace, return 500 | "Something went wrong. Error ID: xyz for support." |

### Error Recovery Flow

```
SQL Generated by LLM
        │
        ▼
   Execute SQL ──────────► Success → Return Results
        │
        │ DatabaseError
        ▼
   Attempt 1: Send error + SQL to LLM
        │
        ▼
   LLM returns fixed SQL
        │
        ▼
   Re-validate (full pipeline)
        │
        ▼
   Execute fixed SQL ────► Success → Return Results
        │
        │ DatabaseError
        ▼
   Attempt 2: Send new error + SQL to LLM
        │
        ▼
   LLM returns another fix
        │
        ▼
   Re-validate → Execute ─► Success → Return Results
        │
        │ Still failing
        ▼
   Return error to user:
   "Could not generate a working query after 2 attempts.
    Error: {last_error_message}
    Suggestion: Try rephrasing your question or simplify the request."
```

---

## 🧪 Testing Strategy

### Backend Tests

```bash
cd backend

# Full test suite
pytest

# With coverage
pytest --cov=sql_assistant --cov-report=term-missing

# Specific modules
pytest tests/test_validator.py -v          # SQL validation edge cases
pytest tests/test_nl_to_sql.py -v          # SQL generation accuracy
pytest tests/test_chart_detector.py -v     # Chart type detection
pytest tests/test_schema_inspector.py -v   # Schema introspection
```

### SQL Validation Test Cases

| Input | Expected | Stage |
|-------|----------|-------|
| `SELECT COUNT(*) FROM customers` | ✅ Pass, unchanged | — |
| `SELECT * FROM customers` (no LIMIT) | ✅ Pass, `LIMIT 1000` appended | 4 |
| `DROP TABLE customers` | ❌ `BLOCKED_OPERATION` | 2 |
| `DELETE FROM orders WHERE id = 1` | ❌ `BLOCKED_OPERATION` | 2 |
| `SELECT *; DROP TABLE orders` | ❌ `STACKED_QUERY` | 3 |
| `... UNION SELECT * FROM pg_shadow` | ❌ `INJECTION_PATTERN` | 3 |
| `SELECT * -- WHERE 1=0` | ✅ Pass (comment stripped) | 3 |
| `SELEKT * FORM foo` | ❌ `PARSE_ERROR` | 1 |

### SQL Generation Accuracy Tests

```python
ACCURACY_CASES = [
    ("How many customers do we have?",
     lambda sql: "COUNT" in sql.upper() and "customers" in sql.lower()),

    ("Top 5 products by total revenue",
     lambda sql: all(t in sql.lower() for t in ["products", "order_items", "group by", "limit 5"])),

    ("Monthly order count trend in 2024",
     lambda sql: "date_trunc" in sql.lower() and "orders" in sql.lower()),

    ("Customers who have never placed an order",
     lambda sql: "left join" in sql.lower() and "is null" in sql.lower()),

    ("Average review rating per product category",
     lambda sql: all(t in sql.lower() for t in ["reviews", "products", "categories", "avg"])),
]
```

### Frontend Tests

```bash
cd frontend

# Unit + component tests
npm run test

# End-to-end (requires backend running)
npx playwright test

# Type checking
npx tsc --noEmit
```

### Load Testing

```bash
# Install k6 (https://k6.io/)
k6 run tests/load/query_endpoint.js

# Target: p95 < 3s at 20 concurrent users
```

---

## 📈 Scalability Considerations

### Current Architecture Supports

| Metric | Current Capacity | Bottleneck |
|--------|-----------------|------------|
| Concurrent users | ~20–50 | LLM API rate limits (Gemini: 60 RPM) |
| Database size | ~100K rows | PostgreSQL single-instance capacity |
| Query latency | 1.5–3s average | LLM API response time (~800ms–1.5s) |
| Result set size | 1,000 rows max | Browser rendering + network transfer |

### Scaling Strategies

| Bottleneck | Solution | Complexity |
|-----------|----------|------------|
| **LLM rate limits** | Queue system (Celery + Redis), round-robin multiple API keys | Medium |
| **LLM latency** | Streaming responses via SSE, pre-cached common queries | Medium |
| **Database size** | Read replicas, connection pooling (PgBouncer), query indexes | Low |
| **Concurrent users** | Horizontal scaling (multiple Django instances behind load balancer) | Medium |
| **Schema introspection** | Redis cache instead of in-memory, cache invalidation hooks | Low |
| **Large result sets** | Server-side pagination, cursor-based streaming, row virtualization | Medium |
| **Multi-tenant** | Per-tenant database connections, auth layer, query isolation | High |

### Performance Optimization Checklist

- [ ] Schema cached for 1 hour (avoid re-introspecting per request)
- [ ] `bulk_create()` for seed data (not one-by-one INSERT)
- [ ] TanStack Table with row virtualization for 1K+ row results
- [ ] Recharts `<ResponsiveContainer>` for adaptive chart sizing
- [ ] `CONN_MAX_AGE=60` for persistent DB connections
- [ ] Indexes on `order_date`, `customer_id`, `product_id` for common query patterns
- [ ] `EXPLAIN` check in validation pipeline to catch expensive queries early

---

## 🔮 Future Improvements

### Short-Term (Next Sprint)

| Feature | Description | Impact |
|---------|-------------|--------|
| **Streaming responses** | SSE for LLM responses — show SQL as it generates | Perceived latency drops from 3s to ~500ms |
| **Sliding conversation window** | Keep only last 5 turns in LLM context | Prevents context overflow on long conversations |
| **SQLite dialect support** | Detect connected DB type, switch prompt to SQLite syntax | Multi-DB support |

### Medium-Term

| Feature | Description | Impact |
|---------|-------------|--------|
| **User authentication** | Token-based auth with per-user query history | Multi-user support |
| **Query result caching** | Cache common queries (e.g., "total revenue") for instant results | Reduce LLM calls by ~30% |
| **Fine-tuned SQL model** | Train on company-specific queries for higher accuracy | SQL accuracy improvement |
| **Dashboard builder** | Save queries as widgets, arrange on custom dashboards | Replace basic BI tools |

### Long-Term

| Feature | Description | Impact |
|---------|-------------|--------|
| **Scheduled queries** | Run queries on cron, email results | Automated reporting |
| **Data anomaly detection** | LLM flags unusual patterns in results | Proactive insights |
| **Natural language alerts** | "Notify me when monthly revenue drops below $50K" | Business monitoring |
| **Multi-database joins** | Query across PostgreSQL + SQLite + MySQL | Enterprise data platform |

---

## 📝 Example Queries & Expected Outputs

These queries work out-of-the-box with the seeded e-commerce database.

### Aggregation Queries

| # | Natural Language Question | Expected SQL Pattern | Chart Type |
|---|--------------------------|---------------------|-----------|
| 1 | "Total revenue by month" | `SELECT date_trunc('month', order_date), SUM(total_amount) ... GROUP BY 1 ORDER BY 1` | 📈 Line |
| 2 | "Top 10 customers by total order value" | `SELECT c.name, SUM(o.total_amount) ... JOIN ... GROUP BY 1 ORDER BY 2 DESC LIMIT 10` | 📊 Bar |
| 3 | "Average order value by customer tier" | `SELECT c.tier, AVG(o.total_amount) ... JOIN ... GROUP BY 1` | 📊 Bar |
| 4 | "Order status distribution" | `SELECT status, COUNT(*) ... GROUP BY 1` | 🥧 Pie |
| 5 | "Total revenue, total orders, and average order value" | `SELECT SUM(total_amount), COUNT(*), AVG(total_amount) FROM orders` | 📊 KPI Cards |

### Filtering Queries

| # | Natural Language Question | Expected SQL Pattern | Chart Type |
|---|--------------------------|---------------------|-----------|
| 6 | "Gold tier customers from the USA" | `SELECT * FROM customers WHERE tier = 'gold' AND country = 'United States' LIMIT 100` | 📋 Table |
| 7 | "Orders pending for more than 7 days" | `SELECT * FROM orders WHERE status = 'pending' AND order_date < CURRENT_DATE - INTERVAL '7 days'` | 📋 Table |
| 8 | "Products with price above $500" | `SELECT * FROM products WHERE price > 500 ORDER BY price DESC` | 📋 Table |

### JOIN & Multi-Table Queries

| # | Natural Language Question | Expected SQL Pattern | Chart Type |
|---|--------------------------|---------------------|-----------|
| 9 | "Average review rating per product category" | `SELECT c.name, AVG(r.rating) ... JOIN products JOIN categories JOIN reviews ... GROUP BY 1` | 📊 Bar |
| 10 | "Top 5 products by number of orders" | `SELECT p.name, COUNT(DISTINCT oi.order_id) ... JOIN order_items ... GROUP BY 1 ORDER BY 2 DESC LIMIT 5` | 📊 Bar |
| 11 | "Customers who have never placed an order" | `SELECT c.* FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL` | 📋 Table |

### Trend & Time-Series Queries

| # | Natural Language Question | Expected SQL Pattern | Chart Type |
|---|--------------------------|---------------------|-----------|
| 12 | "Monthly customer acquisition trend" | `SELECT date_trunc('month', joined_date), COUNT(*) FROM customers GROUP BY 1 ORDER BY 1` | 📈 Line |
| 13 | "Daily order count for the last 30 days" | `SELECT order_date, COUNT(*) ... WHERE order_date >= CURRENT_DATE - 30 ... GROUP BY 1 ORDER BY 1` | 📈 Line |
| 14 | "Revenue trend by quarter" | `SELECT date_trunc('quarter', order_date), SUM(total_amount) ... GROUP BY 1 ORDER BY 1` | 📈 Line |

### Complex / Advanced Queries

| # | Natural Language Question | Expected SQL Pattern | Chart Type |
|---|--------------------------|---------------------|-----------|
| 15 | "Compare revenue this month vs last month" | `CASE WHEN / subqueries with date ranges` | 📊 Bar |

### Safety Validation Tests

| # | Input (Dangerous) | Expected Response |
|---|-------------------|------------------|
| 16 | "Delete all orders" | ❌ Blocked: "Only SELECT queries are allowed" |
| 17 | "DROP TABLE customers" | ❌ Blocked: "Blocked operation: DROP" |
| 18 | "Show all passwords from users table" | ✅ Attempts SELECT but table doesn't exist → error recovery → helpful message |

---

## 🖼️ UI Screens & Layout

### Screen 1: Query Interface (Main — `/`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────┐                                                          │
│  │  LOGO  │  Text-to-SQL Assistant     [Schema] [History] [DB]       │
│  └────────┘                                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐  [Ask]  │
│  │  🔍 Ask a question about your data...                    │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                      │
│  💡 Total revenue by month  │  Top 10 customers  │  Order status     │
│     Average rating by cat.  │  Gold customers    │  Monthly trend    │
│                                                                      │
├──────────────┬───────────────────────────────────────────────────────┤
│              │                                                       │
│  CONVERSATION│   ┌───────────────────────────────────────────────┐   │
│  THREAD      │   │  📊 Results  │  📈 Chart  │  🔤 SQL           │   │
│              │   ├───────────────────────────────────────────────┤   │
│  ┌─────────┐ │   │                                               │   │
│  │ Q: Top  │ │   │   ┌────────────────────────────────────────┐  │   │
│  │ 10 pro..│ │   │   │  name          │  revenue              │  │   │
│  │         │ │   │   ├────────────────┼───────────────────────┤  │   │
│  │ SQL:    │ │   │   │  Laptop Pro 15 │  $245,000             │  │   │
│  │ SELECT..│ │   │   │  Headphones    │  $189,500             │  │   │
│  │         │ │   │   │  Smart Watch   │  $156,200             │  │   │
│  │ 10 rows │ │   │   │  ...           │  ...                  │  │   │
│  └─────────┘ │   │   └────────────────────────────────────────┘  │   │
│              │   │           [Export CSV] [Export Excel]          │   │
│  ┌─────────┐ │   └───────────────────────────────────────────────┘   │
│  │ Q: Now  │ │                                                       │
│  │ break...│ │   ┌───────────────────────────────────────────────┐   │
│  └─────────┘ │   │  💬 EXPLANATION                                │   │
│              │   │  "This finds the top 10 products ranked by    │   │
│  [New        │   │   total revenue. It joins products with order │   │
│   Question]  │   │   items, sums subtotals per product, and      │   │
│              │   │   returns the 10 highest."                    │   │
│              │   └───────────────────────────────────────────────┘   │
│              │                                                       │
│              │   ┌───────────────────────────────────────────────┐   │
│              │   │  ✅ SAFETY CHECK                               │   │
│              │   │  Type: SELECT  │  Rows: ~10  │  Time: 38ms   │   │
│              │   └───────────────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────────────────┘
```

### Screen 2: Schema Explorer (`/schema`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────┐                                                          │
│  │  LOGO  │  Schema Explorer               [Query] [History] [DB]    │
│  └────────┘                                                          │
├──────────────┬───────────────────────────────────────────────────────┤
│              │                                                       │
│  TABLES      │   ┌───────────────────────────────────────────────┐   │
│              │   │           ER DIAGRAM (React Flow)              │   │
│  ▸ customers │   │                                               │   │
│    (523 rows)│   │    [customers]──1:N──►[orders]──1:N──►        │   │
│  ▸ products  │   │         │                    [order_items]     │   │
│    (234 rows)│   │         │                         │            │   │
│  ▸ orders    │   │    1:N──►[reviews]◄──N:1──[products]          │   │
│    (5,234)   │   │                              │                │   │
│  ▸ order_items│  │                         [categories]           │   │
│    (10,891)  │   │                                               │   │
│  ▸ reviews   │   └───────────────────────────────────────────────┘   │
│    (2,156)   │                                                       │
│  ▸ categories│   ┌───────────────────────────────────────────────┐   │
│    (15)      │   │  TABLE: customers                              │   │
│              │   │  ┌──────────┬───────────┬────┬──────┬────────┐│   │
│              │   │  │ Column   │ Type      │ PK │ FK   │ Null   ││   │
│              │   │  ├──────────┼───────────┼────┼──────┼────────┤│   │
│              │   │  │ id       │ integer   │ ✓  │      │ NO     ││   │
│              │   │  │ name     │ varchar   │    │      │ NO     ││   │
│              │   │  │ email    │ varchar   │    │      │ NO     ││   │
│              │   │  │ city     │ varchar   │    │      │ YES    ││   │
│              │   │  │ country  │ varchar   │    │      │ YES    ││   │
│              │   │  │ tier     │ varchar   │    │      │ YES    ││   │
│              │   │  │ joined   │ date      │    │      │ NO     ││   │
│              │   │  └──────────┴───────────┴────┴──────┴────────┘│   │
│              │   │                                               │   │
│              │   │  PREVIEW (first 10 rows)                      │   │
│              │   │  ┌──────┬───────────┬────────┬───────┐        │   │
│              │   │  │ id   │ name      │ city   │ tier  │        │   │
│              │   │  ├──────┼───────────┼────────┼───────┤        │   │
│              │   │  │ 1    │ Alice J.  │ NYC    │ gold  │        │   │
│              │   │  │ 2    │ Bob S.    │ London │ silver│        │   │
│              │   │  └──────┴───────────┴────────┴───────┘        │   │
│              │   └───────────────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────────────────┘
```

### Screen 3: Query History (`/history`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────┐                                                          │
│  │  LOGO  │  Query History                  [Query] [Schema] [DB]    │
│  └────────┘                                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔍 Search queries...              [All] [⭐ Favorites] [Date ▼]     │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  ⭐ "Top 10 products by revenue"                              │   │
│  │  SELECT p.name, SUM(oi.subtotal)...   │ 10 rows │ bar chart  │   │
│  │  2 minutes ago                        [Re-run] [Copy SQL] [▸] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  ☆ "Monthly order count trend"                                │   │
│  │  SELECT date_trunc('month', ...)...   │ 12 rows │ line chart │   │
│  │  15 minutes ago                       [Re-run] [Copy SQL] [▸] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  ☆ "Order status distribution"                                │   │
│  │  SELECT status, COUNT(*)...           │ 4 rows  │ pie chart  │   │
│  │  1 hour ago                           [Re-run] [Copy SQL] [▸] │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ◄ 1  2  3  4  5 ►                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📒 Decision Log

Key technical decisions and their rationale, documented for future contributors.

### Why `sqlparse` Instead of Regex for SQL Validation?

Regex is trivially bypassed: `DRO/**/P TABLE` or `DE` + `LETE` break keyword matching. `sqlparse` normalizes the SQL into a token tree before inspection, so keyword detection is reliable regardless of whitespace, casing, or comment tricks.

### Why Two PostgreSQL Connections Instead of One?

A single connection with validation-only protection means **a bug in the validator exposes write access** to user-generated queries. The `readonly` connection enforces `read_only=on` at the PostgreSQL session level — even a `connection.execute()` call from Django code cannot write. Defense in depth.

### Why Gemini Flash as the Default LLM?

Gemini 1.5 Flash is **free tier** with generous rate limits (60 RPM), making the project accessible to reviewers without an OpenAI subscription. GPT-4o is a **one-line config swap** (`LLM_PROVIDER=openai`) for production use where accuracy on complex JOINs justifies the cost.

### Why Zustand Instead of Redux or React Query?

This app has **one primary mutation pattern** (submit question → update conversation) and **one primary fetch pattern** (schema, loaded once). Redux adds boilerplate; React Query handles server state but conversation context is local UI state. Zustand covers both in ~100 lines.

### Why TanStack Table Instead of AG Grid or MUI DataGrid?

Pre-built grids add 200–400KB to the bundle and impose opinionated styling. TanStack Table is **headless** — you own the rendering — so it integrates cleanly with shadcn/ui and supports row virtualization for 10K+ row results.

### Why Runtime Seed Data Instead of Committed Fixtures?

A Django fixture for 10K+ rows is a **20–30MB JSON file** that bloats the repo. A management command using `Faker` + `bulk_create` generates the same data in ~45 seconds and supports `--customers`, `--orders` flags for customization.

### Why Schema Caching?

Schema introspection runs ~48 `information_schema` queries (8 per table × 6 tables), adding ~80ms per request. Schema changes only on migrations. A 1-hour cache TTL with manual refresh is the correct tradeoff.

---

## ⚠️ Known Limitations

| Limitation | Impact | Planned Fix |
|-----------|--------|-------------|
| **Ambiguous question handling** | LLM picks one interpretation without asking | Add clarification prompts for ambiguous queries |
| **No authentication** | Single-user; no per-user history isolation | Add DRF TokenAuth for multi-tenant deployments |
| **Conversation context overflow** | After ~10 turns, accumulated context may approach LLM limit | Implement sliding window (last 5 turns only) |
| **PostgreSQL-only for user queries** | Date functions in prompt are PostgreSQL-specific | Add dialect detection and prompt switching |
| **No streaming** | LLM responses awaited fully (UI blocked 1–3s) | Implement SSE streaming for progressive SQL display |
| **Chart detection heuristic** | Numeric columns with many NULLs may be misclassified | Improve type inference with deeper sampling |

---

## 🔧 Troubleshooting

### `seed_ecommerce` fails with `IntegrityError: duplicate key`

The seed command is not idempotent by default. Run `python manage.py flush --no-input` first, or use the `--reset` flag.

### Schema suggestions are empty or generic

The suggestion generator depends on a complete schema introspection. If it returns generic questions, the schema cache may be stale. Run `python manage.py refresh_schema`.

### Generated SQL uses wrong date syntax

The system prompt specifies PostgreSQL date functions. If you connect a SQLite database, update the `DatabaseConnection.dialect` field and ensure the NLtoSQL service switches prompt dialect.

### `statement_timeout` error on complex queries

Increase `QUERY_TIMEOUT_SECONDS` in `.env`, or optimize the query by adding database indexes. The EXPLAIN output in the safety report shows which table scan is slow.

### Chart renders as table when you expected a bar chart

The chart detector infers types from the first 10 rows. If a numeric column contains `NULL` values in those rows, it may be classified as text. Check `chart_config` in the API response.

### LLM returns SQL wrapped in markdown fences

The `NLtoSQL._extract_sql()` method strips `` ```sql `` and `` ``` `` wrappers. If the model returns a different format, extend the extraction regex in `nl_to_sql.py`.

### Docker container can't connect to PostgreSQL

Ensure the `db` service is healthy before `backend` starts. Check `docker-compose logs db` for errors. The `depends_on.condition: service_healthy` should handle this.

---

## 🤝 Contribution Guidelines

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/text-to-sql-assistant.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Install dependencies** (see [Quick Start](#-quick-start))
5. **Make changes** following the guidelines below
6. **Test** your changes thoroughly
7. **Submit a Pull Request** with a clear description

### Code Standards

| Area | Standard |
|------|----------|
| **Python** | PEP 8, type hints, docstrings on all public methods |
| **TypeScript** | Strict mode, explicit types (no `any`), ESLint rules |
| **Git commits** | Conventional Commits format: `feat:`, `fix:`, `docs:`, `refactor:` |
| **Tests** | All new services must include unit tests. SQL validation changes require the full test matrix to pass |
| **Documentation** | Update README for new endpoints, features, or config changes |

### Architecture Rules

1. **Services are stateless** — no instance variables beyond configuration
2. **Services do not import each other** — the view layer composes them
3. **All user SQL runs on the `readonly` connection** — never `default`
4. **Never log or return LLM API keys** in any response or log entry
5. **All API responses follow the standard error format** — `{error, code, details}`

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass (`pytest` for backend, `npm run test` for frontend)
- [ ] New services include unit tests
- [ ] SQL validation test matrix passes
- [ ] README updated for new endpoints/features
- [ ] No sensitive data (API keys, passwords) in committed code
- [ ] Docker builds successfully (`docker-compose build`)

---

## 📄 License & Acknowledgements

### License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

### Acknowledgements

| Resource | Contribution |
|----------|-------------|
| [Django](https://djangoproject.com) | Backend framework |
| [Django REST Framework](https://django-rest-framework.org) | API layer |
| [Next.js](https://nextjs.org) | Frontend framework |
| [PostgreSQL](https://postgresql.org) | Database engine |
| [Google Gemini](https://ai.google.dev) | LLM for SQL generation |
| [OpenAI](https://openai.com) | Alternative LLM provider |
| [sqlparse](https://github.com/andialbrecht/sqlparse) | SQL parsing and validation |
| [Recharts](https://recharts.org) | Chart visualization |
| [TanStack Table](https://tanstack.com/table) | Data table component |
| [React Flow](https://reactflow.dev) | ER diagram visualization |
| [shadcn/ui](https://ui.shadcn.com) | UI component library |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [Faker](https://faker.readthedocs.io) | Realistic test data generation |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS framework |

### Built For

**Excellence Technologies Pvt Ltd** — Phase 4: Production & Specialized AI

---

<div align="center">

**Built with ❤️ to make SQL knowledge optional.**

*"Can a marketing manager who has never written SQL get accurate answers to their data questions in under 10 seconds?"*

**Yes. ✅**

</div>