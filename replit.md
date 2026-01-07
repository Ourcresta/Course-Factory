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

## Deployment (Version 1.0)

### Deployment Documentation
-   **ENV_SAMPLE.txt**: Environment variable template with all required secrets
-   **README_DEPLOY.md**: Step-by-step MilesWeb deployment guide
-   **SECURITY_CHECKLIST.md**: Production security audit checklist
-   **docs/JSON_SCHEMA.md**: Complete JSON import schema documentation
-   **database/schema.sql**: PostgreSQL schema export for database setup
-   **ecosystem.config.js**: PM2 process manager configuration

### Production Requirements
-   **Database**: PostgreSQL 15+ (recommended)
-   **Runtime**: Node.js 20 LTS
-   **Process Manager**: PM2 for clustering and monitoring
-   **Web Server**: Nginx or Apache as reverse proxy
-   **SSL**: Let's Encrypt for HTTPS

### Build Commands
```bash
npm ci                    # Install dependencies
npm run build             # Build frontend and backend
npm run db:push           # Push schema to database
pm2 start ecosystem.config.js --env production
```

### Security Features
-   Helmet.js security headers
-   bcrypt password hashing (12 rounds)
-   JWT authentication (12-hour expiry)
-   Rate limiting on all endpoints
-   Input validation with Zod schemas
-   CORS configuration for production domains

### Default Pricing (Auto-applied)
| Level        | Price (INR) | Credit Cost |
|-------------|-------------|-------------|
| Beginner    | ₹1,999      | 800         |
| Intermediate | ₹3,999      | 1,600       |
| Advanced    | ₹5,999      | 2,400       |

## Enterprise Architecture (Version 2.0)

### RBAC System
Role-based access control with granular permissions:

**Roles Hierarchy:**
- `super_admin` (Level 100): Full system access
- `admin` (Level 80): General admin operations
- `content_admin` (Level 60): Course management
- `finance_admin` (Level 60): Financial operations
- `support_admin` (Level 40): Student support
- `readonly_admin` (Level 10): View-only access

**Permission Categories:**
- `dashboard.*` - Dashboard access
- `courses.*` - Course management (view, create, edit, delete, publish)
- `users.*` - Admin user management
- `students.*` - Shishya user management
- `rewards.*` - Reward approvals
- `finance.*` - Pricing, credits, refunds
- `settings.*` - System configuration
- `ai.*` - AI governance
- `certificates.*` - Certificate management
- `reports.*` - Analytics and exports
- `audit.*` - Audit log access
- `approvals.*` - Workflow approvals

### Approval Workflows
Multi-step approval system for sensitive actions:
- **Course Publishing**: Content admin -> Admin approval
- **High-Value Rewards**: Support admin -> Finance admin
- **Refund Requests**: Support admin -> Finance admin
- **AI Rule Changes**: Content admin -> Super admin

### Course Versioning
Full version control for courses:
- Automatic snapshots on major changes
- Publish history with audit trail
- Quality checks before publishing

### Enterprise Tables
- `admin_roles` - Role definitions
- `admin_permissions` - Permission codes
- `admin_role_permissions` - Role-permission mappings
- `admin_user_roles` - User role assignments
- `approval_templates` - Workflow templates
- `approval_requests` - Pending approvals
- `approval_steps` - Workflow steps
- `approval_actions` - Approval audit trail
- `course_versions` - Version snapshots
- `course_publish_history` - Publish audit
- `course_quality_checks` - Quality validation
- `platform_settings` - Global configuration
- `credit_policies` - Pricing rules
- `scholarship_policies` - Scholarship eligibility
- `pricing_rules` - Dynamic pricing
- `ai_rule_registry` - AI generation rules
- `ai_model_registry` - AI model configs
- `certificate_templates` - Certificate designs
- `signer_registry` - Authorized signers
- `academic_authorities` - Accreditation bodies
- `data_access_logs` - Access audit trail
- `escalation_logs` - Security escalations
- `admin_security_logs` - Security events

### RBAC Middleware
File: `server/rbac-middleware.ts`
- `requirePermission()` - Check specific permissions
- `requireRole()` - Check user roles
- `requireMinLevel()` - Check role hierarchy level
- `assignRoleToUser()` - Assign roles programmatically
- `hasPermission()` - Check permissions in code

### Seed Data
File: `server/seeds/enterprise-seed.ts`
- 6 default admin roles
- 41 system permissions
- Role-permission mappings
- Default platform settings
- Credit policies by level
- Approval workflow templates
- AI model configurations
