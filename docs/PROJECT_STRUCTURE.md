# Project Structure

Reference folder layout for AI-powered agentic projects. Use this as a starting template when creating new repositories.

```
/
├── CLAUDE.md                           # Claude agent rules & workflow
├── GEMINI.md                           # Gemini agent rules & workflow
├── README.md                           # Project overview
├── project-init.md                     # Bootstrap / onboarding guide
│
├── docs/                               # All documentation (single source of truth)
│   ├── api/
│   │   └── API_SPEC.md                 # REST API contract (shared between backend & frontend)
│   ├── backend/
│   │   ├── architecture.md             # Backend system design & stack decisions
│   │   ├── data-model.md               # Database schema documentation
│   │   ├── data-model.drawio           # ERD diagram (draw.io)
│   │   └── db-init.yaml               # Seed / demo data definition
│   ├── frontend/
│   │   └── FRONTEND_IMPROVEMENTS.md    # UI/UX enhancement backlog
│   ├── framework/
│   │   ├── architecture.md             # Multi-agent framework design
│   │   ├── working-model.md            # Agent collaboration model
│   │   ├── backlog.md                  # Framework improvement backlog
│   │   └── diagrams/
│   │       ├── multi-agent-architecture.drawio
│   │       └── working-model.drawio
│   └── testing/
│       └── testing-strategy.md         # QA & test approach
│
├── tasks/                              # AI task management
│   ├── todo.md                         # Current sprint / task backlog
│   └── lessons.md                      # Mistakes & patterns learned by agents
│
├── backend/                            # Python / FastAPI backend
│   ├── app/
│   │   ├── agents/                     # AI agent personas & prompts
│   │   │   ├── personas.py
│   │   │   └── prompts/
│   │   ├── api/                        # REST endpoints
│   │   │   └── v1/
│   │   ├── core/                       # Config, DB, enums, exceptions
│   │   ├── executors/                  # Test executors (SQL, dbt, GX)
│   │   ├── graph/                      # LangGraph workflow
│   │   │   └── nodes/
│   │   ├── models/                     # SQLAlchemy models
│   │   ├── parsers/                    # Document parsers (PDF, DOCX, MD)
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   └── services/                   # Business logic layer
│   ├── alembic/                        # DB migrations
│   │   └── versions/
│   ├── scripts/
│   │   └── seed_db.py                  # Database seeder
│   ├── tests/                          # Backend test suite
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
│
└── frontend/                           # Next.js frontend
    ├── src/
    │   ├── app/                        # Next.js App Router pages
    │   │   └── projects/[id]/          # Project detail pages
    │   ├── components/
    │   │   ├── agent/                  # Agent review UI
    │   │   ├── dashboard/              # Dashboard widgets
    │   │   ├── execution/              # Test execution views
    │   │   ├── layout/                 # Sidebar, breadcrumbs
    │   │   ├── phase/                  # Phase detail & artifacts
    │   │   ├── pipeline/               # Pipeline progress
    │   │   ├── project/                # Project cards & dialogs
    │   │   ├── ui/                     # Shared UI primitives
    │   │   └── workflow/               # Workflow history
    │   ├── lib/                        # API client & utilities
    │   └── types/                      # TypeScript type definitions
    ├── package.json
    └── tsconfig.json
```

## Conventions

| Convention | Rule |
|---|---|
| **Docs location** | All documentation lives under `docs/` — never scatter across subprojects |
| **Agent rules** | `CLAUDE.md` and `GEMINI.md` at project root — auto-loaded by agents |
| **Task tracking** | `tasks/todo.md` for backlog, `tasks/lessons.md` for agent self-improvement |
| **API contract** | `docs/api/API_SPEC.md` is the single source of truth shared by backend & frontend |
| **Seed data** | `docs/backend/db-init.yaml` — referenced by `backend/scripts/seed_db.py` |
| **Diagrams** | `.drawio` files co-located with their markdown docs |

## Quick Start for New Projects

1. Copy this structure as your starting scaffold
2. Place `CLAUDE.md` / `GEMINI.md` at the root with your agent rules
3. Create `docs/` subdirectories matching your project domains
4. Keep `tasks/` for AI-managed task tracking and lessons learned
5. Backend and frontend each get their own top-level directory
