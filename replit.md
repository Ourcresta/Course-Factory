# Oushiksha Guru - Admin Course Factory

## Overview

Oushiksha Guru (formerly AISiksha) is an AI-powered course creation platform designed for administrators to generate complete educational courses from simple instructions. The platform transforms single commands into production-ready courses with full syllabi, modules, lessons, projects, and tests. It follows a modern SaaS admin interface design pattern (similar to Linear, Notion, Vercel Dashboard) focused on clarity, information density, and efficient workflow management.

Integrated with OurShiksha Shishya (student portal) via REST API where Shishya pulls published course data using secure API keys.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure with reusable components. Key pages include:
- **Dashboard**: Overview with stats and quick actions
- **Courses**: Listing with filters and status badges
- **Course Detail**: Tabbed interface (Overview, Modules, Projects, Tests, Labs, Certificate, Publish)
- **Module Editor**: Lessons management with AI generation
- **Project Editor**: Comprehensive project configuration with skill mapping
- **Test Editor**: Question management with MCQ and scenario types
- **Lab Editor**: Practice lab configuration with code validation and hints
- **Certificate Designer**: Certificate configuration with requirements
- **Skills Library**: Global skill management for tagging
- **Settings**: Application configuration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas with drizzle-zod integration for type-safe database operations

The server handles course CRUD operations, AI-powered content generation, and serves the static frontend in production.

