# Project Tasks

## Phase 0: Bootstrap ✅
- [x] Init Next.js with TypeScript, Tailwind, App Router
- [x] Docker Compose for MongoDB
- [x] MongoDB connection utility
- [x] Verify health check

## Phase 1: Data Layer ✅
- [x] Mongoose models (Episode, GlossaryTerm, QA)
- [x] API routes (CRUD for all collections)
- [x] Glossary seed data

## Phase 2: AI Integration ✅
- [x] OpenAI client + Gemini client
- [x] Rate limiter
- [x] Content generation pipeline (ChatGPT writes -> Gemini verifies)
- [x] Comprehensive system prompts for Vietnamese content

## Phase 3: UI ✅
- [x] Layout (Header, Footer, Vietnamese fonts)
- [x] Home page
- [x] Episode listing + detail
- [x] Glossary page
- [x] Q&A page
- [x] Admin content generation

## Phase 3.5: Bible Scanning & Classification ✅
- [x] Types: BiblePassageData, ScanJobData
- [x] Models: BiblePassage (with indexes), ScanJob
- [x] Bible reference catalog (66 books, 3 scan tiers)
- [x] Bible scanner: classifyPassage, scanChapterBatch, reviewPassage, runScanJob
- [x] API: GET /api/bible-passages (list/filter/paginate)
- [x] API: GET /api/bible-passages/[id] (by reference or _id)
- [x] API: POST /api/bible-passages/scan (trigger scan job)
- [x] API: GET /api/bible-passages/scan/[jobId] (check progress)
- [x] API: POST /api/bible-passages/review (trigger Gemini review batch)
- [x] API: GET /api/bible-passages/stats (aggregated stats)
- [x] Updated API_SPEC.md + docs/architecture.md
- [x] TypeScript + build verification
- [x] Run Phase 1 scan: content.md priority passages (~30)
- [x] Run Phase 2 scan: 4 Gospels (89 chapters)
- [x] Run Phase 3 scan: Pauline Epistles (87 chapters)
- [x] Review all scanned passages with Gemini

## Phase 4: Content Generation ✅
- [x] Generate Workstream A episodes (8-10)
- [x] Generate Workstream B episodes (10)
- [x] Verify all with Gemini
- [x] Review and publish

## Phase 5: TTS (CURRENT)
- [ ] Choose TTS provider (OpenAI TTS / Google Cloud TTS / ElevenLabs)
- [ ] TTS API route: POST /api/tts/generate
- [ ] TTS generation logic (text-to-speech for practiceScript)
- [ ] Audio storage strategy (local/cloud)
- [ ] Audio player component on episode detail page
- [ ] Admin UI to trigger TTS generation
- [ ] Update API_SPEC.md + docs/architecture.md
