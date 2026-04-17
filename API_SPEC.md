# API Specification

> This file is the **contract** between Backend (Claude) and Frontend (Gemini).
> Claude writes endpoints here. Gemini reads and integrates against them.

---

## Endpoints

### GET /api/health

**Description:** Check database connection status.

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Error Response (500):**
```json
{ "status": "error", "message": "..." }
```

---

### GET /api/episodes

**Description:** List episodes with optional filters. Sorted by workstream (asc), episodeNumber (asc).

**Query Parameters:**
| Param | Type | Values | Required |
|-------|------|--------|----------|
| workstream | string | `A`, `B` | No |
| status | string | `draft`, `verified`, `published` | No |

**Response (200):** `EpisodeData[]`

---

### POST /api/episodes

**Description:** Create a new episode.

**Request Body:** Full `EpisodeData` object (see types below).

**Response (201):** Created `EpisodeData` object.

**Error Responses:**
- `400` — Validation failed: `{ "error": "Validation failed", "details": "..." }`
- `409` — Duplicate slug: `{ "error": "An episode with this slug already exists" }`
- `500` — Internal error

---

### GET /api/episodes/[id]

**Description:** Retrieve a single episode. Tries by `slug` first, falls back to MongoDB `_id`.

**Path Parameter:** `id` — episode slug or MongoDB ObjectId.

**Response (200):** `EpisodeData` object.

**Error Responses:**
- `404` — `{ "error": "Episode not found" }`
- `500` — Internal error

---

### PUT /api/episodes/[id]

**Description:** Update an episode by MongoDB `_id`.

**Path Parameter:** `id` — MongoDB ObjectId.

**Request Body:** Partial `EpisodeData` (fields to update).

**Response (200):** Updated `EpisodeData` object.

**Error Responses:**
- `400` — Validation failed
- `404` — Episode not found
- `500` — Internal error

---

### DELETE /api/episodes/[id]

**Description:** Delete an episode by MongoDB `_id`.

**Path Parameter:** `id` — MongoDB ObjectId.

**Response (200):**
```json
{ "message": "Episode deleted successfully" }
```

**Error Responses:**
- `404` — Episode not found
- `500` — Internal error

---

### GET /api/glossary

**Description:** List glossary terms. Sorted alphabetically by `termVi`.

**Query Parameters:**
| Param | Type | Values | Required |
|-------|------|--------|----------|
| search | string | Free text (MongoDB text search) | No |
| category | string | `contemplative`, `biblical`, `mindfulness`, `general` | No |

**Response (200):** `GlossaryTermData[]`

---

### POST /api/glossary

**Description:** Create a new glossary term.

**Request Body:**
```json
{
  "termVi": "string (required)",
  "termEn": "string (required)",
  "definition": "string (required)",
  "relatedVerses": ["string"],
  "category": "contemplative | biblical | mindfulness | general (required)",
  "relatedAuthors": ["tolle | demello | rohr"]
}
```

**Response (201):** Created `GlossaryTermData` object.

**Error Responses:**
- `400` — Validation failed
- `409` — Duplicate Vietnamese term
- `500` — Internal error

---

### GET /api/qa

**Description:** List published Q&A pairs. Sorted by `createdAt` descending.

**Response (200):** `QAData[]` (only `isPublished: true` entries).

---

### POST /api/qa

**Description:** Submit a question. AI generates an answer using GPT-4o, extracts Bible references, and saves to database.

**Request Body:**
```json
{
  "question": "string (required, non-empty)"
}
```

**Response (201):**
```json
{
  "_id": "string",
  "question": "string",
  "answer": "string (AI-generated, Vietnamese)",
  "answeredByModel": "gpt-4o",
  "relatedEpisodeSlugs": [],
  "relatedVerses": ["string"],
  "isPublished": true,
  "createdAt": "date",
  "updatedAt": "date"
}
```

**Error Responses:**
- `400` — `{ "error": "A non-empty question string is required" }`
- `500` — Internal error

---

### POST /api/generate/episode

**Description:** Generate a new episode using ChatGPT GPT-4o. Creates a 7-layer content structure and saves as draft.

**Request Body:**
```json
{
  "workstream": "A | B (required)",
  "episodeNumber": "number (required)",
  "title": "string (required)",
  "bibleVerses": ["string (required)"],
  "keywords": ["string (required)"],
  "lens": "tolle | demello | rohr (required)"
}
```

