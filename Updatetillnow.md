# AISiksha Admin Course Factory - Updates Till Now

## Overview

This document tracks all the code, features, and configurations that have been generated for the AISiksha Admin Course Factory platform.

---

## Database Schema (shared/schema.ts)

### Tables Created (15 Tables)

#### 1. Users
```typescript
- id: varchar (UUID, primary key)
- username: text (unique)
- password: text
- role: text (default: "admin")
- createdAt: timestamp
```

#### 2. Skills
```typescript
- id: serial (primary key)
- name: text (unique)
- category: text
- createdAt: timestamp
```

#### 3. Courses
```typescript
- id: serial (primary key)
- name: text
- description: text
- level: text (beginner/intermediate/advanced)
- targetAudience: text
- duration: text
- overview: text
- learningOutcomes: jsonb (string array)
- jobRoles: jsonb (string array)
- includeProjects: boolean
- includeTests: boolean
- certificateType: text
- status: text (draft/generating/published)
- aiCommand: text
- thumbnailUrl: text
- createdAt, updatedAt, publishedAt, deletedAt: timestamps
```

#### 4. Course Skills (Junction Table)
```typescript
- id: serial (primary key)
- courseId: integer (foreign key)
- skillId: integer (foreign key)
```

#### 5. Modules
```typescript
- id: serial (primary key)
- courseId: integer (foreign key)
- title: text
- description: text
- orderIndex: integer
- estimatedTime: text
- createdAt, updatedAt: timestamps
```

#### 6. Lessons
```typescript
- id: serial (primary key)
- moduleId: integer (foreign key)
- title: text
- objectives: jsonb (string array)
- estimatedTime: text
- keyConcepts: jsonb (string array)
- videoUrl: text
- externalLinks: jsonb (string array)
- orderIndex: integer
- createdAt, updatedAt: timestamps
```

#### 7. AI Notes
```typescript
- id: serial (primary key)
- lessonId: integer (foreign key)
- content: text
- simplifiedExplanation: text
- bulletNotes: jsonb (string array)
- keyTakeaways: jsonb (string array)
- interviewQuestions: jsonb (string array)
- version: integer
- createdAt, updatedAt: timestamps
```

#### 8. Projects
```typescript
- id: serial (primary key)
- moduleId: integer (foreign key)
- title: text
- problemStatement: text
- techStack: jsonb (string array)
- folderStructure: text
- evaluationChecklist: jsonb (string array)
- difficulty: text
- orderIndex: integer
- createdAt, updatedAt: timestamps
```

#### 9. Project Steps
```typescript
- id: serial (primary key)
- projectId: integer (foreign key)
- stepNumber: integer
- title: text
- description: text
- codeSnippet: text
- tips: jsonb (string array)
- createdAt: timestamp
```

#### 10. Tests
```typescript
- id: serial (primary key)
- moduleId: integer (foreign key)
- title: text
- description: text
- passingPercentage: integer (default: 70)
- isLocked: boolean
- timeLimit: integer
- createdAt, updatedAt: timestamps
```

#### 11. Questions
```typescript
- id: serial (primary key)
- testId: integer (foreign key)
- type: text (mcq/scenario)
- difficulty: text
- questionText: text
- options: jsonb (string array)
- correctAnswer: text
- explanation: text
- orderIndex: integer
- createdAt: timestamp
```

#### 12. Certificates
```typescript
- id: serial (primary key)
- courseId: integer (foreign key)
- name: text
- skillTags: jsonb (string array)
- level: text
- requiresTestPass: boolean
- requiresProjectCompletion: boolean
- qrVerification: boolean
- createdAt, updatedAt: timestamps
```

#### 13. Audit Logs
```typescript
- id: serial (primary key)
- userId: varchar (foreign key)
- action: text
- entityType: text
- entityId: integer
- oldValue: jsonb
- newValue: jsonb
- metadata: jsonb
- createdAt: timestamp
```

#### 14. AI Generation Logs
```typescript
- id: serial (primary key)
- courseId: integer (foreign key)
- generationType: text
- prompt: text
- response: text
- tokensUsed: integer
- status: text (pending/completed/failed)
- errorMessage: text
- createdAt, completedAt: timestamps
```

