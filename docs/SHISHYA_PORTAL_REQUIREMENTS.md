# OurShiksha Shishya - Student Portal Requirements

## Master AI Prompt for Building Student Portal

### Project Overview
Build OurShiksha Shishya - a student learning portal that shares the same PostgreSQL database with OurShiksha Guru (admin portal). Students browse courses, enroll, complete lessons, take tests, submit projects, earn coins, and receive certificates.

### Architecture: Shared Database
- **Single PostgreSQL Database** used by both Guru and Shishya
- **No API sync needed** - both portals use Drizzle ORM with same schema
- **Connection**: Use same `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with shared schema from `shared/schema.ts`

---

## Data Flow Between Portals

| Data Category | Created By | Read By | Notes |
|---------------|------------|---------|-------|
| Courses, Modules, Lessons | Guru | Shishya | Only status='published' |
| Tests, Questions | Guru | Shishya | Read-only for students |
| Projects, Labs | Guru | Shishya | Students submit work |
| Certificates, Rewards | Guru | Shishya | Issue to students |
| Pricing, Scholarships | Guru | Shishya | Apply during purchase |
| Skills, Categories | Guru | Shishya | Filter/browse courses |
| Student Users | Shishya | Guru | Analytics dashboard |
| Enrollments, Progress | Shishya | Guru | Reports, analytics |
| Test Attempts | Shishya | Guru | Grade viewing |
| Project Submissions | Shishya | Guru | Manual review |
| Payments, Coins | Shishya | Guru | Finance reports |

---

## Tables Shishya READS FROM (Created by Guru)

### Core Content Tables
```
courses
- Filter: status = 'published' AND deleted_at IS NULL
- Fields: id, name, description, level, duration, overview
- Fields: learningOutcomes, jobRoles, thumbnailUrl
- Fields: creditCost, isFree, includeProjects, includeTests, includeLabs

modules
- Filter: course_id from published courses
- Fields: id, courseId, title, description, orderIndex, estimatedTime

lessons
- Fields: id, moduleId, title, objectives, estimatedTime
- Fields: keyConceptS, videoUrl, youtubeReferences, orderIndex

ai_notes
- Fields: lessonId, content, simplifiedExplanation
- Fields: bulletNotes, keyTakeaways, interviewQuestions
```

### Assessment Tables
```
tests
- Fields: id, courseId, moduleId, title, description
- Fields: passingPercentage, isLocked, timeLimit, maxAttempts

questions
- Fields: id, testId, question, questionType, options
- Fields: correctAnswer, explanation, marks, orderIndex

projects
- Fields: id, courseId, title, description, problemStatement
- Fields: techStack, deliverables, evaluationChecklist, difficulty

project_steps
- Fields: projectId, stepNumber, title, description, codeSnippet, tips

practice_labs
- Fields: id, courseId, title, description, difficulty
- Fields: starterCode, solutionCode, hints, validationCriteria
```

### Rewards & Gamification Tables
```
course_rewards
- Fields: courseId, enrollmentCoins, completionCoins
- Fields: streakBonusCoins, referralBonus

achievement_cards
- Fields: id, courseId, title, description, iconUrl
- Fields: criteria, coinsReward, rarity

motivational_cards
- Fields: id, courseId, message, triggerType, displayAt
```

### Certification Tables
```
certificates
- Fields: id, courseId, title, description
- Fields: templateUrl, requirements, validityMonths

certificate_templates (enterprise)
- Fields: id, name, designData, isActive

signer_registry (enterprise)
- Fields: id, name, title, signatureUrl, isActive
```

### Pricing & Policy Tables
```
credit_policies
- Fields: level, basePrice, creditCost, discountPercentage

scholarship_policies
- Fields: id, name, criteria, discountPercentage, isActive

subscription_plans
- Fields: id, name, slug, price, billingCycle, features

pricing_rules (enterprise)
- Fields: id, name, ruleType, conditions, adjustments
```

### Reference Tables
```
skills
- Fields: id, name, category

course_skills
- Fields: courseId, skillId
```

---

## Tables Shishya CREATES/MANAGES

### 1. Student Authentication
```sql
-- Already exists
shishya_users
- id, external_id, name, email, phone
- avatar_url, status, last_active_at
- total_spend, signup_source, created_at

-- Need to create
shishya_sessions
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- token (text, unique)
- device_info (jsonb) -- {browser, os, device}
- ip_address (text)
- expires_at (timestamp)
- created_at (timestamp)

shishya_otp_tokens
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- otp (text)
- purpose (text) -- 'login', 'password_reset', 'email_verify'
- expires_at (timestamp)
- attempts (integer, default 0)
- is_used (boolean, default false)
- created_at (timestamp)
```

### 2. Course Enrollments
```sql
course_enrollments
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- course_id (integer, references courses.id)
- enrolled_at (timestamp)
- status (text) -- 'active', 'completed', 'dropped', 'expired'
- progress_percentage (integer, default 0)
- last_accessed_at (timestamp)
- completed_at (timestamp, nullable)
- certificate_issued (boolean, default false)
- payment_id (integer, references shishya_payments.id, nullable)
- scholarship_applied (boolean, default false)
- created_at (timestamp)

