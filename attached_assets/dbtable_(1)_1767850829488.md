# SHISHYA Database Schema Documentation

## Overview

The SHISHYA student portal shares a PostgreSQL database with the OurShiksha Admin Course Factory. The database contains **35 tables** organized into two main categories:

1. **Course Content Tables (6)** - Managed by Admin, read-only for SHISHYA
2. **SHISHYA Student Tables (29)** - All prefixed with `shishya_` for clear separation

---

## Course Content Tables (6 Tables)

These tables are managed by the Admin portal. SHISHYA reads only published content.

### courses

Main catalog of all courses. SHISHYA only reads where `status = 'published' AND is_active = true`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| title | VARCHAR(255) | NO | - | Course title |
| description | TEXT | YES | - | Full course description |
| short_description | VARCHAR(500) | YES | - | Brief summary for cards |
| level | VARCHAR(20) | NO | 'beginner' | Difficulty: beginner/intermediate/advanced |
| language | VARCHAR(20) | NO | 'en' | Course language code |
| duration | VARCHAR(50) | YES | - | Estimated completion time |
| skills | TEXT | YES | - | Comma-separated skills taught |
| status | VARCHAR(20) | NO | 'draft' | draft/published/archived |
| is_active | BOOLEAN | NO | false | Quick toggle for visibility |
| is_free | BOOLEAN | NO | false | Whether course is free |
| credit_cost | INTEGER | NO | 0 | Credits required to enroll |
| price | INTEGER | NO | 0 | Price in currency units |
| currency | VARCHAR(10) | NO | 'INR' | Currency code |
| test_required | BOOLEAN | NO | false | Must pass test for certificate |
| project_required | BOOLEAN | NO | false | Must submit project for certificate |
| thumbnail_url | TEXT | YES | - | Course cover image URL |
| instructor_id | VARCHAR(36) | YES | - | Creator's user ID |
| published_at | TIMESTAMP | YES | - | When course was published |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update time |

**Usage:** Course catalog, enrollment, progress tracking

---

### modules

Sections or chapters within a course.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| course_id | INTEGER | NO | - | FK to courses.id |
| title | VARCHAR(255) | NO | - | Module title |
| description | TEXT | YES | - | Module overview |
| order_index | INTEGER | NO | 0 | Display order in course |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Course structure, navigation, progress tracking

---

### lessons

Individual learning units within modules.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| module_id | INTEGER | NO | - | FK to modules.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| title | VARCHAR(255) | NO | - | Lesson title |
| content | TEXT | YES | - | Lesson content (HTML/Markdown) |
| video_url | TEXT | YES | - | Video lesson URL |
| duration | INTEGER | YES | - | Duration in minutes |
| order_index | INTEGER | NO | 0 | Display order in module |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Content display, lesson viewer, progress tracking

---

### tests

Assessments for courses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| course_id | INTEGER | NO | - | FK to courses.id |
| title | VARCHAR(255) | NO | - | Test title |
| description | TEXT | YES | - | Test instructions |
| duration_minutes | INTEGER | NO | 30 | Time limit |
| passing_percentage | INTEGER | NO | 60 | Minimum score to pass |
| questions | JSONB | NO | - | Array of question objects |
| is_active | BOOLEAN | NO | true | Whether test is available |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Test taking, scoring (server-side), certificate eligibility

---

### projects

Assignments for hands-on practice.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| course_id | INTEGER | NO | - | FK to courses.id |
| title | VARCHAR(255) | NO | - | Project title |
| description | TEXT | YES | - | Project requirements |
| difficulty | VARCHAR(20) | NO | 'beginner' | beginner/intermediate/advanced |
| estimated_hours | INTEGER | YES | - | Expected completion time |
| requirements | JSONB | YES | - | Submission requirements |
| rubric | JSONB | YES | - | Grading criteria |
| is_active | BOOLEAN | NO | true | Whether project is available |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Project display, submission tracking, certificate eligibility

---

### labs

