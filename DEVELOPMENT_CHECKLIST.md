# Frontdesk AI – Master Development Checklist

---

## Build Order

### Phase 1: Foundation (Blockers)

- [x] Database + persistence
- [ ] Authentication + multi-tenancy
- [ ] Agent CRUD + ownership
- [ ] Real LLM integration (not stubs)

### Phase 2: Core MVP

- [ ] Chat API + conversation storage
- [ ] Website widget (script + public chat endpoint)
- [ ] Leads system (store, list, export)
- [ ] Knowledge base (add sources + retrieval)
- [ ] Basic Analytics (overview)

### Phase 3: Booking

- [ ] Google Calendar OAuth
- [ ] Availability + booking endpoints
- [ ] Confirmation notifications

### Phase 4: Voice

- [ ] Twilio inbound call flow
- [ ] Transfer + voicemail
- [ ] Transcription + summaries
- [ ] Call history + analytics

### Phase 5: Integrations and Polish

- [ ] WhatsApp
- [ ] Email
- [ ] Slack
- [ ] Teams
- [ ] API keys + rate limiting
- [ ] Settings + polished UX

---

# 0. Global Foundations (Blockers)

## 0.1 Database and Persistence

- [x] Choose DB (Postgres)
- [x] Setup ORM (Prisma)
- [x] Environment config (.env example, dev/staging/prod)
- [x] Replace in-memory sessions with DB-backed sessions
- [ ] Logging strategy (structured logs)

## 0.2 Authentication and Multi-Tenancy

### Backend

- [ ] Users table
- [ ] Organizations/Workspaces table
- [ ] User belongs to org
- [ ] JWT auth
- [ ] Refresh token strategy (or short-lived JWT + re-auth)
- [ ] Auth middleware
- [ ] RBAC scaffold (owner/admin/member) minimal

### Endpoints

- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/logout
- [ ] POST /api/v1/auth/refresh (if used)
- [ ] GET /api/v1/auth/me

### Frontend

- [ ] Auth screens (or gated onboarding)
- [ ] Token storage strategy
- [ ] Route protection
- [ ] Logout flow

## 0.3 Core Models (data models)

- [x] Agent model
- [x] Conversation model
- [x] Message model
- [x] Lead model
- [x] Appointment model
- [x] KnowledgeSource model

---

# 1. Landing Page (/)

Status: FE done

## Pending

- [ ] Connect pricing CTA → onboarding entry
- [ ] Add auth gating (if needed)
- [ ] Add basic footer links (privacy, terms)

---

# 2. Onboarding Page (/onboarding)

Status: FE done, BE onboarding flow exists and persists to DB

## Backend

- [x] Persist onboarding conversation to DB
- [x] Persist onboarding result as Agent draft
- [x] Associate onboarding session with user + org
- [ ] Add idempotency so refresh does not duplicate agents

## Frontend

- [ ] Ensure onboarding returns agentId
- [ ] Redirect to /agent-studio?agentId=...
- [ ] Handle reload resume from stored session
- [ ] Error states (network/LLM)

---

# 3. Onboarding Confirmation Page (/onboarding-confirmation)

Status: FE done

## Backend

- [ ] POST /api/v1/agents (create agent from confirmation payload)
- [ ] Validate fields (name, niche, greeting, hours, channels)
- [ ] Store onboarding summary (for audit)

## Frontend

- [ ] Hook confirm button to create agent endpoint
- [ ] Show created agent status = draft
- [ ] Button to go to Agent Studio

---

# 4. Agent Studio Page (/agent-studio)

Status: FE UI complete, BE missing entirely

## 4.1 Agent CRUD (Blocker)

### Backend endpoints

- [ ] GET /api/v1/agents
- [ ] POST /api/v1/agents
- [ ] GET /api/v1/agents/:id
- [ ] PUT /api/v1/agents/:id
- [ ] DELETE /api/v1/agents/:id

### Backend data

