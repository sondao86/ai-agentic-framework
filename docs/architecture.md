# Architecture

> This file is maintained by Claude (Backend Agent). It documents the system design as features are built.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB (Mongoose 9) |
| AI Generation | OpenAI GPT-4o |
| AI Verification | Google Gemini 2.5 Flash |
| Styling | Tailwind CSS 4, Noto Serif (Vietnamese), Inter |
| Infrastructure | Docker Compose (local MongoDB) |

## Project Structure

```
src/
  app/                 # Next.js App Router
    api/               # REST API routes (backend)
      episodes/        # CRUD for episodes
      glossary/        # CRUD for glossary terms
      qa/              # Q&A with AI answers
      bible-passages/  # Bible passage CRUD, scan, review, stats
      generate/        # AI content generation & verification
      health/          # Database health check
    admin/             # Admin dashboard pages
    tap/               # Episode listing & detail pages
    tu-dien/           # Glossary page
    hoi-dap/           # Q&A page
    layout.tsx         # Root layout (fonts, header, footer)
    page.tsx           # Home page
    globals.css        # Tailwind + custom sacred theme
  components/          # React components
    admin/             # Admin forms (GenerationForm)
    episodes/          # EpisodeCard, EpisodeFilter
    glossary/          # GlossarySearch
    qa/                # QuestionForm
    layout/            # Header, Footer
    ui/                # Badge, Button, Card, Input, Spinner
  lib/                 # Backend utilities
    mongodb.ts         # Connection singleton (serverless-safe)
    openai.ts          # OpenAI client
    gemini.ts          # Gemini client
    content-pipeline.ts# Episode generation + verification logic
    bible-scanner.ts   # Bible passage scanning + classification + review
    bible-reference.ts # 66-book Bible catalog with Vietnamese names
    rate-limiter.ts    # Token-bucket rate limiter
  models/              # Mongoose schemas
    Episode.ts
    BiblePassage.ts
    ScanJob.ts
    GlossaryTerm.ts
    QA.ts
  types/               # TypeScript interfaces
    episode.ts
    bible-passage.ts
    scan-job.ts
    glossary.ts
    qa.ts
```

## Database Schema

### Collection: `episodes`

| Field | Type | Notes |
|-------|------|-------|
| slug | String | Unique, indexed. Format: `{workstream}-{nn}-{title-slug}` |
| workstream | String | `"A"` or `"B"`, indexed |
| episodeNumber | Number | Sequence within workstream |
| title | String | Episode title (Vietnamese) |
| bibleAnchor | Object | `{ verses: string[], textVi: string, textEn?: string }` |
| contemplativeReading | String | 600-1000 words (Vietnamese) |
| keywords | String[] | Contemplative/mindfulness terms |
| christianContext | String | 200-300 words theological context |
| lensInterpretations | Array | `[{ author: "tolle"|"demello"|"rohr", content: string }]` |
| lifeApplication | String | 200-400 words practical application |
| practiceScript | Object | `{ text: string, durationMinutes: 3-7, audioUrl?: string }` |
| generatedBy | String | `"chatgpt"` or `"manual"` |
| generationModel | String | e.g. `"gpt-4o"` |
| verification | Object | `{ isVerified: bool, notes: string, bibleReferencesChecked: string[], verifiedAt: Date }` |
| status | String | `"draft"` / `"verified"` / `"published"`, indexed |

**Indexes:** `slug` (unique), `workstream`, `status`, `(workstream, episodeNumber)` compound

### Collection: `glossaryterms`

| Field | Type | Notes |
|-------|------|-------|
| termVi | String | Vietnamese term, unique, indexed |
| termEn | String | English term, indexed |
| definition | String | Definition text |
| relatedVerses | String[] | Bible verse references |
| category | String | `"contemplative"` / `"biblical"` / `"mindfulness"` / `"general"` |
| relatedAuthors | String[] | `"tolle"` / `"demello"` / `"rohr"` |

**Indexes:** `termVi` (unique), `termEn`, text search on `(termVi, termEn, definition)`

### Collection: `qas`

| Field | Type | Notes |
|-------|------|-------|
| question | String | User's question |
| answer | String | AI-generated answer |
| answeredByModel | String | e.g. `"gpt-4o"` |
| relatedEpisodeSlugs | String[] | Links to relevant episodes |
| relatedVerses | String[] | Extracted Bible references |
| isPublished | Boolean | Visibility flag |

**Indexes:** text search on `(question, answer)`

### Collection: `biblepassages`