**Response (201):** Full `EpisodeData` object with `status: "draft"`.

**Error Responses:**
- `400` — Missing required fields
- `500` — `{ "error": "Failed to generate episode", "details": "..." }`

---

### POST /api/generate/verify

**Description:** Verify an episode using Gemini 2.5 Flash. Checks Bible references, theological accuracy, and interpretation labeling.

**Request Body:**
```json
{
  "episodeId": "string (MongoDB ObjectId, required)"
}
```

**Response (200):** Updated `EpisodeData` object. If verified: `status` changes to `"verified"`.

**Error Responses:**
- `400` — Missing `episodeId`
- `500` — `{ "error": "Failed to verify episode", "details": "..." }`

---

### GET /api/bible-passages

**Description:** List/filter Bible passages with pagination. Sorted by book, chapter, verseStart.

**Query Parameters:**
| Param | Type | Values | Required |
|-------|------|--------|----------|
| category | string | `theGioiQuan`, `nhanSinhQuan`, `giaTriQuan` | No |
| book | string | English book abbreviation (e.g. `Matt`, `Rom`) | No |
| reviewStatus | string | `pending`, `verified`, `rejected` | No |
| priorityTier | string | `1`, `2`, `3` | No |
| search | string | Free text (MongoDB text search on textVi + contemplativePerspective) | No |
| page | number | Page number (default: 1) | No |
| limit | number | Items per page (default: 20, max: 100) | No |

**Response (200):**
```json
{
  "data": [BiblePassageData],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

---

### GET /api/bible-passages/[id]

**Description:** Retrieve a single passage by `reference` or MongoDB `_id`.

**Path Parameter:** `id` — passage reference (e.g. `Matt 5:3-12`) or MongoDB ObjectId.

**Response (200):** `BiblePassageData` object.

**Error Responses:**
- `404` — `{ "error": "Passage not found" }`
- `500` — Internal error

---

### POST /api/bible-passages/scan

**Description:** Trigger a Bible scanning job. Scans chapters using ChatGPT, classifies passages by 3 philosophical categories, and generates contemplative perspectives. Runs asynchronously.

**Request Body:**
```json
{
  "phase": "priority | thematic | systematic (required)",
  "input": {
    "references": ["Pl 2:7", "Lc 23:34"],
    "books": ["Matt", "Rom"]
  }
}
```

- `phase: "priority"` — classify specific references (uses `input.references`)
- `phase: "thematic"` / `"systematic"` — scan book chapters (uses `input.books`)

**Response (201):**
```json
{ "jobId": "string", "status": "queued", "phase": "priority" }
```

---

### GET /api/bible-passages/scan/[jobId]

**Description:** Check scan job progress.

**Path Parameter:** `jobId` — MongoDB ObjectId of the scan job.

**Response (200):** `ScanJobData` object.

**Error Responses:**
- `404` — `{ "error": "Scan job not found" }`

---

### POST /api/bible-passages/review

**Description:** Trigger Gemini review batch for unreviewed passages. Runs asynchronously.

**Request Body (optional):**
```json
{
  "passageIds": ["string (MongoDB ObjectId)"],
  "limit": 20
}
```

- If `passageIds` provided: reviews those specific passages
- Otherwise: finds up to `limit` (default 20, max 50) pending passages

**Response (202):**
```json
{ "message": "Review started for 20 passages", "total": 20 }
```

---

### GET /api/bible-passages/stats

**Description:** Aggregated statistics for Bible passages.

**Response (200):**
```json
{
  "total": 150,
  "byCategory": [
    { "category": "giaTriQuan", "count": 80, "avgConfidence": 0.85 }
  ],
  "byBook": [
    { "book": "Matt", "bookVi": "Mátthêu", "count": 25 }
  ],
  "byStatus": { "pending": 30, "verified": 100, "rejected": 20 },
  "byTier": { "1": 50, "2": 100 }
}
```

---

## Shared Types

### EpisodeData
See `src/types/episode.ts` for full TypeScript interface.

### GlossaryTermData
See `src/types/glossary.ts` for full TypeScript interface.

### QAData
See `src/types/qa.ts` for full TypeScript interface.

### BiblePassageData
See `src/types/bible-passage.ts` for full TypeScript interface.

### ScanJobData
See `src/types/scan-job.ts` for full TypeScript interface.