Guided coding exercises with browser-based execution.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| course_id | INTEGER | NO | - | FK to courses.id |
| module_id | INTEGER | YES | - | FK to modules.id |
| lesson_id | INTEGER | YES | - | FK to lessons.id |
| title | VARCHAR(255) | NO | - | Lab title |
| description | TEXT | YES | - | Lab instructions |
| difficulty | VARCHAR(20) | NO | 'beginner' | Difficulty level |
| instructions | JSONB | YES | - | Step-by-step guide |
| starter_code | TEXT | YES | - | Initial code template |
| expected_output | TEXT | YES | - | Expected result for validation |
| language | VARCHAR(20) | NO | 'javascript' | Programming language |
| estimated_time | INTEGER | YES | - | Minutes to complete |
| order_index | INTEGER | NO | 0 | Display order |
| is_active | BOOLEAN | NO | true | Whether lab is available |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Interactive coding, output matching, skill building

---

## SHISHYA Student Tables (29 Tables)

All student-specific tables use the `shishya_` prefix for clear separation from Admin tables.

---

## Authentication Tables (4)

### shishya_users

Student account credentials.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | UUID | Primary key (UUID v4) |
| email | VARCHAR(255) | NO | - | Unique email address |
| password_hash | TEXT | NO | - | Bcrypt hashed password |
| email_verified | BOOLEAN | NO | false | Email verification status |
| created_at | TIMESTAMP | NO | NOW() | Account creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update time |

**Usage:** Authentication, login, email verification

---

### shishya_sessions

Server-side session storage for authenticated users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| sid | VARCHAR(255) | NO | - | Session ID (Primary key) |
| sess | JSONB | NO | - | Session data |
| expire | TIMESTAMP | NO | - | Session expiration time |

**Usage:** Session management, HTTP-only cookies, authentication state

---

### shishya_otp_codes

One-time passwords for email verification.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| email | VARCHAR(255) | NO | - | Target email address |
| otp_hash | TEXT | NO | - | SHA256 hashed OTP |
| expires_at | TIMESTAMP | NO | - | OTP expiration time |
| verified | BOOLEAN | NO | false | Whether OTP was used |
| created_at | TIMESTAMP | NO | NOW() | OTP creation time |

**Usage:** Email verification, password reset, secure signup

---

### shishya_otp_logs

Audit trail for OTP-related actions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| email | VARCHAR(255) | NO | - | Target email |
| action | VARCHAR(50) | NO | - | Action type (send/verify/fail) |
| ip_address | VARCHAR(45) | YES | - | Client IP address |
| user_agent | TEXT | YES | - | Browser user agent |
| created_at | TIMESTAMP | NO | NOW() | Action timestamp |

**Usage:** Security auditing, abuse detection, compliance

---

## Profile Tables (1)

### shishya_user_profiles

Extended student profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | UUID | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id (Unique) |
| full_name | VARCHAR(255) | YES | - | Display name |
| username | VARCHAR(50) | YES | - | Unique public username |
| bio | TEXT | YES | - | About me (max 500 chars) |
| profile_photo | TEXT | YES | - | Base64 encoded photo |
| headline | VARCHAR(200) | YES | - | Professional headline |
| location | VARCHAR(100) | YES | - | City/Country |
| github_url | TEXT | YES | - | GitHub profile link |
| linkedin_url | TEXT | YES | - | LinkedIn profile link |
| website_url | TEXT | YES | - | Personal website |
| facebook_url | TEXT | YES | - | Facebook profile |
| instagram_url | TEXT | YES | - | Instagram profile |
| portfolio_visible | BOOLEAN | NO | false | Public portfolio enabled |
| created_at | TIMESTAMP | NO | NOW() | Profile creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update time |

**Usage:** Profile page, public portfolio, social links

---

## Progress Tables (6)

### shishya_user_progress

Lesson completion tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| lesson_id | INTEGER | NO | - | FK to lessons.id |
| completed | BOOLEAN | NO | false | Completion status |
| completed_at | TIMESTAMP | YES | - | When marked complete |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Progress bars, continue learning, course completion percentage

---

### shishya_user_lab_progress

Lab completion and code storage.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| lab_id | INTEGER | NO | - | FK to labs.id |
| completed | BOOLEAN | NO | false | Completion status |
| user_code | TEXT | YES | - | Student's saved code |
| completed_at | TIMESTAMP | YES | - | When completed |
| created_at | TIMESTAMP | NO | NOW() | Record creation time |

**Usage:** Lab progress, code persistence, skill tracking

---

