# OurShiksha Database Architecture

## Complete Database Documentation for Guru (Admin) and Shishya (Student) Portals

**Database Name**: `ourshiksha_db`  
**Database Type**: PostgreSQL  
**Architecture**: Single Shared Database with Draft/Live Table Separation

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [High-Level System Overview](#2-high-level-system-overview)
3. [Admin Portal (Guru) - Course Factory](#3-admin-portal-guru---course-factory)
4. [Draft Tables (Admin Only)](#4-draft-tables-admin-only)
5. [Publish Process](#5-publish-process)
6. [Live Content Tables (Student Visible)](#6-live-content-tables-student-visible)
7. [Student Portal (Shishya) - Learning Flow](#7-student-portal-shishya---learning-flow)
8. [Student Activity Tables](#8-student-activity-tables)
9. [Certificates & Marksheets](#9-certificates--marksheets)
10. [Security & Permissions](#10-security--permissions)
11. [Data Flow Diagram](#11-data-flow-diagram)

---

## 1. Core Philosophy

### Why One Database?

| Approach | Problems | Our Solution |
|----------|----------|--------------|
| Two Databases | Data sync issues, duplication, complexity | ONE database, shared safely |
| Copy on every edit | Performance issues, version conflicts | Copy ONLY on Publish |
| No separation | Students see incomplete content | Draft vs Live tables |

### Key Principles

- **ONE database** for entire platform
- **Admin and Student portals** share the same database
- **Data visibility** controlled by:
  - Draft tables (admin only)
  - Live tables (student readable)
  - Status fields (draft/published)
  - Role-based access control (RBAC)
- **No duplicate databases**
- **No real-time sync needed**

---

## 2. High-Level System Overview

### How Draft → Publish → Visible to Students Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SINGLE DATABASE                              │
│                         ourshiksha_db                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────┐         ┌──────────────────────┐         │
│   │    DRAFT TABLES      │         │    LIVE TABLES       │         │
│   │    (Admin Only)      │         │    (Students Read)   │         │
│   │                      │         │                      │         │
│   │  draft_courses       │ ──────► │  courses             │         │
│   │  draft_modules       │ PUBLISH │  modules             │         │
│   │  draft_lessons       │ ACTION  │  lessons             │         │
│   │  draft_tests         │         │  tests               │         │
│   │  draft_projects      │         │  projects            │         │
│   │  draft_labs          │         │  practice_labs       │         │
│   │  draft_certificates  │         │  certificates        │         │
│   │                      │         │                      │         │
│   └──────────────────────┘         └──────────────────────┘         │
│                                                                      │
│                          ┌──────────────────────┐                   │
│                          │  STUDENT ACTIVITY    │                   │
│                          │  (Students Write)    │                   │
│                          │                      │                   │
│                          │  shishya_users       │                   │
│                          │  course_enrollments  │                   │
│                          │  lesson_progress     │                   │
│                          │  test_attempts       │                   │
│                          │  project_submissions │                   │
│                          │  issued_certificates │                   │
│                          └──────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Approach is Enterprise-Ready

1. **Single Source of Truth** - No data conflicts
2. **Atomic Publishing** - Either everything publishes or nothing
3. **Version Control** - Draft remains for future edits
4. **Security** - Students physically cannot access draft tables
5. **Scalability** - Same architecture works for 100 or 100,000 courses

---

## 3. Admin Portal (Guru) - Course Factory

### Admin Workflow

```
Step 1: Create Course
│
▼
Step 2: Add Modules & Lessons
│
▼
Step 3: AI Auto-generates Content (optional)
│
▼
Step 4: Add Tests, Labs, Projects
│
▼
Step 5: Review & Edit
│
▼
Step 6: Configure Certificate Rules
│
▼
Step 7: Click "PUBLISH"
│
▼
Step 8: Course Visible to Students
```

### What Admin Can Do

| Action | Table Type | Description |
|--------|------------|-------------|
| Create course | Draft | Creates in draft_courses |
| Edit modules | Draft | Updates draft_modules |
| Add lessons | Draft | Inserts into draft_lessons |
| Generate with AI | Draft | AI writes to draft tables |
| Review content | Draft | Admin reads draft tables |
| Publish course | Both | Copies draft → live |
| View analytics | Activity | Reads student progress |
| Issue certificates | Activity | Reads completion data |

---

## 4. Draft Tables (Admin Only)

### Important: Students Can NEVER Access These Tables

These tables are the "workspace" where admins create and edit content before publishing.

---

### `draft_courses`

**Purpose**: Master record for courses being created/edited

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft course ID |
| `live_course_id` | integer | Link to published course (null if never published) |
| `name` | text | Course title |
| `description` | text | Course description |
| `level` | text | beginner / intermediate / advanced |
| `target_audience` | text | Who should take this |
| `duration` | text | Estimated duration |
| `overview` | text | Detailed overview |
| `learning_outcomes` | jsonb | Array of outcomes |
| `job_roles` | jsonb | Target job roles |
| `include_projects` | boolean | Has projects |
| `include_tests` | boolean | Has tests |
| `include_labs` | boolean | Has labs |
| `certificate_type` | text | completion / assessment |
| `thumbnail_url` | text | Course image |
| `credit_cost` | integer | Price in credits |
| `ai_command` | text | Original AI prompt |
| `status` | text | editing / ready_to_publish / published |
| `version` | integer | Current version number |
| `created_by` | varchar (FK) | Admin who created |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit date |

---

### `draft_modules`

**Purpose**: Course sections/chapters in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft module ID |
| `draft_course_id` | integer (FK) | References draft_courses.id |
| `live_module_id` | integer | Link to published module |
| `title` | text | Module title |
| `description` | text | Module description |
| `order_index` | integer | Sort order |
| `estimated_time` | text | Duration |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_lessons`

**Purpose**: Individual lessons in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft lesson ID |
| `draft_module_id` | integer (FK) | References draft_modules.id |
| `live_lesson_id` | integer | Link to published lesson |
| `title` | text | Lesson title |
| `objectives` | jsonb | Learning objectives |
| `estimated_time` | text | Duration |
| `key_concepts` | jsonb | Key concepts |
| `video_url` | text | Video link |
| `youtube_references` | jsonb | YouTube videos array |
| `external_links` | jsonb | External resources |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_ai_notes`

**Purpose**: AI-generated lesson content in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft note ID |
| `draft_lesson_id` | integer (FK) | References draft_lessons.id |
| `live_note_id` | integer | Link to published note |
| `content` | text | Full lesson content (HTML/Markdown) |
| `simplified_explanation` | text | ELI5 version |
| `bullet_notes` | jsonb | Key points array |
| `key_takeaways` | jsonb | Summary array |
| `interview_questions` | jsonb | Practice Q&A |
| `version` | integer | Content version |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_tests`

**Purpose**: Quiz/exam definitions in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft test ID |
| `draft_course_id` | integer (FK) | References draft_courses.id |
| `draft_module_id` | integer (FK) | References draft_modules.id (optional) |
| `live_test_id` | integer | Link to published test |
| `title` | text | Test title |
| `description` | text | Test description |
| `passing_percentage` | integer | Minimum score (default 70) |
| `time_limit` | integer | Minutes (null = unlimited) |
| `difficulty` | text | easy / medium / hard |
| `status` | text | draft / ready |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_questions`

**Purpose**: Test questions in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft question ID |
| `draft_test_id` | integer (FK) | References draft_tests.id |
| `live_question_id` | integer | Link to published question |
| `type` | text | mcq / true_false / fill_blank |
| `difficulty` | text | easy / medium / hard |
| `question_text` | text | The question |
| `options` | jsonb | Answer options |
| `correct_answer` | text | Correct option |
| `explanation` | text | Why correct |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |

---

### `draft_practice_labs`

**Purpose**: Coding exercises in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft lab ID |
| `draft_course_id` | integer (FK) | References draft_courses.id |
| `draft_module_id` | integer (FK) | References draft_modules.id |
| `draft_lesson_id` | integer (FK) | References draft_lessons.id |
| `live_lab_id` | integer | Link to published lab |
| `slug` | text | URL-friendly ID |
| `title` | text | Lab title |
| `description` | text | Lab description |
| `difficulty` | text | beginner / intermediate / advanced |
| `language` | text | Programming language |
| `estimated_time` | integer | Minutes |
| `instructions` | text | Step-by-step guide |
| `starter_code` | text | Initial template |
| `solution_code` | text | Reference solution |
| `expected_output` | text | Expected console output |
| `validation_type` | text | console / test / visual |
| `hints` | jsonb | Hints array |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_projects`

**Purpose**: Hands-on projects in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft project ID |
| `draft_course_id` | integer (FK) | References draft_courses.id |
| `draft_module_id` | integer (FK) | References draft_modules.id |
| `live_project_id` | integer | Link to published project |
| `title` | text | Project title |
| `description` | text | Overview |
| `problem_statement` | text | What to build |
| `objectives` | text | Learning goals |
| `deliverables` | text | Expected outputs |
| `submission_instructions` | text | How to submit |
| `tech_stack` | jsonb | Technologies array |
| `evaluation_checklist` | jsonb | Grading criteria |
| `difficulty` | text | Level |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

### `draft_project_steps`

**Purpose**: Step-by-step project guide in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Step ID |
| `draft_project_id` | integer (FK) | References draft_projects.id |
| `live_step_id` | integer | Link to published step |
| `step_number` | integer | Step sequence |
| `title` | text | Step title |
| `description` | text | Instructions |
| `code_snippet` | text | Example code |
| `tips` | jsonb | Tips array |
| `created_at` | timestamp | Creation date |

---

### `draft_certificates`

**Purpose**: Certificate requirements in draft

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Draft certificate ID |
| `draft_course_id` | integer (FK) | References draft_courses.id |
| `live_certificate_id` | integer | Link to published certificate |
| `name` | text | Certificate name |
| `description` | text | Description |
| `template_id` | text | Design template |
| `type` | text | completion / assessment |
| `requires_test_pass` | boolean | Must pass tests |
| `passing_percentage` | integer | Minimum score |
| `requires_project_completion` | boolean | Must complete projects |
| `requires_lab_completion` | boolean | Must complete labs |
| `qr_verification` | boolean | Include QR code |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last edit |

---

## 5. Publish Process

### What Happens When Admin Clicks "Publish"

This is the **most critical process** in the system. It must be atomic (all or nothing).

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PUBLISH WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: VALIDATION                                                  │
│  ├─ Check course has at least 1 module                              │
│  ├─ Check each module has at least 1 lesson                         │
│  ├─ Validate all required fields                                    │
│  └─ Run quality checks                                              │
│                                                                      │
│  Step 2: BEGIN TRANSACTION                                          │
│  └─ Database transaction starts                                     │
│                                                                      │
│  Step 3: COPY DATA                                                  │
│  ├─ draft_courses → courses                                         │
│  ├─ draft_modules → modules                                         │
│  ├─ draft_lessons → lessons                                         │
│  ├─ draft_ai_notes → ai_notes                                       │
│  ├─ draft_tests → tests                                             │
│  ├─ draft_questions → questions                                     │
│  ├─ draft_practice_labs → practice_labs                             │
│  ├─ draft_projects → projects                                       │
│  ├─ draft_project_steps → project_steps                             │
│  └─ draft_certificates → certificates                               │
│                                                                      │
│  Step 4: UPDATE REFERENCES                                          │
│  ├─ Set live_course_id in draft_courses                             │
│  ├─ Set live_module_id in draft_modules                             │
│  └─ Update all foreign key references                               │
│                                                                      │
│  Step 5: UPDATE STATUS                                              │
│  ├─ courses.status = 'published'                                    │
│  ├─ courses.published_at = NOW()                                    │
│  └─ draft_courses.status = 'published'                              │
│                                                                      │
│  Step 6: CREATE VERSION SNAPSHOT                                    │
│  ├─ Store complete course JSON in course_versions                   │
│  └─ Record in course_publish_history                                │
│                                                                      │
│  Step 7: COMMIT TRANSACTION                                         │
│  └─ If any step fails, ROLLBACK everything                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### After Publish

| What Happens | Details |
|--------------|---------|
| Draft data remains | For future edits and versioning |
| Students can see | Live tables have the content |
| Version is saved | Complete snapshot stored |
| Edit requires unpublish | Or creates new version |

### Updating a Published Course

```
Option A: Unpublish → Edit → Republish
  - Course temporarily hidden from students
  - Good for major changes

Option B: Create New Version
  - Edit draft, publish as v2
  - Students on v1 continue, new enrollments get v2
  - Good for continuous improvement
```

---

## 6. Live Content Tables (Student Visible)

### Important: Students Can ONLY READ These Tables

These are the "production" tables that students see after admin publishes.

---

### `courses`

**Purpose**: Published courses visible to students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Course ID |
| `name` | text | Course title |
| `description` | text | Short description |
| `level` | text | beginner / intermediate / advanced |
| `target_audience` | text | Who should take this |
| `duration` | text | Estimated duration |
| `overview` | text | Detailed overview |
| `learning_outcomes` | jsonb | Outcomes array |
| `job_roles` | jsonb | Job roles array |
| `include_projects` | boolean | Has projects |
| `include_tests` | boolean | Has tests |
| `include_labs` | boolean | Has labs |
| `certificate_type` | text | completion / assessment |
| `thumbnail_url` | text | Course image |
| `credit_cost` | integer | Price in credits (0 = free) |
| `is_free` | boolean | Free flag |
| `status` | text | draft / published |
| `version` | integer | Current version |
| `published_at` | timestamp | When published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |
| `deleted_at` | timestamp | Soft delete |

**Student Query**:
```sql
SELECT * FROM courses 
WHERE status = 'published' 
AND deleted_at IS NULL;
```

---

### `modules`

**Purpose**: Course sections visible to students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Module ID |
| `course_id` | integer (FK) | References courses.id |
| `title` | text | Module title |
| `description` | text | Module description |
| `order_index` | integer | Sort order |
| `estimated_time` | text | Duration |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `lessons`

**Purpose**: Individual lessons visible to students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Lesson ID |
| `module_id` | integer (FK) | References modules.id |
| `title` | text | Lesson title |
| `objectives` | jsonb | Learning objectives |
| `estimated_time` | text | Duration |
| `key_concepts` | jsonb | Key concepts |
| `video_url` | text | Primary video |
| `youtube_references` | jsonb | YouTube videos |
| `external_links` | jsonb | External resources |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `ai_notes`

**Purpose**: Lesson content for students to read

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Note ID |
| `lesson_id` | integer (FK) | References lessons.id |
| `content` | text | Full lesson content |
| `simplified_explanation` | text | Simple version |
| `bullet_notes` | jsonb | Key points |
| `key_takeaways` | jsonb | Summary |
| `interview_questions` | jsonb | Practice Q&A |
| `version` | integer | Content version |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `tests`

**Purpose**: Published tests for students to attempt

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Test ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id |
| `title` | text | Test title |
| `description` | text | Description |
| `passing_percentage` | integer | Minimum score |
| `time_limit` | integer | Minutes |
| `difficulty` | text | Level |
| `status` | text | published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `questions`

**Purpose**: Test questions (correct_answer hidden until submission)

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Question ID |
| `test_id` | integer (FK) | References tests.id |
| `type` | text | mcq / true_false / fill_blank |
| `difficulty` | text | Level |
| `question_text` | text | The question |
| `options` | jsonb | Answer options |
| `correct_answer` | text | Correct option (hide from student) |
| `explanation` | text | Why correct (show after attempt) |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |

---

### `practice_labs`

**Purpose**: Coding exercises for students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Lab ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id |
| `lesson_id` | integer (FK) | References lessons.id |
| `slug` | text | URL identifier |
| `title` | text | Lab title |
| `description` | text | Description |
| `difficulty` | text | Level |
| `language` | text | Programming language |
| `estimated_time` | integer | Minutes |
| `instructions` | text | Step-by-step guide |
| `starter_code` | text | Initial code |
| `solution_code` | text | Reference (hide until complete) |
| `expected_output` | text | Expected result |
| `validation_type` | text | How to validate |
| `hints` | jsonb | Progressive hints |
| `order_index` | integer | Sort order |
| `status` | text | published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `projects`

**Purpose**: Hands-on projects for students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Project ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id |
| `title` | text | Project title |
| `description` | text | Overview |
| `problem_statement` | text | What to build |
| `objectives` | text | Learning goals |
| `deliverables` | text | Expected outputs |
| `submission_instructions` | text | How to submit |
| `tech_stack` | jsonb | Technologies |
| `evaluation_checklist` | jsonb | Grading criteria |
| `difficulty` | text | Level |
| `order_index` | integer | Sort order |
| `status` | text | published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `project_steps`

**Purpose**: Step-by-step project guide

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Step ID |
| `project_id` | integer (FK) | References projects.id |
| `step_number` | integer | Sequence |
| `title` | text | Step title |
| `description` | text | Instructions |
| `code_snippet` | text | Example code |
| `tips` | jsonb | Tips array |
| `created_at` | timestamp | Creation date |

---

### `certificates`

**Purpose**: Certificate requirements

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Certificate ID |
| `course_id` | integer (FK) | References courses.id |
| `name` | text | Certificate name |
| `description` | text | Description |
| `template_id` | text | Design template |
| `type` | text | completion / assessment |
| `requires_test_pass` | boolean | Must pass tests |
| `passing_percentage` | integer | Minimum score |
| `requires_project_completion` | boolean | Must complete projects |
| `requires_lab_completion` | boolean | Must complete labs |
| `qr_verification` | boolean | Include QR code |
| `status` | text | published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

## 7. Student Portal (Shishya) - Learning Flow

### Student Journey Step-by-Step

```
Step 1: REGISTER
├─ Student creates account
├─ Email verification
└─ Profile setup

Step 2: BROWSE & ENROLL
├─ View published courses
├─ Check price / free status
└─ Enroll (pay or redeem credits)

Step 3: LEARN
├─ Watch video lessons
├─ Read AI notes
├─ Take notes
└─ Complete activities

Step 4: PRACTICE
├─ Complete coding labs
├─ Run code
├─ Check output
└─ Unlock hints if stuck

Step 5: ASSESS
├─ Take module tests
├─ Take final exam
├─ Review results
└─ Retry if needed

Step 6: BUILD
├─ Complete projects
├─ Submit for review
└─ Receive feedback

Step 7: CERTIFICATE
├─ All requirements checked
├─ Score calculated
├─ Certificate generated
└─ Marksheet issued
```

---

## 8. Student Activity Tables

### These tables track what students DO

Students can WRITE to these tables. Admin can READ for analytics.

---

### `shishya_users`

**Purpose**: Student accounts

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Student ID |
| `external_id` | text | External system ID |
| `name` | text | Full name |
| `email` | text | Email (unique) |
| `phone` | text | Phone number |
| `avatar_url` | text | Profile picture |
| `status` | text | active / suspended |
| `last_active_at` | timestamp | Last activity |
| `total_spend` | integer | Lifetime spend |
| `signup_source` | text | How they registered |
| `created_at` | timestamp | Registration date |

---

### `course_enrollments`

**Purpose**: Which courses students are enrolled in

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Enrollment ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `course_id` | integer (FK) | References courses.id |
| `enrolled_at` | timestamp | When enrolled |
| `status` | text | active / completed / dropped |
| `progress_percentage` | integer | 0-100 |
| `started_at` | timestamp | First activity |
| `completed_at` | timestamp | Completion date |
| `certificate_issued` | boolean | Certificate given |
| `payment_id` | integer | Payment reference |
| `created_at` | timestamp | Creation date |

---

### `lesson_progress`

**Purpose**: Track which lessons student completed

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Progress ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `lesson_id` | integer (FK) | References lessons.id |
| `status` | text | not_started / in_progress / completed |
| `started_at` | timestamp | When started |
| `completed_at` | timestamp | When completed |
| `time_spent_seconds` | integer | Total time |
| `video_watch_percentage` | integer | How much video watched |
| `notes_read` | boolean | Read AI notes |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `user_lab_progress`

**Purpose**: Track lab completions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Progress ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `lab_id` | integer (FK) | References practice_labs.id |
| `status` | text | not_started / in_progress / completed |
| `user_code` | text | Student's current code |
| `attempts` | integer | Number of attempts |
| `hints_used` | integer | Hints revealed |
| `started_at` | timestamp | When started |
| `completed_at` | timestamp | When completed |
| `time_spent_seconds` | integer | Total time |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `user_test_attempts`

**Purpose**: Track test attempts and scores

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Attempt ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `test_id` | integer (FK) | References tests.id |
| `attempt_number` | integer | Which attempt |
| `score` | integer | Score achieved |
| `max_score` | integer | Maximum possible |
| `percentage` | integer | Score percentage |
| `passed` | boolean | Met passing percentage |
| `answers` | jsonb | Student's answers |
| `started_at` | timestamp | When started |
| `submitted_at` | timestamp | When submitted |
| `time_taken_seconds` | integer | Time used |
| `created_at` | timestamp | Creation date |

---

### `user_project_submissions`

**Purpose**: Track project submissions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Submission ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `project_id` | integer (FK) | References projects.id |
| `submission_url` | text | Link to submission |
| `submission_notes` | text | Student notes |
| `status` | text | submitted / under_review / approved / rejected |
| `score` | integer | Score given |
| `feedback` | text | Reviewer feedback |
| `reviewed_by` | varchar | Reviewer admin |
| `reviewed_at` | timestamp | Review date |
| `submitted_at` | timestamp | Submission date |
| `created_at` | timestamp | Creation date |

---

### `issued_certificates`

**Purpose**: Certificates given to students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Issue ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `course_id` | integer (FK) | References courses.id |
| `certificate_id` | integer (FK) | References certificates.id |
| `certificate_number` | text | Unique cert number |
| `issue_date` | timestamp | When issued |
| `final_score` | integer | Overall score |
| `grade` | text | A / B / C / Pass |
| `pdf_url` | text | Certificate PDF |
| `qr_code` | text | Verification QR |
| `is_valid` | boolean | Currently valid |
| `revoked_at` | timestamp | If revoked |
| `revoked_reason` | text | Why revoked |
| `created_at` | timestamp | Creation date |

---

### `marksheets`

**Purpose**: Detailed score breakdown

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Marksheet ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `course_id` | integer (FK) | References courses.id |
| `issued_certificate_id` | integer (FK) | References issued_certificates.id |
| `test_scores` | jsonb | All test scores |
| `lab_scores` | jsonb | All lab scores |
| `project_scores` | jsonb | All project scores |
| `total_score` | integer | Overall score |
| `total_max_score` | integer | Maximum possible |
| `percentage` | integer | Overall percentage |
| `grade` | text | Final grade |
| `pdf_url` | text | Marksheet PDF |
| `generated_at` | timestamp | Generation date |
| `created_at` | timestamp | Creation date |

---

### `activity_logs`

**Purpose**: General activity tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Log ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `action` | text | What happened |
| `entity_type` | text | What type |
| `entity_id` | text | Which item |
| `metadata` | jsonb | Additional data |
| `ip_address` | text | Client IP |
| `user_agent` | text | Browser info |
| `created_at` | timestamp | When |

---

## 9. Certificates & Marksheets

### Certificate Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CERTIFICATE GENERATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: CHECK ELIGIBILITY                                          │
│  ├─ Course completion percentage >= requirement                     │
│  ├─ All required tests passed (if requires_test_pass)               │
│  ├─ All projects completed (if requires_project_completion)         │
│  └─ All labs completed (if requires_lab_completion)                 │
│                                                                      │
│  Step 2: CALCULATE SCORES                                           │
│  ├─ Average test scores                                             │
│  ├─ Lab completion count                                            │
│  ├─ Project scores                                                  │
│  └─ Weighted total                                                  │
│                                                                      │
│  Step 3: DETERMINE GRADE                                            │
│  ├─ 90-100%: A (Excellent)                                          │
│  ├─ 80-89%: B (Good)                                                │
│  ├─ 70-79%: C (Satisfactory)                                        │
│  └─ <70%: Pass (if all requirements met)                            │
│                                                                      │
│  Step 4: GENERATE CERTIFICATE                                       │
│  ├─ Create unique certificate number                                │
│  ├─ Generate PDF with template                                      │
│  ├─ Create QR code for verification                                 │
│  └─ Store in issued_certificates                                    │
│                                                                      │
│  Step 5: GENERATE MARKSHEET                                         │
│  ├─ Compile all scores                                              │
│  ├─ Generate PDF                                                    │
│  └─ Store in marksheets                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Important Rules

- Certificates are **immutable** once issued
- Can be **revoked** but not edited
- Each has unique **verification number**
- QR code links to **verification page**

---

## 10. Security & Permissions

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL MATRIX                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TABLE TYPE        │ ADMIN PORTAL       │ STUDENT PORTAL             │
│  ──────────────────┼────────────────────┼──────────────────────────  │
│  Draft Tables      │ CREATE/READ/UPDATE │ NO ACCESS                  │
│  Live Content      │ READ/UPDATE        │ READ ONLY                  │
│  Student Activity  │ READ (analytics)   │ CREATE/READ/UPDATE (own)   │
│  Certificates      │ READ/REVOKE        │ READ (own)                 │
│  Admin Users       │ MANAGE             │ NO ACCESS                  │
│  Student Users     │ READ/MANAGE        │ MANAGE (own profile)       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Students Cannot See Drafts

1. **Physical Separation**: Draft tables have different names
2. **No Foreign Keys**: Student tables don't reference draft tables
3. **API Protection**: Student API has no draft endpoints
4. **Database Roles**: Student connection has no permissions on draft tables

### Why Admins Cannot Fake Student Progress

1. **Audit Logs**: All changes are logged
2. **Immutable Records**: Certificates cannot be edited
3. **Timestamps**: System timestamps cannot be backdated
4. **Dual Approval**: High-value actions need 2 approvers

---

## 11. Data Flow Diagram

### Complete System Flow (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ ADMIN USER   │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ GURU PORTAL  │                                                   │
│  │ (Admin UI)   │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    DRAFT TABLES                               │  │
│  │  draft_courses → draft_modules → draft_lessons                │  │
│  │  draft_tests → draft_questions                                │  │
│  │  draft_projects → draft_project_steps                         │  │
│  │  draft_practice_labs                                          │  │
│  │  draft_certificates                                           │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│                              │ PUBLISH                              │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LIVE TABLES                                │  │
│  │  courses → modules → lessons → ai_notes                       │  │
│  │  tests → questions                                            │  │
│  │  projects → project_steps                                     │  │
│  │  practice_labs                                                │  │
│  │  certificates                                                 │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│                              │ STUDENTS READ                        │
│                              ▼                                      │
│  ┌──────────────┐     ┌──────────────┐                             │
│  │ SHISHYA      │────▶│ STUDENT      │                             │
│  │ PORTAL       │     │ ACTIVITY     │                             │
│  │ (Student UI) │     │ TABLES       │                             │
│  └──────────────┘     └──────┬───────┘                             │
│                              │                                      │
│                              │ COMPLETION                           │
│                              ▼                                      │
│                       ┌──────────────┐                             │
│                       │ CERTIFICATE  │                             │
│                       │ ENGINE       │                             │
│                       └──────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Summary

| Portal | Writes To | Reads From |
|--------|-----------|------------|
| **Guru (Admin)** | Draft tables | Draft + Live + Activity |
| **Shishya (Student)** | Activity tables | Live tables |

---

## Quick Reference

### Admin Actions

| Action | Draft Table | Live Table |
|--------|-------------|------------|
| Create course | INSERT draft_courses | - |
| Add module | INSERT draft_modules | - |
| Add lesson | INSERT draft_lessons | - |
| Generate AI content | INSERT draft_ai_notes | - |
| Add test | INSERT draft_tests | - |
| Publish course | - | COPY all to live tables |
| View student progress | - | READ activity tables |

### Student Actions

| Action | Live Table (Read) | Activity Table (Write) |
|--------|-------------------|------------------------|
| Browse courses | SELECT courses | - |
| Enroll | SELECT courses | INSERT course_enrollments |
| Watch lesson | SELECT lessons | UPDATE lesson_progress |
| Complete lab | SELECT practice_labs | UPDATE user_lab_progress |
| Take test | SELECT tests, questions | INSERT user_test_attempts |
| Submit project | SELECT projects | INSERT user_project_submissions |
| Get certificate | SELECT certificates | INSERT issued_certificates |

---

**Document Version**: 2.0  
**Last Updated**: January 2026  
**Architecture**: Draft/Live Table Separation
