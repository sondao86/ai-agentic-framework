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
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

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

### 7. Full-Stack Development with Gemini Review

#### Claude's Role — Full-Stack Implementation
- Claude codes **both backend and frontend**
- Own the entire implementation: API routes, database, UI components, pages

#### Gemini's Role — UI/UX Review Only
- Gemini reviews UI/UX design, user flow, and visual consistency
- Gemini does NOT write code — only provides approval or feedback

#### Feature Development Flow
1. **API Spec**: Define the API contract in `API_SPEC.md`
2. **Enhancement Doc**: Claude writes a recommendation document describing the proposed UI/UX approach
3. **Gemini Approval**: Wait for Gemini to review and approve the enhancement doc before implementing frontend
4. **Implement**: Once approved, Claude implements both backend and frontend

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