-- Unique constraint: (shishya_user_id, course_id)
```

### 3. Lesson Progress
```sql
lesson_progress
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- lesson_id (integer, references lessons.id)
- course_id (integer, references courses.id)
- module_id (integer, references modules.id)
- status (text) -- 'not_started', 'in_progress', 'completed'
- started_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- time_spent_seconds (integer, default 0)
- video_progress_seconds (integer, default 0)
- notes (text, nullable) -- student's personal notes
- created_at (timestamp)
- updated_at (timestamp)

-- Unique constraint: (shishya_user_id, lesson_id)
```

### 4. Test Attempts
```sql
test_attempts
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- test_id (integer, references tests.id)
- course_id (integer, references courses.id)
- attempt_number (integer)
- started_at (timestamp)
- submitted_at (timestamp, nullable)
- answers (jsonb) -- [{questionId, selectedAnswer, isCorrect}]
- score (integer, nullable) -- percentage
- marks_obtained (integer, nullable)
- total_marks (integer, nullable)
- passed (boolean, nullable)
- time_taken_seconds (integer, nullable)
- status (text) -- 'in_progress', 'submitted', 'timed_out'
- created_at (timestamp)

-- Index on (shishya_user_id, test_id, attempt_number)
```

### 5. Project Submissions
```sql
project_submissions
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- project_id (integer, references projects.id)
- course_id (integer, references courses.id)
- submission_url (text) -- GitHub/drive link
- notes (text, nullable) -- student's notes
- submitted_at (timestamp)
- status (text) -- 'pending', 'under_review', 'approved', 'rejected', 'revision_requested'
- reviewed_by (varchar, nullable) -- admin user id
- reviewed_at (timestamp, nullable)
- feedback (text, nullable)
- score (integer, nullable) -- 0-100
- attempt_number (integer, default 1)
- created_at (timestamp)
- updated_at (timestamp)
```

### 6. Lab Completions
```sql
lab_completions
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- lab_id (integer, references practice_labs.id)
- course_id (integer, references courses.id)
- started_at (timestamp)
- completed_at (timestamp, nullable)
- code_submitted (text, nullable)
- validation_passed (boolean, default false)
- validation_output (jsonb, nullable)
- hints_used (integer, default 0)
- attempt_count (integer, default 1)
- time_spent_seconds (integer, default 0)
- created_at (timestamp)

-- Unique constraint: (shishya_user_id, lab_id)
```

### 7. Student Achievements
```sql
student_achievements
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- achievement_card_id (integer, references achievement_cards.id)
- course_id (integer, references courses.id, nullable)
- earned_at (timestamp)
- coins_awarded (integer, default 0)
- shared_on_social (boolean, default false)
- share_url (text, nullable)
- created_at (timestamp)

-- Unique constraint: (shishya_user_id, achievement_card_id)
```

### 8. Issued Certificates
```sql
issued_certificates
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- course_id (integer, references courses.id)
- certificate_id (integer, references certificates.id)
- certificate_number (text, unique) -- e.g., 'OSHK-2024-001234'
- issued_at (timestamp)
- valid_until (timestamp, nullable)
- pdf_url (text, nullable)
- verification_code (text, unique)
- student_name (text) -- name at time of issue
- course_name (text) -- course name at time of issue
- completion_date (timestamp)
- shared_on_linkedin (boolean, default false)
- linkedin_post_url (text, nullable)
- download_count (integer, default 0)
- created_at (timestamp)
```

### 9. Wishlist & Bookmarks
```sql
student_wishlist
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- course_id (integer, references courses.id)
- added_at (timestamp)
- notification_enabled (boolean, default true) -- price drop alerts
- created_at (timestamp)

-- Unique constraint: (shishya_user_id, course_id)

lesson_bookmarks
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- lesson_id (integer, references lessons.id)
- course_id (integer, references courses.id)
- note (text, nullable)
- timestamp_seconds (integer, nullable) -- video bookmark time
- created_at (timestamp)
```

### 10. Learning Streaks
```sql
learning_streaks
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- current_streak (integer, default 0)
- longest_streak (integer, default 0)
- last_activity_date (date)
- streak_started_at (date, nullable)
- total_learning_days (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)

-- Unique constraint: (shishya_user_id)

daily_activity_log
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- activity_date (date)
- lessons_completed (integer, default 0)
- tests_attempted (integer, default 0)
- labs_completed (integer, default 0)
- time_spent_minutes (integer, default 0)
- coins_earned (integer, default 0)
- created_at (timestamp)