- [x] Agents table fields:
    - [x] id
    - [x] orgId
    - [x] name
    - [x] niche
    - [x] greeting
    - [x] businessHours
    - [x] status (draft/published)
    - [x] config JSON
    - [x] createdAt/updatedAt

### Frontend integration

- [ ] Load agent details by agentId
- [ ] Save updates
- [ ] Autosave (optional)

## 4.2 Conversation Flow System

- [ ] Define flow schema (nodes, edges, rules)
- [ ] Persist flow in DB (agentId → flow JSON)
- [ ] Validate flow (no broken edges, required nodes exist)
- [ ] Flow version number (basic)

### Endpoints

- [ ] PUT /api/v1/agents/:id/flows
- [ ] GET /api/v1/agents/:id/flows

## 4.3 Test Panel (Chat simulation)

### Backend

- [ ] POST /api/v1/agents/:id/test
- [ ] Calls real LLM
- [ ] Uses agent config + knowledge base retrieval
- [ ] Returns assistant response + debug metadata (optional)

### Frontend

- [ ] Test panel sends prompt to BE
- [ ] Show messages in preview
- [ ] Handle errors + loading

## 4.4 Publish

### Backend

- [ ] POST /api/v1/agents/:id/publish
- [ ] Validate readiness checklist:
    - [ ] greeting exists
    - [ ] business hours set
    - [ ] flow exists
    - [ ] knowledge sources exist (optional for base, recommended)
    - [ ] at least one channel configured
- [ ] Set agent status = published
- [ ] Generate public access token or widget key

### Frontend

- [ ] Publish button calls endpoint
- [ ] Show published status badge
- [ ] Post-publish next steps CTA → Go Live

---

# 5. Go Live Page (/go-live)

Status: FE UI complete, BE missing

## 5.1 Website Widget (MVP channel)

### Backend

- [ ] GET /api/v1/widget/:agentId/config
- [ ] GET /cdn/widget.js (serve widget bundle)
- [ ] Widget auth key (public key per agent)
- [ ] Rate limiting for widget calls
- [ ] CORS safe public endpoints

### Chat for widget

- [ ] POST /api/v1/chat/:agentId/message (public-safe mode)
- [ ] Conversation ID support
- [ ] Store transcript

### Frontend

- [ ] Embed script pulls correct agentId + widget key
- [ ] Copy-to-clipboard works
- [ ] Preview mode (optional)

## 5.2 API Access (MVP-lite)

### Backend

- [ ] POST /api/v1/api-keys
- [ ] GET /api/v1/api-keys
- [ ] DELETE /api/v1/api-keys/:id
- [ ] API key auth middleware
- [ ] Rate limiting middleware

### Frontend

- [ ] Show API key generation
- [ ] Regenerate key flow
- [ ] Docs link

## 5.3 WhatsApp (Deprioritize until core shipped)

- [ ] Connect endpoint
- [ ] Incoming webhook
- [ ] Twilio + Meta Cloud API support
- [ ] Message routing to agent chat engine

## 5.4 Email (Deprioritize)

- [ ] Connect IMAP/SMTP
- [ ] Polling or webhook
- [ ] Route email to agent and respond

## 5.5 Slack (Deprioritize)

- [ ] OAuth connect
- [ ] Slack events webhook
- [ ] Bot setup

## 5.6 Teams (Deprioritize)

- [ ] OAuth connect
- [ ] Teams events webhook
- [ ] Bot Framework integration

---

# 6. Chat System

## Backend

### Data

- [x] Conversations table
- [x] Messages table

### Endpoints

- [ ] POST /api/v1/chat/:agentId/message
- [ ] GET /api/v1/chat/:agentId/history
- [ ] WS /api/v1/chat/:agentId/ws (optional for base)

### AI behavior requirements (PRD)

- [ ] Intent detection (booking, faq, human handoff, lead capture)
- [ ] Lead capture extraction (name/email/phone)
- [ ] Booking trigger path
- [ ] Human handoff trigger path
- [ ] Business hours awareness

