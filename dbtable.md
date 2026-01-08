# Oushiksha Guru - Database Schema Documentation

Complete reference for all PostgreSQL database tables used in the Oushiksha Guru admin platform.

---

## Table of Contents

1. [Admin & Authentication](#admin--authentication)
2. [Course Management (Core)](#course-management-core)
3. [Course Content](#course-content)
4. [Projects & Labs](#projects--labs)
5. [Tests & Questions](#tests--questions)
6. [Certificates](#certificates)
7. [Business & Payments](#business--payments)
8. [Shishya (Student) Portal](#shishya-student-portal)
9. [Rewards & Gamification](#rewards--gamification)
10. [Fraud Detection & Security](#fraud-detection--security)
11. [Audit & Logging](#audit--logging)

---

## Admin & Authentication

### `users`
**Purpose**: Stores admin user accounts for the Guru (admin) portal.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar | No | UUID | Primary key (auto-generated UUID) |
| `username` | text | No | - | Unique username for login |
| `email` | text | No | - | Unique email address |
| `password` | text | No | - | Bcrypt hashed password (12 rounds) |
| `role` | text | No | 'admin' | User role: 'admin', 'pending_admin', 'super_admin' |
| `is_active` | boolean | No | true | Whether account is active |
| `is_email_verified` | boolean | No | false | Email verification status |
| `two_factor_enabled` | boolean | No | false | 2FA enabled flag |
| `failed_login_attempts` | integer | No | 0 | Counter for failed logins |
| `locked_until` | timestamp | Yes | - | Account lockout expiry time |
| `invited_by` | varchar | Yes | - | FK to users.id (inviter) |
| `last_login_at` | timestamp | Yes | - | Last successful login time |
| `created_at` | timestamp | No | NOW() | Account creation time |

**Usage**: Used for admin authentication, role-based access control, and account security.

---

### `otp_tokens`
**Purpose**: Stores one-time passwords for email verification during signup.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `user_id` | varchar | No | - | FK to users.id |
| `otp` | text | No | - | 6-digit OTP code |
| `expires_at` | timestamp | No | - | OTP expiration time |
| `attempts` | integer | No | 0 | Number of verification attempts |
| `is_used` | boolean | No | false | Whether OTP was used |
| `created_at` | timestamp | No | NOW() | Token creation time |

**Usage**: Email verification during admin signup. Sent via Resend API.

---

### `admin_sessions`
**Purpose**: Tracks active admin login sessions for security monitoring.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar | No | UUID | Primary key |
| `user_id` | varchar | No | - | FK to users.id |
| `token` | text | No | - | JWT token |
| `device` | text | Yes | - | Device type (mobile, desktop) |
| `browser` | text | Yes | - | Browser name |
| `ip_address` | text | Yes | - | Client IP address |
| `location` | text | Yes | - | Geo-location |
| `is_active` | boolean | No | true | Session active status |
| `last_active_at` | timestamp | No | NOW() | Last activity time |
| `expires_at` | timestamp | No | - | Session expiration (12 hours) |
| `created_at` | timestamp | No | NOW() | Session start time |

**Usage**: Session management, concurrent login tracking, session revocation.

---

### `login_attempts`
**Purpose**: Records all login attempts for security auditing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `email` | text | No | - | Attempted email |
| `user_id` | varchar | Yes | - | FK to users.id (if found) |
| `success` | boolean | No | - | Login success/failure |
| `ip_address` | text | Yes | - | Client IP |
| `user_agent` | text | Yes | - | Browser user agent |
| `location` | text | Yes | - | Geo-location |
| `reason` | text | Yes | - | Failure reason |
| `created_at` | timestamp | No | NOW() | Attempt timestamp |

**Usage**: Security monitoring, brute force detection, audit trail.

---

## Course Management (Core)

### `courses`
**Purpose**: Main course table - SINGLE SOURCE OF TRUTH for all course data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Course title |
| `description` | text | Yes | - | Course description |
| `level` | text | No | 'beginner' | 'beginner', 'intermediate', 'advanced' |
| `target_audience` | text | Yes | - | Who this course is for |
| `duration` | text | Yes | - | Estimated duration (e.g., "8 weeks") |
| `overview` | text | Yes | - | Course overview/summary |
| `learning_outcomes` | jsonb | Yes | - | Array of learning outcomes |
| `job_roles` | jsonb | Yes | - | Array of target job roles |
| `include_projects` | boolean | Yes | true | Generate projects flag |
| `include_tests` | boolean | Yes | true | Generate tests flag |
| `include_labs` | boolean | Yes | true | Generate labs flag |
| `certificate_type` | text | Yes | 'completion' | Certificate type |
| `status` | text | No | 'draft' | **'draft' \| 'published' \| 'archived' \| 'generating'** |
| `is_active` | boolean | No | false | **Controls Shishya visibility** |
| `ai_command` | text | Yes | - | Original AI generation command |
| `thumbnail_url` | text | Yes | - | Course thumbnail image URL |
| `credit_cost` | integer | No | 0 | Price in credits |
| `is_free` | boolean | No | true | Free course flag |
| `original_credit_cost` | integer | Yes | - | Original price (for discounts) |
| `pricing_updated_at` | timestamp | Yes | - | Last pricing update |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update time |
| `published_at` | timestamp | Yes | - | **Set when published** |
| `deleted_at` | timestamp | Yes | - | Soft delete timestamp |
| `version` | integer | No | 1 | Version number |

**Status Flow**:
- `draft` → Default state, editable, not visible to students
- `generating` → AI is generating content (cannot publish)
- `published` → Live and visible to Shishya portal (`is_active=true`)
- `archived` → Preserved for audit, hidden from students (`is_active=false`)

**Shishya Visibility Rule** (MANDATORY):
```sql
SELECT * FROM courses WHERE status = 'published' AND is_active = true;
```

**Usage**: Core course management, publishing workflow, student portal API.

---

### `course_skills`
**Purpose**: Junction table linking courses to skills (many-to-many).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id |
| `skill_id` | integer | No | - | FK to skills.id |

**Usage**: Tag courses with skills for filtering and categorization.

---

### `skills`
**Purpose**: Master list of skills/tags used across the platform.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Unique skill name |
| `category` | text | Yes | - | Skill category |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Skills library, course tagging, project requirements.

---

## Course Content

### `modules`
**Purpose**: Course modules/chapters that group lessons together.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id (CASCADE DELETE) |
| `title` | text | No | - | Module title |
| `description` | text | Yes | - | Module description |
| `order_index` | integer | No | 0 | Display order |
| `estimated_time` | text | Yes | - | Time estimate |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Organize course content into logical sections.

---

### `lessons`
**Purpose**: Individual lessons within modules containing learning content.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `module_id` | integer | No | - | FK to modules.id (CASCADE DELETE) |
| `title` | text | No | - | Lesson title |
| `objectives` | jsonb | Yes | - | Array of learning objectives |
| `estimated_time` | text | Yes | - | Duration estimate |
| `key_concepts` | jsonb | Yes | - | Array of key concepts |
| `video_url` | text | Yes | - | Primary video URL |
| `external_links` | jsonb | Yes | - | Array of external resource URLs |
| `youtube_references` | jsonb | Yes | - | Array of {url, title, description?} |
| `order_index` | integer | No | 0 | Display order within module |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Main learning content delivery, video references, supplementary materials.

---

### `ai_notes`
**Purpose**: AI-generated study notes for lessons.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `lesson_id` | integer | No | - | FK to lessons.id (CASCADE DELETE) |
| `content` | text | No | - | Full markdown content |
| `simplified_explanation` | text | Yes | - | ELI5 explanation |
| `bullet_notes` | jsonb | Yes | - | Array of bullet points |
| `key_takeaways` | jsonb | Yes | - | Array of takeaways |
| `interview_questions` | jsonb | Yes | - | Array of prep questions |
| `version` | integer | No | 1 | Version number |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: AI-powered study aids, interview prep, quick revision.

---

## Projects & Labs

### `projects`
**Purpose**: Capstone projects for hands-on learning.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | Yes | - | FK to courses.id (SET NULL) |
| `module_id` | integer | Yes | - | FK to modules.id (SET NULL) |
| `title` | text | No | - | Project title |
| `description` | text | Yes | - | Project description |
| `objectives` | text | Yes | - | Learning objectives |
| `deliverables` | text | Yes | - | Expected deliverables |
| `submission_instructions` | text | Yes | - | How to submit |
| `evaluation_notes` | text | Yes | - | Grading criteria |
| `problem_statement` | text | Yes | - | Detailed problem to solve |
| `tech_stack` | jsonb | Yes | - | Array of technologies |
| `folder_structure` | text | Yes | - | Suggested file structure |
| `evaluation_checklist` | jsonb | Yes | - | Array of evaluation items |
| `difficulty` | text | Yes | 'intermediate' | Difficulty level |
| `category` | text | Yes | - | Project category |
| `tags` | jsonb | Yes | - | Array of tags |
| `status` | text | No | 'draft' | Project status |
| `order_index` | integer | No | 0 | Display order |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Course capstone projects, portfolio building, practical assessment.

---

### `project_steps`
**Purpose**: Step-by-step guide for completing projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `project_id` | integer | No | - | FK to projects.id (CASCADE DELETE) |
| `step_number` | integer | No | - | Step sequence number |
| `title` | text | No | - | Step title |
| `description` | text | Yes | - | Step instructions |
| `code_snippet` | text | Yes | - | Example code |
| `tips` | jsonb | Yes | - | Array of helpful tips |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Guided project completion, progressive disclosure.

---

### `project_skills`
**Purpose**: Skills required/taught by each project.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `project_id` | integer | No | - | FK to projects.id (CASCADE DELETE) |
| `skill_id` | integer | No | - | FK to skills.id (CASCADE DELETE) |

**Usage**: Skill mapping for projects.

---

### `practice_labs`
**Purpose**: Interactive coding labs with starter code and validation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | Yes | - | FK to courses.id (SET NULL) |
| `module_id` | integer | Yes | - | FK to modules.id (SET NULL) |
| `lesson_id` | integer | Yes | - | FK to lessons.id (SET NULL) |
| `category` | text | Yes | - | Lab category |
| `tags` | jsonb | Yes | - | Array of tags |
| `slug` | text | No | - | URL slug |
| `title` | text | No | - | Lab title |
| `description` | text | Yes | - | Lab description |
| `difficulty` | text | No | 'beginner' | Difficulty level |
| `language` | text | No | 'javascript' | Programming language |
| `estimated_time` | integer | Yes | - | Minutes to complete |
| `instructions` | text | Yes | - | Lab instructions |
| `starter_code` | text | Yes | - | Initial code template |
| `solution_code` | text | Yes | - | Reference solution |
| `expected_output` | text | Yes | - | Expected result |
| `validation_type` | text | No | 'console' | 'console', 'test', 'output' |
| `unlock_type` | text | Yes | - | Prerequisite type |
| `unlock_ref_id` | integer | Yes | - | Prerequisite ID |
| `hints` | jsonb | Yes | - | Array of hints |
| `ai_prompt_context` | text | Yes | - | Context for AI assistance |
| `mark_lab_complete` | boolean | Yes | true | Auto-mark on success |
| `unlock_next` | boolean | Yes | true | Unlock next content |
| `contributes_to_certificate` | boolean | Yes | false | Certificate requirement |
| `certificate_weight` | integer | Yes | 1 | Weight for certificate |
| `status` | text | No | 'draft' | Lab status |
| `order_index` | integer | No | 0 | Display order |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Interactive coding practice, automated validation, skill building.

---

## Tests & Questions

### `tests`
**Purpose**: Assessments/quizzes for modules or courses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | Yes | - | FK to courses.id (SET NULL) |
| `module_id` | integer | Yes | - | FK to modules.id (SET NULL) |
| `title` | text | No | - | Test title |
| `description` | text | Yes | - | Test description |
| `passing_percentage` | integer | Yes | 70 | Minimum score to pass |
| `is_locked` | boolean | Yes | false | Requires prerequisite |
| `time_limit` | integer | Yes | - | Time limit in minutes |
| `difficulty` | text | Yes | 'medium' | Difficulty level |
| `category` | text | Yes | - | Test category |
| `tags` | jsonb | Yes | - | Array of tags |
| `status` | text | No | 'draft' | Test status |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Knowledge assessment, certification requirements.

---

### `questions`
**Purpose**: Individual questions within tests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `test_id` | integer | No | - | FK to tests.id (CASCADE DELETE) |
| `type` | text | No | 'mcq' | 'mcq', 'true_false', 'short_answer' |
| `difficulty` | text | Yes | 'medium' | Question difficulty |
| `question_text` | text | No | - | The question |
| `options` | jsonb | Yes | - | Array of answer options (MCQ) |
| `correct_answer` | text | Yes | - | Correct answer |
| `explanation` | text | Yes | - | Answer explanation |
| `order_index` | integer | No | 0 | Display order |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Quiz questions, knowledge testing.

---

## Certificates

### `certificates`
**Purpose**: Certificate templates and requirements per course.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | Yes | - | FK to courses.id (SET NULL) |
| `name` | text | No | - | Certificate name |
| `description` | text | Yes | - | Certificate description |
| `template_id` | text | Yes | - | Design template ID |
| `category` | text | Yes | - | Certificate category |
| `tags` | jsonb | Yes | - | Array of tags |
| `status` | text | No | 'draft' | Certificate status |
| `type` | text | No | 'completion' | 'completion', 'excellence', 'mastery' |
| `skill_tags` | jsonb | Yes | - | Skills earned |
| `level` | text | Yes | - | Certificate level |
| `requires_test_pass` | boolean | Yes | false | Requires passing tests |
| `passing_percentage` | integer | Yes | 70 | Minimum test score |
| `requires_project_completion` | boolean | Yes | false | Requires project |
| `requires_lab_completion` | boolean | Yes | false | Requires labs |
| `qr_verification` | boolean | Yes | false | QR code for verification |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Certificate generation, completion requirements.

---

## Business & Payments

### `credit_packages`
**Purpose**: Credit bundles available for purchase.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Package name |
| `description` | text | Yes | - | Package description |
| `credits` | integer | No | - | Number of credits |
| `price_inr` | integer | No | - | Price in INR (paise) |
| `price_usd` | integer | Yes | - | Price in USD (cents) |
| `discount` | integer | Yes | 0 | Discount percentage |
| `is_active` | boolean | No | true | Available for purchase |
| `is_featured` | boolean | Yes | false | Featured package |
| `validity_days` | integer | Yes | - | Credit validity period |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Credit-based course purchases.

---

### `subscription_plans`
**Purpose**: Monthly/yearly subscription tiers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Plan name |
| `slug` | text | No | - | URL slug (unique) |
| `price_monthly` | integer | No | 0 | Monthly price (INR) |
| `price_yearly` | integer | No | 0 | Yearly price (INR) |
| `coins_per_month` | integer | No | 0 | Monthly coin allowance |
| `signup_bonus_coins` | integer | No | 0 | One-time signup bonus |
| `features` | jsonb | Yes | - | Feature flags object |
| `is_active` | boolean | No | true | Plan available |
| `is_featured` | boolean | No | false | Featured plan |
| `sort_order` | integer | Yes | 0 | Display order |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Features JSON**:
```json
{
  "aiUsha": true,
  "labs": true,
  "tests": true,
  "projects": true,
  "certificates": true,
  "prioritySupport": false,
  "maxCoursesAccess": 10
}
```

**Usage**: Subscription management, feature gating.

---

### `vouchers`
**Purpose**: Discount and bonus voucher codes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `code` | text | No | - | Unique voucher code |
| `name` | text | No | - | Voucher name |
| `description` | text | Yes | - | Voucher description |
| `type` | text | No | 'discount' | 'discount', 'credit_bonus' |
| `discount_type` | text | Yes | 'percentage' | 'percentage', 'flat' |
| `discount_value` | integer | No | - | Discount amount |
| `credit_bonus` | integer | Yes | 0 | Bonus credits |
| `max_uses` | integer | Yes | - | Max redemptions |
| `used_count` | integer | No | 0 | Current redemptions |
| `min_purchase` | integer | Yes | 0 | Minimum purchase |
| `is_active` | boolean | No | true | Voucher active |
| `starts_at` | timestamp | Yes | - | Start date |
| `expires_at` | timestamp | Yes | - | Expiry date |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Promotional discounts, marketing campaigns.

---

### `gift_boxes`
**Purpose**: Gift credit packages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Gift box name |
| `description` | text | Yes | - | Description |
| `credits` | integer | No | - | Credits included |
| `price_inr` | integer | No | - | Price in INR |
| `price_usd` | integer | Yes | - | Price in USD |
| `template_image` | text | Yes | - | Gift card image URL |
| `custom_message` | text | Yes | - | Customizable message |
| `is_active` | boolean | No | true | Available for purchase |
| `expiry_days` | integer | Yes | 365 | Gift validity days |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Gift card purchases, referral rewards.

---

### `payment_gateways`
**Purpose**: Payment provider configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Gateway name |
| `type` | text | No | - | 'razorpay', 'stripe', 'paypal' |
| `is_active` | boolean | No | false | Gateway enabled |
| `is_test_mode` | boolean | No | true | Test/sandbox mode |
| `config` | jsonb | Yes | - | Gateway-specific config |
| `priority` | integer | Yes | 0 | Selection priority |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Payment processing configuration.

---

### `upi_settings`
**Purpose**: UPI payment configuration (India).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `upi_id` | text | No | - | UPI ID/VPA |
| `display_name` | text | No | - | Display name |
| `is_active` | boolean | No | true | UPI enabled |
| `qr_code_image` | text | Yes | - | QR code image URL |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: UPI payment acceptance.

---

### `bank_accounts`
**Purpose**: Bank account details for transfers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `bank_name` | text | No | - | Bank name |
| `account_number` | text | No | - | Account number |
| `account_holder_name` | text | No | - | Account holder name |
| `ifsc_code` | text | No | - | IFSC code |
| `branch_name` | text | Yes | - | Branch name |
| `account_type` | text | Yes | 'savings' | Account type |
| `is_active` | boolean | No | true | Account active |
| `is_primary` | boolean | No | false | Primary account |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Bank transfer instructions.

---

### `promotions`
**Purpose**: Marketing promotions and campaigns.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `title` | text | No | - | Promotion title |
| `code` | text | Yes | - | Promo code (unique) |
| `type` | text | No | 'bonus_coins' | Promotion type |
| `bonus_coins` | integer | Yes | 0 | Bonus coins awarded |
| `discount_percent` | integer | Yes | 0 | Discount percentage |
| `plan_id` | integer | Yes | - | FK to subscription_plans.id |
| `is_global` | boolean | No | true | Available to all |
| `valid_from` | timestamp | No | - | Start date |
| `valid_to` | timestamp | No | - | End date |
| `max_redemptions` | integer | Yes | - | Max total uses |
| `current_redemptions` | integer | No | 0 | Current uses |
| `is_active` | boolean | No | true | Promotion active |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Marketing campaigns, limited-time offers.

---

## Shishya (Student) Portal

### `shishya_users`
**Purpose**: Student accounts in the Shishya portal.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `external_id` | text | Yes | - | External auth ID (unique) |
| `name` | text | No | - | Full name |
| `email` | text | No | - | Email (unique) |
| `phone` | text | Yes | - | Phone number |
| `avatar_url` | text | Yes | - | Profile picture URL |
| `status` | text | No | 'active' | 'active', 'suspended', 'deleted' |
| `last_active_at` | timestamp | Yes | - | Last activity time |
| `total_spend` | integer | No | 0 | Lifetime spend (INR) |
| `signup_source` | text | Yes | - | Acquisition channel |
| `created_at` | timestamp | No | NOW() | Registration time |

**Usage**: Student management, analytics, engagement tracking.

---

### `user_subscriptions`
**Purpose**: Student subscription records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `plan_id` | integer | No | - | FK to subscription_plans.id |
| `status` | text | No | 'active' | Subscription status |
| `start_date` | timestamp | No | - | Subscription start |
| `end_date` | timestamp | Yes | - | Subscription end |
| `billing_cycle` | text | Yes | 'monthly' | Billing frequency |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Subscription management, billing.

---

### `coin_wallets`
**Purpose**: Student reward coin balances.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id (unique) |
| `balance` | integer | No | 0 | Current coin balance |
| `lifetime_earned` | integer | No | 0 | Total coins earned |
| `lifetime_spent` | integer | No | 0 | Total coins spent |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Reward system, gamification.

---

### `coin_transactions`
**Purpose**: Coin transaction history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `amount` | integer | No | - | Transaction amount (+/-) |
| `type` | text | No | - | 'earn', 'spend', 'bonus', 'revoke' |
| `reason` | text | Yes | - | Transaction reason |
| `reference_id` | text | Yes | - | Related entity ID |
| `reference_type` | text | Yes | - | Related entity type |
| `balance_after` | integer | No | - | Balance after transaction |
| `created_at` | timestamp | No | NOW() | Transaction time |

**Usage**: Coin ledger, transaction history.

---

### `shishya_payments`
**Purpose**: Student payment records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `amount` | integer | No | - | Payment amount |
| `currency` | text | No | 'INR' | Currency code |
| `status` | text | No | 'pending' | Payment status |
| `payment_method` | text | Yes | - | Payment method used |
| `provider` | text | Yes | - | Payment gateway |
| `provider_transaction_id` | text | Yes | - | Gateway transaction ID |
| `subscription_id` | integer | Yes | - | FK to user_subscriptions.id |
| `metadata` | jsonb | Yes | - | Additional payment data |
| `created_at` | timestamp | No | NOW() | Payment initiation |
| `completed_at` | timestamp | Yes | - | Payment completion |

**Usage**: Payment tracking, revenue reports.

---

### `activity_logs`
**Purpose**: Student activity tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | Yes | - | FK to shishya_users.id |
| `action` | text | No | - | Activity type |
| `entity_type` | text | Yes | - | Related entity type |
| `entity_id` | text | Yes | - | Related entity ID |
| `metadata` | jsonb | Yes | - | Activity details |
| `ip_address` | text | Yes | - | Client IP |
| `user_agent` | text | Yes | - | Browser user agent |
| `created_at` | timestamp | No | NOW() | Activity time |

**Usage**: Student engagement analytics, learning paths.

---

## Rewards & Gamification

### `course_rewards`
**Purpose**: Reward configuration per course.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id (unique) |
| `coins_enabled` | boolean | No | false | Coins feature enabled |
| `coin_name` | text | Yes | 'Skill Coins' | Custom coin name |
| `coin_icon` | text | Yes | 'coins' | Coin icon name |
| `rules_json` | jsonb | Yes | {...} | Coin earning rules |
| `bonus_json` | jsonb | Yes | {...} | Bonus configurations |
| `scholarship_enabled` | boolean | Yes | false | Scholarship feature |
| `scholarship_json` | jsonb | Yes | - | Scholarship config |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Rules JSON default**:
```json
{
  "courseCompletion": 100,
  "moduleCompletion": 20,
  "lessonCompletion": 5,
  "testPass": 15,
  "projectSubmission": 25,
  "labCompletion": 10
}
```

**Usage**: Course-specific gamification settings.

---

### `achievement_cards`
**Purpose**: Achievement badges students can earn.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id |
| `title` | text | No | - | Achievement title |
| `description` | text | Yes | - | Achievement description |
| `icon` | text | Yes | 'trophy' | Icon name |
| `condition_json` | jsonb | No | - | Earning conditions |
| `rarity` | text | No | 'common' | 'common', 'rare', 'epic', 'legendary' |
| `is_active` | boolean | No | true | Achievement active |
| `sort_order` | integer | Yes | 0 | Display order |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Condition types**: 'percentage_complete', 'module_complete', 'all_tests_passed', 'project_approved', 'all_labs_complete', 'custom'

**Usage**: Student motivation, progress milestones.

---

### `motivational_cards`
**Purpose**: Motivational messages shown at triggers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id |
| `message` | text | No | - | Motivational message |
| `trigger_type` | text | No | - | When to show |
| `trigger_value` | integer | Yes | - | Trigger threshold |
| `icon` | text | Yes | 'sparkles' | Icon name |
| `is_active` | boolean | No | true | Card active |
| `sort_order` | integer | Yes | 0 | Priority order |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Student encouragement, engagement boost.

---

### `approval_policies`
**Purpose**: Reward approval rules and limits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `reward_type` | text | No | - | Reward type |
| `approval_mode` | text | No | 'admin_approval_required' | Approval mode |
| `min_value_for_approval` | integer | Yes | 0 | Minimum value needing approval |
| `max_auto_approve_value` | integer | Yes | 100 | Max auto-approve threshold |
| `require_dual_approval` | boolean | Yes | false | Requires two approvers |
| `dual_approval_threshold` | integer | Yes | 1000 | Dual approval threshold |
| `cooldown_minutes` | integer | Yes | 0 | Time between rewards |
| `daily_limit` | integer | Yes | - | Daily limit per user |
| `weekly_limit` | integer | Yes | - | Weekly limit per user |
| `is_active` | boolean | No | true | Policy active |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Fraud prevention, reward governance.

---

### `motivation_rules`
**Purpose**: AI engine rules for automatic rewards.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `name` | text | No | - | Rule name |
| `description` | text | Yes | - | Rule description |
| `trigger_type` | text | No | - | Event type |
| `trigger_condition` | jsonb | Yes | - | Condition details |
| `reward_type` | text | No | - | Reward type |
| `reward_value` | integer | No | 0 | Reward amount |
| `reward_metadata` | jsonb | Yes | - | Additional reward data |
| `approval_mode` | text | No | 'admin_approval_required' | Approval requirement |
| `priority` | integer | Yes | 0 | Rule priority |
| `is_active` | boolean | No | true | Rule active |
| `valid_from` | timestamp | Yes | - | Start validity |
| `valid_to` | timestamp | Yes | - | End validity |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Automated reward triggering, AI motivation engine.

---

### `reward_approvals`
**Purpose**: Pending reward approval queue.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `rule_id` | integer | Yes | - | FK to motivation_rules.id |
| `reward_type` | text | No | - | Reward type |
| `original_value` | integer | No | - | Proposed value |
| `adjusted_value` | integer | Yes | - | Adjusted by admin |
| `status` | text | No | 'pending' | Approval status |
| `trigger_event` | text | Yes | - | Triggering event |
| `trigger_data` | jsonb | Yes | - | Event details |
| `ai_reason` | text | Yes | - | AI-generated reason |
| `risk_score` | integer | Yes | 0 | Fraud risk score |
| `is_flagged` | boolean | Yes | false | Flagged for review |
| `flag_reason` | text | Yes | - | Flag reason |
| `reviewed_by` | varchar | Yes | - | FK to users.id |
| `reviewed_at` | timestamp | Yes | - | Review time |
| `review_notes` | text | Yes | - | Admin notes |
| `second_approver` | varchar | Yes | - | FK to users.id (dual approval) |
| `second_approved_at` | timestamp | Yes | - | Second approval time |
| `wallet_transaction_id` | integer | Yes | - | Resulting transaction |
| `expires_at` | timestamp | Yes | - | Approval expiry |
| `created_at` | timestamp | No | NOW() | Creation time |
| `updated_at` | timestamp | No | NOW() | Last update |

**Statuses**: 'pending', 'approved', 'rejected', 'revoked', 'adjusted'

**Usage**: Reward moderation, fraud prevention.

---

### `reward_overrides`
**Purpose**: Manual admin reward actions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `admin_id` | varchar | No | - | FK to users.id |
| `action_type` | text | No | - | 'grant', 'revoke', 'adjust' |
| `reward_type` | text | Yes | - | Reward type |
| `amount` | integer | Yes | - | Amount affected |
| `reason` | text | No | - | Justification (required) |
| `metadata` | jsonb | Yes | - | Additional data |
| `wallet_transaction_id` | integer | Yes | - | Resulting transaction |
| `created_at` | timestamp | No | NOW() | Action time |

**Usage**: Manual reward adjustments, customer support.

---

### `scholarships`
**Purpose**: Scholarship records for students.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `reward_approval_id` | integer | Yes | - | FK to reward_approvals.id |
| `title` | text | No | - | Scholarship title |
| `description` | text | Yes | - | Scholarship description |
| `amount` | integer | No | - | Scholarship value |
| `currency` | text | Yes | 'INR' | Currency |
| `status` | text | No | 'pending' | Scholarship status |
| `course_id` | integer | Yes | - | FK to courses.id |
| `valid_from` | timestamp | Yes | - | Start validity |
| `valid_to` | timestamp | Yes | - | End validity |
| `issued_by` | varchar | Yes | - | FK to users.id |
| `issued_at` | timestamp | Yes | - | Issue time |
| `redeemed_at` | timestamp | Yes | - | Redemption time |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Financial aid, merit scholarships.

---

## Fraud Detection & Security

### `fraud_flags`
**Purpose**: Detected fraud patterns and alerts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `flag_type` | text | No | - | Type of fraud detected |
| `severity` | text | No | 'medium' | 'low', 'medium', 'high', 'critical' |
| `description` | text | Yes | - | Flag description |
| `detection_data` | jsonb | Yes | - | Detection details |
| `status` | text | No | 'active' | Flag status |
| `resolved_by` | varchar | Yes | - | FK to users.id |
| `resolved_at` | timestamp | Yes | - | Resolution time |
| `resolution_notes` | text | Yes | - | Resolution notes |
| `created_at` | timestamp | No | NOW() | Detection time |

**Usage**: Fraud monitoring, account review.

---

### `wallet_freezes`
**Purpose**: Frozen student wallets due to fraud.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id |
| `reason` | text | No | - | Freeze reason |
| `frozen_by` | varchar | No | - | FK to users.id |
| `frozen_at` | timestamp | No | NOW() | Freeze time |
| `unfrozen_by` | varchar | Yes | - | FK to users.id |
| `unfrozen_at` | timestamp | Yes | - | Unfreeze time |
| `unfreeze_reason` | text | Yes | - | Unfreeze justification |
| `is_active` | boolean | No | true | Currently frozen |

**Usage**: Fraud prevention, wallet security.

---

### `risk_scores`
**Purpose**: Calculated fraud risk per student.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `shishya_user_id` | integer | No | - | FK to shishya_users.id (unique) |
| `overall_score` | integer | No | 0 | Combined risk score (0-100) |
| `velocity_score` | integer | Yes | 0 | Activity velocity risk |
| `pattern_score` | integer | Yes | 0 | Suspicious pattern risk |
| `account_age_score` | integer | Yes | 0 | New account risk |
| `behavior_score` | integer | Yes | 0 | Behavioral anomaly risk |
| `last_calculated_at` | timestamp | No | NOW() | Last calculation time |
| `risk_factors` | jsonb | Yes | - | Detected risk factors |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Real-time fraud detection, automated flagging.

---

## Audit & Logging

### `audit_logs`
**Purpose**: General audit trail for all entities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `user_id` | varchar | Yes | - | FK to users.id (admin) |
| `action` | text | No | - | Action performed |
| `entity_type` | text | No | - | Entity type affected |
| `entity_id` | integer | Yes | - | Entity ID |
| `old_value` | jsonb | Yes | - | Previous state |
| `new_value` | jsonb | Yes | - | New state |
| `metadata` | jsonb | Yes | - | Additional context |
| `created_at` | timestamp | No | NOW() | Action time |

**Usage**: Change tracking, compliance, debugging.

---

### `admin_action_logs`
**Purpose**: Immutable log of admin actions (cannot be deleted).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `admin_id` | varchar | No | - | FK to users.id |
| `action_type` | text | No | - | Action type |
| `entity_type` | text | No | - | Entity type |
| `entity_id` | text | Yes | - | Entity ID |
| `previous_state` | jsonb | Yes | - | Before state |
| `new_state` | jsonb | Yes | - | After state |
| `reason` | text | Yes | - | Action reason |
| `ip_address` | text | Yes | - | Admin IP |
| `user_agent` | text | Yes | - | Browser info |
| `created_at` | timestamp | No | NOW() | Action time |

**Usage**: Admin accountability, security audit.

---

### `ai_generation_logs`
**Purpose**: AI content generation history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | Yes | - | FK to courses.id |
| `generation_type` | text | No | - | Type of generation |
| `prompt` | text | Yes | - | AI prompt used |
| `response` | text | Yes | - | AI response |
| `tokens_used` | integer | Yes | - | Token consumption |
| `status` | text | No | 'pending' | Generation status |
| `error_message` | text | Yes | - | Error if failed |
| `created_at` | timestamp | No | NOW() | Start time |
| `completed_at` | timestamp | Yes | - | Completion time |

**Usage**: AI cost tracking, debugging, prompt history.

---

### `publish_status`
**Purpose**: Course publishing status per platform.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `course_id` | integer | No | - | FK to courses.id |
| `platform` | text | No | - | Platform name |
| `status` | text | No | 'pending' | Sync status |
| `synced_at` | timestamp | Yes | - | Last sync time |
| `error_message` | text | Yes | - | Sync error |
| `created_at` | timestamp | No | NOW() | Creation time |

**Usage**: Multi-platform publishing, sync status.

---

### `system_settings`
**Purpose**: Global system configuration key-value store.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | serial | No | Auto | Primary key |
| `key` | text | No | - | Setting key (unique) |
| `value` | text | Yes | - | Setting value |
| `description` | text | Yes | - | Setting description |
| `updated_at` | timestamp | No | NOW() | Last update |

**Usage**: Runtime configuration, feature flags.

---

## Entity Relationships Summary

```
courses (1) ─────┬───── (*) modules ──────── (*) lessons ──────── (*) ai_notes
                 │
                 ├───── (*) projects ──────── (*) project_steps
                 │                └───────── (*) project_skills ──── skills
                 │
                 ├───── (*) tests ─────────── (*) questions
                 │
                 ├───── (*) practice_labs
                 │
                 ├───── (*) certificates
                 │
                 ├───── (*) course_skills ──── skills
                 │
                 ├───── (1) course_rewards ──┬── (*) achievement_cards
                 │                           └── (*) motivational_cards
                 │
                 └───── (*) scholarships

shishya_users (1) ──┬── (1) coin_wallets ──── (*) coin_transactions
                    │
                    ├── (*) user_subscriptions ──── subscription_plans
                    │
                    ├── (*) shishya_payments
                    │
                    ├── (*) activity_logs
                    │
                    ├── (*) reward_approvals
                    │
                    ├── (*) fraud_flags
                    │
                    ├── (1) risk_scores
                    │
                    └── (*) wallet_freezes

users (admins) ──┬── (*) admin_sessions
                 │
                 ├── (*) otp_tokens
                 │
                 ├── (*) login_attempts
                 │
                 ├── (*) audit_logs
                 │
                 └── (*) admin_action_logs
```

---

## Quick Reference: Common Queries

### Get Published Courses for Shishya Portal
```sql
SELECT * FROM courses 
WHERE status = 'published' AND is_active = true;
```

### Get Course with All Content
```sql
SELECT c.*, 
       m.id as module_id, m.title as module_title,
       l.id as lesson_id, l.title as lesson_title
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
WHERE c.id = :courseId
ORDER BY m.order_index, l.order_index;
```

### Get Dashboard Stats
```sql
SELECT 
  COUNT(*) as total_courses,
  COUNT(*) FILTER (WHERE status = 'published') as published_courses,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_courses,
  COUNT(*) FILTER (WHERE status = 'archived') as archived_courses,
  COUNT(*) FILTER (WHERE status = 'generating') as generating_courses
FROM courses;
```

---

*Last Updated: January 2026*
