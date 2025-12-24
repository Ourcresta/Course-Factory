# AISiksha Admin Course Factory - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Authentication System](#authentication-system)
4. [Course Factory Engine](#course-factory-engine)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Public API for Shishya Integration](#public-api-for-shishya-integration)
8. [Environment Variables](#environment-variables)
9. [Development Guide](#development-guide)

---

## Overview

AISiksha Admin Course Factory is an AI-powered course creation platform designed for administrators to generate complete educational courses from simple natural language commands. The platform transforms single commands into production-ready courses with full syllabi, modules, lessons, projects, tests, practice labs, and certificates.

### Key Features
- **AI-Powered Course Generation**: Generate complete courses from natural language commands
- **Preview & Publish Modes**: Quick draft generation vs. complete detailed content
- **Practice Labs**: Coding exercises with validation and progressive hints
- **Skill Mapping**: Tag courses and projects with skills for learning path tracking
- **Certificate System**: Configurable completion certificates with requirements
- **Credit Pricing**: Monetization system (1 Credit = 1 Indian Rupee)
- **Public API**: REST API for Shishya student portal integration

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI Components | Shadcn/ui, Radix UI, Tailwind CSS |
| State Management | TanStack React Query |
| Routing | Wouter |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Drizzle ORM |
| AI | OpenAI GPT-4o |
| Email | Resend API |
| Authentication | JWT with bcrypt |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AISiksha Admin Portal                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   Frontend   │◄──►│   Express    │◄──►│     PostgreSQL       │   │
│  │   (React)    │    │   Server     │    │     Database         │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│         │                   │                                        │
│         │                   ▼                                        │
│         │            ┌──────────────┐                               │
│         │            │   OpenAI     │                               │
│         │            │   GPT-4o     │                               │
│         │            └──────────────┘                               │
│         │                   │                                        │
│         │                   ▼                                        │
│         │            ┌──────────────┐                               │
│         │            │   Resend     │                               │
│         │            │   Email API  │                               │
│         │            └──────────────┘                               │
│         │                                                            │
└─────────│────────────────────────────────────────────────────────────┘
          │
          │  Public API (X-API-Key)
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OurShiksha Shishya Portal                        │
│                     (Student Application)                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture
- **Pages**: Dashboard, Courses, Course Detail, Module Editor, Project Editor, Test Editor, Lab Editor, Certificate Designer, Skills Library, Settings
- **Components**: Shadcn/ui component library with custom extensions
- **Forms**: React Hook Form with Zod validation
- **Theming**: Light/Dark mode with CSS variables

### Backend Architecture
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **ORM**: Drizzle ORM with type-safe operations
- **Validation**: Zod schemas with drizzle-zod integration
- **Security**: Helmet, CORS, Rate Limiting, JWT Authentication

---

## Authentication System

The platform uses a dual authentication flow for security:

### Sign In Flow (Existing Admins)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Enter   │───►│ Validate │───►│  Issue   │───►│  Access  │
│  Email & │    │ Password │    │   JWT    │    │  Granted │
│ Password │    │ (bcrypt) │    │  Token   │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. Admin enters email and password
2. Server validates credentials against bcrypt-hashed password (12 rounds)
3. JWT token issued immediately with 12-hour expiry
4. No OTP required for existing admins

### Sign Up Flow (New Admins)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Enter   │───►│  Create  │───►│Send OTP  │───►│  Verify  │───►│  Access  │
│ Details  │    │  User    │    │to Admin  │    │   OTP    │    │  Granted │
│          │    │(pending) │    │  Email   │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. New user enters username, email, and password
2. Server creates user with `pending_admin` role
3. 6-digit OTP sent to admin approval email (ourcresta@gmail.com)
4. OTP stored in database with 5-minute expiry and max 3 attempts
5. New user enters OTP (obtained from admin)
6. User role updated to `admin` and JWT token issued

### Security Features
| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 12 rounds |
| OTP Delivery | Resend API |
| JWT Tokens | 12-hour expiry |
| Rate Limiting | Auth: 10/15min, OTP: 5/5min, API: 100/min |
| Security Headers | Helmet.js (XSS, CSP, Clickjacking) |
| CORS | Configured for allowed domains |

### Default Admin Credentials
```
Email: admin@ourshiksha.ai
Password: AdminPassword123!
```
Seed command: `npx tsx server/seed-admin.ts`

---

## Course Factory Engine

The AI-powered Course Factory uses GPT-4o to generate complete courses from natural language commands.

### System Prompt Roles
The AI acts as:
- Senior Instructional Designer
- Subject Matter Expert
- Learning Experience Architect
- Skill Assessment Designer
- Product Engineer

### Generation Modes

| Mode | Purpose | Speed | Content Detail | Status |
|------|---------|-------|----------------|--------|
| Preview | Quick admin review | 10-30 seconds | Concise structure | Draft |
| Publish | Student-ready | 1-3 minutes | Full detailed content | Published |

### Generation Options
- `includeLabs`: Generate practice labs for coding lessons
- `includeProjects`: Generate hands-on projects
- `includeTests`: Generate assessments with questions

### AI Methodology
```
PLAN → STRUCTURE → GENERATE → VALIDATE
```

### Self-Validation Checks
- Progression logic verification
- Lab coverage for coding lessons
- Content weight distribution
- Job relevance alignment

### Practice-First Design
Labs are generated with:
- Starter code templates
- Progressive hints (no direct answers)
- Automatic validation (output/console/api/regex/function)
- Unlock mechanisms (always/module_complete/lesson_complete/test_pass/lab_complete)

---

## Database Schema

### Core Entities

#### Users
```typescript
{
  id: string,
  username: string,
  email: string,
  password: string (hashed),
  role: 'admin' | 'pending_admin',
  otp: string | null,
  otpExpiry: Date | null,
  otpAttempts: number
}
```

#### Courses
```typescript
{
  id: number,
  title: string,
  description: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  audience: string,
  duration: string,
  learningOutcomes: string[],
  prerequisites: string[],
  status: 'draft' | 'published',
  creditPrice: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Modules
```typescript
{
  id: number,
  courseId: number,
  title: string,
  description: string,
  orderIndex: number,
  estimatedTime: string
}
```

#### Lessons
```typescript
{
  id: number,
  moduleId: number,
  title: string,
  content: string,
  objectives: string[],
  keyConcepts: string[],
  orderIndex: number,
  aiNotes: string | null
}
```

#### Practice Labs
```typescript
{
  id: number,
  courseId: number,
  title: string,
  description: string,
  starterCode: string,
  solution: string,
  validationType: 'output' | 'console' | 'api' | 'regex' | 'function',
  expectedOutput: string,
  hints: string[],
  aiContext: string,
  unlockMechanism: string,
  certificateWeight: number
}
```

#### Projects
```typescript
{
  id: number,
  courseId: number,
  title: string,
  description: string,
  objectives: string[],
  deliverables: string[],
  submissionInstructions: string,
  evaluationNotes: string
}
```

#### Tests
```typescript
{
  id: number,
  moduleId: number,
  title: string,
  description: string,
  passingScore: number,
  timeLimit: number | null
}
```

#### Questions
```typescript
{
  id: number,
  testId: number,
  type: 'mcq' | 'scenario',
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string,
  difficulty: 'easy' | 'medium' | 'hard'
}
```

#### Certificates
```typescript
{
  id: number,
  courseId: number,
  title: string,
  description: string,
  skillTags: string[],
  testRequirements: object,
  projectRequirements: object,
  labRequirements: object
}
```

#### Skills
```typescript
{
  id: number,
  name: string,
  category: string,
  description: string
}
```

#### API Keys
```typescript
{
  id: number,
  name: string,
  keyHash: string,
  keyPreview: string,
  isActive: boolean,
  expiresAt: Date | null,
  createdAt: Date
}
```

---

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/admin/auth/login` | POST | Sign in with email/password | No |
| `/api/admin/auth/signup` | POST | Register new admin (sends OTP) | No |
| `/api/admin/auth/verify-signup` | POST | Verify OTP and complete signup | No |
| `/api/admin/auth/me` | GET | Get current user info | Yes (JWT) |
| `/api/admin/auth/logout` | POST | Logout (client clears token) | Yes (JWT) |

### Course Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses` | GET | List all courses |
| `/api/courses` | POST | Create new course |
| `/api/courses/:id` | GET | Get course details |
| `/api/courses/:id` | PATCH | Update course |
| `/api/courses/:id` | DELETE | Delete course |
| `/api/courses/:id/publish` | POST | Publish course |
| `/api/courses/:id/unpublish` | POST | Unpublish course |

### AI Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/generate` | POST | Generate course from command |
| `/api/courses/:id/regenerate` | POST | Regenerate course content |

### Modules & Lessons

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/modules` | GET | List modules |
| `/api/courses/:id/modules` | POST | Create module |
| `/api/modules/:id` | PATCH | Update module |
| `/api/modules/:id` | DELETE | Delete module |
| `/api/modules/:id/lessons` | GET | List lessons |
| `/api/modules/:id/lessons` | POST | Create lesson |
| `/api/lessons/:id` | PATCH | Update lesson |
| `/api/lessons/:id` | DELETE | Delete lesson |

### Tests & Questions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/tests` | GET | List tests |
| `/api/tests/:id` | GET | Get test with questions |
| `/api/tests/:id` | PATCH | Update test |
| `/api/tests/:id/questions` | POST | Add question |
| `/api/questions/:id` | PATCH | Update question |
| `/api/questions/:id` | DELETE | Delete question |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/projects` | GET | List projects |
| `/api/courses/:id/projects` | POST | Create project |
| `/api/projects/:id` | PATCH | Update project |
| `/api/projects/:id` | DELETE | Delete project |

### Practice Labs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/labs` | GET | List labs |
| `/api/courses/:id/labs` | POST | Create lab |
| `/api/labs/:id` | PATCH | Update lab |
| `/api/labs/:id` | DELETE | Delete lab |

### Certificates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/certificate` | GET | Get certificate config |
| `/api/courses/:id/certificate` | POST | Create/update certificate |

### Skills

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET | List all skills |
| `/api/skills` | POST | Create skill |
| `/api/skills/:id` | PATCH | Update skill |
| `/api/skills/:id` | DELETE | Delete skill |

### API Keys

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/api-keys` | GET | List API keys |
| `/api/api-keys` | POST | Create API key |
| `/api/api-keys/:id` | PATCH | Update API key |
| `/api/api-keys/:id` | DELETE | Delete API key |

---

## Public API for Shishya Integration

The platform exposes a secure REST API for the OurShiksha Shishya student portal to fetch published course data.

### Authentication
All public API endpoints require an `X-API-Key` header:
```
X-API-Key: ais_<64_hex_characters>
```

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/public/courses` | List all published courses (metadata only) |
| `GET /api/public/courses/:id` | Full course with modules, lessons, AI notes |
| `GET /api/public/courses/:id/tests` | Tests with questions |
| `GET /api/public/courses/:id/projects` | Projects with skills and steps |
| `GET /api/public/courses/:id/labs` | Practice labs with hints and validation |
| `GET /api/public/courses/:id/certificate` | Certificate requirements and config |

### Response Format
```json
{
  "success": true,
  "count": 5,
  "courses": [...]
}
```

### Error Responses
| Code | Description |
|------|-------------|
| 401 | Missing or invalid API key |
| 403 | API key inactive or expired |
| 404 | Course not found or not published |
| 500 | Server error |

### Integration Flow
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Shishya   │────────►│  AISiksha   │────────►│  Response   │
│   Portal    │ API Key │   Server    │  JSON   │   Data      │
│   (Client)  │◄────────│             │◄────────│             │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## Environment Variables

### Required Secrets
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Replit Database |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | OpenAI Dashboard |
| `SESSION_SECRET` | JWT signing secret | Generate random string |
| `RESEND_API_KEY` | Resend email API key | Resend Dashboard |
| `RESEND_FROM_EMAIL` | Sender email address | Your verified domain |

### Email Configuration
OTP emails for new admin signups are sent to: `ourcresta@gmail.com`

---

## Development Guide

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities & context
│   │   └── hooks/          # Custom hooks
│   └── index.html
├── server/
│   ├── routes.ts           # API routes
│   ├── auth-routes.ts      # Authentication routes
│   ├── auth-middleware.ts  # JWT middleware
│   ├── email-service.ts    # Resend integration
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry
├── shared/
│   └── schema.ts           # Drizzle schema & types
└── migrations/             # Database migrations
```

### Commands
```bash
# Development
npm run dev                 # Start dev server

# Database
npm run db:push             # Push schema changes
npm run db:push --force     # Force push (use carefully)

# Seed Admin
npx tsx server/seed-admin.ts

# Build
npm run build               # Production build
```

### Adding New Features

1. **Schema First**: Define models in `shared/schema.ts`
2. **Storage Layer**: Add CRUD operations in `server/storage.ts`
3. **API Routes**: Add endpoints in `server/routes.ts`
4. **Frontend**: Create pages in `client/src/pages/`
5. **Validation**: Use Zod schemas for type safety

### Publish Workflow
1. Courses start as `draft` status
2. Admin reviews and edits content
3. Publishing validates minimum content requirements
4. Published courses become read-only
5. To edit, admin must unpublish first

---

## Support & Contact

- **Admin Approval Email**: ourcresta@gmail.com
- **Sender Email**: admin@admin.aisiksha.in

---

*AISiksha Admin Course Factory v1.0*
*Powered by OurShiksha Technologies*