## Frontend

- [ ] Agent Studio test uses this engine
- [ ] Widget uses this engine

---

# 7. Leads System

## Backend

### Data

- [x] Leads table

### Endpoints

- [ ] GET /api/v1/leads
- [ ] POST /api/v1/leads
- [ ] GET /api/v1/leads/:id
- [ ] PUT /api/v1/leads/:id
- [ ] DELETE /api/v1/leads/:id
- [ ] GET /api/v1/leads/export (CSV)

## Frontend (new pages needed)

- [ ] Leads list page
- [ ] Lead detail view
- [ ] Search and filters
- [ ] Export CSV button

---

# 8. Knowledge Base (PRD requirement)

## Backend

- [x] KnowledgeSource table
- [ ] File upload pipeline (PDF, DOCX)
- [ ] Website ingest/scrape pipeline (URL)
- [ ] Vector index (pgvector/pinecone/etc)
- [ ] Retrieval function used by chat engine

### Endpoints

- [ ] GET /api/v1/agents/:id/knowledge
- [ ] POST /api/v1/agents/:id/knowledge
- [ ] DELETE /api/v1/agents/:id/knowledge/:kid
- [ ] POST /api/v1/agents/:id/knowledge/sync

## Frontend (new UI likely needed)

- [ ] Knowledge base management page
- [ ] Upload sources UI
- [ ] Sync URL UI
- [ ] Show status (processing/ready/error)

---

# 9. Analytics Dashboard

## Backend

- [ ] GET /api/v1/analytics/overview
- [ ] GET /api/v1/analytics/chats
- [ ] GET /api/v1/analytics/leads
- [ ] GET /api/v1/analytics/appointments (later)
- [ ] GET /api/v1/analytics/calls (later)

## Frontend (new page)

- [ ] Overview dashboard page
- [ ] Charts for:
    - [ ] Calls answered (later)
    - [ ] Chats handled
    - [ ] Leads captured
    - [ ] Appointments booked (later)
- [ ] Time filter (7d/30d/custom)

---

# 10. Booking

## Backend

- [ ] Google Calendar OAuth connect
- [ ] Store tokens per agent/org
- [ ] Availability rules engine:
    - [ ] working hours
    - [ ] buffers
    - [ ] meeting length
- [ ] Appointment creation
- [ ] Reschedule/cancel

### Endpoints

- [ ] GET /api/v1/availability/:agentId
- [ ] POST /api/v1/appointments
- [ ] PUT /api/v1/appointments/:id
- [ ] DELETE /api/v1/appointments/:id
- [ ] GET /api/v1/appointments

## Frontend (new UI likely needed)

- [ ] Calendar connect flow
- [ ] Availability settings UI
- [ ] Appointments list page

---

# 11. Voice (Twilio) (PRD primary but later)

## Backend

- [ ] Twilio number connect
- [ ] Incoming webhook
- [ ] Call state machine
- [ ] Transfer to human numbers
- [ ] Voicemail fallback
- [ ] Recording consent toggle
- [ ] Transcription
- [ ] Summary generation
- [ ] Call history storage

### Endpoints

- [ ] POST /api/v1/voice/:agentId/incoming
- [ ] POST /api/v1/voice/:agentId/status
- [ ] GET /api/v1/voice/:agentId/calls

## Frontend (new UI)

- [ ] Voice setup wizard implementation
- [ ] Call logs page

---

# 12. Settings and Policies (PRD polish)

## Business Settings

- [ ] Business hours configuration
- [ ] Holiday schedule
- [ ] Staff contact list (handoff)
- [ ] Notification preferences (email/SMS)
- [ ] Recording consent settings
- [ ] Data retention settings

## Quality and Safety

- [ ] Failover behavior definition:
    - [ ] if AI fails, take message
    - [ ] if booking fails, escalate
- [ ] Rate limiting across public endpoints
- [ ] Audit logs for admin actions
