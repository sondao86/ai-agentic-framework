# AI Agentic Framework

A **reference framework** for AI-assisted development: **Claude** (Full-Stack Implementation) + **Gemini** (UI/UX Review), coordinated via shared Markdown files.

Use this repo as a reference alongside your project repos to bootstrap a structured multi-agent development workflow.

## What's Inside

| File | Purpose |
|---|---|
| `CLAUDE.md` | Full-stack agent rules, memory management, workflow orchestration |
| `GEMINI.md` | UI/UX review agent rules & boundaries |
| `API_SPEC.md` | API contract for features |
| `docs/working-model.md` | The 5-step agentic workflow |
| `docs/working-model.drawio` | Visual diagram (open in draw.io) |
| `docs/architecture.md` | System design (AI fills this in) |
| `docs/backlog.md` | Kanban board for features |
| `tasks/lessons.md` | AI self-improvement log |
| `improvements/_template.md` | Template for feature specs |

## How to Use

### As a Reference Framework (Recommended)

Clone this repo alongside your project repo:

```bash
# Your actual project
git clone https://github.com/your-org/my-app.git
cd my-app

# Reference framework (read-only, informs decisions)
git clone https://github.com/sondao86/ai-agentic-framework.git
```

Copy `CLAUDE.md` and `GEMINI.md` into your project, then adapt them to your stack. The framework repo stays as reference material — patterns, docs, and workflow guidance.

### Feature Development Flow

1. **API Spec** — Claude defines the API contract in `API_SPEC.md`
2. **Enhancement Doc** — Claude writes a UI/UX recommendation document
3. **Gemini Approval** — Gemini reviews and approves the enhancement before frontend work begins
4. **Implement** — Claude implements both backend and frontend

### Start Claude (Full-Stack Agent)

```bash
claude --dangerously-skip-permissions
```

Claude reads `CLAUDE.md` and handles full-stack implementation: API routes, database, UI components, and pages.

### Gemini's Role (UI/UX Reviewer)

Gemini reviews UI/UX design, user flow, and visual consistency. Gemini does not write code — only provides approval or feedback on enhancement docs.

## How It Works

See `docs/working-model.md` for the full 5-step workflow, or open `docs/working-model.drawio` in [draw.io](https://app.diagrams.net/) for the visual diagram.

## License

MIT
