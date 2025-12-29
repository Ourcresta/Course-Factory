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

### Data Model
Core entities include Users, Courses, Modules, Lessons, Projects, Tests, Questions, Practice Labs, Certificates, Skills, and Audit Logs.

### Lesson YouTube References
Lessons can have YouTube video references attached for supplementary learning:
- **Schema**: `youtubeReferences` field stores array of `{url, title, description?}`
- **UI**: Lesson editor has "YouTube References" section with add/remove functionality
- **Features**: Auto-extracts thumbnails from YouTube URLs, clickable video cards
- **Location**: `/courses/:id/modules/:moduleId/lessons/:lessonId` editor page

### Publish Workflow
Courses are managed as `draft` or `published`. Published courses are read-only; unpublishing is required for edits. Validation checks content minimums before publishing.

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
-   **Authentication**: Requires `X-API-Key` header (keys managed in Settings).
-   **Endpoints**: Provide access to published course metadata, full course content, tests, projects, labs, and certificate requirements.
-   **Response Format**: Consistent JSON structure with `success` flag, `count`, and data.