-- Unique constraint: (shishya_user_id, activity_date)
```

### 11. Course Reviews
```sql
course_reviews
- id (serial, primary key)
- shishya_user_id (varchar, references shishya_users.id)
- course_id (integer, references courses.id)
- rating (integer) -- 1-5
- review_text (text, nullable)
- is_verified_purchase (boolean, default false)
- helpful_count (integer, default 0)
- status (text) -- 'pending', 'approved', 'rejected'
- created_at (timestamp)
- updated_at (timestamp)

-- Unique constraint: (shishya_user_id, course_id)
```

---

## Tables Already Exist (Shared)

### Coin System
```
coin_wallets
- shishya_user_id (unique), balance, lifetime_earned, lifetime_spent

coin_transactions
- shishya_user_id, amount, type, reason, reference_id, reference_type, balance_after
```

### Payments
```
shishya_payments
- shishya_user_id, course_id, amount, currency, payment_method
- transaction_id, status, gateway_response, created_at
```

### Subscriptions
```
user_subscriptions
- shishya_user_id, plan_id, status, started_at, expires_at
- auto_renew, cancelled_at
```

---

## Key Features to Build

### Authentication & Profile
1. Email/OTP login (Resend API)
2. Google OAuth integration
3. Profile management (name, avatar, phone)
4. Session management (multi-device)

### Course Discovery
1. Browse published courses
2. Filter by level, skill, price, duration
3. Search courses
4. Course detail page with syllabus preview
5. Wishlist functionality

### Enrollment & Purchase
1. Free course enrollment
2. Coin-based purchase
3. Credit package purchase
4. Subscription access
5. Scholarship application
6. Coupon/voucher redemption

### Learning Experience
1. Video lesson player
2. AI notes display
3. Lesson bookmarking
4. Progress tracking (auto-save)
5. Personal notes

### Assessments
1. Test taking interface
2. Timed tests with countdown
3. Immediate scoring
4. Retry logic (based on maxAttempts)
5. Review incorrect answers

### Projects & Labs
1. Project requirements display
2. Submission upload (URL-based)
3. View feedback from admin
4. Lab code editor (Monaco)
5. Code validation/execution
6. Hints system

### Gamification
1. Coin earning/spending
2. Achievement badges
3. Learning streaks
4. Daily activity tracking
5. Motivational cards display
6. Progress milestones

### Certificates
1. Certificate requirements display
2. Automatic issuance on completion
3. PDF generation
4. Verification page (public)
5. LinkedIn sharing

### Dashboard
1. Continue learning (recent courses)
2. Progress overview
3. Upcoming deadlines
4. Recent achievements
5. Coin balance

---

## Tech Stack (Match Guru)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Shadcn/ui |
| State | TanStack React Query |
| Forms | React Hook Form + Zod |
| Routing | Wouter |
| Backend | Node.js, Express |
| Database | PostgreSQL (shared) |
| ORM | Drizzle ORM |
| Auth | JWT, bcrypt |
| Email | Resend API |
| Payments | Razorpay |

---

## Environment Variables Needed

```env
DATABASE_URL=postgresql://...  # Same as Guru
SESSION_SECRET=...
JWT_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://shishya.ourshiksha.com
```

---

## Security Considerations

1. Students can ONLY see published courses (status='published')
2. Students CANNOT access admin tables directly
3. Students can ONLY modify their own data
4. Rate limiting on all endpoints
5. JWT tokens with short expiry (12 hours)
6. Password hashing with bcrypt
7. Input validation with Zod schemas
8. SQL injection prevention via Drizzle ORM

---

## Analytics Data for Guru

Shishya writes data that Guru admin can view:
- Enrollment counts per course
- Completion rates
- Test pass rates
- Average scores
- Revenue per course
- Active students
- Daily/weekly/monthly activity
- Popular courses
- Drop-off points

---

## Database Indexes to Add

```sql
-- Enrollments
CREATE INDEX idx_enrollments_user ON course_enrollments(shishya_user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);

-- Progress
CREATE INDEX idx_lesson_progress_user ON lesson_progress(shishya_user_id);
CREATE INDEX idx_lesson_progress_course ON lesson_progress(course_id);

-- Test Attempts
CREATE INDEX idx_test_attempts_user ON test_attempts(shishya_user_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);

-- Submissions
CREATE INDEX idx_submissions_user ON project_submissions(shishya_user_id);
CREATE INDEX idx_submissions_status ON project_submissions(status);

-- Certificates
CREATE INDEX idx_certificates_user ON issued_certificates(shishya_user_id);
CREATE INDEX idx_certificates_verify ON issued_certificates(verification_code);
```

---

## Summary

This document provides complete specifications for building the Shishya student portal that shares the same PostgreSQL database with Guru admin portal. No API integration is needed - both portals directly access the shared database using Drizzle ORM.
