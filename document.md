# AISiksha Admin Course Factory - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Data Model](#data-model)
5. [API Reference](#api-reference)
6. [Frontend Pages](#frontend-pages)
7. [Workflows](#workflows)
8. [AI Integration](#ai-integration)
9. [Security & Access Control](#security--access-control)

---

## Overview

AISiksha Admin Course Factory is an AI-powered course creation platform designed for administrators to generate complete educational courses from natural language commands. The platform transforms simple instructions into production-ready courses with:

- Full course syllabi with structured modules
- Lessons with AI-generated notes and key concepts
- Real-world projects with deliverables and evaluation criteria
- MCQ and scenario-based tests with difficulty levels
- Certificates with skill tags and completion requirements

The interface follows modern SaaS admin patterns (similar to Linear, Notion, Vercel Dashboard) focused on clarity, information density, and efficient workflow management.

---

## Features

### Course Management
- Create courses from natural language commands
- AI-powered content generation for modules, lessons, projects, and tests
- Draft vs Published workflow with validation
- Content locking when published (prevents accidental modifications)
- Unpublish to edit functionality

### Module & Lesson Management
- Hierarchical course structure (Course > Modules > Lessons)
- AI-generated lesson content with objectives and key concepts
- Drag-and-drop reordering
- Estimated time tracking per module

### Project Manager
- Course-scoped projects (not module-scoped)
- Comprehensive project configuration:
  - Title and description
  - Problem statement
  - Learning objectives
  - Deliverables
  - Submission instructions
  - Evaluation notes
  - Recommended folder structure
  - Difficulty level (beginner/intermediate/advanced)
- Skill mapping from global Skills Library
- Project status (draft/locked)
- Read-only when course is published

### Test Manager
- Module-scoped assessments
- Question types:
  - MCQ (Multiple Choice Questions)
  - Scenario-based questions
- Difficulty levels (easy/medium/hard)
- Passing percentage configuration
- Optional time limits
- Question explanations for learning

### Certificate Designer
- Course completion certificates
- Achievement certificates
- Skill tags configuration
- Requirements validation:
  - Test pass requirements
  - Project completion requirements
- Passing percentage thresholds
- QR verification option

### Skills Library
- Global skill management
- Tagging system for courses and projects
- Many-to-many relationships via join tables
- Badge-based selection UI

### Audit Logging
- Activity tracking for admin actions:
  - Course publish/unpublish
  - Test CRUD operations
  - Question CRUD operations
  - Project CRUD operations
- Timestamp and action type recording

---

## System Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Wouter for routing
- TanStack React Query for server state
- Shadcn/ui component library (Radix UI primitives)
- Tailwind CSS with custom theming
- React Hook Form with Zod validation
- Vite build tool

**Backend:**
- Node.js with Express
- TypeScript with ES modules
- RESTful JSON APIs
- Drizzle ORM with PostgreSQL

**AI Services:**
- OpenAI API via Replit AI Integrations
- GPT for text generation
- Batch processing with rate limiting

### Directory Structure

```
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/                 # Shadcn UI components
│       │   ├── app-sidebar.tsx     # Navigation sidebar
│       │   ├── certificate-designer.tsx
│       │   ├── project-manager.tsx
│       │   ├── test-manager.tsx
│       │   └── ...
│       ├── pages/
│       │   ├── dashboard.tsx
│       │   ├── courses.tsx
│       │   ├── course-detail.tsx
│       │   ├── project-editor.tsx
│       │   ├── test-editor.tsx
│       │   ├── skills.tsx
│       │   └── ...
│       ├── lib/
│       │   ├── queryClient.ts
│       │   └── theme-provider.tsx
│       └── App.tsx
├── server/
│   ├── index.ts                    # Express server entry
│   ├── routes.ts                   # API route definitions
│   ├── storage.ts                  # Database operations
│   ├── ai-service.ts               # OpenAI integration
│   └── vite.ts                     # Vite dev server
├── shared/
│   └── schema.ts                   # Drizzle schema & types
├── design_guidelines.md
├── replit.md
└── document.md
```

---

## Data Model

### Core Entities

#### Users
```typescript
{
  id: number (auto-generated)
  username: string
  password: string (hashed)
}
```

#### Courses
```typescript
{
  id: number (auto-generated)
  name: string
  description: string | null
  level: "beginner" | "intermediate" | "advanced" | null
  targetAudience: string | null
  estimatedDuration: string | null
  learningOutcomes: string[] | null
  prerequisites: string[] | null
  status: "draft" | "published"
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Modules
```typescript
{
  id: number (auto-generated)
  courseId: number (FK to courses)
  name: string
  description: string | null
  estimatedTime: string | null
  order: number
}
```

#### Lessons
```typescript
{
  id: number (auto-generated)
  moduleId: number (FK to modules)
  name: string
  content: string | null
  objectives: string[] | null
  keyConcepts: string[] | null
  order: number
}
```

#### Projects
```typescript
{
  id: number (auto-generated)
  courseId: number (FK to courses)
  title: string
  description: string | null
  problemStatement: string | null
  objectives: string | null
  deliverables: string | null
  submissionInstructions: string | null
  evaluationNotes: string | null
  folderStructure: string | null
  difficulty: "beginner" | "intermediate" | "advanced"
  status: "draft" | "locked"
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Project Skills (Join Table)
```typescript
{
  id: number (auto-generated)
  projectId: number (FK to projects)
  skillId: number (FK to skills)
}
```

#### Tests
```typescript
{
  id: number (auto-generated)
  moduleId: number (FK to modules)
  title: string
  description: string | null
  passingPercentage: number (default: 70)
  timeLimit: number | null (minutes)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Questions
```typescript
{
  id: number (auto-generated)
  testId: number (FK to tests)
  type: "mcq" | "scenario"
  difficulty: "easy" | "medium" | "hard"
  questionText: string
  options: string[] | null (for MCQ)
  correctAnswer: string | null
  explanation: string | null
  scenarioText: string | null (for scenario type)
  order: number
}
```

#### Certificates
```typescript
{
  id: number (auto-generated)
  courseId: number (FK to courses, unique)
  name: string
  type: "completion" | "achievement"
  level: string | null
  skillTags: string[] | null
  passingPercentage: number | null
  requiresTestPass: boolean | null
  requiresProjectCompletion: boolean | null
  qrVerification: boolean | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Skills
```typescript
{
  id: number (auto-generated)
  name: string (unique)
  category: string | null
  description: string | null
  createdAt: timestamp
}
```

#### Audit Logs
```typescript
{
  id: number (auto-generated)
  entityType: string
  entityId: number
  action: string
  details: json | null
  createdAt: timestamp
}
```

---

## API Reference

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course with modules, lessons, projects |
| POST | `/api/courses` | Create new course |
| PATCH | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST | `/api/courses/:id/publish` | Publish course |
| POST | `/api/courses/:id/unpublish` | Unpublish course |
| POST | `/api/courses/:id/generate` | AI generate content |

### Modules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:courseId/modules` | List course modules |
| POST | `/api/courses/:courseId/modules` | Create module |
| PATCH | `/api/modules/:id` | Update module |
| DELETE | `/api/modules/:id` | Delete module |

### Lessons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules/:moduleId/lessons` | List module lessons |
| GET | `/api/lessons/:id` | Get lesson details |
| POST | `/api/modules/:moduleId/lessons` | Create lesson |
| PATCH | `/api/lessons/:id` | Update lesson |
| DELETE | `/api/lessons/:id` | Delete lesson |
| POST | `/api/lessons/:id/generate-notes` | AI generate notes |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:courseId/projects` | List course projects |
| GET | `/api/projects/:id` | Get project with skills |
| POST | `/api/courses/:courseId/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules/:moduleId/tests` | List module tests |
| GET | `/api/tests/:id` | Get test with questions |
| POST | `/api/modules/:moduleId/tests` | Create test |
| PATCH | `/api/tests/:id` | Update test |
| DELETE | `/api/tests/:id` | Delete test |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tests/:testId/questions` | Create question |
| PATCH | `/api/questions/:id` | Update question |
| DELETE | `/api/questions/:id` | Delete question |

### Certificates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:courseId/certificate` | Get course certificate |
| POST | `/api/courses/:courseId/certificate` | Create/update certificate |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List all skills |
| POST | `/api/skills` | Create skill |
| PATCH | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |

---

## Frontend Pages

### Dashboard (`/`)
- Overview statistics (total courses, published, drafts)
- Quick actions (Create New Course)
- Recent activity

### Courses (`/courses`)
- Course listing with filters
- Status badges (Draft/Published)
- Create new course action

### Create Course (`/courses/new`)
- AI command input for course generation
- Manual course creation form
- Level and audience configuration

### Course Detail (`/courses/:id`)
- Tabbed interface:
  - **Overview**: Course metadata, stats, quick edit
  - **Modules**: Module listing with lesson counts
  - **Projects**: ProjectManager component
  - **Tests**: TestManager component
  - **Certificate**: CertificateDesigner component
  - **Publish**: Publication status and actions

### Module Detail (`/courses/:courseId/modules/:moduleId`)
- Lesson management
- AI lesson generation
- Drag-and-drop ordering

### Lesson Editor (`/courses/:courseId/modules/:moduleId/lessons/:lessonId`)
- Lesson content editing
- AI notes generation
- Objectives and key concepts

### Project Editor (`/courses/:courseId/projects/:projectId`)
- Full project configuration form
- Skill selection from Skills Library
- Read-only mode when published

### Test Editor (`/courses/:courseId/tests/:testId`)
- Test settings (title, passing %, time limit)
- Question management
- MCQ and scenario question dialogs

### Skills Library (`/skills`)
- Global skill management
- Category organization
- CRUD operations

### Settings (`/settings`)
- Application configuration

---

## Workflows

### Course Creation Workflow
1. Admin enters natural language command
2. AI generates course structure (modules, lessons)
3. Admin reviews and edits generated content
4. Admin adds projects and tests manually or via AI
5. Admin configures certificate requirements
6. Admin publishes course

### Publish Workflow
1. Course starts in "draft" status
2. Publishing validates:
   - Minimum content requirements
   - Certificate configuration
3. Published courses lock all content
4. Unpublish required to make edits
5. Re-publish after changes

### Project Workflow
1. Create project from Projects tab
2. Configure all project details
3. Map skills from Skills Library
4. Project auto-locks when course is published

### Test Workflow
1. Create test for a module
2. Add MCQ or scenario questions
3. Set passing percentage and time limit
4. Test auto-locks when course is published

---

## AI Integration

### Capabilities
- **Course Generation**: Create full course structure from command
- **Module Generation**: Generate modules with descriptions
- **Lesson Generation**: Create lessons with content
- **Notes Generation**: Generate detailed lesson notes
- **Project Generation**: Create project assignments
- **Test Generation**: Generate questions for assessments

### Configuration
- Provider: OpenAI API
- Environment Variables:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Rate limiting and retry logic for bulk operations

---

## Security & Access Control

### Publish Guards
- Published courses have read-only content
- API routes reject modifications to published content
- Frontend displays read-only warnings

### Audit Logging
All critical actions are logged:
- Course publish/unpublish
- Test create/update/delete
- Question create/update/delete
- Project create/update/delete

### Data Validation
- Zod schemas for all API inputs
- Type-safe database operations via Drizzle ORM
- Foreign key constraints for data integrity

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session secret |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL |

---

## Development

### Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database
- `npm run build` - Build for production

### Database Migrations
Use Drizzle Kit for schema management:
```bash
npm run db:push
```

For production, avoid changing primary key types to prevent migration failures.
