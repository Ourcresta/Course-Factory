# OurShiksha Database - Complete Table & Column Reference

## All Tables and Columns with Usage Description

**Database**: ourshiksha_db (PostgreSQL)  
**Total Tables**: 55+  
**Last Updated**: January 2026

---

## Table of Contents

1. [Admin Authentication Tables](#1-admin-authentication-tables)
2. [Course Content Tables](#2-course-content-tables)
3. [Assessment Tables](#3-assessment-tables)
4. [Student Tables](#4-student-tables)
5. [Payment & Subscription Tables](#5-payment--subscription-tables)
6. [Reward & Gamification Tables](#6-reward--gamification-tables)
7. [RBAC Tables](#7-rbac-tables)
8. [Approval Workflow Tables](#8-approval-workflow-tables)
9. [Course Versioning Tables](#9-course-versioning-tables)
10. [AI Governance Tables](#10-ai-governance-tables)
11. [Certificate Management Tables](#11-certificate-management-tables)
12. [Audit & Security Tables](#12-audit--security-tables)
13. [System Configuration Tables](#13-system-configuration-tables)

---

## 1. Admin Authentication Tables

### Table: `users`
**Use**: Store admin user accounts for Guru portal

| Column | Type | Use |
|--------|------|-----|
| `id` | varchar (PK) | Unique UUID for each admin user |
| `username` | text | Login username (unique) |
| `email` | text | Admin email address (unique) |
| `password` | text | bcrypt hashed password for authentication |
| `role` | text | Legacy role: admin, super_admin, pending_admin |
| `is_active` | boolean | Whether account is enabled or disabled |
| `is_email_verified` | boolean | Email verification status for new accounts |
| `two_factor_enabled` | boolean | Whether 2FA is enabled for the user |
| `failed_login_attempts` | integer | Count of consecutive failed logins |
| `locked_until` | timestamp | When account lockout expires |
| `invited_by` | varchar (FK) | Admin who invited this user |
| `last_login_at` | timestamp | Last successful login time |
| `created_at` | timestamp | Account creation timestamp |

---

### Table: `otp_tokens`
**Use**: Store one-time passwords for email verification and 2FA

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Auto-increment ID |
| `user_id` | varchar (FK) | References users.id |
| `otp` | text | 6-digit OTP code |
| `expires_at` | timestamp | When OTP expires (10 minutes) |
| `attempts` | integer | Number of verification attempts |
| `is_used` | boolean | Whether OTP has already been used |
| `created_at` | timestamp | When OTP was generated |

---

### Table: `admin_sessions`
**Use**: Track active login sessions for admin users

| Column | Type | Use |
|--------|------|-----|
| `id` | varchar (PK) | Session UUID |
| `user_id` | varchar (FK) | References users.id |
| `token` | text | JWT access token for session |
| `device` | text | Device type (desktop, mobile, tablet) |
| `browser` | text | Browser name and version |
| `ip_address` | text | Client IP address |
| `location` | text | Geo location from IP lookup |
| `is_active` | boolean | Whether session is still valid |
| `last_active_at` | timestamp | Last activity timestamp |
| `expires_at` | timestamp | When session expires (12 hours) |
| `created_at` | timestamp | Session start time |

---

### Table: `login_attempts`
**Use**: Audit log of all login attempts for security monitoring

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Auto-increment ID |
| `email` | text | Email used for login attempt |
| `user_id` | varchar (FK) | References users.id (if account exists) |
| `success` | boolean | Whether login succeeded |
| `ip_address` | text | Client IP address |
| `user_agent` | text | Browser user agent string |
| `location` | text | Geo location |
| `reason` | text | Failure reason (invalid_password, account_locked) |
| `created_at` | timestamp | Attempt timestamp |

---

## 2. Course Content Tables

### Table: `courses`
**Use**: Master record for all courses (published and draft)

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique course ID |
| `name` | text | Course title |
| `description` | text | Short course description |
| `level` | text | Difficulty: beginner, intermediate, advanced |
| `target_audience` | text | Who should take this course |
| `duration` | text | Estimated completion time (e.g., "4 weeks") |
| `overview` | text | Detailed course overview |
| `learning_outcomes` | jsonb | Array of learning outcomes |
| `job_roles` | jsonb | Target job roles array |
| `include_projects` | boolean | Whether course has projects |
| `include_tests` | boolean | Whether course has tests |
| `include_labs` | boolean | Whether course has labs |
| `certificate_type` | text | Type: completion, assessment |
| `status` | text | Status: draft, published |
| `ai_command` | text | Original AI generation prompt |
| `thumbnail_url` | text | Course thumbnail image URL |
| `credit_cost` | integer | Price in credits (0 = free) |
| `is_free` | boolean | Whether course is free |
| `original_credit_cost` | integer | Price before discount |
| `pricing_updated_at` | timestamp | Last pricing change date |
| `created_at` | timestamp | Course creation date |
| `updated_at` | timestamp | Last update date |
| `published_at` | timestamp | When course was published |
| `deleted_at` | timestamp | Soft delete timestamp |

---

### Table: `modules`
**Use**: Course sections/chapters containing lessons

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique module ID |
| `course_id` | integer (FK) | Parent course reference |
| `title` | text | Module title |
| `description` | text | Module description |
| `order_index` | integer | Sort order within course |
| `estimated_time` | text | Duration (e.g., "2 hours") |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `lessons`
**Use**: Individual learning units within modules

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique lesson ID |
| `module_id` | integer (FK) | Parent module reference |
| `title` | text | Lesson title |
| `objectives` | jsonb | Learning objectives array |
| `estimated_time` | text | Duration |
| `key_concepts` | jsonb | Key concepts array |
| `video_url` | text | Primary video URL |
| `external_links` | jsonb | External resources array |
| `youtube_references` | jsonb | Array of {url, title, description} |
| `order_index` | integer | Sort order within module |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `ai_notes`
**Use**: AI-generated lesson content for students to read

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique note ID |
| `lesson_id` | integer (FK) | Parent lesson reference |
| `content` | text | Full lesson content (HTML/Markdown) |
| `simplified_explanation` | text | Simple ELI5 version |
| `bullet_notes` | jsonb | Key points as bullet array |
| `key_takeaways` | jsonb | Summary takeaways array |
| `interview_questions` | jsonb | Practice Q&A array |
| `version` | integer | Content version number |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `skills`
**Use**: Skill taxonomy for courses and filtering

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique skill ID |
| `name` | text | Skill name (unique) |
| `category` | text | Skill category |
| `created_at` | timestamp | Creation date |

---

### Table: `course_skills`
**Use**: Many-to-many mapping of courses to skills

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Record ID |
| `course_id` | integer (FK) | References courses.id |
| `skill_id` | integer (FK) | References skills.id |

---

## 3. Assessment Tables

### Table: `tests`
**Use**: Quiz and exam definitions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique test ID |
| `course_id` | integer (FK) | Parent course reference |
| `module_id` | integer (FK) | Parent module (for module tests) |
| `title` | text | Test title |
| `description` | text | Test description |
| `passing_percentage` | integer | Minimum score to pass (default 70) |
| `is_locked` | boolean | Whether test requires prerequisites |
| `time_limit` | integer | Time limit in minutes (null = unlimited) |
| `difficulty` | text | Difficulty: easy, medium, hard |
| `category` | text | Test category |
| `tags` | jsonb | Tags array for filtering |
| `status` | text | Status: draft, published |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `questions`
**Use**: Test questions with answers

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique question ID |
| `test_id` | integer (FK) | Parent test reference |
| `type` | text | Type: mcq, true_false, fill_blank |
| `difficulty` | text | Difficulty: easy, medium, hard |
| `question_text` | text | The question text |
| `options` | jsonb | Answer options array |
| `correct_answer` | text | Correct option (hide from students) |
| `explanation` | text | Why answer is correct |
| `order_index` | integer | Sort order in test |
| `created_at` | timestamp | Creation date |

---

### Table: `projects`
**Use**: Hands-on project assignments

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique project ID |
| `course_id` | integer (FK) | Parent course reference |
| `module_id` | integer (FK) | Parent module reference |
| `title` | text | Project title |
| `description` | text | Project overview |
| `objectives` | text | Learning objectives |
| `deliverables` | text | Expected outputs |
| `submission_instructions` | text | How to submit |
| `evaluation_notes` | text | Grading notes for reviewers |
| `problem_statement` | text | What to build |
| `tech_stack` | jsonb | Technologies array |
| `folder_structure` | text | Recommended file structure |
| `evaluation_checklist` | jsonb | Grading criteria array |
| `difficulty` | text | Difficulty level |
| `category` | text | Project category |
| `tags` | jsonb | Tags array |
| `status` | text | Status: draft, published |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `project_steps`
**Use**: Step-by-step guide for completing projects

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique step ID |
| `project_id` | integer (FK) | Parent project reference |
| `step_number` | integer | Step sequence number |
| `title` | text | Step title |
| `description` | text | Step instructions |
| `code_snippet` | text | Example code |
| `tips` | jsonb | Helpful tips array |
| `created_at` | timestamp | Creation date |

---

### Table: `project_skills`
**Use**: Skills learned from each project

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Record ID |
| `project_id` | integer (FK) | References projects.id |
| `skill_id` | integer (FK) | References skills.id |

---

### Table: `practice_labs`
**Use**: Interactive coding exercises

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique lab ID |
| `course_id` | integer (FK) | Parent course reference |
| `module_id` | integer (FK) | Parent module reference |
| `lesson_id` | integer (FK) | Parent lesson reference |
| `category` | text | Lab category |
| `tags` | jsonb | Tags array |
| `slug` | text | URL-friendly identifier |
| `title` | text | Lab title |
| `description` | text | Lab description |
| `difficulty` | text | Difficulty: beginner, intermediate, advanced |
| `language` | text | Programming language |
| `estimated_time` | integer | Minutes to complete |
| `instructions` | text | Step-by-step instructions |
| `starter_code` | text | Initial code template |
| `solution_code` | text | Reference solution (hide until complete) |
| `expected_output` | text | Expected console output |
| `validation_type` | text | Validation: console, test, visual |
| `unlock_type` | text | How to unlock this lab |
| `unlock_ref_id` | integer | ID of prerequisite item |
| `hints` | jsonb | Hints array (revealed progressively) |
| `ai_prompt_context` | text | Context for AI assistance |
| `mark_lab_complete` | boolean | Auto-mark on success |
| `unlock_next` | boolean | Unlock next item on completion |
| `contributes_to_certificate` | boolean | Counts toward certificate |
| `certificate_weight` | integer | Weight for certificate calculation |
| `status` | text | Status: draft, published |
| `order_index` | integer | Sort order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `certificates`
**Use**: Certificate templates and requirements

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique certificate ID |
| `course_id` | integer (FK) | Parent course reference |
| `name` | text | Certificate name |
| `description` | text | Certificate description |
| `template_id` | text | Design template reference |
| `category` | text | Certificate category |
| `tags` | jsonb | Tags array |
| `status` | text | Status: draft, published |
| `type` | text | Type: completion, assessment |
| `skill_tags` | jsonb | Skills certified |
| `level` | text | Certification level |
| `requires_test_pass` | boolean | Must pass all tests |
| `passing_percentage` | integer | Minimum test score |
| `requires_project_completion` | boolean | Must complete all projects |
| `requires_lab_completion` | boolean | Must complete all labs |
| `qr_verification` | boolean | Include QR code for verification |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

## 4. Student Tables

### Table: `shishya_users`
**Use**: Student accounts for Shishya portal

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Unique student ID |
| `external_id` | text | External system ID |
| `name` | text | Full name |
| `email` | text | Email address (unique) |
| `phone` | text | Phone number |
| `avatar_url` | text | Profile picture URL |
| `status` | text | Status: active, suspended, deleted |
| `last_active_at` | timestamp | Last activity time |
| `total_spend` | integer | Lifetime spending in INR |
| `signup_source` | text | How they registered |
| `created_at` | timestamp | Registration date |

---

### Table: `activity_logs`
**Use**: Student activity tracking for analytics

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `shishya_user_id` | integer (FK) | Student reference |
| `action` | text | Action type (lesson_view, test_start) |
| `entity_type` | text | Entity: course, lesson, test, project |
| `entity_id` | text | ID of entity |
| `metadata` | jsonb | Additional data |
| `ip_address` | text | Client IP |
| `user_agent` | text | Browser info |
| `created_at` | timestamp | Activity timestamp |

---

## 5. Payment & Subscription Tables

### Table: `subscription_plans`
**Use**: Available subscription tiers

| Column | Type | Use |
|--------|------|-----|
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
| `updated_at` | timestamp | Last update date |

---

### Table: `user_subscriptions`
**Use**: Active student subscriptions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Subscription ID |
| `shishya_user_id` | integer (FK) | Student reference |
| `plan_id` | integer (FK) | Subscription plan reference |
| `status` | text | Status: active, cancelled, expired |
| `start_date` | timestamp | Subscription start |
| `end_date` | timestamp | Subscription end |
| `billing_cycle` | text | Cycle: monthly, yearly |
| `created_at` | timestamp | Creation date |

---

### Table: `credit_packages`
**Use**: Credit purchase options

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Package ID |
| `name` | text | Package name |
| `description` | text | Package description |
| `credits` | integer | Number of credits |
| `price_inr` | integer | Price in INR |
| `price_usd` | integer | Price in USD |
| `discount` | integer | Discount percentage |
| `is_active` | boolean | Available for purchase |
| `is_featured` | boolean | Highlight package |
| `validity_days` | integer | Credit expiry days |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `shishya_payments`
**Use**: Payment transaction records

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Payment ID |
| `shishya_user_id` | integer (FK) | Student reference |
| `amount` | integer | Amount in smallest currency unit |
| `currency` | text | Currency: INR, USD |
| `status` | text | Status: pending, success, failed, refunded |
| `payment_method` | text | Method: card, upi, netbanking |
| `provider` | text | Gateway: razorpay, stripe |
| `provider_transaction_id` | text | Gateway transaction ID |
| `subscription_id` | integer (FK) | Subscription reference |
| `metadata` | jsonb | Additional payment data |
| `created_at` | timestamp | Payment initiated |
| `completed_at` | timestamp | Payment completed |

---

### Table: `vouchers`
**Use**: Discount and promotional codes

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Voucher ID |
| `code` | text | Unique voucher code |
| `name` | text | Voucher name |
| `description` | text | Terms and conditions |
| `type` | text | Type: discount, credit_bonus |
| `discount_type` | text | Discount: percentage, flat |
| `discount_value` | integer | Discount amount |
| `credit_bonus` | integer | Bonus credits |
| `max_uses` | integer | Maximum redemptions |
| `used_count` | integer | Current redemptions |
| `min_purchase` | integer | Minimum order value |
| `is_active` | boolean | Voucher enabled |
| `starts_at` | timestamp | Valid from |
| `expires_at` | timestamp | Valid until |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `gift_boxes`
**Use**: Gift credit packages

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Gift box ID |
| `name` | text | Gift name |
| `description` | text | Gift description |
| `credits` | integer | Credit amount |
| `price_inr` | integer | Price in INR |
| `price_usd` | integer | Price in USD |
| `template_image` | text | Gift card design URL |
| `custom_message` | text | Default message |
| `is_active` | boolean | Available |
| `expiry_days` | integer | Days until expiry |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `payment_gateways`
**Use**: Payment gateway configuration

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Gateway ID |
| `name` | text | Gateway name |
| `type` | text | Type: razorpay, stripe, payu |
| `is_active` | boolean | Gateway enabled |
| `is_test_mode` | boolean | Using test credentials |
| `config` | jsonb | Gateway configuration |
| `priority` | integer | Fallback order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `upi_settings`
**Use**: UPI payment configuration

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Setting ID |
| `upi_id` | text | UPI VPA |
| `display_name` | text | Merchant name |
| `is_active` | boolean | UPI enabled |
| `qr_code_image` | text | QR code image URL |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `bank_accounts`
**Use**: Bank account details for transfers

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Account ID |
| `bank_name` | text | Bank name |
| `account_number` | text | Account number |
| `account_holder_name` | text | Account holder |
| `ifsc_code` | text | IFSC code |
| `branch_name` | text | Branch |
| `account_type` | text | Type: savings, current |
| `is_active` | boolean | Account active |
| `is_primary` | boolean | Primary account |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `promotions`
**Use**: Marketing promotions and campaigns

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Promotion ID |
| `title` | text | Promotion title |
| `code` | text | Promo code (unique) |
| `type` | text | Type: bonus_coins, discount |
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

## 6. Reward & Gamification Tables

### Table: `coin_wallets`
**Use**: Student coin balance

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Wallet ID |
| `shishya_user_id` | integer (FK) | Student reference (unique) |
| `balance` | integer | Current coin balance |
| `lifetime_earned` | integer | Total coins ever earned |
| `lifetime_spent` | integer | Total coins ever spent |
| `updated_at` | timestamp | Last transaction time |

---

### Table: `coin_transactions`
**Use**: Coin earn/spend history

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Transaction ID |
| `shishya_user_id` | integer (FK) | Student reference |
| `amount` | integer | Coins (positive=earn, negative=spend) |
| `type` | text | Type: earned, spent, bonus, refund |
| `reason` | text | Transaction reason |
| `reference_id` | text | Related entity ID |
| `reference_type` | text | Entity: course, lesson, test, project |
| `balance_after` | integer | Balance after transaction |
| `created_at` | timestamp | Transaction time |

---

### Table: `course_rewards`
**Use**: Reward rules per course

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Reward config ID |
| `course_id` | integer (FK) | Course reference (unique) |
| `coins_enabled` | boolean | Rewards active for course |
| `coin_name` | text | Custom coin name |
| `coin_icon` | text | Coin icon name |
| `rules_json` | jsonb | Coin amounts per action |
| `bonus_json` | jsonb | Bonus conditions |
| `scholarship_enabled` | boolean | Scholarship available |
| `scholarship_json` | jsonb | Scholarship configuration |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `achievement_cards`
**Use**: Achievement badge definitions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Achievement ID |
| `course_id` | integer (FK) | Course reference |
| `title` | text | Achievement title |
| `description` | text | How to earn |
| `icon` | text | Icon name |
| `condition_json` | jsonb | Unlock conditions |
| `rarity` | text | Rarity: common, rare, epic, legendary |
| `is_active` | boolean | Achievement active |
| `sort_order` | integer | Display order |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `motivational_cards`
**Use**: Encouragement messages shown to students

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Card ID |
| `course_id` | integer (FK) | Course reference |
| `message` | text | Motivational message |
| `trigger_type` | text | When to show: lesson_complete, streak, milestone |
| `trigger_value` | integer | Trigger threshold |
| `icon` | text | Icon name |
| `is_active` | boolean | Card active |
| `sort_order` | integer | Display priority |
| `created_at` | timestamp | Creation date |

---

### Table: `motivation_rules`
**Use**: AI engine trigger rules for rewards

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Rule ID |
| `name` | text | Rule name |
| `description` | text | Rule description |
| `trigger_type` | text | Event type |
| `trigger_condition` | jsonb | Condition configuration |
| `reward_type` | text | Type: coins, scholarship, coupon |
| `reward_value` | integer | Reward amount |
| `reward_metadata` | jsonb | Additional reward data |
| `approval_mode` | text | Mode: auto_approved, admin_approval_required |
| `priority` | integer | Rule priority |
| `is_active` | boolean | Rule enabled |
| `valid_from` | timestamp | Rule start date |
| `valid_to` | timestamp | Rule end date |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `reward_approvals`
**Use**: Pending reward approval queue

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Approval ID |
| `shishya_user_id` | integer (FK) | Student requesting reward |
| `rule_id` | integer (FK) | Rule that triggered reward |
| `reward_type` | text | Type of reward |
| `original_value` | integer | Requested amount |
| `adjusted_value` | integer | Approved amount |
| `status` | text | Status: pending, approved, rejected |
| `trigger_event` | text | What triggered this |
| `trigger_data` | jsonb | Event data |
| `ai_reason` | text | AI recommendation |
| `risk_score` | integer | Fraud risk score (0-100) |
| `is_flagged` | boolean | Flagged for review |
| `flag_reason` | text | Why flagged |
| `reviewed_by` | varchar (FK) | Admin reviewer |
| `reviewed_at` | timestamp | Review time |
| `review_notes` | text | Admin notes |
| `second_approver` | varchar (FK) | Second approver (dual approval) |
| `second_approved_at` | timestamp | Second approval time |
| `wallet_transaction_id` | integer | Created transaction ID |
| `expires_at` | timestamp | Approval expiry |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `approval_policies`
**Use**: Auto-approval thresholds per reward type

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Policy ID |
| `reward_type` | text | Type: coins, scholarship, coupon |
| `approval_mode` | text | Mode: auto_approved, admin_approval_required |
| `min_value_for_approval` | integer | Minimum value requiring approval |
| `max_auto_approve_value` | integer | Maximum auto-approved amount |
| `require_dual_approval` | boolean | Needs two approvers |
| `dual_approval_threshold` | integer | Amount triggering dual approval |
| `cooldown_minutes` | integer | Wait time between rewards |
| `daily_limit` | integer | Max rewards per day |
| `weekly_limit` | integer | Max rewards per week |
| `is_active` | boolean | Policy active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `scholarships`
**Use**: Issued scholarship records

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Scholarship ID |
| `shishya_user_id` | integer (FK) | Student recipient |
| `reward_approval_id` | integer (FK) | Related approval |
| `title` | text | Scholarship name |
| `description` | text | Terms |
| `amount` | integer | Discount amount |
| `currency` | text | Currency: INR, USD |
| `status` | text | Status: pending, active, redeemed, expired |
| `course_id` | integer (FK) | Applicable course |
| `valid_from` | timestamp | Start date |
| `valid_to` | timestamp | Expiry date |
| `issued_by` | varchar (FK) | Issuing admin |
| `issued_at` | timestamp | Issue date |
| `redeemed_at` | timestamp | Redemption date |
| `created_at` | timestamp | Creation date |

---

### Table: `fraud_flags`
**Use**: Suspicious activity flags

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Flag ID |
| `shishya_user_id` | integer (FK) | Flagged student |
| `flag_type` | text | Type of suspicious activity |
| `severity` | text | Severity: low, medium, high, critical |
| `description` | text | Flag details |
| `is_resolved` | boolean | Flag resolved |
| `resolved_by` | varchar (FK) | Who resolved |
| `resolved_at` | timestamp | Resolution time |
| `resolution_notes` | text | How resolved |
| `created_at` | timestamp | Flag time |

---

### Table: `wallet_freezes`
**Use**: Frozen student wallets

| Column | Type | Use |
|--------|------|-----|
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

### Table: `risk_scores`
**Use**: Student fraud risk assessment

| Column | Type | Use |
|--------|------|-----|
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

### Table: `reward_overrides`
**Use**: Manual reward adjustments by admin

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Override ID |
| `shishya_user_id` | integer (FK) | Affected student |
| `admin_id` | varchar (FK) | Admin who made override |
| `action_type` | text | Type: add, deduct, freeze, adjust |
| `reward_type` | text | Type: coins, credits, scholarship |
| `amount` | integer | Amount changed |
| `reason` | text | Reason for override |
| `metadata` | jsonb | Additional data |
| `wallet_transaction_id` | integer | Created transaction |
| `created_at` | timestamp | Override time |

---

## 7. RBAC Tables

### Table: `admin_roles`
**Use**: Role definitions with hierarchy levels

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Role ID |
| `name` | text | Role identifier (unique) |
| `display_name` | text | Human-readable name |
| `description` | text | Role description |
| `level` | integer | Hierarchy level (100=highest) |
| `is_system` | boolean | System role (cannot delete) |
| `is_active` | boolean | Role active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `admin_permissions`
**Use**: Granular permission definitions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Permission ID |
| `code` | text | Permission code (unique) |
| `name` | text | Permission name |
| `description` | text | What it allows |
| `category` | text | Permission category |
| `is_system` | boolean | System permission |
| `created_at` | timestamp | Creation date |

---

### Table: `admin_role_permissions`
**Use**: Maps permissions to roles

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Mapping ID |
| `role_id` | integer (FK) | Role reference |
| `permission_id` | integer (FK) | Permission reference |
| `granted_at` | timestamp | When granted |
| `granted_by` | varchar (FK) | Who granted it |

---

### Table: `admin_user_roles`
**Use**: Assigns roles to admin users

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Assignment ID |
| `user_id` | varchar (FK) | User reference |
| `role_id` | integer (FK) | Role reference |
| `assigned_at` | timestamp | When assigned |
| `assigned_by` | varchar (FK) | Who assigned it |
| `expires_at` | timestamp | Role expiry (null=permanent) |
| `is_active` | boolean | Assignment active |

---

## 8. Approval Workflow Tables

### Table: `approval_templates`
**Use**: Workflow templates for different actions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Template ID |
| `name` | text | Template name (unique) |
| `description` | text | Template description |
| `entity_type` | text | Entity: course, reward, refund |
| `steps_config` | jsonb | Workflow steps configuration |
| `is_active` | boolean | Template active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `approval_requests`
**Use**: Pending approval requests

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Request ID |
| `template_id` | integer (FK) | Template reference |
| `entity_type` | text | What needs approval |
| `entity_id` | integer | ID of entity |
| `requested_by` | varchar (FK) | Who requested |
| `title` | text | Request title |
| `description` | text | Request details |
| `priority` | text | Priority: low, normal, high, urgent |
| `status` | text | Status: pending, approved, rejected, cancelled |
| `current_step` | integer | Current workflow step |
| `total_steps` | integer | Total steps needed |
| `metadata` | jsonb | Additional request data |
| `due_date` | timestamp | Deadline |
| `completed_at` | timestamp | Completion time |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `approval_steps`
**Use**: Individual steps in an approval workflow

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Step ID |
| `request_id` | integer (FK) | Request reference |
| `step_order` | integer | Step sequence |
| `role_required` | text | Required role for this step |
| `assigned_to` | varchar (FK) | Specific assignee |
| `status` | text | Status: pending, approved, rejected, skipped |
| `decision` | text | Decision: approve, reject |
| `comments` | text | Approver comments |
| `decided_at` | timestamp | Decision time |
| `created_at` | timestamp | Creation date |

---

### Table: `approval_actions`
**Use**: Audit trail of all approval actions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Action ID |
| `request_id` | integer (FK) | Request reference |
| `step_id` | integer (FK) | Step reference |
| `action_by` | varchar (FK) | Who took action |
| `action` | text | Action: approve, reject, comment, escalate |
| `previous_status` | text | Status before action |
| `new_status` | text | Status after action |
| `comments` | text | Action comments |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamp | Action time |

---

## 9. Course Versioning Tables

### Table: `course_versions`
**Use**: Version snapshots of courses

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Version ID |
| `course_id` | integer (FK) | Course reference |
| `version` | integer | Version number |
| `version_label` | text | Label (e.g., "v1.0.0") |
| `snapshot_data` | jsonb | Complete course snapshot |
| `change_log` | text | What changed |
| `created_by` | varchar (FK) | Who created version |
| `is_published` | boolean | Published version |
| `published_at` | timestamp | Publication time |
| `created_at` | timestamp | Creation date |

---

### Table: `course_publish_history`
**Use**: Audit trail of publish/unpublish actions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | History ID |
| `course_id` | integer (FK) | Course reference |
| `version_id` | integer (FK) | Version reference |
| `action` | text | Action: publish, unpublish, update |
| `performed_by` | varchar (FK) | Who performed action |
| `reason` | text | Action reason |
| `approval_request_id` | integer (FK) | Related approval |
| `previous_status` | text | Status before |
| `new_status` | text | Status after |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamp | Action time |

---

### Table: `course_quality_checks`
**Use**: Quality validation results

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Check ID |
| `course_id` | integer (FK) | Course reference |
| `version_id` | integer (FK) | Version reference |
| `check_type` | text | Type: content, structure, completeness |
| `status` | text | Status: pending, passed, failed |
| `score` | integer | Check score |
| `max_score` | integer | Maximum possible score |
| `details` | jsonb | Passed/failed/warnings lists |
| `checked_by` | varchar (FK) | Reviewer |
| `is_automatic` | boolean | AI-generated check |
| `created_at` | timestamp | Check time |

---

## 10. AI Governance Tables

### Table: `ai_generation_logs`
**Use**: Log of all AI content generation

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `course_id` | integer (FK) | Course reference |
| `generation_type` | text | Type: course, module, lesson, test |
| `prompt` | text | AI prompt used |
| `response` | text | AI response |
| `tokens_used` | integer | Token count |
| `status` | text | Status: pending, success, failed |
| `error_message` | text | Error details |
| `created_at` | timestamp | Generation start |
| `completed_at` | timestamp | Generation end |

---

### Table: `ai_rule_registry`
**Use**: AI generation rules and configurations

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Rule ID |
| `name` | text | Rule name (unique) |
| `description` | text | Rule description |
| `rule_type` | text | Rule type |
| `configuration` | jsonb | Model and prompt configuration |
| `input_schema` | jsonb | Input schema definition |
| `output_schema` | jsonb | Output schema definition |
| `version` | integer | Rule version |
| `status` | text | Status: draft, active |
| `approved_by` | varchar (FK) | Approving admin |
| `approved_at` | timestamp | Approval time |
| `is_active` | boolean | Rule active |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `ai_model_registry`
**Use**: AI model configurations

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Model ID |
| `name` | text | Model name |
| `provider` | text | Provider: openai, anthropic |
| `model_id` | text | Model identifier (gpt-4o) |
| `version` | text | Model version |
| `capabilities` | jsonb | Capabilities array |
| `cost_per_token` | integer | Cost per token |
| `max_tokens` | integer | Maximum tokens |
| `is_default` | boolean | Default model |
| `is_active` | boolean | Model active |
| `metadata` | jsonb | Additional metadata |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

## 11. Certificate Management Tables

### Table: `certificate_templates`
**Use**: Certificate design templates

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Template ID |
| `name` | text | Template name |
| `description` | text | Template description |
| `template_type` | text | Type: completion, assessment |
| `design_config` | jsonb | Design configuration (colors, fonts, logo) |
| `fields_config` | jsonb | Field positions and styles |
| `is_default` | boolean | Default template |
| `is_active` | boolean | Template active |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `signer_registry`
**Use**: Authorized certificate signers

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Signer ID |
| `name` | text | Signer name |
| `title` | text | Signer title |
| `organization` | text | Organization name |
| `signature_image_url` | text | Signature image URL |
| `is_active` | boolean | Signer active |
| `valid_from` | timestamp | Valid from |
| `valid_to` | timestamp | Valid until |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `academic_authorities`
**Use**: Accreditation bodies

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Authority ID |
| `name` | text | Authority name |
| `type` | text | Authority type |
| `registration_number` | text | Registration number |
| `country` | text | Country |
| `website` | text | Website URL |
| `logo_url` | text | Logo image URL |
| `accreditation_details` | jsonb | Accreditation details |
| `is_active` | boolean | Authority active |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

## 12. Audit & Security Tables

### Table: `audit_logs`
**Use**: General audit trail for entity changes

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `user_id` | varchar (FK) | Who made change |
| `action` | text | Action: create, update, delete |
| `entity_type` | text | Table/entity name |
| `entity_id` | integer | Entity ID |
| `old_value` | jsonb | Previous state |
| `new_value` | jsonb | New state |
| `metadata` | jsonb | Additional context |
| `created_at` | timestamp | Action time |

---

### Table: `admin_action_logs`
**Use**: Immutable audit of admin actions

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `admin_id` | varchar (FK) | Admin reference |
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

### Table: `data_access_logs`
**Use**: Track who accessed what data

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `user_id` | varchar (FK) | User who accessed |
| `entity_type` | text | What was accessed |
| `entity_id` | text | Entity ID |
| `access_type` | text | Access: read, export |
| `fields_accessed` | jsonb | Which fields |
| `ip_address` | text | Client IP |
| `user_agent` | text | Browser info |
| `session_id` | varchar | Session reference |
| `created_at` | timestamp | Access time |

---

### Table: `escalation_logs`
**Use**: Security escalation records

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `source_type` | text | Source of escalation |
| `source_id` | integer | Source entity ID |
| `severity` | text | Severity: low, medium, high, critical |
| `title` | text | Escalation title |
| `description` | text | Details |
| `escalated_to` | varchar (FK) | Assigned admin |
| `status` | text | Status: open, in_progress, resolved |
| `resolution` | text | How resolved |
| `resolved_by` | varchar (FK) | Who resolved |
| `resolved_at` | timestamp | Resolution time |
| `metadata` | jsonb | Additional data |
| `created_at` | timestamp | Escalation time |

---

### Table: `admin_security_logs`
**Use**: Security events and alerts

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Log ID |
| `user_id` | varchar (FK) | Related user |
| `event_type` | text | Event type |
| `severity` | text | Severity: info, warning, error, critical |
| `description` | text | Event description |
| `ip_address` | text | Client IP |
| `user_agent` | text | Browser info |
| `geo_location` | text | Geo location |
| `metadata` | jsonb | Additional data |
| `is_alerted` | boolean | Alert sent |
| `created_at` | timestamp | Event time |

---

## 13. System Configuration Tables

### Table: `system_settings`
**Use**: Key-value system configuration

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Setting ID |
| `key` | text | Setting key (unique) |
| `value` | text | Setting value |
| `description` | text | What this setting does |
| `updated_at` | timestamp | Last update |

---

### Table: `platform_settings`
**Use**: Platform-wide configuration

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Setting ID |
| `key` | text | Setting key (unique) |
| `value` | text | Setting value |
| `value_type` | text | Type: string, number, boolean, json |
| `category` | text | Setting category |
| `description` | text | Setting description |
| `is_public` | boolean | Visible to students |
| `is_editable` | boolean | Can be changed |
| `validation_rule` | text | Validation regex |
| `updated_by` | varchar (FK) | Who updated |
| `updated_at` | timestamp | Last update |

---

### Table: `api_keys`
**Use**: API keys for external integrations

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Key ID |
| `name` | text | Key name/description |
| `key` | text | API key value (unique) |
| `description` | text | Key purpose |
| `is_active` | boolean | Key active |
| `last_used_at` | timestamp | Last API call |
| `created_at` | timestamp | Creation date |
| `expires_at` | timestamp | Key expiry |

---

### Table: `publish_status`
**Use**: Course sync status with external platforms

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Status ID |
| `course_id` | integer (FK) | Course reference |
| `platform` | text | Platform name |
| `status` | text | Status: pending, synced, failed |
| `synced_at` | timestamp | Last sync time |
| `error_message` | text | Sync error |
| `created_at` | timestamp | Creation date |

---

### Table: `credit_policies`
**Use**: Pricing rules by course level

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Policy ID |
| `name` | text | Policy name |
| `description` | text | Policy description |
| `course_level` | text | Level: beginner, intermediate, advanced |
| `base_credits` | integer | Base credit cost |
| `price_inr` | integer | Price in INR |
| `price_usd` | integer | Price in USD |
| `is_default` | boolean | Default policy |
| `is_active` | boolean | Policy active |
| `valid_from` | timestamp | Valid from |
| `valid_to` | timestamp | Valid until |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `scholarship_policies`
**Use**: Scholarship eligibility rules

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Policy ID |
| `name` | text | Policy name |
| `description` | text | Policy description |
| `eligibility_criteria` | jsonb | Eligibility conditions |
| `discount_type` | text | Type: percentage, flat |
| `discount_value` | integer | Discount amount |
| `max_discount` | integer | Maximum discount |
| `usage_limit` | integer | Maximum uses |
| `usage_count` | integer | Current uses |
| `is_stackable` | boolean | Can combine with other discounts |
| `is_active` | boolean | Policy active |
| `valid_from` | timestamp | Valid from |
| `valid_to` | timestamp | Valid until |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

### Table: `pricing_rules`
**Use**: Dynamic pricing rules

| Column | Type | Use |
|--------|------|-----|
| `id` | serial (PK) | Rule ID |
| `name` | text | Rule name |
| `description` | text | Rule description |
| `rule_type` | text | Rule type |
| `conditions` | jsonb | Rule conditions |
| `pricing` | jsonb | Pricing configuration |
| `priority` | integer | Rule priority |
| `is_active` | boolean | Rule active |
| `created_by` | varchar (FK) | Creator |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last update date |

---

## Summary Statistics

| Category | Table Count |
|----------|-------------|
| Admin Authentication | 4 |
| Course Content | 7 |
| Assessment | 7 |
| Student | 2 |
| Payment & Subscription | 10 |
| Reward & Gamification | 12 |
| RBAC | 4 |
| Approval Workflow | 4 |
| Course Versioning | 3 |
| AI Governance | 3 |
| Certificate Management | 3 |
| Audit & Security | 5 |
| System Configuration | 6 |
| **TOTAL** | **70** |

---

**Document Version**: 1.0  
**Last Updated**: January 2026
