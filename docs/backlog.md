# Product Backlog

## Doing
<!-- Features currently in progress -->
- Standardize documentation and code flow per CLAUDE.md, architecture.md, working-model.md

## To Do
<!-- Features planned but not started -->
- Generate Workstream A episodes (8-10 episodes)
- Generate Workstream B episodes (10 episodes)
- Verify all generated episodes with Gemini
- Review and publish verified episodes
- TTS integration + audio player component

## Done
<!-- Completed features -->
- Project bootstrap (Next.js, TypeScript, Tailwind, App Router)
- Docker Compose for local MongoDB
- MongoDB connection utility (serverless-safe singleton)
- Mongoose models: Episode, GlossaryTerm, QA
- CRUD API routes for Episodes, Glossary, QA
- Health check endpoint
- OpenAI GPT-4o client integration
- Google Gemini 2.5 Flash client integration
- Token-bucket rate limiter (configurable per provider)
- AI content generation pipeline (7-layer episode structure)
- AI verification pipeline (Gemini checks theological accuracy)
- Root layout with Vietnamese fonts (Noto Serif, Inter)
- Header + Footer components
- Home page with workstream cards and author lens explanations
- Episode listing page with workstream/status filters
- Episode detail page with 7-layer content display
- Glossary page with search and category filtering
- Q&A page with AI-powered question answering
- Admin dashboard with content statistics
- Admin content generation form
- UI component library (Badge, Button, Card, Input, Spinner)
- Sacred color theme (Tailwind custom colors)