| Field | Type | Notes |
|-------|------|-------|
| book | String | English abbreviation (e.g. `Matt`) |
| bookVi | String | Vietnamese name (e.g. `Mátthêu`) |
| chapter | Number | Chapter number |
| verseStart | Number | Starting verse |
| verseEnd | Number? | Ending verse (optional for single verses) |
| reference | String | Unique. English ref (e.g. `Matt 5:3-12`) |
| referenceVi | String | Vietnamese ref (e.g. `Mt 5,3-12`) |
| textVi | String | Full Vietnamese text of the passage |
| textEn | String? | English text (optional) |
| classifications | Array | `[{ category: "theGioiQuan"|"nhanSinhQuan"|"giaTriQuan", subThemes: string[], confidence: 0-1 }]` |
| contemplativePerspective | Object | `{ text: string (150-300 words Vi), isInterpretation: true }` |
| review | Object? | `{ isVerified, referenceAccurate, classificationReasonable, notes, reviewedAt }` |
| reviewStatus | String | `"pending"` / `"verified"` / `"rejected"` |
| priorityTier | Number | `1` (content.md) / `2` (thematic) / `3` (systematic) |
| scanPhase | String | `"priority"` / `"thematic"` / `"systematic"` |
| scanBatchId | String? | Links to ScanJob._id |
| relatedEpisodeSlugs | String[] | Links to Episode slugs |
| generatedBy | String | `"chatgpt"` |
| generationModel | String | e.g. `"gpt-4o"` |

**Indexes:** `reference` (unique), `classifications.category`, `(book, chapter)`, `reviewStatus`, `priorityTier`, text search on `(textVi, contemplativePerspective.text)`

### Collection: `scanjobs`

| Field | Type | Notes |
|-------|------|-------|
| phase | String | `"priority"` / `"thematic"` / `"systematic"` |
| status | String | `"queued"` / `"running"` / `"completed"` / `"failed"` |
| description | String | JSON metadata (references or books) |
| totalItems | Number | Total items to process |
| processedItems | Number | Items processed so far |
| successCount | Number | Successful items |
| failureCount | Number | Failed items |
| errorMessages | String[] | Error details per failed item |

**Indexes:** `status`

## AI Content Pipeline

```
User submits episode params
        |
        v
  [OpenAI GPT-4o] -- rate limited (token bucket, default 60/min)
        |
        v
  Generates 7-layer content:
    1. bibleAnchor (verses + Vietnamese/English text)
    2. contemplativeReading (600-1000 words)
    3. keywords
    4. christianContext (200-300 words)
    5. lensInterpretations (author + content)
    6. lifeApplication (200-400 words)
    7. practiceScript (3-7 min guided practice)
        |
        v
  Saved to MongoDB as "draft"
        |
        v
  [Gemini 2.5 Flash] -- rate limited (token bucket, default 15/min)
        |
        v
  Verifies:
    - Bible references exist and are accurate
    - Theological context is correct
    - Interpretations labeled as interpretations (not doctrine)
    - No syncretism (Christianity ≠ Buddhism)
        |
        v
  If passed: status → "verified"
  If failed: remains "draft" with verification notes
```

## Bible Scanning Pipeline

```
POST /api/bible-passages/scan { phase, input }
        |
        v
  Create ScanJob (status: "queued")
        |
        v
  runScanJob() — async, non-blocking
        |
        +--- phase: "priority" ----> classifyPassage() per reference
        |                                    |
        +--- phase: "thematic" ----+         v
        |                          |   [ChatGPT GPT-4o] — rate limited
        +--- phase: "systematic" --+   Classify by 3 categories:
                                   |     - theGioiQuan (worldview)
                                   |     - nhanSinhQuan (life view)
                                   |     - giaTriQuan (value view)
                                   |   + generate contemplative perspective
                                   v
                            scanChapterBatch()
                            3-5 chapters/batch
                                   |
                                   v
                            savePassage() — upsert by reference
                                   |
                                   v
                         POST /api/bible-passages/review
                                   |
                                   v
                         reviewPassage() per passage
                                   |
                                   v
                         [Gemini 2.5 Flash] — rate limited
                         Verify: reference, classification, interpretation label
                                   |
                                   v
                         reviewStatus → "verified" or "rejected"
```

**Scan Tiers (66 books, Tier 1 first):**
- Tier 1: 4 Gospels + 13 Pauline Epistles (176 chapters)
- Tier 2: Remaining NT (Acts, Hebrews, Catholic Epistles, Revelation)
- Tier 3: Old Testament (future)

## Rate Limiting

Token-bucket implementation in `src/lib/rate-limiter.ts`:
- **OpenAI**: `OPENAI_RATE_LIMIT` env var (default: 60 requests/min)
- **Gemini**: `GEMINI_RATE_LIMIT` env var (default: 15 requests/min)
- `waitForToken()` blocks until a token is available, with 100ms polling interval

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGODB_URI | Yes | - | MongoDB connection string |
| OPENAI_API_KEY | Yes | - | OpenAI API key |
| GEMINI_API_KEY | Yes | - | Google Gemini API key |
| OPENAI_RATE_LIMIT | No | 60 | Requests per minute |
| GEMINI_RATE_LIMIT | No | 15 | Requests per minute |
