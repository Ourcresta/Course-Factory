# OurShiksha Database Schema Reference

## Complete Database Documentation for Guru (Admin) and Shishya (Student) Portals

**Database**: PostgreSQL  
**ORM**: Drizzle ORM  
**Total Tables**: 55+  
**Architecture**: Shared database between Admin and Student portals

---

## Table of Contents

1. [Admin Authentication & Security](#1-admin-authentication--security)
2. [Course Content Management](#2-course-content-management)
3. [Assessments & Practice](#3-assessments--practice)
4. [Student Management (Shishya)](#4-student-management-shishya)
5. [Payments & Subscriptions](#5-payments--subscriptions)
6. [Rewards & Gamification](#6-rewards--gamification)
7. [RBAC System](#7-rbac-system)
8. [Approval Workflows](#8-approval-workflows)
9. [Course Versioning & Quality](#9-course-versioning--quality)
10. [AI & Governance](#10-ai--governance)
11. [Audit & Security Logs](#11-audit--security-logs)
12. [System Configuration](#12-system-configuration)

---

## 1. Admin Authentication & Security

### `users`
**Purpose**: Admin user accounts for the Guru portal

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar (PK) | UUID primary key |
| `username` | text | Unique username for login |
| `email` | text | Unique email address |
| `password` | text | bcrypt hashed password |
| `role` | text | Legacy role field (admin, super_admin, pending_admin) |
| `is_active` | boolean | Account enabled/disabled |
| `is_email_verified` | boolean | Email verification status |
| `two_factor_enabled` | boolean | 2FA enabled flag |
| `failed_login_attempts` | integer | Count of failed logins |
| `locked_until` | timestamp | Account lock expiry time |
| `invited_by` | varchar (FK) | User who sent invite |
| `last_login_at` | timestamp | Last successful login |
| `created_at` | timestamp | Account creation date |

---

### `otp_tokens`
**Purpose**: One-time passwords for email verification and 2FA

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Auto-increment ID |
| `user_id` | varchar (FK) | References users.id |
| `otp` | text | 6-digit OTP code |
| `expires_at` | timestamp | OTP expiry time (usually 10 mins) |
| `attempts` | integer | Number of verification attempts |
| `is_used` | boolean | Whether OTP has been used |
| `created_at` | timestamp | When OTP was generated |

---

### `admin_sessions`
**Purpose**: Active login sessions for admin users

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar (PK) | Session UUID |
| `user_id` | varchar (FK) | References users.id |
| `token` | text | JWT access token |
| `device` | text | Device type (desktop, mobile) |
| `browser` | text | Browser name and version |
| `ip_address` | text | Client IP address |
| `location` | text | Geo location from IP |
| `is_active` | boolean | Session validity |
| `last_active_at` | timestamp | Last activity time |
| `expires_at` | timestamp | Session expiry (12 hours) |
| `created_at` | timestamp | Session start time |

---

### `login_attempts`
**Purpose**: Audit log of all login attempts (success and failure)

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Auto-increment ID |
| `email` | text | Email used for login attempt |
| `user_id` | varchar (FK) | References users.id (if exists) |
| `success` | boolean | Whether login succeeded |
| `ip_address` | text | Client IP address |
| `user_agent` | text | Browser user agent string |
| `location` | text | Geo location |
| `reason` | text | Failure reason (invalid_password, account_locked) |
| `created_at` | timestamp | Attempt timestamp |

---

## 2. Course Content Management

### `courses`
**Purpose**: Master course records created by admins

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Course ID |
| `name` | text | Course title |
| `description` | text | Short description |
| `level` | text | beginner / intermediate / advanced |
| `target_audience` | text | Who should take this course |
| `duration` | text | Estimated duration (e.g., "4 weeks") |
| `overview` | text | Detailed course overview |
| `learning_outcomes` | jsonb | Array of outcome strings |
| `job_roles` | jsonb | Target job roles array |
| `include_projects` | boolean | Has projects flag |
| `include_tests` | boolean | Has tests flag |
| `include_labs` | boolean | Has labs flag |
| `certificate_type` | text | completion / assessment |
| `status` | text | draft / published |
| `ai_command` | text | Original AI generation prompt |
| `thumbnail_url` | text | Course thumbnail image |
| `credit_cost` | integer | Cost in credits (0 = free) |
| `is_free` | boolean | Free course flag |
| `original_credit_cost` | integer | Price before discount |
| `pricing_updated_at` | timestamp | Last pricing change |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |
| `published_at` | timestamp | When published |
| `deleted_at` | timestamp | Soft delete timestamp |

**Shishya Access**: READ only, filter `status = 'published'` AND `deleted_at IS NULL`

---

### `modules`
**Purpose**: Course sections/chapters containing lessons

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Module ID |
| `course_id` | integer (FK) | References courses.id |
| `title` | text | Module title |
| `description` | text | Module description |
| `order_index` | integer | Sort order within course |
| `estimated_time` | text | Duration (e.g., "2 hours") |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

### `lessons`
**Purpose**: Individual learning units within modules

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Lesson ID |
| `module_id` | integer (FK) | References modules.id |
| `title` | text | Lesson title |
| `objectives` | jsonb | Learning objectives array |
| `estimated_time` | text | Duration |
| `key_concepts` | jsonb | Key concepts array |
| `video_url` | text | Primary video URL |
| `external_links` | jsonb | External resources array |
| `youtube_references` | jsonb | Array of {url, title, description} |
| `order_index` | integer | Sort order within module |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

### `ai_notes`
**Purpose**: AI-generated lesson content and study notes

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Note ID |
| `lesson_id` | integer (FK) | References lessons.id |
| `content` | text | Full lesson content (HTML/Markdown) |
| `simplified_explanation` | text | ELI5 version |
| `bullet_notes` | jsonb | Key points as bullet array |
| `key_takeaways` | jsonb | Summary takeaways array |
| `interview_questions` | jsonb | Practice Q&A array |
| `version` | integer | Content version number |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only (main lesson content source)

---

### `skills`
**Purpose**: Skill taxonomy for courses and filtering

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Skill ID |
| `name` | text | Skill name (unique) |
| `category` | text | Skill category |
| `created_at` | timestamp | Creation date |

**Shishya Access**: READ only

---

### `course_skills`
**Purpose**: Many-to-many mapping of courses to skills

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Record ID |
| `course_id` | integer (FK) | References courses.id |
| `skill_id` | integer (FK) | References skills.id |

**Shishya Access**: READ only

---

## 3. Assessments & Practice

### `tests`
**Purpose**: Quiz and exam definitions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Test ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id (for module tests) |
| `title` | text | Test title |
| `description` | text | Test description |
| `passing_percentage` | integer | Minimum score to pass (default 70) |
| `is_locked` | boolean | Requires prerequisites |
| `time_limit` | integer | Time limit in minutes (null = unlimited) |
| `difficulty` | text | easy / medium / hard |
| `category` | text | Test category |
| `tags` | jsonb | Tags array |
| `status` | text | draft / published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

### `questions`
**Purpose**: Test questions with answers

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Question ID |
| `test_id` | integer (FK) | References tests.id |
| `type` | text | mcq / true_false / fill_blank |
| `difficulty` | text | easy / medium / hard |
| `question_text` | text | The question |
| `options` | jsonb | Answer options array |
| `correct_answer` | text | Correct option |
| `explanation` | text | Why answer is correct |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |

**Shishya Access**: READ only (hide correct_answer until submission)

---

### `projects`
**Purpose**: Hands-on project assignments

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Project ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id |
| `title` | text | Project title |
| `description` | text | Overview |
| `objectives` | text | Learning objectives |
| `deliverables` | text | Expected outputs |
| `submission_instructions` | text | How to submit |
| `evaluation_notes` | text | Grading notes for reviewers |
| `problem_statement` | text | What to build |
| `tech_stack` | jsonb | Technologies array |
| `folder_structure` | text | Recommended file structure |
| `evaluation_checklist` | jsonb | Grading criteria array |
| `difficulty` | text | beginner / intermediate / advanced |
| `category` | text | Project category |
| `tags` | jsonb | Tags array |
| `status` | text | draft / published |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

### `project_steps`
**Purpose**: Step-by-step guide for completing projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Step ID |
| `project_id` | integer (FK) | References projects.id |
| `step_number` | integer | Step sequence |
| `title` | text | Step title |
| `description` | text | Step instructions |
| `code_snippet` | text | Example code |
| `tips` | jsonb | Helpful tips array |
| `created_at` | timestamp | Creation date |

**Shishya Access**: READ only

---

### `project_skills`
**Purpose**: Skills learned from each project

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Record ID |
| `project_id` | integer (FK) | References projects.id |
| `skill_id` | integer (FK) | References skills.id |

---

### `practice_labs`
**Purpose**: Interactive coding exercises

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Lab ID |
| `course_id` | integer (FK) | References courses.id |
| `module_id` | integer (FK) | References modules.id |
| `lesson_id` | integer (FK) | References lessons.id |
| `slug` | text | URL-friendly identifier |
| `title` | text | Lab title |
| `description` | text | Lab description |
| `difficulty` | text | beginner / intermediate / advanced |
| `language` | text | Programming language |
| `estimated_time` | integer | Minutes to complete |
| `instructions` | text | Step-by-step instructions |
| `starter_code` | text | Initial code template |
| `solution_code` | text | Reference solution |
| `expected_output` | text | Expected console output |
| `validation_type` | text | console / test / visual |
| `hints` | jsonb | Hints array (revealed progressively) |
| `ai_prompt_context` | text | Context for AI assistance |
| `mark_lab_complete` | boolean | Auto-mark on success |
| `unlock_next` | boolean | Unlock next item on completion |
| `contributes_to_certificate` | boolean | Counts toward certificate |
| `certificate_weight` | integer | Weight for certificate calculation |
| `category` | text | Lab category |
| `tags` | jsonb | Tags array |
| `status` | text | draft / published |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

### `certificates`
**Purpose**: Certificate templates and requirements

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Certificate ID |
| `course_id` | integer (FK) | References courses.id |
| `name` | text | Certificate name |
| `description` | text | Certificate description |
| `template_id` | text | Design template reference |
| `category` | text | Category |
| `tags` | jsonb | Tags array |
| `status` | text | draft / published |
| `type` | text | completion / assessment |
| `skill_tags` | jsonb | Skills certified |
| `level` | text | Certification level |
| `requires_test_pass` | boolean | Must pass tests |
| `passing_percentage` | integer | Minimum test score |
| `requires_project_completion` | boolean | Must complete projects |
| `requires_lab_completion` | boolean | Must complete labs |
| `qr_verification` | boolean | Include QR code |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Shishya Access**: READ only

---

## 4. Student Management (Shishya)

### `shishya_users`
**Purpose**: Student accounts for the learning portal

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Student ID |
| `external_id` | text | External system ID (unique) |
| `name` | text | Full name |
| `email` | text | Email address (unique) |
| `phone` | text | Phone number |
| `avatar_url` | text | Profile picture URL |
| `status` | text | active / suspended / deleted |
| `last_active_at` | timestamp | Last activity |
| `total_spend` | integer | Lifetime spending in INR |
| `signup_source` | text | How they signed up |
| `created_at` | timestamp | Registration date |

**Portal Access**: Shishya creates, Guru reads for analytics

---

### `activity_logs`
**Purpose**: Student activity tracking for analytics

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Log ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `action` | text | Action type (lesson_view, test_start, etc.) |
| `entity_type` | text | course / lesson / test / project |
| `entity_id` | text | ID of entity |
| `metadata` | jsonb | Additional data |
| `ip_address` | text | Client IP |
| `user_agent` | text | Browser info |
| `created_at` | timestamp | Activity timestamp |

**Portal Access**: Shishya writes, Guru reads for analytics

---

## 5. Payments & Subscriptions

### `subscription_plans`
**Purpose**: Available subscription tiers

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Plan ID |
| `name` | text | Plan name (Free, Pro, Elite) |
| `slug` | text | URL-friendly name (unique) |
| `price_monthly` | integer | Monthly price in INR |
| `price_yearly` | integer | Annual price in INR |
| `coins_per_month` | integer | Monthly coin allocation |
| `signup_bonus_coins` | integer | One-time signup bonus |
| `features` | jsonb | Feature flags object |
| `is_active` | boolean | Plan available |
| `is_featured` | boolean | Highlight on pricing page |
| `sort_order` | integer | Display order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

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

---

### `user_subscriptions`
**Purpose**: Active student subscriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Subscription ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `plan_id` | integer (FK) | References subscription_plans.id |
| `status` | text | active / cancelled / expired |
| `start_date` | timestamp | Subscription start |
| `end_date` | timestamp | Subscription end |
| `billing_cycle` | text | monthly / yearly |
| `created_at` | timestamp | Creation date |

---

### `credit_packages`
**Purpose**: Credit purchase options

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Package ID |
| `name` | text | Package name |
| `description` | text | Package description |
| `credits` | integer | Number of credits |
| `price_inr` | integer | Price in INR |
| `price_usd` | integer | Price in USD |
| `discount` | integer | Discount percentage |
| `is_active` | boolean | Available for purchase |
| `is_featured` | boolean | Highlight package |
| `validity_days` | integer | Credit expiry |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `shishya_payments`
**Purpose**: Payment transaction records

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Payment ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `amount` | integer | Amount in smallest currency unit |
| `currency` | text | INR / USD |
| `status` | text | pending / success / failed / refunded |
| `payment_method` | text | card / upi / netbanking |
| `provider` | text | razorpay / stripe |
| `provider_transaction_id` | text | Gateway transaction ID |
| `subscription_id` | integer (FK) | References user_subscriptions.id |
| `metadata` | jsonb | Additional payment data |
| `created_at` | timestamp | Payment initiated |
| `completed_at` | timestamp | Payment completed |

---

### `vouchers`
**Purpose**: Discount and promotional codes

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Voucher ID |
| `code` | text | Unique voucher code |
| `name` | text | Voucher name |
| `description` | text | Terms and conditions |
| `type` | text | discount / credit_bonus |
| `discount_type` | text | percentage / flat |
| `discount_value` | integer | Discount amount |
| `credit_bonus` | integer | Bonus credits |
| `max_uses` | integer | Maximum redemptions |
| `used_count` | integer | Current redemptions |
| `min_purchase` | integer | Minimum order value |
| `is_active` | boolean | Voucher enabled |
| `starts_at` | timestamp | Valid from |
| `expires_at` | timestamp | Valid until |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `gift_boxes`
**Purpose**: Gift credit packages

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Gift box ID |
| `name` | text | Gift name |
| `description` | text | Gift description |
| `credits` | integer | Credit amount |
| `price_inr` | integer | Price in INR |
| `price_usd` | integer | Price in USD |
| `template_image` | text | Gift card design |
| `custom_message` | text | Default message |
| `is_active` | boolean | Available |
| `expiry_days` | integer | Days until expiry |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `payment_gateways`
**Purpose**: Payment gateway configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Gateway ID |
| `name` | text | Gateway name |
| `type` | text | razorpay / stripe / payu |
| `is_active` | boolean | Gateway enabled |
| `is_test_mode` | boolean | Using test credentials |
| `config` | jsonb | Gateway configuration |
| `priority` | integer | Fallback order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `upi_settings`
**Purpose**: UPI payment configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Setting ID |
| `upi_id` | text | UPI VPA |
| `display_name` | text | Merchant name |
| `is_active` | boolean | UPI enabled |
| `qr_code_image` | text | QR code image URL |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `bank_accounts`
**Purpose**: Bank account details for transfers

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Account ID |
| `bank_name` | text | Bank name |
| `account_number` | text | Account number |
| `account_holder_name` | text | Account holder |
| `ifsc_code` | text | IFSC code |
| `branch_name` | text | Branch |
| `account_type` | text | savings / current |
| `is_active` | boolean | Account active |
| `is_primary` | boolean | Primary account |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

## 6. Rewards & Gamification

### `coin_wallets`
**Purpose**: Student coin balance

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Wallet ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id (unique) |
| `balance` | integer | Current coin balance |
| `lifetime_earned` | integer | Total coins ever earned |
| `lifetime_spent` | integer | Total coins ever spent |
| `updated_at` | timestamp | Last transaction |

---

### `coin_transactions`
**Purpose**: Coin earn/spend history

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Transaction ID |
| `shishya_user_id` | integer (FK) | References shishya_users.id |
| `amount` | integer | Coins (positive=earn, negative=spend) |
| `type` | text | earned / spent / bonus / refund |
| `reason` | text | Transaction reason |
| `reference_id` | text | Related entity ID |
| `reference_type` | text | course / lesson / test / project |
| `balance_after` | integer | Balance after transaction |
| `created_at` | timestamp | Transaction time |

---

### `course_rewards`
**Purpose**: Reward rules per course

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Reward config ID |
| `course_id` | integer (FK) | References courses.id (unique) |
| `coins_enabled` | boolean | Rewards active |
| `coin_name` | text | Custom coin name |
| `coin_icon` | text | Coin icon name |
| `rules_json` | jsonb | Coin amounts per action |
| `bonus_json` | jsonb | Bonus conditions |
| `scholarship_enabled` | boolean | Scholarship available |
| `scholarship_json` | jsonb | Scholarship configuration |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**rules_json Example**:
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

---

### `achievement_cards`
**Purpose**: Achievement badge definitions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Achievement ID |
| `course_id` | integer (FK) | References courses.id |
| `title` | text | Achievement title |
| `description` | text | How to earn |
| `icon` | text | Icon name |
| `condition_json` | jsonb | Unlock conditions |
| `rarity` | text | common / rare / epic / legendary |
| `is_active` | boolean | Achievement active |
| `sort_order` | integer | Display order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `motivational_cards`
**Purpose**: Encouragement messages shown to students

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Card ID |
| `course_id` | integer (FK) | References courses.id |
| `message` | text | Motivational message |
| `trigger_type` | text | lesson_complete / streak / milestone |
| `trigger_value` | integer | Trigger threshold |
| `icon` | text | Icon name |
| `is_active` | boolean | Card active |
| `sort_order` | integer | Display priority |
| `created_at` | timestamp | Creation date |

---

### `motivation_rules`
**Purpose**: AI engine trigger rules for rewards

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Rule ID |
| `name` | text | Rule name |
| `description` | text | Rule description |
| `trigger_type` | text | Event type |
| `trigger_condition` | jsonb | Condition configuration |
| `reward_type` | text | coins / scholarship / coupon |
| `reward_value` | integer | Reward amount |
| `reward_metadata` | jsonb | Additional reward data |
| `approval_mode` | text | auto_approved / admin_approval_required |
| `priority` | integer | Rule priority |
| `is_active` | boolean | Rule enabled |
| `valid_from` | timestamp | Rule start date |
| `valid_to` | timestamp | Rule end date |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `reward_approvals`
**Purpose**: Pending reward approval queue

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Approval ID |
| `shishya_user_id` | integer (FK) | Student requesting reward |
| `rule_id` | integer (FK) | References motivation_rules.id |
| `reward_type` | text | Type of reward |
| `original_value` | integer | Requested amount |
| `adjusted_value` | integer | Approved amount |
| `status` | text | pending / approved / rejected |
| `trigger_event` | text | What triggered this |
| `trigger_data` | jsonb | Event data |
| `ai_reason` | text | AI recommendation |
| `risk_score` | integer | Fraud risk score (0-100) |
| `is_flagged` | boolean | Flagged for review |
| `flag_reason` | text | Why flagged |
| `reviewed_by` | varchar (FK) | Admin reviewer |
| `reviewed_at` | timestamp | Review time |
| `review_notes` | text | Admin notes |
| `second_approver` | varchar (FK) | Second approver (for dual approval) |
| `second_approved_at` | timestamp | Second approval time |
| `wallet_transaction_id` | integer | Created transaction ID |
| `expires_at` | timestamp | Approval expiry |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `approval_policies`
**Purpose**: Auto-approval thresholds per reward type

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Policy ID |
| `reward_type` | text | coins / scholarship / coupon |
| `approval_mode` | text | auto_approved / admin_approval_required |
| `min_value_for_approval` | integer | Minimum value requiring approval |
| `max_auto_approve_value` | integer | Maximum auto-approved amount |
| `require_dual_approval` | boolean | Needs two approvers |
| `dual_approval_threshold` | integer | Amount triggering dual approval |
| `cooldown_minutes` | integer | Wait time between rewards |
| `daily_limit` | integer | Max rewards per day |
| `weekly_limit` | integer | Max rewards per week |
| `is_active` | boolean | Policy active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `scholarships`
**Purpose**: Issued scholarship records

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Scholarship ID |
| `shishya_user_id` | integer (FK) | Student recipient |
| `reward_approval_id` | integer (FK) | Related approval |
| `title` | text | Scholarship name |
| `description` | text | Terms |
| `amount` | integer | Discount amount |
| `currency` | text | INR / USD |
| `status` | text | pending / active / redeemed / expired |
| `course_id` | integer (FK) | Applicable course |
| `valid_from` | timestamp | Start date |
| `valid_to` | timestamp | Expiry date |
| `issued_by` | varchar (FK) | Issuing admin |
| `issued_at` | timestamp | Issue date |
| `redeemed_at` | timestamp | Redemption date |
| `created_at` | timestamp | Creation date |

---

### `promotions`
**Purpose**: Marketing promotions and campaigns

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Promotion ID |
| `title` | text | Promotion title |
| `code` | text | Promo code (unique) |
| `type` | text | bonus_coins / discount |
| `bonus_coins` | integer | Bonus coin amount |
| `discount_percent` | integer | Discount percentage |
| `plan_id` | integer (FK) | Applicable subscription plan |
| `is_global` | boolean | Applies to all |
| `valid_from` | timestamp | Start date |
| `valid_to` | timestamp | End date |
| `max_redemptions` | integer | Maximum uses |
| `current_redemptions` | integer | Current uses |
| `is_active` | boolean | Promotion active |
| `created_at` | timestamp | Creation date |

---

## 7. RBAC System

### `admin_roles`
**Purpose**: Role definitions with hierarchy levels

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Role ID |
| `name` | text | Role identifier (unique) |
| `display_name` | text | Human-readable name |
| `description` | text | Role description |
| `level` | integer | Hierarchy level (100=highest) |
| `is_system` | boolean | System role (cannot delete) |
| `is_active` | boolean | Role active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

**Default Roles**:
| Role | Level | Description |
|------|-------|-------------|
| super_admin | 100 | Full system access |
| admin | 80 | General admin operations |
| content_admin | 60 | Course management |
| finance_admin | 60 | Financial operations |
| support_admin | 40 | Student support |
| readonly_admin | 10 | View-only access |

---

### `admin_permissions`
**Purpose**: Granular permission definitions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Permission ID |
| `code` | text | Permission code (unique) |
| `name` | text | Permission name |
| `description` | text | What it allows |
| `category` | text | Permission category |
| `is_system` | boolean | System permission |
| `created_at` | timestamp | Creation date |

**Permission Categories**:
- `dashboard.*` - Dashboard access
- `courses.*` - Course management
- `users.*` - Admin user management
- `students.*` - Student management
- `rewards.*` - Reward approvals
- `finance.*` - Financial operations
- `settings.*` - System configuration
- `ai.*` - AI governance
- `certificates.*` - Certificate management
- `reports.*` - Analytics and exports
- `audit.*` - Audit log access
- `approvals.*` - Workflow approvals

---

### `admin_role_permissions`
**Purpose**: Maps permissions to roles

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Mapping ID |
| `role_id` | integer (FK) | References admin_roles.id |
| `permission_id` | integer (FK) | References admin_permissions.id |
| `granted_at` | timestamp | When granted |
| `granted_by` | varchar (FK) | Who granted it |

---

### `admin_user_roles`
**Purpose**: Assigns roles to admin users

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Assignment ID |
| `user_id` | varchar (FK) | References users.id |
| `role_id` | integer (FK) | References admin_roles.id |
| `assigned_at` | timestamp | When assigned |
| `assigned_by` | varchar (FK) | Who assigned it |
| `expires_at` | timestamp | Role expiry (null=permanent) |
| `is_active` | boolean | Assignment active |

---

## 8. Approval Workflows

### `approval_templates`
**Purpose**: Workflow templates for different actions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Template ID |
| `name` | text | Template name (unique) |
| `description` | text | Template description |
| `entity_type` | text | course / reward / refund |
| `steps_config` | jsonb | Workflow steps configuration |
| `is_active` | boolean | Template active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `approval_requests`
**Purpose**: Pending approval requests

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Request ID |
| `template_id` | integer (FK) | References approval_templates.id |
| `entity_type` | text | What needs approval |
| `entity_id` | integer | ID of entity |
| `requested_by` | varchar (FK) | Who requested |
| `title` | text | Request title |
| `description` | text | Request details |
| `priority` | text | low / normal / high / urgent |
| `status` | text | pending / approved / rejected / cancelled |
| `current_step` | integer | Current workflow step |
| `total_steps` | integer | Total steps needed |
| `metadata` | jsonb | Additional request data |
| `due_date` | timestamp | Deadline |
| `completed_at` | timestamp | Completion time |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update |

---

### `approval_steps`
**Purpose**: Individual steps in an approval workflow

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Step ID |
| `request_id` | integer (FK) | References approval_requests.id |
| `step_order` | integer | Step sequence |
| `role_required` | text | Required role for this step |
| `assigned_to` | varchar (FK) | Specific assignee |
| `status` | text | pending / approved / rejected / skipped |
| `decision` | text | approve / reject |
| `comments` | text | Approver comments |
| `decided_at` | timestamp | Decision time |
| `created_at` | timestamp | Creation date |

---

### `approval_actions`
**Purpose**: Audit trail of all approval actions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Action ID |
| `request_id` | integer (FK) | References approval_requests.id |
| `step_id` | integer (FK) | References approval_steps.id |
| `action_by` | varchar (FK) | Who took action |
| `action` | text | approve / reject / comment / escalate |
| `previous_status` | text | Status before action |
| `new_status` | text | Status after action |
| `comments` | text | Action comments |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamp | Action time |

---

## 9. Course Versioning & Quality

### `course_versions`
**Purpose**: Version snapshots of courses

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Version ID |
| `course_id` | integer (FK) | References courses.id |
| `version` | integer | Version number |
| `version_label` | text | Label (e.g., "v1.0.0") |
| `snapshot_data` | jsonb | Complete course snapshot |
| `change_log` | text | What changed |
| `created_by` | varchar (FK) | Who created version |
| `is_published` | boolean | Published version |
| `published_at` | timestamp | Publication time |
| `created_at` | timestamp | Creation date |

---

### `course_publish_history`
**Purpose**: Audit trail of publish/unpublish actions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | History ID |
| `course_id` | integer (FK) | References courses.id |
| `version_id` | integer (FK) | References course_versions.id |
| `action` | text | publish / unpublish / update |
| `performed_by` | varchar (FK) | Who performed action |
| `reason` | text | Action reason |
| `approval_request_id` | integer (FK) | Related approval |
| `previous_status` | text | Status before |
| `new_status` | text | Status after |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamp | Action time |

---

### `course_quality_checks`
**Purpose**: Quality validation results

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Check ID |
| `course_id` | integer (FK) | References courses.id |
| `version_id` | integer (FK) | References course_versions.id |
| `check_type` | text | content / structure / completeness |
| `status` | text | pending / passed / failed |
| `score` | integer | Check score |
| `max_score` | integer | Maximum possible score |
| `details` | jsonb | Passed/failed/warnings lists |
| `checked_by` | varchar (FK) | Reviewer |
| `is_automatic` | boolean | AI-generated check |
| `created_at` | timestamp | Check time |

---

## 10. AI & Governance

### `ai_generation_logs`
**Purpose**: Log of all AI content generation

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Log ID |
| `course_id` | integer (FK) | References courses.id |
| `generation_type` | text | course / module / lesson / test |
| `prompt` | text | AI prompt used |
| `response` | text | AI response |
| `tokens_used` | integer | Token count |
| `status` | text | pending / success / failed |
| `error_message` | text | Error details |
| `created_at` | timestamp | Generation start |
| `completed_at` | timestamp | Generation end |

---

## 11. Audit & Security Logs

### `audit_logs`
**Purpose**: General audit trail for entity changes

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Log ID |
| `user_id` | varchar (FK) | Who made change |
| `action` | text | create / update / delete |
| `entity_type` | text | Table/entity name |
| `entity_id` | integer | Entity ID |
| `old_value` | jsonb | Previous state |
| `new_value` | jsonb | New state |
| `metadata` | jsonb | Additional context |
| `created_at` | timestamp | Action time |

---

### `admin_action_logs`
**Purpose**: Immutable audit of admin actions

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Log ID |
| `admin_id` | varchar (FK) | References users.id |
| `action_type` | text | Action performed |
| `entity_type` | text | What was affected |
| `entity_id` | text | Entity ID |
| `previous_state` | jsonb | State before |
| `new_state` | jsonb | State after |
| `reason` | text | Why action taken |
| `ip_address` | text | Admin IP |
| `user_agent` | text | Browser info |
| `created_at` | timestamp | Action time |

---

### `fraud_flags`
**Purpose**: Suspicious activity flags

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Flag ID |
| `shishya_user_id` | integer (FK) | Flagged student |
| `flag_type` | text | Type of suspicious activity |
| `severity` | text | low / medium / high / critical |
| `description` | text | Flag details |
| `is_resolved` | boolean | Flag resolved |
| `resolved_by` | varchar (FK) | Who resolved |
| `resolved_at` | timestamp | Resolution time |
| `resolution_notes` | text | How resolved |
| `created_at` | timestamp | Flag time |

---

### `wallet_freezes`
**Purpose**: Frozen student wallets

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Freeze ID |
| `shishya_user_id` | integer (FK) | Frozen student |
| `reason` | text | Freeze reason |
| `frozen_by` | varchar (FK) | Admin who froze |
| `frozen_at` | timestamp | Freeze time |
| `unfrozen_by` | varchar (FK) | Admin who unfroze |
| `unfrozen_at` | timestamp | Unfreeze time |
| `unfreeze_reason` | text | Why unfrozen |
| `is_active` | boolean | Currently frozen |

---

### `risk_scores`
**Purpose**: Student fraud risk assessment

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Score ID |
| `shishya_user_id` | integer (FK) | Student (unique) |
| `overall_score` | integer | Composite risk score (0-100) |
| `velocity_score` | integer | Activity velocity |
| `pattern_score` | integer | Suspicious patterns |
| `account_age_score` | integer | Account age factor |
| `behavior_score` | integer | Behavior analysis |
| `last_calculated_at` | timestamp | Last calculation |
| `risk_factors` | jsonb | Detected risk factors |
| `updated_at` | timestamp | Last update |

---

### `reward_overrides`
**Purpose**: Manual reward adjustments

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Override ID |
| `shishya_user_id` | integer (FK) | Affected student |
| `admin_id` | varchar (FK) | Admin who made override |
| `action_type` | text | add / deduct / freeze / adjust |
| `reward_type` | text | coins / credits / scholarship |
| `amount` | integer | Amount changed |
| `reason` | text | Reason for override |
| `metadata` | jsonb | Additional data |
| `wallet_transaction_id` | integer | Created transaction |
| `created_at` | timestamp | Override time |

---

## 12. System Configuration

### `system_settings`
**Purpose**: Key-value system configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Setting ID |
| `key` | text | Setting key (unique) |
| `value` | text | Setting value |
| `description` | text | What this setting does |
| `updated_at` | timestamp | Last update |

---

### `api_keys`
**Purpose**: API keys for external integrations

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Key ID |
| `name` | text | Key name/description |
| `key` | text | API key value (unique) |
| `description` | text | Key purpose |
| `is_active` | boolean | Key active |
| `last_used_at` | timestamp | Last API call |
| `created_at` | timestamp | Creation date |
| `expires_at` | timestamp | Key expiry |

---

### `publish_status`
**Purpose**: Course sync status with external platforms

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Status ID |
| `course_id` | integer (FK) | References courses.id |
| `platform` | text | Platform name |
| `status` | text | pending / synced / failed |
| `synced_at` | timestamp | Last sync time |
| `error_message` | text | Sync error |
| `created_at` | timestamp | Creation date |

---

## Data Access Summary

### Guru (Admin) Portal - Full Access
- All tables: CREATE, READ, UPDATE, DELETE

### Shishya (Student) Portal - Limited Access

**READ ONLY**:
- courses (status='published')
- modules, lessons, ai_notes
- tests, questions (hide correct_answer)
- projects, project_steps
- practice_labs
- certificates
- skills, course_skills
- course_rewards, achievement_cards, motivational_cards
- subscription_plans, credit_packages
- vouchers, promotions

**CREATE/UPDATE**:
- shishya_users (own profile)
- coin_transactions (earn/spend)
- activity_logs
- shishya_payments
- user_subscriptions (own)

**NO ACCESS**:
- users (admin accounts)
- admin_sessions, otp_tokens
- All approval tables
- All audit tables
- All RBAC tables
- All governance tables

---

## Quick Reference Queries

### Get Published Courses with Skills
```sql
SELECT c.*, array_agg(s.name) as skills
FROM courses c
LEFT JOIN course_skills cs ON c.id = cs.course_id
LEFT JOIN skills s ON cs.skill_id = s.id
WHERE c.status = 'published' AND c.deleted_at IS NULL
GROUP BY c.id;
```

### Get Course with Full Content
```sql
SELECT c.*, 
  (SELECT json_agg(m ORDER BY m.order_index) FROM modules m WHERE m.course_id = c.id) as modules
FROM courses c
WHERE c.id = $1 AND c.status = 'published';
```

### Get Student Progress
```sql
SELECT 
  ce.course_id,
  ce.progress_percentage,
  COUNT(lp.id) FILTER (WHERE lp.status = 'completed') as lessons_completed
FROM course_enrollments ce
LEFT JOIN lesson_progress lp ON lp.shishya_user_id = ce.shishya_user_id
WHERE ce.shishya_user_id = $1
GROUP BY ce.course_id, ce.progress_percentage;
```

---

**Document Version**: 1.0  
**Last Updated**: January 2026