### shishya_user_test_attempts

Test attempt history and scores.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| test_id | INTEGER | NO | - | FK to tests.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| score | INTEGER | NO | - | Points earned |
| total_questions | INTEGER | NO | - | Number of questions |
| passed | BOOLEAN | NO | false | Met passing percentage |
| answers | JSONB | YES | - | Student's answers |
| time_taken | INTEGER | YES | - | Seconds to complete |
| attempted_at | TIMESTAMP | NO | NOW() | Attempt timestamp |

**Usage:** Test results, certificate eligibility, marksheet grades

---

### shishya_user_project_submissions

Project submission tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| project_id | INTEGER | NO | - | FK to projects.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| submission_url | TEXT | YES | - | Live demo URL |
| github_url | TEXT | YES | - | Repository URL |
| description | TEXT | YES | - | Submission notes |
| status | VARCHAR(20) | NO | 'pending' | pending/approved/rejected |
| feedback | TEXT | YES | - | Reviewer feedback |
| submitted_at | TIMESTAMP | NO | NOW() | Submission time |
| reviewed_at | TIMESTAMP | YES | - | Review timestamp |

**Usage:** Project submissions, portfolio, certificate eligibility

---

### shishya_user_certificates

Earned certificates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | UUID | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| certificate_number | VARCHAR(50) | NO | - | Unique verification ID |
| issued_at | TIMESTAMP | NO | NOW() | Issue date |
| pdf_url | TEXT | YES | - | Generated PDF URL |

**Usage:** Certificate viewer, public verification, portfolio

---

### shishya_course_enrollments

Course enrollment records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| enrolled_at | TIMESTAMP | NO | NOW() | Enrollment time |
| completed_at | TIMESTAMP | YES | - | Completion time |
| status | VARCHAR(20) | NO | 'active' | active/completed/dropped |

**Usage:** Dashboard, course access control, progress tracking

---

## Credits & Wallet Tables (5)

### shishya_user_credits

Student credit balance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id (Unique) |
| balance | INTEGER | NO | 0 | Current credit balance |
| lifetime_earned | INTEGER | NO | 0 | Total credits ever received |
| lifetime_spent | INTEGER | NO | 0 | Total credits ever spent |
| updated_at | TIMESTAMP | NO | NOW() | Last balance change |

**Usage:** Wallet display, enrollment, credit management

---

### shishya_credit_transactions

Credit transaction history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| amount | INTEGER | NO | - | Credits (+/-) |
| type | VARCHAR(20) | NO | - | welcome/purchase/spend/refund |
| description | TEXT | YES | - | Transaction description |
| reference_id | VARCHAR(100) | YES | - | External reference (Razorpay) |
| created_at | TIMESTAMP | NO | NOW() | Transaction time |

**Usage:** Transaction history, wallet page, auditing

---

### shishya_vouchers

Redeemable voucher codes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| code | VARCHAR(50) | NO | - | Unique voucher code |
| credits | INTEGER | NO | - | Credits awarded |
| max_uses | INTEGER | NO | 1 | Maximum redemptions |
| used_count | INTEGER | NO | 0 | Current redemption count |
| expires_at | TIMESTAMP | YES | - | Expiration date |
| is_active | BOOLEAN | NO | true | Voucher enabled |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Usage:** Promotions, partnerships, marketing campaigns

---

### shishya_voucher_redemptions

Voucher redemption records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| voucher_id | INTEGER | NO | - | FK to shishya_vouchers.id |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| redeemed_at | TIMESTAMP | NO | NOW() | Redemption time |

**Usage:** Prevent duplicate redemptions, voucher analytics

---

### shishya_gift_boxes

Surprise credit gifts for students.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| credits | INTEGER | NO | - | Gift amount |
| message | TEXT | YES | - | Gift message |
| opened | BOOLEAN | NO | false | Whether gift was claimed |
| opened_at | TIMESTAMP | YES | - | Claim timestamp |
| created_at | TIMESTAMP | NO | NOW() | Gift creation time |

**Usage:** Gamification, rewards, engagement

---

## Notifications Table (1)

### shishya_notifications

