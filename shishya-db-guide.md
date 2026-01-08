# Master Replit Prompt: Shishya Portal Database Guide

## Role

You are building the **Shishya (Student) Portal** for OurShiksha - an educational platform. The Shishya portal shares a **single PostgreSQL database** with the Admin (Guru) portal. You must understand which tables you can read, which you can write to, and the critical rules for data access.

---

## Database Architecture Overview

**Total Tables:** 74 tables in shared PostgreSQL database

**Access Pattern:**
- **Admin (Guru)** = Creates and manages course content
- **Shishya (Student)** = Reads published content, writes own progress/data

**Key Principle:** Shishya portal NEVER modifies course content tables. It only READS published courses and WRITES to shishya-prefixed tables.

---

## Critical ID Type Rule

**IMPORTANT:** `shishya_users.id` is `VARCHAR(36)` containing UUID v4 - NOT a serial integer.

All foreign keys referencing shishya users MUST use `VARCHAR(36)`:
```sql
user_id VARCHAR(36) REFERENCES shishya_users(id)
```

---

## Tables Shishya Portal CAN READ (Course Content)

These are created by Admin. Shishya reads ONLY published content.

### MANDATORY Visibility Filter
```sql
SELECT * FROM courses 
WHERE status = 'published' AND is_active = true
```

| Table | What It Contains |
|-------|------------------|
| courses | Course catalog (name, description, level, pricing) |
| modules | Course sections/chapters |
| lessons | Individual learning units |
| tests | Course assessments |
| questions | Test questions (MCQ, true/false) |
| projects | Hands-on assignments |
| practice_labs | Coding exercises with validation |
| certificates | Certificate templates |
| skills | Skills library |
| course_rewards | Reward configuration per course |
| achievement_cards | Unlockable achievements |
| motivational_cards | Motivational messages |
| credit_packages | Purchasable credit bundles |
| subscription_plans | Subscription tiers |

---

## Tables Shishya Portal OWNS (Read + Write)

These tables are prefixed with `shishya_` and belong to the student portal.

### Authentication (4 tables)
| Table | Purpose |
|-------|---------|
| shishya_users | Student accounts (email, password_hash, status) |
| shishya_sessions | Login sessions (express-session store) |
| shishya_otp_codes | Email verification OTPs |
| shishya_otp_logs | OTP audit trail |

### Profile (1 table)
| Table | Purpose |
|-------|---------|
| shishya_user_profiles | Extended profile (bio, social links, portfolio) |

### Progress (6 tables)
| Table | Purpose |
|-------|---------|
| shishya_course_enrollments | Which courses user enrolled in |
| shishya_user_progress | Lesson completion tracking |
| shishya_user_lab_progress | Lab completion + saved code |
| shishya_user_test_attempts | Test scores and answers |
| shishya_user_project_submissions | Project submissions |
| shishya_user_certificates | Earned certificates |

### Credits & Wallet (6 tables)
| Table | Purpose |
|-------|---------|
| shishya_user_credits | Current credit balance |
| shishya_credit_transactions | Transaction history |
| shishya_payments | Payment records (Razorpay) |
| shishya_vouchers | Redeemable voucher codes |
| shishya_voucher_redemptions | Voucher usage tracking |
| shishya_gift_boxes | Surprise credit gifts |

### Notifications (1 table)
| Table | Purpose |
|-------|---------|
| shishya_notifications | In-app notifications |

### AI Motivation (8 tables)
| Table | Purpose |
|-------|---------|
| shishya_motivation_rules | Automated trigger rules |
| shishya_rule_trigger_logs | Rule execution log |
| shishya_motivation_cards | Personalized motivation messages |
| shishya_ai_nudge_logs | AI-generated nudges |
| shishya_student_streaks | Learning streak tracking |
| shishya_mystery_boxes | Gamified reward boxes |
| shishya_scholarships | Available scholarships |
| shishya_user_scholarships | Awarded scholarships |

### Academic (2 tables)
| Table | Purpose |
|-------|---------|
| shishya_marksheets | Consolidated academic records |
| shishya_marksheet_verifications | Public verification log |

### AI Tutor - Usha (2 tables)
| Table | Purpose |
|-------|---------|
| shishya_usha_conversations | Chat sessions with context |
| shishya_usha_messages | Individual chat messages |

---

## Key Relationship Patterns

### 1. User to Profile (One-to-One)
```sql
shishya_users.id --> shishya_user_profiles.user_id (UNIQUE)
```

### 2. User to Credits (One-to-One)
```sql
shishya_users.id --> shishya_user_credits.user_id (UNIQUE)
```

