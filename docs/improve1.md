Đúng rồi, đây là một pain point khá phổ biến khi làm việc với Claude Code trên các project lớn. Để tôi phân tích vấn đề và các giải pháp:

## Vấn đề cốt lõi

Khi context window bị reset hoặc gần đầy (~1M tokens), Claude Code mất đi:
- **Implicit context**: coding style, patterns đã thống nhất, architectural decisions
- **Decision history**: lý do tại sao code được viết theo cách đó
- **Domain knowledge**: business rules đặc thù của project

---

## Solutions: Memory as State

### 1. **CLAUDE.md** — Primary Memory File
File này được Claude Code tự động đọc khi khởi động session mới.

```markdown
# CLAUDE.md

## Architecture Decisions
- Medallion: Bronze (raw) → Silver (cleaned) → Gold (aggregated)
- All Delta tables use SCD Type 2 for customer domain
- Naming: snake_case for tables, PascalCase for classes

## Code Patterns
- Always use context managers for Spark sessions
- Error handling: wrap all DQ checks in try/except with structured logging
- Never use .collect() on large datasets — use .limit() + sampling

## Anti-patterns (DO NOT)
- No hardcoded connection strings
- No .toPandas() on tables > 1M rows
- No schema inference — always define schema explicitly

## Current Sprint Context
- Working on: Silver layer for Customer domain
- Blocker: SCD Type 4b implementation for account merges
- Last decision: use surrogate key from Unity Catalog lineage
```

### 2. **SKILL.md / CONTEXT.md** — Domain Knowledge
```markdown
# SKILL.md

## VIB Data Platform Stack
- Databricks Runtime: 14.x
- Unity Catalog: enabled, 3-level namespace (catalog.schema.table)
- OpenMetadata: v1.3, REST API for lineage push

## Decision 2439 Constraints
- PII fields must be masked at Bronze→Silver transition
- Audit trail: all transformations logged to governance.audit_log
- Retention: raw data 7 years, aggregated 10 years
```

### 3. **Compact Checkpoint Pattern** — State Serialization

Trước khi context gần đầy, chạy lệnh này:

```bash
# Trong Claude Code session
> /compact  # Built-in command để summarize context

# Hoặc tạo checkpoint thủ công
> "Summarize our current session: decisions made, 
   patterns established, and pending tasks as a 
   structured CLAUDE_SESSION.md file"
```

### 4. **`/init` + Project Structure**

```
project/
├── CLAUDE.md          # Auto-loaded, core memory
├── SKILL.md           # Tech stack knowledge  
├── docs/
│   ├── decisions/     # ADR (Architecture Decision Records)
│   │   ├── ADR-001-scd-type.md
│   │   └── ADR-002-dq-framework.md
│   └── patterns/      # Code pattern examples
│       └── delta_merge_pattern.py
└── .claude/
    └── session_YYYYMMDD.md  # Session checkpoints
```

### 5. **Hierarchical Memory Strategy**

| Layer | File | Update Frequency | Content |
|-------|------|-----------------|---------|
| **Permanent** | `CLAUDE.md` | Rarely | Core rules, anti-patterns |
| **Project** | `SKILL.md` | Per sprint | Stack, domain knowledge |
| **Session** | `SESSION.md` | Per session | Current task, decisions |
| **Task** | inline comments | Per task | Why this specific code |

---

## Workflow thực tế cho VIB project

```bash
# Bắt đầu session mới
claude  # Auto-reads CLAUDE.md

# Khi gần 800K tokens
> "Update CLAUDE.md with decisions from this session 
   and create SESSION_checkpoint.md"

# Session tiếp theo
> "Read SESSION_checkpoint.md and continue from where we left off"
```

---

## Quick Win ngay bây giờ

Nếu chưa có CLAUDE.md, chạy lệnh này trong Claude Code:

```
> "Analyze this codebase and generate a CLAUDE.md file 
   capturing: architecture patterns, naming conventions, 
   anti-patterns to avoid, and key domain constraints"
```

Claude Code sẽ tự scan code và tạo memory file phù hợp với project thực tế của bạn.

---

**Bottom line**: Memory as State hoạt động tốt nhất khi bạn treat CLAUDE.md như một **living document** — cập nhật sau mỗi session quan trọng, không phải một file static. Với VIB project có độ phức tạp cao (medallion + DQ + governance), tôi recommend dùng **3-layer approach**: CLAUDE.md + SKILL.md + session checkpoint.