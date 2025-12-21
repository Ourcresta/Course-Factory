# AISiksha Admin Course Factory - Project Plan

## Project Vision

Build a production-ready SaaS platform (admin.aisiksha.in) where administrators can create complete educational courses from simple natural language commands. The AI automatically generates structured syllabi, modules, lessons, projects, tests, and certificates - transforming a single command into a fully production-ready course.

---

## What We Are Doing

### Core Objective
Create an AI-powered course creation platform that eliminates the manual work of building educational content. Administrators describe what they want to teach, and the system generates:

1. **Complete Course Structure** - Name, description, learning outcomes, target audience
2. **Organized Modules** - Logical sections with estimated time
3. **Detailed Lessons** - Objectives, key concepts, and AI-generated notes
4. **Real-World Projects** - Step-by-step practical assignments
5. **Assessment Tests** - MCQ and scenario-based questions
6. **Certificate Configuration** - Completion or achievement-based credentials

### Target Users
- Educational content administrators
- Course creators and instructional designers
- Training department managers
- EdTech platform operators

---

## What We Will Do

### Phase 1: Core Platform (Completed)
- Database schema design (15+ tables)
- Full frontend with modern SaaS admin interface
- Backend API with CRUD operations
- AI integration using OpenAI GPT via Replit
- Course generation from natural language commands

### Phase 2: Enhanced Content Generation (Planned)
- Streaming AI responses for real-time progress
- Batch generation with progress tracking
- Content regeneration and editing
- Module-level and lesson-level AI refinement

### Phase 3: Publishing Pipeline (Planned)
- Multi-platform publishing (learn, test, profile portals)
- Draft vs Published workflow
- Version control for courses
- Rollback capabilities

### Phase 4: Advanced Features (Future)
- Course templates and cloning
- Collaborative editing
- Analytics dashboard
- User authentication and role management
- API for external integrations

---

## How We Will Do Everything

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │Dashboard│  │Courses  │  │ Skills  │  │ Course Builder  │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + Node)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  REST APIs  │  │  AI Service │  │  Storage Interface  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  PostgreSQL  │ │  OpenAI API  │ │ Audit Logs   │
      │   Database   │ │  (via Replit)│ │   System     │
      └──────────────┘ └──────────────┘ └──────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, TypeScript, Tailwind CSS | Modern, responsive UI |
| UI Components | Shadcn/ui, Radix UI | Accessible, consistent design |
| State Management | TanStack React Query | Server state, caching |
| Routing | Wouter | Lightweight client routing |
| Backend | Express.js, TypeScript | REST API server |
| Database | PostgreSQL (Drizzle ORM) | Data persistence |
| AI | OpenAI GPT (Replit Integration) | Content generation |
| Build Tool | Vite | Fast development and bundling |

### Development Methodology

1. **Schema-First Development**
   - Define data models before writing code
   - Use Drizzle ORM for type-safe database operations
   - Generate insert/select types from schema

2. **Component-Based Architecture**
   - Reusable UI components with Shadcn
   - Page-based routing structure
   - Separation of concerns (pages, components, hooks)

3. **API-First Backend**
   - RESTful endpoints under `/api/*`
   - Zod validation for request/response
   - Storage interface pattern for data access

4. **AI Integration Pattern**
   - Async generation with status tracking
   - Structured prompts for consistent output
   - Error handling with retry logic

### Database Design Principles

- **Hierarchical Structure**: Course > Module > Lesson > Content
- **Soft Delete**: All entities support soft delete via `deletedAt`
- **Audit Trail**: All changes logged in `audit_logs` table
- **AI Tracking**: Generation logs for debugging and analytics
- **Flexible Content**: JSONB for arrays (outcomes, concepts, options)

### Frontend Design Principles

- **Modern SaaS Admin Style**: Clean, information-dense layouts
- **Dark/Light Mode**: Full theme support
- **Responsive Design**: Mobile-friendly interfaces
- **Loading States**: Skeleton loaders for async operations
- **Empty States**: Helpful messages when no data exists
- **Error Handling**: User-friendly error messages

---

## Implementation Roadmap

### Sprint 1 (Completed)
- [x] Database schema design
- [x] Push schema to PostgreSQL
- [x] Dashboard with stats
- [x] Course listing page
- [x] Course creation form
- [x] Course detail/editor page
- [x] Skills management
- [x] Settings page
- [x] Backend storage layer
- [x] AI service integration
- [x] API routes with validation

### Sprint 2 (Current)
- [ ] Test complete course generation flow
- [ ] Add streaming for AI progress
- [ ] Implement module/lesson editing
- [ ] Add project step builder
- [ ] Test builder interface
- [ ] Certificate configuration UI

### Sprint 3 (Planned)
- [ ] Publishing workflow
- [ ] Multi-platform sync
- [ ] Draft vs Published states
- [ ] Course versioning
- [ ] Rollback functionality

### Sprint 4 (Future)
- [ ] User authentication
- [ ] Role-based permissions
- [ ] Course templates
- [ ] Analytics dashboard
- [ ] External API

---

## Quality Assurance

### Testing Strategy
- Component testing for UI elements
- API endpoint testing
- Integration testing for AI generation
- End-to-end course creation flow

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Consistent naming conventions
- Documentation in code

### Performance Considerations
- Query optimization with proper indexing
- Lazy loading for large datasets
- Caching with React Query
- Efficient AI token usage

---

## Success Metrics

1. **Course Generation Time**: < 2 minutes for full course
2. **Content Quality**: Human-editable AI output
3. **Platform Stability**: 99.9% uptime
4. **User Experience**: Intuitive workflow, minimal training

---

## Part of Larger Ecosystem

AISiksha Admin Course Factory is one component of the AISiksha platform:

- **admin.aisiksha.in** - Course creation (this platform)
- **learn.aisiksha.in** - Student learning portal
- **test.aisiksha.in** - Assessment platform
- **profile.aisiksha.in** - User profiles and certificates
- **udyog.aisiksha.in** - Job and career services

All platforms share course content through the publishing pipeline.
