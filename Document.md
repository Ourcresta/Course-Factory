# Oushiksha Guru - Admin Course Factory

## Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Navigation & Tabs](#navigation--tabs)
4. [Authentication System](#authentication-system)
5. [Course Factory Engine](#course-factory-engine)
6. [Database Schema](#database-schema)
7. [Admin API Reference](#admin-api-reference)
8. [Public API for Shishya Integration](#public-api-for-shishya-integration)
9. [Shishya Data Requirements](#shishya-data-requirements)
10. [Environment Variables](#environment-variables)
11. [Development Guide](#development-guide)

---

## Overview

Oushiksha Guru (formerly AISiksha) is an AI-powered course creation platform designed for administrators to generate complete educational courses from simple natural language commands. The platform transforms single commands into production-ready courses with full syllabi, modules, lessons, projects, tests, practice labs, and certificates.

### Key Features

- **AI Course Factory**: Generate complete courses from natural language commands using GPT-4o
- **Preview & Publish Modes**: Quick draft generation vs. detailed student-ready content
- **Practice Labs**: Coding exercises with validation and progressive hints
- **Skill Mapping**: Tag courses and projects with skills for learning path tracking
- **Certificate System**: Configurable completion certificates with requirements
- **Credit/Subscription System**: Monetization via credits and subscription plans
- **Shishya Control Panel**: Monitor student portal analytics and engagement
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
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Oushiksha Guru Admin Portal                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐          │
│  │   Frontend   │◄──►│   Express    │◄──►│     PostgreSQL       │          │
│  │   (React)    │    │   Server     │    │     Database         │          │
│  └──────────────┘    └──────────────┘    └──────────────────────┘          │
│         │                   │                                               │
│         │                   ▼                                               │
│         │            ┌──────────────┐    ┌──────────────┐                  │
│         │            │   OpenAI     │    │   Resend     │                  │
│         │            │   GPT-4o     │    │   Email API  │                  │
│         │            └──────────────┘    └──────────────┘                  │
│         │                                                                   │
└─────────│───────────────────────────────────────────────────────────────────┘
          │
          │  Public API (X-API-Key Header)
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OurShiksha Shishya Portal                             │
│                        (Student Application)                                 │
│                                                                              │
│  Features:                                                                   │
│  - Course Catalog & Enrollment                                              │
│  - Lesson Learning with AI Mithra Tutor                                     │
│  - Practice Labs with Code Editor                                           │
│  - Tests & Assessments                                                      │
│  - Project Submissions                                                      │
│  - Certificate Generation                                                   │
│  - Skill Badge Collection                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Navigation & Tabs

The admin portal is organized into 5 main sections with 18 total pages:

### 1. MAIN Section

| Tab | URL | Purpose | Features |
|-----|-----|---------|----------|
| **Dashboard** | `/` | Executive command center | KPI overview, revenue metrics, course stats, recent activity, quick actions |
| **Reports** | `/reports` | Analytics & reporting | Revenue reports, course analytics, user engagement, date range filtering, export options |

### 2. ACADEMICS Section

| Tab | URL | Purpose | Features |
|-----|-----|---------|----------|
| **Courses** | `/courses` | Course management | List all courses, filter by status, search, view/edit course details |
| **AI Course Factory** | `/courses/new` | AI-powered course generation | Natural language commands, preview/publish modes, generation options (labs, tests, projects) |
| **Practice Labs** | `/labs` | Lab management | View all labs across courses, filter by course, edit lab details |
| **Tests** | `/tests` | Assessment management | View all tests, manage questions, set passing criteria |
| **Projects** | `/projects` | Project management | View all projects, skill mapping, submission requirements |
| **Certificates** | `/certificates` | Certificate configuration | Design certificates, set requirements (tests, projects, labs), skill badges |
| **Skills Library** | `/skills` | Global skills management | Create/edit skills, categorization, tag courses and projects |

### 3. BUSINESS Section

| Tab | URL | Purpose | Features |
|-----|-----|---------|----------|
| **Credits & Pricing** | `/credits` | Course monetization | Set credit prices for courses (1 Credit = 1 INR), free course toggle |
| **Plans & Subscriptions** | `/subscriptions` | Subscription management | Create subscription plans, set features, pricing tiers |
| **Payments** | `/payments` | Payment tracking | View payment history, transaction details, refund management |
| **Promotions** | `/promotions` | Discount management | Create promo codes, set discounts, validity periods, usage limits |

### 4. SHISHYA CONTROL Section

| Tab | URL | Purpose | Features |
|-----|-----|---------|----------|
| **Shishya Overview** | `/shishya` | Student portal dashboard | Active users, enrollments, completion rates, revenue from students |
| **Users** | `/shishya/users` | Student management | View all students, activity status, enrollment details, search/filter |
| **Activity** | `/shishya/activity` | Learning activity logs | Lesson completions, lab attempts, test submissions, timestamps |
| **Payments** | `/shishya/payments` | Student payments | Credit purchases, subscription payments, coin transactions |
| **Engagement** | `/shishya/engagement` | Gamification analytics | Streaks, achievements, leaderboard data, badge distribution |

### 5. SYSTEM Section

| Tab | URL | Purpose | Features |
|-----|-----|---------|----------|
| **Security & Admins** | `/security` | Access control | Manage admin users, roles, security settings |
| **Settings** | `/settings` | Configuration | API keys for Shishya, bank accounts, theme, notifications, 2FA |

---

## Course Detail Page Tabs

When viewing a specific course (`/courses/:id`), there are 7 sub-tabs:

| Tab | Purpose | Features |
|-----|---------|----------|
| **Overview** | Course metadata | Title, description, level, audience, duration, learning outcomes, job roles |
| **Modules** | Content structure | List modules, reorder, expand to view lessons, AI generation status |
| **Projects** | Hands-on assignments | Project list, objectives, deliverables, skill mapping |
| **Tests** | Assessments | Test list per module, question management, passing criteria |
| **Labs** | Practice exercises | Code labs, validation config, hints, unlock conditions |
| **Certificate** | Completion certificate | Requirements, skills awarded, template design |
| **Publish** | Publication control | Publish/unpublish, validation status, publication date |

---

## Authentication System

### Sign In Flow (Existing Admins)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Enter   │───►│ Validate │───►│  Issue   │───►│  Access  │
│  Email & │    │ Password │    │   JWT    │    │  Granted │
│ Password │    │ (bcrypt) │    │  Token   │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Sign Up Flow (New Admins)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Enter   │───►│  Create  │───►│Send OTP  │───►│  Verify  │───►│  Access  │
│ Details  │    │  User    │    │to Admin  │    │   OTP    │    │  Granted │
│          │    │(pending) │    │  Email   │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 12 rounds |
| OTP Delivery | Resend API to ourcresta@gmail.com |
| JWT Tokens | 12-hour expiry |
| Rate Limiting | Auth: 10/15min, OTP: 5/5min, API: 100/min |
| Security Headers | Helmet.js (XSS, CSP, Clickjacking) |

### Default Admin Credentials
```
Email: admin@ourshiksha.ai
Password: AdminPassword123!
Seed: npx tsx server/seed-admin.ts
```

---

## Course Factory Engine

The AI-powered Course Factory uses GPT-4o to generate complete courses.

### Generation Modes

| Mode | Purpose | Speed | Content Detail | Status |
|------|---------|-------|----------------|--------|
| Preview | Quick admin review | 10-30 seconds | Concise structure | Draft |
| Publish | Student-ready | 1-3 minutes | Full detailed content | Published |

### Generation Options

- `includeLabs`: Generate practice labs for coding lessons
- `includeProjects`: Generate hands-on projects with skill mapping
- `includeTests`: Generate assessments with MCQ and scenario questions

### AI Methodology
```
PLAN → STRUCTURE → GENERATE → VALIDATE
```

### Practice-First Design

Labs are generated with:
- Starter code templates
- Progressive hints (no direct answers)
- Automatic validation (output/console/api/regex/function)
- Unlock mechanisms (always/module_complete/lesson_complete/test_pass/lab_complete)
- Certificate weight contribution

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Admin accounts with OTP fields |
| `courses` | Course metadata and status |
| `modules` | Course sections |
| `lessons` | Learning content with AI notes |
| `practiceLabs` | Code exercises with validation |
| `projects` | Hands-on assignments |
| `tests` | Module assessments |
| `questions` | Test questions (MCQ/scenario) |
| `certificates` | Course completion requirements |
| `skills` | Global skill library |
| `courseSkills` | Course-skill mappings |
| `projectSkills` | Project-skill mappings |
| `apiKeys` | Public API authentication |

### Business Tables

| Table | Purpose |
|-------|---------|
| `subscriptionPlans` | Subscription tier definitions |
| `subscriptions` | Active user subscriptions |
| `coinWallet` | User coin balances |
| `coinTransactions` | Coin transaction history |
| `promotions` | Discount codes |
| `activityLogs` | Admin action audit trail |
| `bankAccounts` | Payment settlement accounts |

---

## Admin API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/auth/login` | POST | Sign in | No |
| `/api/admin/auth/signup` | POST | Register (sends OTP) | No |
| `/api/admin/auth/verify-signup` | POST | Verify OTP | No |
| `/api/admin/auth/me` | GET | Get current user | JWT |
| `/api/admin/auth/logout` | POST | Logout | JWT |

### Course Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses` | GET | List all courses |
| `/api/courses` | POST | Create course |
| `/api/courses/:id` | GET | Get course details |
| `/api/courses/:id` | PATCH | Update course |
| `/api/courses/:id` | DELETE | Delete course |
| `/api/courses/:id/publish` | POST | Publish course |
| `/api/courses/:id/unpublish` | POST | Unpublish course |
| `/api/courses/generate` | POST | AI generate course |

### Content Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses/:id/modules` | GET/POST | List/Create modules |
| `/api/modules/:id` | PATCH/DELETE | Update/Delete module |
| `/api/modules/:id/lessons` | GET/POST | List/Create lessons |
| `/api/lessons/:id` | PATCH/DELETE | Update/Delete lesson |
| `/api/courses/:id/tests` | GET | List tests |
| `/api/tests/:id` | GET/PATCH | Get/Update test |
| `/api/tests/:id/questions` | POST | Add question |
| `/api/questions/:id` | PATCH/DELETE | Update/Delete question |
| `/api/courses/:id/projects` | GET/POST | List/Create projects |
| `/api/projects/:id` | PATCH/DELETE | Update/Delete project |
| `/api/courses/:id/labs` | GET/POST | List/Create labs |
| `/api/labs/:id` | PATCH/DELETE | Update/Delete lab |
| `/api/courses/:id/certificate` | GET/POST | Get/Set certificate |

### Skills & API Keys

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET/POST | List/Create skills |
| `/api/skills/:id` | PATCH/DELETE | Update/Delete skill |
| `/api/api-keys` | GET/POST | List/Create API keys |
| `/api/api-keys/:id` | PATCH/DELETE | Update/Delete key |

### Business Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscription-plans` | GET/POST | Manage plans |
| `/api/promotions` | GET/POST | Manage promos |
| `/api/bank-accounts` | GET/POST | Manage bank accounts |
| `/api/dashboard/stats` | GET | Dashboard KPIs |
| `/api/reports/:type` | GET | Generate reports |

---

## Public API for Shishya Integration

The Shishya student portal fetches all course data from Guru via these public APIs.

### Authentication

All public API endpoints require the `X-API-Key` header:
```
X-API-Key: ais_<64_hex_characters>
```

API keys are created and managed in Settings > API Keys.

### Error Responses

| Code | Description |
|------|-------------|
| 401 | Missing or invalid API key |
| 403 | API key inactive or expired |
| 404 | Course not found or not published |
| 500 | Server error |

---

### Endpoint 1: List Published Courses

```
GET /api/public/courses
```

**Purpose**: Course catalog for browse/search page

**Response**:
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": 1,
      "name": "Full Stack Web Development",
      "description": "Complete course on modern web development...",
      "level": "intermediate",
      "targetAudience": "Aspiring web developers",
      "duration": "40 hours",
      "learningOutcomes": ["Build REST APIs", "Create React apps"],
      "jobRoles": ["Frontend Developer", "Full Stack Developer"],
      "thumbnailUrl": "https://...",
      "publishedAt": "2024-01-15T10:30:00Z",
      "creditCost": 500,
      "isFree": false,
      "skillTags": ["React", "Node.js", "TypeScript"],
      "moduleCount": 8,
      "lessonCount": 45,
      "labCount": 20,
      "testCount": 8,
      "projectCount": 3,
      "hasCertificate": true
    }
  ]
}
```

**Shishya Usage**:
- Display course cards in catalog
- Search and filter functionality
- Show pricing (credits or free)
- Course stats preview

---

### Endpoint 2: Get Full Course Details

```
GET /api/public/courses/:id
```

**Purpose**: Complete course with modules, lessons, and AI context

**Response**:
```json
{
  "success": true,
  "course": {
    "id": 1,
    "name": "Full Stack Web Development",
    "description": "Complete course...",
    "level": "intermediate",
    "targetAudience": "Aspiring web developers",
    "duration": "40 hours",
    "learningOutcomes": ["Build REST APIs", "Create React apps"],
    "jobRoles": ["Frontend Developer", "Full Stack Developer"],
    "thumbnailUrl": "https://...",
    "publishedAt": "2024-01-15T10:30:00Z",
    "creditCost": 500,
    "isFree": false,
    "modules": [
      {
        "id": 1,
        "title": "Introduction to Web Development",
        "description": "Overview of web technologies",
        "estimatedTime": "2 hours",
        "order": 1,
        "lessons": [
          {
            "id": 1,
            "title": "What is Web Development?",
            "objectives": ["Understand web architecture", "Learn HTTP basics"],
            "keyConceptsList": ["Client-Server", "HTTP/HTTPS", "DNS"],
            "order": 1,
            "aiMithraContext": "Focus on practical examples. Student is learning basics.",
            "mithraContent": "Detailed AI tutor content for Mithra chatbot..."
          }
        ]
      }
    ],
    "skills": [
      {
        "id": 1,
        "name": "React",
        "category": "Frontend"
      }
    ]
  }
}
```

**Shishya Usage**:
- Course detail page with syllabus
- Lesson navigation and content display
- AI Mithra tutor integration (uses `aiMithraContext` and `mithraContent`)
- Progress tracking per lesson/module

---

### Endpoint 3: Get Course Tests

```
GET /api/public/courses/:id/tests
```

**Purpose**: All assessments with questions for a course

**Response**:
```json
{
  "success": true,
  "count": 8,
  "tests": [
    {
      "id": 1,
      "title": "Module 1 Assessment",
      "description": "Test your understanding of web basics",
      "moduleId": 1,
      "moduleName": "Introduction to Web Development",
      "passingPercentage": 70,
      "timeLimitMinutes": 30,
      "order": 1,
      "questions": [
        {
          "id": 1,
          "questionText": "What protocol is used for secure web communication?",
          "questionType": "mcq",
          "difficulty": "easy",
          "options": ["HTTP", "HTTPS", "FTP", "SMTP"],
          "correctAnswer": "HTTPS",
          "explanation": "HTTPS uses TLS/SSL encryption for secure communication.",
          "points": 10,
          "order": 1
        },
        {
          "id": 2,
          "questionText": "You're debugging an e-commerce checkout. Customer reports payment fails after clicking Submit. What should you check first?",
          "questionType": "scenario",
          "difficulty": "hard",
          "options": ["Debug frontend code", "Check server logs", "Review database"],
          "correctAnswer": "Check server logs",
          "explanation": "Server logs provide direct insight into API failures...",
          "points": 20,
          "order": 2
        }
      ]
    }
  ]
}
```

**Shishya Usage**:
- Render test interface with timer
- Auto-grading using `correctAnswer`
- Show explanations after submission
- Calculate scores and passing status
- Track test attempts and best scores

---

### Endpoint 4: Get Course Projects

```
GET /api/public/courses/:id/projects
```

**Purpose**: Hands-on projects with requirements and skill mappings

**Response**:
```json
{
  "success": true,
  "count": 3,
  "projects": [
    {
      "id": 1,
      "title": "Build a Todo App",
      "description": "Create a full-stack todo application with CRUD operations.",
      "objectives": ["Implement CRUD operations", "Use React state management", "Build REST API"],
      "deliverables": ["Working frontend", "REST API", "Documentation", "Demo video"],
      "submissionInstructions": "Submit GitHub repo link with README explaining your approach.",
      "evaluationNotes": "Focus on code quality, UX design, and proper error handling.",
      "estimatedTime": "8 hours",
      "order": 1,
      "skills": [
        { "id": 1, "name": "React", "category": "Frontend" },
        { "id": 2, "name": "Node.js", "category": "Backend" },
        { "id": 3, "name": "REST API", "category": "Backend" }
      ]
    }
  ]
}
```

**Shishya Usage**:
- Display project requirements page
- Show skills students will earn upon completion
- Submission form with instructions
- Track project completion status
- Award skill badges on approval

---

### Endpoint 5: Get Course Labs

```
GET /api/public/courses/:id/labs
```

**Purpose**: Practice coding exercises with validation and hints

**Response**:
```json
{
  "success": true,
  "count": 20,
  "labs": [
    {
      "id": 1,
      "title": "Create Your First React Component",
      "description": "Learn to build functional components with JSX.",
      "lessonId": 5,
      "lessonName": "React Components",
      "starterCode": "function App() {\n  // Your code here\n  return null;\n}",
      "solutionCode": "function App() {\n  return <h1>Hello World</h1>;\n}",
      "validationType": "output",
      "expectedOutput": "<h1>Hello World</h1>",
      "hints": [
        { "level": 1, "text": "Think about what JSX returns from a function" },
        { "level": 2, "text": "Use HTML-like syntax inside the return statement" },
        { "level": 3, "text": "Try using an h1 tag with text inside" }
      ],
      "aiContext": "Student is learning React basics. Help them understand JSX syntax without giving direct answers.",
      "unlockMechanism": "lesson_complete",
      "unlockReferenceId": 5,
      "certificateWeight": 5,
      "order": 1
    }
  ]
}
```

**Shishya Usage**:
- Code editor interface with `starterCode`
- Run and validate against `expectedOutput` using `validationType`
- Progressive hint system (level 1, 2, 3 - never direct answers)
- AI Mithra uses `aiContext` for contextual help
- Unlock logic based on `unlockMechanism`:
  - `always`: Always available
  - `lesson_complete`: After completing specific lesson
  - `module_complete`: After completing entire module
  - `test_pass`: After passing specific test
  - `lab_complete`: After completing previous lab
- Track completions for certificate progress using `certificateWeight`

---

### Endpoint 6: Get Course Certificate

```
GET /api/public/courses/:id/certificate
```

**Purpose**: Certificate requirements and skill awards

**Response**:
```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "courseId": 1,
    "title": "Full Stack Web Development Certificate",
    "description": "Awarded upon successful completion of all course requirements.",
    "templateUrl": "https://...",
    "requirements": {
      "tests": {
        "requiredIds": [1, 2, 3, 4, 5, 6, 7, 8],
        "minimumPassPercent": 100
      },
      "projects": {
        "requiredIds": [1, 2, 3],
        "minimumCompletionPercent": 100
      },
      "labs": {
        "requiredIds": [1, 2, 3, 4, 5, 10, 15, 20],
        "minimumCompletionPercent": 80,
        "minimumTotalWeight": 40
      }
    },
    "skills": [
      { "id": 1, "name": "React", "category": "Frontend" },
      { "id": 2, "name": "Node.js", "category": "Backend" },
      { "id": 3, "name": "TypeScript", "category": "Language" },
      { "id": 4, "name": "REST API", "category": "Backend" }
    ],
    "isActive": true
  }
}
```

**Shishya Usage**:
- Display certificate requirements on course page
- Track student progress toward certificate:
  - Tests passed vs required
  - Projects completed vs required
  - Labs completed vs required (with weight calculation)
- Generate certificate when all requirements met
- Award skill badges to student profile
- Add certificate to student portfolio

---

## Shishya Data Requirements

### What Shishya NEEDS from Guru

| Category | Data | Endpoint | Usage |
|----------|------|----------|-------|
| **Catalog** | All published courses | `/api/public/courses` | Browse, search, filter |
| **Course Content** | Modules, lessons, AI notes | `/api/public/courses/:id` | Learning experience |
| **Assessments** | Tests with questions/answers | `/api/public/courses/:id/tests` | Auto-graded tests |
| **Projects** | Requirements, skills | `/api/public/courses/:id/projects` | Project submissions |
| **Labs** | Code, validation, hints | `/api/public/courses/:id/labs` | Code practice |
| **Certificates** | Requirements, skills | `/api/public/courses/:id/certificate` | Certificate generation |

### What Guru SENDS to Shishya

| Data Type | Fields Included | Purpose |
|-----------|-----------------|---------|
| **Course Metadata** | name, description, level, audience, duration, outcomes, jobRoles, price | Display and enrollment |
| **Module Structure** | title, description, estimatedTime, order | Navigation |
| **Lesson Content** | title, objectives, keyConcepts, aiMithraContext, mithraContent | Learning with AI tutor |
| **Test Questions** | questionText, type, options, correctAnswer, explanation, points | Assessment |
| **Lab Exercises** | starterCode, validationType, expectedOutput, hints, aiContext, unlock rules | Code practice |
| **Project Info** | objectives, deliverables, submissionInstructions, skills | Hands-on work |
| **Certificate Config** | requirements (tests, projects, labs), skills awarded | Achievement |

### Data NOT Sent to Shishya (Admin-Only)

- Solution code for labs (only for internal validation reference)
- Admin users and credentials
- API key values
- Audit logs
- Bank account details
- Draft courses (only published)
- Internal pricing configurations
- Promotion codes (applied via separate mechanism)

---

## Caching Strategy for Shishya

| Endpoint | Cache Duration | Invalidation |
|----------|---------------|--------------|
| `/api/public/courses` | 5 minutes | On course publish/unpublish |
| `/api/public/courses/:id` | 15 minutes | On course update |
| `/api/public/courses/:id/tests` | 1 hour | On test/question update |
| `/api/public/courses/:id/projects` | 1 hour | On project update |
| `/api/public/courses/:id/labs` | 1 hour | On lab update |
| `/api/public/courses/:id/certificate` | 1 hour | On certificate update |

---

## Environment Variables

### Required Secrets

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection | Replit Database |
| `OPENAI_API_KEY` | OpenAI API key | OpenAI Dashboard |
| `SESSION_SECRET` | JWT signing secret | Generate random |
| `RESEND_API_KEY` | Resend email API | Resend Dashboard |
| `RESEND_FROM_EMAIL` | Sender email | Verified domain |

### Email Configuration

- **Admin OTP emails sent to**: ourcresta@gmail.com
- **Sender address**: admin@admin.aisiksha.in

---

## Development Guide

### Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # Shadcn components
│   │   │   ├── app-sidebar.tsx
│   │   │   └── dashboard-panels.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── course-detail.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── subscriptions.tsx
│   │   │   ├── promotions.tsx
│   │   │   ├── shishya-overview.tsx
│   │   │   ├── shishya-users.tsx
│   │   │   ├── shishya-activity.tsx
│   │   │   ├── shishya-payments.tsx
│   │   │   ├── shishya-engagement.tsx
│   │   │   └── settings.tsx
│   │   ├── lib/            # Utilities & context
│   │   └── hooks/          # Custom hooks
│   └── index.html
├── server/
│   ├── routes.ts           # API routes
│   ├── auth-routes.ts      # Authentication
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

# Seed Admin
npx tsx server/seed-admin.ts

# Build
npm run build               # Production build
```

### Adding New Features

1. **Schema First**: Define models in `shared/schema.ts`
2. **Storage Layer**: Add CRUD in `server/storage.ts`
3. **API Routes**: Add endpoints in `server/routes.ts`
4. **Frontend**: Create pages in `client/src/pages/`
5. **Sidebar**: Add navigation in `app-sidebar.tsx`

---

## Integration Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         GURU ADMIN                               │
│  Creates courses → Generates AI content → Publishes             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Public API (X-API-Key)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SHISHYA STUDENT                            │
│  Fetches catalog → Enrolls → Learns → Practices → Earns Cert   │
└─────────────────────────────────────────────────────────────────┘
```

---

*Oushiksha Guru Admin v2.0*
*Powered by OurShiksha Technologies*