In-app notifications for students.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| title | VARCHAR(255) | NO | - | Notification title |
| message | TEXT | NO | - | Full message |
| type | VARCHAR(50) | NO | 'info' | info/success/warning/achievement |
| read | BOOLEAN | NO | false | Read status |
| action_url | TEXT | YES | - | Click destination |
| created_at | TIMESTAMP | NO | NOW() | Notification time |

**Usage:** Notification center, alerts, engagement

---

## AI Motivation Tables (8)

### shishya_motivation_rules

Rules engine for automated motivation triggers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| name | VARCHAR(255) | NO | - | Rule name |
| description | TEXT | YES | - | Rule purpose |
| trigger_type | VARCHAR(50) | NO | - | Event type (lesson_complete, streak, etc.) |
| trigger_condition | JSONB | NO | - | Condition parameters |
| action_type | VARCHAR(50) | NO | - | Action type (notification, badge, etc.) |
| action_data | JSONB | NO | - | Action parameters |
| is_active | BOOLEAN | NO | true | Rule enabled |
| priority | INTEGER | NO | 0 | Execution order |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Usage:** Automated engagement, gamification rules

---

### shishya_rule_trigger_logs

Audit log for rule executions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| rule_id | INTEGER | NO | - | FK to shishya_motivation_rules.id |
| user_id | VARCHAR(36) | NO | - | Triggered for user |
| triggered_at | TIMESTAMP | NO | NOW() | Execution time |
| action_taken | JSONB | YES | - | What action was performed |

**Usage:** Analytics, debugging, rule effectiveness

---

### shishya_motivation_cards

Personalized motivation messages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| card_type | VARCHAR(50) | NO | - | quote/tip/challenge/streak |
| title | VARCHAR(255) | NO | - | Card headline |
| message | TEXT | NO | - | Full message |
| action_url | TEXT | YES | - | Optional CTA link |
| dismissed | BOOLEAN | NO | false | User dismissed |
| expires_at | TIMESTAMP | YES | - | Auto-expire time |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Usage:** Dashboard cards, daily motivation, engagement

---

### shishya_ai_nudge_logs

AI-generated nudge history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| nudge_type | VARCHAR(50) | NO | - | Type of nudge |
| message | TEXT | NO | - | Generated message |
| context | JSONB | YES | - | Generation context |
| created_at | TIMESTAMP | NO | NOW() | Nudge time |

**Usage:** AI engagement, personalized reminders

---

### shishya_student_streaks

Learning streak tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id (Unique) |
| current_streak | INTEGER | NO | 0 | Current consecutive days |
| longest_streak | INTEGER | NO | 0 | All-time best streak |
| last_activity_date | DATE | YES | - | Last learning date |
| updated_at | TIMESTAMP | NO | NOW() | Last update |

**Usage:** Streak badges, gamification, retention

---

### shishya_mystery_boxes

Gamified reward boxes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| box_type | VARCHAR(50) | NO | - | daily/weekly/achievement |
| reward_type | VARCHAR(50) | YES | - | credits/badge/feature |
| reward_value | INTEGER | YES | - | Reward amount |
| opened | BOOLEAN | NO | false | Whether opened |
| opened_at | TIMESTAMP | YES | - | Open timestamp |
| expires_at | TIMESTAMP | YES | - | Expiration time |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Usage:** Daily rewards, engagement, surprise mechanics

---

### shishya_scholarships

Available scholarship programs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| name | VARCHAR(255) | NO | - | Scholarship name |
| description | TEXT | YES | - | Full description |
| credits | INTEGER | NO | - | Credits awarded |
| eligibility_criteria | JSONB | YES | - | Requirements |
| max_recipients | INTEGER | YES | - | Maximum awardees |
| current_recipients | INTEGER | NO | 0 | Current count |
| is_active | BOOLEAN | NO | true | Open for applications |
| starts_at | TIMESTAMP | YES | - | Start date |
| ends_at | TIMESTAMP | YES | - | End date |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Usage:** Financial aid, credit grants, accessibility

---

### shishya_user_scholarships

Scholarship awards to students.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| scholarship_id | INTEGER | NO | - | FK to shishya_scholarships.id |
| awarded_at | TIMESTAMP | NO | NOW() | Award date |
| status | VARCHAR(20) | NO | 'active' | active/expired/revoked |

**Usage:** Scholarship tracking, student aid history

---

## Academic Tables (2)

