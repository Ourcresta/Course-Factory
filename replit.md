# Oushiksha Guru - Admin Course Factory

## Overview
Oushiksha Guru is an AI-powered platform for administrators to create comprehensive educational courses from simple instructions. It generates full syllabi, modules, lessons, projects, and tests, adopting a modern SaaS admin interface design for clarity and efficient workflow. The platform integrates with the OurShiksha Shishya (student portal) via a secure REST API.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: Shadcn/ui (Radix UI, Tailwind CSS)
- **Forms**: React Hook Form with Zod
- **Build Tool**: Vite

**Key Sections**:
-   **Dashboard**: KPIs, revenue, course stats.
-   **Academics**: Courses, AI Course Factory, Labs, Tests, Projects, Certificates, Skills Library.
-   **Business**: Credits, pricing, subscriptions, payments, promotions.
-   **Shishya Control**: Student portal analytics, user management, activity, payments, engagement.
-   **System**: Security, admin management, settings.
-   **Course Detail**: Tabbed interface for managing course content.

### Backend
-   **Runtime**: Node.js with Express
-   **Language**: TypeScript
-   **API Design**: RESTful JSON (`/api/*`)
-   **Database ORM**: Drizzle ORM with PostgreSQL
-   **Validation**: Zod schemas

### AI Integration
-   **Provider**: OpenAI API (GPT-4o)
-   **Engine**: Acts as a Senior Instructional Designer, SME, LX Architect, Skill Assessment Designer, and Product Engineer.
-   **Generation Modes**: Preview (draft, concise content) and Publish (detailed, validated content).
-   **Features**: Full course generation (modules, lessons, labs, projects, tests, certificates) from commands. Includes `includeLabs`, `includeProjects`, `includeTests` toggles.
-   **Practice-First Design**: Labs with starter code, hints, and automatic validation.
-   **Methodology**: PLAN → STRUCTURE → GENERATE → VALIDATE.
-   **Self-Validation**: AI checks progression logic, coverage, content weight, job relevance.
-   **Auto-Generated Content**: Pricing (level-based ₹1,999-9,999), reward coins, achievement cards, motivational cards, and scholarship configs.

### JSON Import Feature
-   **Location**: AI Course Factory → JSON Import tab
-   **Endpoint**: POST `/api/courses/import`
-   **Features**:
    -   Upload JSON file or paste JSON content directly
    -   Real-time validation with error messages
    -   Preview of parsed course structure before import
    -   Downloadable JSON template for reference
    -   Default pricing based on level if not specified
-   **Supported Fields**: name, description, level, modules (with lessons), labs, projects, tests, rewards, achievementCards, motivationalCards, pricing, scholarship, certificateRules
-   **Default Pricing**: Beginner ₹1,999, Intermediate ₹3,999, Advanced ₹5,999 (auto-applied if not specified)

### Data Model
Core entities include Users, Courses, Modules, Lessons, Projects, Tests, Questions, Practice Labs, Certificates, Skills, and Audit Logs.

### Single-Table Course Architecture (FINALIZED)
The platform uses a SINGLE `courses` table as the source of truth. Publishing UPDATES the same row - no data copying or duplication.

**Course Table Columns** (`shared/schema.ts`):
- `id` (serial, primary key)
- `name`, `description`, `level`, `targetAudience`, `duration`, `overview`
- `status` (text): 'draft' | 'published' | 'archived' | 'generating'
- `isActive` (boolean): Controls Shishya visibility (must be true when published)
- `publishedAt` (timestamp, nullable): Set when published
- `createdAt`, `updatedAt` (timestamps)

**Status Flow**:
- `draft` → Default state, editable, not visible to students
- `published` → Live and visible to Shishya portal (isActive=true)
- `archived` → Preserved for audit, hidden from students (isActive=false)
- `generating` → AI is generating content (cannot publish)

**Shishya Query Rule (MANDATORY)**:
```sql
SELECT * FROM courses WHERE status = 'published' AND is_active = true;
```

### Lesson YouTube References
Lessons can have YouTube video references attached for supplementary learning:
- **Schema**: `youtubeReferences` field stores array of `{url, title, description?}`
- **UI**: Lesson editor has "YouTube References" section with add/remove functionality
- **Features**: Auto-extracts thumbnails from YouTube URLs, clickable video cards
- **Location**: `/courses/:id/modules/:moduleId/lessons/:lessonId` editor page

### Publish Workflow (FINALIZED)

**Publishing Process**:
1. Admin creates/edits course content while in `draft` or `archived` status
2. Click "Publish" (or "Republish" for archived courses) button on course detail page
3. System validates: at least 1 module with at least 1 lesson each
4. **UPDATE** same row: `status='published'`, `isActive=true`, `publishedAt=CURRENT_TIMESTAMP`
5. Course becomes available via `/api/public/courses` endpoints

**Unpublishing (Archive)**:
- Click "Unpublish" to archive the course
- **UPDATE** same row: `status='archived'`, `isActive=false`
- Course is hidden from Shishya portal but preserved for audit
- Can be republished later (same row reused)

**API Endpoints**:
- `POST /api/courses/:id/publish` - Publish course (updates status only)
- `POST /api/courses/:id/unpublish` - Archive course (updates status only)
- `GET /api/public/courses` - Shishya reads only published + active courses

### Admin Authentication
-   **Sign In**: Email/password, JWT (12-hour expiry).
-   **Sign Up**: Email/password, OTP verification (via Resend API) for new users with `pending_admin` role, then upgraded to `admin`.
-   **Security**: bcrypt hashing (12 rounds), JWT, rate limiting, Helmet.js for security headers, CORS.

## External Dependencies

### Database
-   **PostgreSQL**: Primary data store.
-   **Drizzle ORM**: For schema definition and migrations.

### AI Services
-   **OpenAI API**: For all AI content generation using `GPT-4o`. Requires `OPENAI_API_KEY`.

### Key NPM Packages
-   Radix UI (primitives)
-   TanStack React Query
-   React Hook Form + Zod
-   date-fns
-   Lucide React
-   Vaul
-   Embla Carousel

### Replit-Specific Integrations
-   `@replit/vite-plugin-runtime-error-modal`
-   `@replit/vite-plugin-cartographer`
-   `@replit/vite-plugin-dev-banner`

### Public API for Shishya Integration
-   **Authentication**: No authentication required - both Guru (admin) and Shishya (student) portals share the same database.
-   **Endpoints**: Provide access to published course metadata, full course content, tests, projects, labs, and certificate requirements.
-   **Response Format**: Consistent JSON structure with `success` flag, `count`, and data.
-   **Note**: API key functionality has been removed as it's unnecessary when both portals share the same database.
