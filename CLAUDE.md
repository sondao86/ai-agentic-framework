> **Project progress:** xem `docs/progress.md`

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
- **Test: Every changed line should trace directly to the user's request.**

### Goal-Driven Execution
- Transform tasks into verifiable goals with success criteria.
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then fix"
- For multi-step tasks, state a brief plan with verify steps.

### 7. Domain Separation (Monolithic Next.js)
- This is a monolithic Next.js (App Router) project — frontend and backend coexist in `src/`.
- **Backend scope**: `src/app/api/`, `src/lib/`, `src/models/`, `src/types/`
- **Frontend scope**: `src/app/` (pages), `src/components/`
- When building a feature: implement API routes first, then update `API_SPEC.md`, then build UI.
- Gemini may handle frontend tasks; Claude focuses on backend + architecture.

### 8. Memory & Context Management

#### Hierarchical Memory Layers

| Layer | Location | Update Frequency | Content |
|-------|----------|-----------------|---------|
| **Permanent** | `CLAUDE.md` | Rarely | Core rules, anti-patterns, architecture decisions |
| **Project** | `docs/architecture.md`, `tasks/lessons.md` | Per feature/sprint | Domain knowledge, stack decisions, learned patterns |
| **Session** | `.claude/sessions/SESSION_YYYYMMDD.md` | Per session | Current task state, decisions made, pending work |

#### Auto-Compact Protocol
When context feels heavy or before ending a significant session:
1. Summarize decisions made and patterns established this session
2. Write checkpoint to `.claude/sessions/SESSION_YYYYMMDD.md` with:
   - **Decisions**: Architecture/design choices and rationale
   - **Progress**: What was completed, what's pending
   - **Blockers**: Open issues or unresolved questions
   - **Context**: Key files touched, relevant state
3. Update `CLAUDE.md` if any permanent-level decisions were made (new rules, anti-patterns)
4. Update `tasks/lessons.md` if corrections occurred during the session

#### Session Resume Protocol
At session start:
1. `CLAUDE.md` is auto-read (built-in)
2. Check `.claude/sessions/` for the latest checkpoint — resume where you left off
3. Review `tasks/lessons.md` for relevant lessons before starting work
4. Review `tasks/todo.md` for pending work items

#### What to Persist Where
- **CLAUDE.md** — Rules that apply to ALL sessions: workflow, conventions, anti-patterns, domain separation
- **docs/architecture.md** — Stack decisions, system design, integration patterns
- **tasks/lessons.md** — Mistakes made and how to avoid them (self-improvement)
- **Session checkpoints** — Ephemeral context: current task progress, in-flight decisions, debugging state

### 9. Framework-as-Reference Pattern

This repo (`ai-agentic-framework`) is a **reference framework**, not a project template to code in directly.

#### When Used Alongside Another Project
- This repo provides patterns, architecture docs, and workflow rules as **reference material**
- The actual project code lives in a **separate, independent repo** (e.g., `auto-test`, `data-pipeline`)
- Do NOT mix project-specific code into `ai-agentic-framework`
- Files like `docs/`, `CLAUDE.md`, and architecture docs from this repo inform decisions — they are not modified by the target project

#### How It Works in Practice
- User clones both repos side by side
- `ai-agentic-framework/` is read-only reference: patterns, improve docs, architecture guidance
- The target project repo is where all implementation happens
- When improvements are discovered during a project, feed them back into `ai-agentic-framework/docs/`