### shishya_marksheets

Consolidated academic records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | UUID | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| marksheet_number | VARCHAR(50) | NO | - | Unique verification ID |
| courses_completed | INTEGER | NO | 0 | Number of courses |
| total_credits | INTEGER | NO | 0 | Credits earned |
| cgpa | DECIMAL(3,2) | YES | - | Cumulative GPA (10-point) |
| classification | VARCHAR(50) | YES | - | Distinction/First Class/Pass |
| generated_at | TIMESTAMP | NO | NOW() | Generation time |

**Usage:** Academic record, transcript, public verification

---

### shishya_marksheet_verifications

Marksheet verification audit log.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| marksheet_id | VARCHAR(36) | NO | - | FK to shishya_marksheets.id |
| verified_at | TIMESTAMP | NO | NOW() | Verification time |
| verifier_ip | VARCHAR(45) | YES | - | Verifier's IP |
| verifier_agent | TEXT | YES | - | Browser info |

**Usage:** Verification analytics, authenticity tracking

---

## AI Tutor Tables (2)

### shishya_usha_conversations

Usha AI tutor conversation sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | FK to shishya_users.id |
| course_id | INTEGER | NO | - | FK to courses.id |
| page_type | VARCHAR(20) | NO | - | lesson/lab/project/test |
| context_id | INTEGER | YES | - | Lesson/Lab/Project ID |
| created_at | TIMESTAMP | NO | NOW() | Session start |
| updated_at | TIMESTAMP | NO | NOW() | Last activity |

**Usage:** Conversation context, history management

---

### shishya_usha_messages

Individual messages in Usha conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| conversation_id | INTEGER | NO | - | FK to shishya_usha_conversations.id |
| role | VARCHAR(20) | NO | - | user/assistant |
| content | TEXT | NO | - | Message content |
| response_type | VARCHAR(50) | YES | - | explanation/hint/guidance |
| help_level | VARCHAR(20) | YES | - | minimal/moderate/detailed |
| created_at | TIMESTAMP | NO | NOW() | Message time |

**Usage:** Chat history, context for AI responses

---

## Database Views

### published_courses_view

Optimized view for SHISHYA to read only published, active courses.

```sql
CREATE VIEW published_courses_view AS
SELECT * FROM courses
WHERE status = 'published' AND is_active = true;
```

**Usage:** SHISHYA API can read from this view instead of filtering at application level.

---

## Table Relationships

```
courses (1) ─────┬───── (N) modules
                 ├───── (N) lessons
                 ├───── (N) tests
                 ├───── (N) projects
                 └───── (N) labs

shishya_users (1) ─────┬───── (1) shishya_user_profiles
                       ├───── (N) shishya_sessions
                       ├───── (N) shishya_user_progress
                       ├───── (N) shishya_course_enrollments
                       ├───── (1) shishya_user_credits
                       ├───── (N) shishya_credit_transactions
                       ├───── (N) shishya_notifications
                       ├───── (N) shishya_usha_conversations
                       └───── (1) shishya_student_streaks
```

---

## Summary

| Category | Tables | Count |
|----------|--------|-------|
| Course Content | courses, modules, lessons, tests, projects, labs | 6 |
| Auth | shishya_users, shishya_sessions, shishya_otp_codes, shishya_otp_logs | 4 |
| Profiles | shishya_user_profiles | 1 |
| Progress | shishya_user_progress, shishya_user_lab_progress, shishya_user_test_attempts, shishya_user_project_submissions, shishya_user_certificates, shishya_course_enrollments | 6 |
| Credits | shishya_user_credits, shishya_credit_transactions, shishya_vouchers, shishya_voucher_redemptions, shishya_gift_boxes | 5 |
| Notifications | shishya_notifications | 1 |
| AI Motivation | shishya_motivation_rules, shishya_rule_trigger_logs, shishya_motivation_cards, shishya_ai_nudge_logs, shishya_student_streaks, shishya_mystery_boxes, shishya_scholarships, shishya_user_scholarships | 8 |
| Academic | shishya_marksheets, shishya_marksheet_verifications | 2 |
| AI Tutor | shishya_usha_conversations, shishya_usha_messages | 2 |
| **Total** | | **35** |

---

*Last Updated: January 2026*