### 3. User to Progress (One-to-Many)
```sql
shishya_users.id --> shishya_user_progress.user_id
shishya_users.id --> shishya_course_enrollments.user_id
```

### 4. Course Content Hierarchy
```
courses --> modules --> lessons
courses --> tests --> questions
courses --> projects
courses --> practice_labs
```

---

## API Endpoints Pattern

### Public API (No Auth Required)
Read-only access to published course data:
```
GET /api/public/courses                    -- Published courses
GET /api/public/courses/:id                -- Course details
GET /api/public/courses/:id/modules        -- Course modules
GET /api/public/courses/:id/tests          -- Course tests
GET /api/public/courses/:id/projects       -- Course projects
GET /api/public/courses/:id/labs           -- Course labs
GET /api/public/verify/certificate/:number -- Certificate verification
GET /api/public/verify/marksheet/:number   -- Marksheet verification
```

### Protected API (Auth Required)
Student-specific data:
```
GET/POST /api/shishya/auth/*               -- Auth endpoints
GET/PATCH /api/shishya/profile             -- User profile
GET/POST /api/shishya/enrollments          -- Course enrollments
GET/POST /api/shishya/progress/*           -- Learning progress
GET/POST /api/shishya/credits/*            -- Wallet & transactions
GET /api/shishya/notifications             -- Notifications
GET/POST /api/shishya/usha/*               -- AI tutor chat
```

---

## Authentication Flow

1. **Signup:** Email --> OTP sent --> Verify OTP --> Create account + 50 welcome credits
2. **Login:** Email + Password --> JWT/Session --> Access protected routes
3. **Session:** Store in `shishya_sessions` table (PostgreSQL session store)

---

## Credit System Rules

- **Welcome Bonus:** 50 credits on signup
- **Course Enrollment:** Deduct `courses.credit_cost` from balance
- **Free Courses:** `courses.is_free = true` requires 0 credits
- **Transaction Types:** welcome, purchase, spend, refund, reward

---

## Progress Calculation

### Course Completion Percentage
```sql
SELECT 
  (COUNT(CASE WHEN completed = true THEN 1 END) * 100.0 / 
   (SELECT COUNT(*) FROM lessons WHERE module_id IN 
     (SELECT id FROM modules WHERE course_id = :courseId)))
  AS completion_percentage
FROM shishya_user_progress
WHERE user_id = :userId AND course_id = :courseId
```

### Certificate Eligibility
Check `certificates` table for requirements:
- `requires_test_pass` = true --> Must pass all tests
- `requires_project_completion` = true --> Must submit all projects
- `requires_lab_completion` = true --> Must complete all labs
- `passing_percentage` = Minimum test score required

---

## Do NOT Do These

1. **Never modify course content tables** (courses, modules, lessons, etc.)
2. **Never use legacy tables** (coin_wallets, coin_transactions)
3. **Never query courses without** `status='published' AND is_active=true`
4. **Never use INTEGER for shishya_users.id** - It's VARCHAR(36) UUID
5. **Never expose unpublished content** to students

---

## Technology Stack

- **Database:** PostgreSQL (Neon-compatible)
- **ORM:** Drizzle ORM
- **Auth:** Express sessions + bcrypt + JWT
- **Payments:** Razorpay integration
- **Email:** Resend API for OTPs
- **AI:** OpenAI GPT-4o for Usha tutor

---

## Complete Table Reference

### Shishya Authentication Tables

#### shishya_users
```sql
id              VARCHAR(36)   PRIMARY KEY (UUID v4)
email           VARCHAR(255)  UNIQUE NOT NULL
password_hash   TEXT          NOT NULL
name            VARCHAR(255)  
phone           VARCHAR(20)   
status          VARCHAR(20)   DEFAULT 'active' (active/suspended/deleted)
email_verified  BOOLEAN       DEFAULT false
phone_verified  BOOLEAN       DEFAULT false
last_login_at   TIMESTAMP     
last_active_at  TIMESTAMP     
created_at      TIMESTAMP     DEFAULT NOW()
updated_at      TIMESTAMP     DEFAULT NOW()
```

#### shishya_sessions
```sql
sid             VARCHAR(255)  PRIMARY KEY (session ID)
sess            JSONB         NOT NULL (session data)
expire          TIMESTAMP     NOT NULL (expiration time)
```

#### shishya_otp_codes
```sql
id              SERIAL        PRIMARY KEY
email           VARCHAR(255)  NOT NULL
otp_hash        TEXT          NOT NULL (SHA256 hashed)
expires_at      TIMESTAMP     NOT NULL
verified        BOOLEAN       DEFAULT false
created_at      TIMESTAMP     DEFAULT NOW()
```