#### 15. Publish Status
```typescript
- id: serial (primary key)
- courseId: integer (foreign key)
- platform: text
- status: text (pending/synced/failed)
- syncedAt: timestamp
- errorMessage: text
- createdAt: timestamp
```

### Relations Defined
- Courses -> Modules (one-to-many)
- Courses -> Course Skills (one-to-many)
- Courses -> Certificates (one-to-many)
- Modules -> Lessons (one-to-many)
- Modules -> Projects (one-to-many)
- Modules -> Tests (one-to-many)
- Lessons -> AI Notes (one-to-many)
- Projects -> Project Steps (one-to-many)
- Tests -> Questions (one-to-many)

---

## Frontend Components

### Pages (client/src/pages/)

#### 1. Dashboard (dashboard.tsx)
- Stats cards showing total/published/draft/generating courses
- Recent courses grid
- Quick action buttons
- Loading skeleton states

#### 2. Courses (courses.tsx)
- Course listing with search
- Filter by status (all/draft/published/generating)
- Course cards with status badges
- Empty state when no courses

#### 3. Create Course (create-course.tsx)
- AI command input form
- Level selector (beginner/intermediate/advanced)
- Toggle for projects and tests
- Certificate type selector
- Submit with loading state

#### 4. Course Detail (course-detail.tsx)
- Full course information display
- Collapsible module sections
- Lesson list with key concepts
- Project and test sections
- Publish button with confirmation dialog

#### 5. Skills (skills.tsx)
- Skills listing with categories
- Add new skill form
- Delete skill functionality
- Search and filter

#### 6. Settings (settings.tsx)
- Application settings placeholder
- Theme configuration
- Future: API keys, integrations

#### 7. Not Found (not-found.tsx)
- 404 error page
- Navigation back to dashboard

### Reusable Components (client/src/components/)

#### 1. App Sidebar (app-sidebar.tsx)
- Navigation menu with icons
- Dashboard, Courses, Create, Skills, Settings links
- Collapsible sidebar support
- Active state highlighting

#### 2. Course Card (course-card.tsx)
- Course thumbnail/placeholder
- Title and description
- Level and duration badges
- Status indicator
- Click to view details

#### 3. Stats Card (stats-card.tsx)
- Icon with label
- Large number display
- Trend indicator (optional)
- Multiple color variants

#### 4. Status Badge (status-badge.tsx)
- Draft, Published, Generating states
- Color-coded indicators
- Consistent styling

#### 5. Empty State (empty-state.tsx)
- Icon display
- Title and description
- Optional action button
- Used across all listing pages

#### 6. Loading Skeleton (loading-skeleton.tsx)
- Shimmer animation
- Card skeleton
- List skeleton
- Stats skeleton

#### 7. Page Header (page-header.tsx)
- Title and description
- Action buttons slot
- Consistent page layout

#### 8. Theme Toggle (theme-toggle.tsx)
- Light/Dark mode switch
- Icon transition
- Persists preference

### UI Components (client/src/components/ui/)
All Shadcn/ui components included:
- Accordion, Alert, Alert Dialog
- Avatar, Badge, Breadcrumb, Button
- Calendar, Card, Carousel, Chart
- Checkbox, Collapsible, Command
- Context Menu, Dialog, Drawer
- Dropdown Menu, Form, Hover Card
- Input, Input OTP, Label
- Menubar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Sidebar
- Skeleton, Slider, Switch
- Table, Tabs, Textarea
- Toast, Toaster, Toggle, Tooltip

### Hooks (client/src/hooks/)

#### 1. use-toast.ts
- Toast notification system
- Multiple toast types
- Auto-dismiss timing

#### 2. use-mobile.tsx
- Mobile detection hook
- Responsive breakpoints

### Lib (client/src/lib/)

#### 1. queryClient.ts
- TanStack Query configuration
- API request helper
- Error handling
- Query key URL builder

#### 2. theme-provider.tsx
- Theme context provider
- Dark/light mode toggle
- LocalStorage persistence

#### 3. utils.ts
- Class name utilities
- Tailwind merge helper

---

## Backend Implementation

### Server Files (server/)

#### 1. index.ts
- Express server initialization
- Middleware configuration
- Route registration