### AI Integration
- **Provider**: OpenAI API (user's own OPENAI_API_KEY)
- **Model**: GPT-4o for all course/chat generation
- **Course Factory Engine**: Comprehensive AI system prompt that acts as Senior Instructional Designer, Subject Matter Expert, Learning Experience Architect, Skill Assessment Designer, and Product Engineer
- **Generation Modes**:
  - **Preview Mode**: Generates full course structure with concise content for quick admin review (faster generation, status: draft)
  - **Publish Mode**: Generates complete, detailed content ready for students (full validation-ready content, status: published)
- **Features**: Full course generation from commands including modules, lessons, practice labs, projects, tests, and certificate rules in a single AI call
- **Generation Options**: includeLabs, includeProjects, includeTests toggles for customizing course content
- **Practice-First Design**: Labs are generated for coding-related lessons with starter code, hints (no direct answers), and automatic validation
- **Thinking Process**: PLAN → STRUCTURE → GENERATE → VALIDATE methodology
- **Self-Validation**: AI checks progression logic, lab coverage, content weight, job relevance before output
- **Batch Processing**: Custom utilities with rate limiting and retry logic for bulk AI operations
- **Chat Interface**: Built-in conversation management for interactive AI features

### Data Model
Core entities include:
- **Users**: Admin authentication
- **Courses**: Main content container with metadata (level, audience, duration, learning outcomes)
- **Modules**: Course sections with estimated time
- **Lessons**: Individual learning units with objectives and key concepts
- **Projects**: Course-scoped hands-on assignments with objectives, deliverables, submission instructions, evaluation notes, and skill mapping via `projectSkills` join table
- **Tests**: Module-scoped assessments with passing criteria and optional time limits
- **Questions**: Test questions supporting MCQ (multiple choice) and scenario-based types with difficulty levels
- **Practice Labs**: Course-scoped coding exercises with validation types (output/console/api/regex/function), progressive hints, AI context for Mithra tutor, unlock mechanisms (always/module_complete/lesson_complete/test_pass/lab_complete), and certificate weight contribution
- **Certificates**: Course completion/achievement certificates with skill tags, test requirements, project completion requirements, and lab completion requirements
- **Skills**: Global tagging system for courses and projects
- **Audit Logs**: Activity tracking for admin actions (course publish/unpublish, test/question/project CRUD)

### Publish Workflow
- **Draft vs Published**: Courses start as drafts and can be published when ready
- **Content Locking**: Published courses have read-only content (modules, lessons, projects, tests, labs)
- **Unpublish to Edit**: Admins must unpublish to make changes
- **Validation**: Publishing requires minimum content (modules, lessons, etc.)

### Build and Development
- **Development**: `npm run dev` runs Vite dev server with HMR
- **Production Build**: Custom build script using esbuild for server bundling and Vite for client
- **Database Migrations**: Drizzle Kit with `npm run db:push`

## Admin Authentication

Production security implemented with separate Sign In and Sign Up flows:

### Sign In Flow (Email + Password only)
1. Admin enters email and password on login page
2. Server validates credentials against bcrypt-hashed password (12 rounds)
3. If valid, JWT token issued immediately with 12-hour expiry
4. No OTP required for existing admin sign in

### Sign Up Flow (Email + Password + OTP)
1. New user enters username, email, and password
2. Server creates user with `pending_admin` role
3. 6-digit OTP is generated and sent to admin approval email (ourcresta@gmail.com) via Resend API
4. OTP stored in database with 5-minute expiry and max 3 attempts
5. New user enters OTP (obtained from admin)
6. User role updated to `admin` and JWT token issued

### Security Features
- **Password Hashing**: bcrypt with 12 rounds
- **OTP Delivery**: Resend API (from admin@admin.aisiksha.in)
- **JWT Authentication**: 12-hour token expiry, Bearer token in Authorization header
- **Rate Limiting**: Auth endpoints (10/15min), OTP (5/5min), General API (100/min)
- **Security Headers**: Helmet.js for XSS, CSP, clickjacking protection
- **CORS**: Configured for allowed domains

### Admin Credentials (Development)
- Email: admin@ourshiksha.ai
- Password: AdminPassword123!
- Seed script: `npx tsx server/seed-admin.ts`

### Auth Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/auth/login` | POST | Submit email/password, receive OTP |
| `/api/admin/auth/verify-otp` | POST | Submit OTP, receive JWT token |
| `/api/admin/auth/me` | GET | Get current user (requires JWT) |
| `/api/admin/auth/logout` | POST | Logout (client clears token) |

### Environment Variables (Auth)
- `SESSION_SECRET`: JWT signing secret
- Resend API key configured via integration

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema defined in `shared/schema.ts`, migrations in `/migrations`

### AI Services
- **OpenAI API**: Used for all AI content generation
- **Environment Variables**: `OPENAI_API_KEY` (user's own API key)
- **Models**: GPT-4o for text generation (course, modules, lessons, labs, projects, tests)

### Key NPM Packages
- Radix UI primitives for accessible components
- TanStack React Query for data fetching
- React Hook Form + Zod for form handling
- date-fns for date formatting
- Lucide React for icons
- Vaul for drawer components
- Embla Carousel for carousels

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator

## Public API for Shishya Integration

The platform exposes a secure REST API for the OurShiksha Shishya student portal to fetch published course data.

### Authentication
- All public API endpoints require an `X-API-Key` header
- API keys are managed in Settings > API Keys
- Keys have format: `ais_` + 64 random hex characters
- Keys can be activated/deactivated and have optional expiration dates

### Public API Endpoints
All endpoints return only **published** courses (status: "published").

| Endpoint | Description |
|----------|-------------|
| `GET /api/public/courses` | List all published courses (metadata only) |
| `GET /api/public/courses/:id` | Full course with modules, lessons, AI notes |
| `GET /api/public/courses/:id/tests` | Tests with questions for a course |
| `GET /api/public/courses/:id/projects` | Projects with skills and steps |
| `GET /api/public/courses/:id/labs` | Practice labs with hints and validation config |
| `GET /api/public/courses/:id/certificate` | Certificate requirements and config |

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "count": 5,
  "courses": [...] // or "course", "tests", "projects", "labs", "certificate"
}
```

### Error Responses
- `401`: Missing or invalid API key
- `403`: API key inactive or expired
- `404`: Course not found or not published
- `500`: Server error

### Internal API Key Management Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/api-keys` | GET | List all API keys (preview only) |
| `/api/api-keys` | POST | Create new API key |
| `/api/api-keys/:id` | PATCH | Update key (name, isActive) |
| `/api/api-keys/:id` | DELETE | Delete/revoke API key |