# The AI Collaboration Framework (Multi-Agent Setup)

This document defines the workflow for coordinating between **Gemini** (Frontend/UX Specialist) and **Claude** (Backend/Architect) to build features.

## The 5-Step Agentic Workflow

### Step 1: Feature Ideation & Backlog (Product Owner)
When you have a new feature idea, open `docs/backlog.md` and add it to the **To Do** column. When you decide to start working on it, move it to **Doing**.

### Step 2: Create Requirements (Single Source of Truth)
Create a new Markdown file: `improvements/improvement-X-[name].md` (copy from `improvements/_template.md`). Write the feature description in natural language.

> **Example:**
> - *Feature: Add comment/feedback functionality to document review.*
> - *Requirement: Managers can highlight text and leave inline comments.*

### Step 3: Assign to Claude (Brain & Backend)
Open the terminal running the `claude` agent and hand it the requirements file.

**Example command:**
```
@[improvements/improvement-X-[name].md] Design the solution for this feature.
Setup database schema, update docs/architecture.md, write the API backend,
and output the contract to API_SPEC.md. Finally, append "Frontend Requirements"
to the improvement file for the Frontend team (Gemini).
```

**Claude will:**
1. Code the full backend implementation.
2. Update the system design in `docs/architecture.md`.
3. Write the API contract to `API_SPEC.md`.
4. Append Frontend Requirements to `improvements/improvement-X.md`.

### Step 4: Assign to Gemini (Face & Frontend)
Switch to the IDE chat with Gemini and give a single command to read Claude's output.

**Example command:**
```
@[improvements/improvement-X-[name].md] Claude finished the Backend and updated
Frontend Requirements. Read that file along with API_SPEC.md to code the UI.
```

**Gemini will:**
1. Read requirements from the improvement file and payload formats from `API_SPEC.md`.
2. Code the frontend UI.
3. If a backend API bug is found (e.g., HTTP 415, 500), Gemini writes a red flag back into the improvement file so you can route it back to Claude for fixing (Domain Separation: Gemini never fixes backend code).

### Step 5: Completion & Logging
When both UI and API are working:
1. Test on localhost — verify end-to-end.
2. Open `docs/backlog.md` and move the feature to **Done**.
3. Save any lessons learned (if bugs occurred) to `tasks/lessons.md` so the AI avoids repeating mistakes.