#### 2. routes.ts
- All REST API endpoints
- Request validation with Zod
- Error handling with detailed messages
- Audit logging integration

#### 3. storage.ts (DatabaseStorage)
- Full CRUD for all entities
- Dashboard statistics
- Course with relations fetch
- Soft delete support
- Audit log creation

#### 4. ai-service.ts
- OpenAI GPT integration
- Course generation from command
- Module generation
- Lesson and notes generation
- Project generation
- Test and question generation

#### 5. db.ts
- Drizzle ORM configuration
- PostgreSQL connection
- Schema loading

### API Endpoints Created

#### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

#### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course with relations
- `POST /api/courses` - Create new course
- `PATCH /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Soft delete course
- `POST /api/courses/generate` - AI generate course
- `POST /api/courses/:id/publish` - Publish course

#### Modules
- `GET /api/courses/:courseId/modules` - List modules
- `POST /api/modules` - Create module
- `PATCH /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Delete module

#### Lessons
- `GET /api/modules/:moduleId/lessons` - List lessons
- `POST /api/lessons` - Create lesson
- `PATCH /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

#### Skills
- `GET /api/skills` - List all skills
- `POST /api/skills` - Create skill
- `DELETE /api/skills/:id` - Delete skill

#### AI Operations
- `POST /api/courses/:id/generate-modules` - Generate modules
- `POST /api/modules/:id/generate-project` - Generate project
- `POST /api/modules/:id/generate-test` - Generate test
- `POST /api/lessons/:id/generate-notes` - Generate AI notes

### Replit Integrations (server/replit_integrations/)

#### Batch Processing (batch/)
- Rate limiting utilities
- Retry logic with p-retry
- Concurrent request management

#### Chat (chat/)
- Conversation management
- Message storage
- Chat routes

#### Image (image/)
- Image generation client
- Image routes

---

## Configuration Files

### 1. package.json
- All npm dependencies
- Build scripts
- Dev server configuration

### 2. tsconfig.json
- TypeScript configuration
- Path aliases

### 3. vite.config.ts
- Vite build configuration
- React plugin
- Path aliases (@, @shared, @assets)

### 4. tailwind.config.ts
- Tailwind CSS configuration
- Custom colors and themes
- Dark mode support

### 5. drizzle.config.ts
- Drizzle ORM configuration
- Database connection

### 6. index.css
- Global styles
- CSS variables for theming
- Tailwind utilities

---

## Key Features Implemented

### 1. AI Course Generation
- Single command input
- Generates full course structure
- Creates modules, lessons, projects, tests
- Async processing with status tracking

### 2. Course Management
- CRUD operations for all entities
- Draft vs Published workflow
- Soft delete with restore capability

### 3. Modern UI/UX
- Clean, information-dense layout
- Dark/light theme support
- Responsive design
- Loading and empty states

### 4. Audit Trail
- All changes logged
- User action tracking
- Entity change history

### 5. Validation
- Zod schema validation
- Detailed error messages
- Type-safe operations

---

## Bug Fixes Applied

### 1. Query Client URL Building
- Fixed array-based query keys
- Proper URL construction from segments
- Filters out object parameters

### 2. Validation Error Handling
- Added Zod error formatting
- Returns detailed validation messages
- Uses zod-validation-error package

---

## Files Generated Count

| Category | Count |
|----------|-------|
| Database Tables | 15 |
| Frontend Pages | 7 |
| Custom Components | 8 |
| UI Components (Shadcn) | 50+ |
| Backend Routes | 20+ |
| API Endpoints | 20+ |
| Hooks | 2 |
| Lib Files | 3 |
| Server Files | 6 |
| Config Files | 5 |

---

## What's Working

1. Database schema pushed to PostgreSQL
2. Dashboard displaying stats
3. Course listing with search/filter
4. Course creation form
5. Course detail view with modules
6. Skills management
7. Settings page
8. Dark/Light theme toggle
9. API endpoints responding
10. Validation with error messages

---

## What's Next

1. Test full AI course generation flow
2. Add streaming for generation progress
3. Module and lesson editing UI
4. Project step builder
5. Test question builder
6. Certificate configuration
7. Publishing workflow
8. Multi-platform sync
