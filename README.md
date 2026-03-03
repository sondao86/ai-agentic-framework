# AI Agentic Framework

A boilerplate for dual-AI collaboration: **Claude** (Backend/Architect) + **Gemini** (Frontend/UX), coordinated via shared Markdown files.

Clone this repo into any new project to instantly bootstrap a structured multi-agent development workflow.

## What's Inside

| File | Purpose |
|---|---|
| `CLAUDE.md` | Backend agent rules & boundaries |
| `GEMINI.md` | Frontend agent rules & boundaries |
| `API_SPEC.md` | API contract between Backend and Frontend |
| `docs/working-model.md` | The 5-step agentic workflow |
| `docs/working-model.drawio` | Visual diagram (open in draw.io) |
| `docs/architecture.md` | System design (AI fills this in) |
| `docs/backlog.md` | Kanban board for features |
| `tasks/lessons.md` | AI self-improvement log |
| `improvements/_template.md` | Template for feature specs |

## 4-Step Setup

### Step 1: Clone & Initialize

```bash
git clone https://github.com/sondao86/ai-agentic-framework.git my-project
cd my-project
# Create your project directories (e.g., backend/, frontend/)
```

### Step 2: Start Claude (Backend Agent)

Open a terminal in the project root and launch Claude Code:

```bash
claude --dangerously-skip-permissions
```

Claude automatically reads `CLAUDE.md` and becomes the Backend Architect. It works from `docs/backlog.md` and writes API contracts to `API_SPEC.md`.

### Step 3: Assign the First Task

1. Add your first feature to `docs/backlog.md` (move it to **Doing**)
2. Create `improvements/improvement-1-[name].md` from the template
3. Tell Claude:
   ```
   @[improvements/improvement-1-[name].md] Design the solution: setup database schema,
   update docs/architecture.md, write API to API_SPEC.md, and append Frontend Requirements.
   ```

### Step 4: Activate Gemini (Frontend Agent)

In your IDE (VS Code, Cursor, or Gemini app), tell the AI chat:

```
Read GEMINI.md to understand your role. Then read improvements/improvement-1-[name].md
and API_SPEC.md to code the UI.
```

The dual-AI machine is now running. Claude builds the backend, Gemini builds the frontend, and `API_SPEC.md` is the contract between them.

## How It Works

See `docs/working-model.md` for the full 5-step workflow, or open `docs/working-model.drawio` in [draw.io](https://app.diagrams.net/) for the visual diagram.

## License

MIT
