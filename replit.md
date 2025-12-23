# AISiksha Admin Course Factory

## Overview

AISiksha Admin Course Factory is an AI-powered course creation platform designed for administrators to generate complete educational courses from simple instructions. The platform transforms single commands into production-ready courses with full syllabi, modules, lessons, projects, and tests. It follows a modern SaaS admin interface design pattern (similar to Linear, Notion, Vercel Dashboard) focused on clarity, information density, and efficient workflow management.

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