### Shishya Progress Tables

#### shishya_course_enrollments
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   FK --> shishya_users.id
course_id       INTEGER       FK --> courses.id
enrolled_at     TIMESTAMP     DEFAULT NOW()
completed_at    TIMESTAMP     
status          VARCHAR(20)   DEFAULT 'active' (active/completed/dropped)
```

#### shishya_user_progress
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   FK --> shishya_users.id
course_id       INTEGER       FK --> courses.id
lesson_id       INTEGER       FK --> lessons.id
completed       BOOLEAN       DEFAULT false
completed_at    TIMESTAMP     
created_at      TIMESTAMP     DEFAULT NOW()
```

#### shishya_user_test_attempts
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   FK --> shishya_users.id
test_id         INTEGER       FK --> tests.id
course_id       INTEGER       FK --> courses.id
score           INTEGER       NOT NULL
total_questions INTEGER       NOT NULL
passed          BOOLEAN       NOT NULL
answers         JSONB         (student's answers)
time_taken      INTEGER       (seconds)
attempted_at    TIMESTAMP     DEFAULT NOW()
```

### Shishya Credits Tables

#### shishya_user_credits
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   UNIQUE FK --> shishya_users.id
balance         INTEGER       DEFAULT 0
lifetime_earned INTEGER       DEFAULT 0
lifetime_spent  INTEGER       DEFAULT 0
updated_at      TIMESTAMP     DEFAULT NOW()
```

#### shishya_credit_transactions
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   FK --> shishya_users.id
amount          INTEGER       NOT NULL (+/-)
type            VARCHAR(20)   NOT NULL (welcome/purchase/spend/refund)
description     TEXT          
reference_id    VARCHAR(100)  (external reference)
created_at      TIMESTAMP     DEFAULT NOW()
```

### Shishya AI Tutor Tables

#### shishya_usha_conversations
```sql
id              SERIAL        PRIMARY KEY
user_id         VARCHAR(36)   FK --> shishya_users.id
course_id       INTEGER       FK --> courses.id
page_type       VARCHAR(20)   (lesson/lab/project/test)
context_id      INTEGER       (lesson_id/lab_id/project_id)
created_at      TIMESTAMP     DEFAULT NOW()
updated_at      TIMESTAMP     DEFAULT NOW()
```

#### shishya_usha_messages
```sql
id              SERIAL        PRIMARY KEY
conversation_id INTEGER       FK --> shishya_usha_conversations.id
role            VARCHAR(20)   NOT NULL (user/assistant)
content         TEXT          NOT NULL
response_type   VARCHAR(50)   (explanation/hint/guidance)
help_level      VARCHAR(20)   (minimal/moderate/detailed)
created_at      TIMESTAMP     DEFAULT NOW()
```

---

## Quick Reference Queries

### Get user's enrolled courses with progress
```sql
SELECT 
  c.id, c.name, c.level,
  e.enrolled_at, e.status,
  COUNT(CASE WHEN p.completed THEN 1 END) as lessons_completed,
  COUNT(p.id) as total_tracked
FROM shishya_course_enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN shishya_user_progress p ON p.user_id = e.user_id AND p.course_id = c.id
WHERE e.user_id = :userId
  AND c.status = 'published' AND c.is_active = true
GROUP BY c.id, e.enrolled_at, e.status
```

### Get user's credit balance and recent transactions
```sql
SELECT 
  uc.balance, uc.lifetime_earned, uc.lifetime_spent,
  (SELECT json_agg(t) FROM (
    SELECT amount, type, description, created_at 
    FROM shishya_credit_transactions 
    WHERE user_id = :userId 
    ORDER BY created_at DESC LIMIT 10
  ) t) as recent_transactions
FROM shishya_user_credits uc
WHERE uc.user_id = :userId
```

### Check certificate eligibility
```sql
SELECT 
  cert.id, cert.name,
  cert.requires_test_pass,
  cert.requires_project_completion,
  cert.requires_lab_completion,
  cert.passing_percentage,
  (SELECT COALESCE(AVG(score), 0) FROM shishya_user_test_attempts 
   WHERE user_id = :userId AND course_id = :courseId AND passed = true) as avg_score,
  (SELECT COUNT(*) FROM shishya_user_project_submissions 
   WHERE user_id = :userId AND course_id = :courseId AND status = 'approved') as projects_approved
FROM certificates cert
WHERE cert.course_id = :courseId
```

---

*This guide provides everything needed to build the Shishya portal with correct database access patterns.*

*Last Updated: January 2026*
