# Oushiksha Guru & Shishya Database Schema Documentation

## Overview

The database contains **69 tables** organized into two main categories:

1. **Admin (Guru) Tables** - Managed by the Admin portal for course creation, content management, and governance
2. **Student (Shishya) Tables** - All prefixed with `shishya_` for student authentication, progress, credits, and AI features

Both Guru (admin) and Shishya (student) portals share the same PostgreSQL database.

---

## Table of Contents

1. [Course Content Tables](#course-content-tables)
2. [Admin Authentication & Security Tables](#admin-authentication--security-tables)
3. [Business & Payment Tables](#business--payment-tables)
4. [Governance & Compliance Tables](#governance--compliance-tables)
5. [Shishya Authentication Tables](#shishya-authentication-tables)
6. [Shishya Profile Tables](#shishya-profile-tables)
7. [Shishya Progress Tables](#shishya-progress-tables)
8. [Shishya Credits & Wallet Tables](#shishya-credits--wallet-tables)
9. [Shishya Notifications Tables](#shishya-notifications-tables)
10. [Shishya AI Motivation Tables](#shishya-ai-motivation-tables)
11. [Shishya Academic Tables](#shishya-academic-tables)
12. [Shishya AI Tutor Tables](#shishya-ai-tutor-tables)

---

## Course Content Tables

These tables store the educational content created by admins. Shishya reads only published content.

### courses

Main catalog of all courses. **Source of truth** for course data.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Course title |
| description | TEXT | Full course description |
| level | TEXT | Difficulty: beginner/intermediate/advanced |
| target_audience | TEXT | Who this course is for |
| duration | TEXT | Estimated completion time |
| overview | TEXT | Course overview summary |
| learning_outcomes | JSONB | Array of learning objectives |
| job_roles | JSONB | Target job roles |
| include_projects | BOOLEAN | Whether course has projects |
| include_tests | BOOLEAN | Whether course has tests |
| include_labs | BOOLEAN | Whether course has labs |
| certificate_type | TEXT | Type of certificate offered |
| status | TEXT | draft/published/archived/generating |
| is_active | BOOLEAN | Quick toggle for Shishya visibility |
| ai_command | TEXT | Original AI generation command |
| thumbnail_url | TEXT | Course cover image |
| credit_cost | INTEGER | Credits required to enroll |
| is_free | BOOLEAN | Whether course is free |
| original_credit_cost | INTEGER | Original price before discount |
| version | INTEGER | Content version number |
| published_at | TIMESTAMP | When course was published |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Course catalog, enrollment, progress tracking
**Shishya Query:** `WHERE status = 'published' AND is_active = true`

---

### modules

Sections or chapters within a course.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| title | TEXT | Module title |
| description | TEXT | Module overview |
| order_index | INTEGER | Display order in course |
| estimated_time | TEXT | Time to complete |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Course structure, navigation, progress tracking
**Connection:** courses (1) -> (N) modules

---

### lessons

Individual learning units within modules.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| module_id | INTEGER | FK to modules.id |
| title | TEXT | Lesson title |
| objectives | JSONB | Learning objectives |
| estimated_time | TEXT | Duration |
| key_concepts | JSONB | Important concepts covered |
| video_url | TEXT | Video lesson URL |
| external_links | JSONB | Additional resources |
| youtube_references | JSONB | YouTube video references |
| order_index | INTEGER | Display order in module |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Content display, lesson viewer, progress tracking
**Connection:** modules (1) -> (N) lessons

---

### tests

Assessments for courses.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| module_id | INTEGER | FK to modules.id (optional) |
| title | TEXT | Test title |
| description | TEXT | Test instructions |
| duration_minutes | INTEGER | Time limit |
| passing_percentage | INTEGER | Minimum score to pass |
| total_marks | INTEGER | Maximum marks |
| is_active | BOOLEAN | Whether test is available |
| shuffle_questions | BOOLEAN | Randomize question order |
| show_results | BOOLEAN | Show results after completion |
| type | TEXT | Test type |
| difficulty | TEXT | Difficulty level |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Test taking, scoring, certificate eligibility
**Connection:** courses (1) -> (N) tests

---

### questions

Test questions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| test_id | INTEGER | FK to tests.id |
| type | TEXT | Question type (mcq/true_false/short_answer) |
| text | TEXT | Question text |
| options | JSONB | Answer options for MCQ |
| correct_answer | TEXT | Correct answer |
| explanation | TEXT | Answer explanation |
| marks | INTEGER | Points for this question |
| order_index | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Test content, grading
**Connection:** tests (1) -> (N) questions

---

### projects

Hands-on assignments for practical learning.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| module_id | INTEGER | FK to modules.id (optional) |
| title | TEXT | Project title |
| description | TEXT | Project requirements |
| difficulty | TEXT | beginner/intermediate/advanced |
| estimated_hours | INTEGER | Expected completion time |
| requirements | JSONB | Submission requirements |
| rubric | JSONB | Grading criteria |
| starter_template | TEXT | Initial code template |
| solution_guide | TEXT | Solution reference |
| resources | JSONB | Helpful resources |
| skills | JSONB | Skills practiced |
| submission_type | TEXT | How to submit |
| max_submissions | INTEGER | Submission limit |
| is_active | BOOLEAN | Whether project is available |
| order_index | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Project display, submission tracking, certificate eligibility
**Connection:** courses (1) -> (N) projects

---

### practice_labs

Guided coding exercises with browser-based execution.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| module_id | INTEGER | FK to modules.id |
| lesson_id | INTEGER | FK to lessons.id |
| slug | TEXT | URL-friendly identifier |
| title | TEXT | Lab title |
| description | TEXT | Lab instructions |
| difficulty | TEXT | Difficulty level |
| language | TEXT | Programming language |
| estimated_time | INTEGER | Minutes to complete |
| instructions | TEXT | Step-by-step guide |
| starter_code | TEXT | Initial code template |
| expected_output | TEXT | Expected result for validation |
| validation_type | TEXT | How to validate solution |
| validation_code | TEXT | Validation logic |
| hints | JSONB | Progressive hints |
| solution_code | TEXT | Reference solution |
| prerequisites | JSONB | Required knowledge |
| skills | JSONB | Skills practiced |
| is_active | BOOLEAN | Whether lab is available |
| order_index | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Interactive coding, output matching, skill building
**Connection:** courses (1) -> (N) practice_labs

---

### certificates

Certificate templates for courses.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| name | TEXT | Certificate name |
| description | TEXT | Certificate description |
| type | TEXT | completion/achievement/skill |
| skill_tags | JSONB | Skills certified |
| level | TEXT | Certificate level |
| requires_test_pass | BOOLEAN | Must pass test |
| requires_project_completion | BOOLEAN | Must submit project |
| requires_lab_completion | BOOLEAN | Must complete labs |
| passing_percentage | INTEGER | Minimum score required |
| qr_verification | BOOLEAN | QR code for verification |
| template_id | TEXT | PDF template reference |
| category | TEXT | Certificate category |
| tags | JSONB | Additional tags |
| status | TEXT | draft/active |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Certificate generation, verification, portfolio
**Connection:** courses (1) -> (1) certificates

---

### skills

Master list of skills taught across courses.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Skill name |
| category | TEXT | Skill category |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Skills library, course tagging, portfolio
**Connection:** Linked to courses via course_skills

---

### course_skills

Many-to-many relationship between courses and skills.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| skill_id | INTEGER | FK to skills.id |

**Usage:** Skill tagging for courses
**Connection:** courses (N) <-> (N) skills

---

### ai_notes

AI-generated lesson notes and summaries.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| lesson_id | INTEGER | FK to lessons.id |
| content | TEXT | Full notes content |
| simplified_explanation | TEXT | Simple explanation |
| bullet_notes | JSONB | Key points |
| key_takeaways | JSONB | Main takeaways |
| interview_questions | JSONB | Related interview questions |
| version | INTEGER | Notes version |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Study aids, revision, interview prep
**Connection:** lessons (1) -> (1) ai_notes

---

### course_rewards

Reward configuration for each course.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| coins_enabled | BOOLEAN | Enable coin rewards |
| coin_name | TEXT | Custom coin name |
| coin_icon | TEXT | Icon for coins |
| rules_json | JSONB | Reward rules configuration |
| bonus_json | JSONB | Bonus reward settings |
| scholarship_enabled | BOOLEAN | Enable scholarship |
| scholarship_json | JSONB | Scholarship configuration |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Gamification, rewards configuration
**Connection:** courses (1) -> (1) course_rewards

---

### achievement_cards

Achievement badges for courses.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| title | TEXT | Achievement title |
| description | TEXT | Achievement description |
| icon | TEXT | Badge icon |
| condition_json | JSONB | Unlock conditions |
| rarity | TEXT | common/rare/epic/legendary |
| is_active | BOOLEAN | Whether active |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Gamification, student motivation
**Connection:** courses (1) -> (N) achievement_cards

---

### motivational_cards

Motivational messages displayed during learning.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| message | TEXT | Motivational message |
| trigger_type | TEXT | When to display |
| trigger_value | INTEGER | Trigger threshold |
| icon | TEXT | Display icon |
| is_active | BOOLEAN | Whether active |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Student motivation, engagement
**Connection:** courses (1) -> (N) motivational_cards

---

## Admin Authentication & Security Tables

### users

Admin user accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| username | TEXT | Unique username |
| email | TEXT | Unique email address |
| password | TEXT | Bcrypt hashed password |
| role | TEXT | pending_admin/admin/super_admin |
| is_email_verified | BOOLEAN | Email verification status |
| profile_image | TEXT | Profile picture URL |
| last_login | TIMESTAMP | Last login time |
| failed_login_attempts | INTEGER | Failed login counter |
| lockout_until | TIMESTAMP | Account lockout expiry |
| must_change_password | BOOLEAN | Force password change |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Admin authentication, authorization
**Security:** Bcrypt hashing, lockout after failed attempts

---

### otp_tokens

One-time passwords for admin verification.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR | FK to users.id |
| otp | TEXT | Hashed OTP code |
| expires_at | TIMESTAMP | OTP expiration |
| attempts | INTEGER | Verification attempts |
| is_used | BOOLEAN | Whether OTP was used |
| created_at | TIMESTAMP | OTP creation time |

**Usage:** Email verification, password reset
**Connection:** users (1) -> (N) otp_tokens

---

### admin_sessions

Active admin login sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| user_id | VARCHAR | FK to users.id |
| token | TEXT | Session token |
| device | TEXT | Device info |
| browser | TEXT | Browser info |
| ip_address | TEXT | Client IP |
| location | TEXT | Geo location |
| is_active | BOOLEAN | Session active status |
| last_active_at | TIMESTAMP | Last activity |
| expires_at | TIMESTAMP | Session expiry |
| created_at | TIMESTAMP | Session creation |

**Usage:** Session management, security monitoring
**Connection:** users (1) -> (N) admin_sessions

---

### login_attempts

Login attempt audit log.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| email | TEXT | Attempted email |
| user_id | VARCHAR | FK to users.id (if exists) |
| success | BOOLEAN | Whether login succeeded |
| ip_address | TEXT | Client IP |
| user_agent | TEXT | Browser info |
| location | TEXT | Geo location |
| reason | TEXT | Failure reason |
| created_at | TIMESTAMP | Attempt time |

**Usage:** Security auditing, abuse detection
**Connection:** users (1) -> (N) login_attempts

---

### audit_logs

System-wide audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR | FK to users.id |
| action | TEXT | Action performed |
| entity_type | TEXT | Type of entity modified |
| entity_id | INTEGER | ID of entity modified |
| old_value | JSONB | Previous state |
| new_value | JSONB | New state |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMP | Action timestamp |

**Usage:** Compliance, debugging, accountability
**Connection:** Tracks all admin actions

---

### ai_generation_logs

AI content generation history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| course_id | INTEGER | FK to courses.id |
| generation_type | TEXT | Type of content generated |
| prompt | TEXT | AI prompt used |
| response | TEXT | AI response |
| tokens_used | INTEGER | API tokens consumed |
| status | TEXT | pending/success/failed |
| error_message | TEXT | Error if failed |
| created_at | TIMESTAMP | Generation start |
| completed_at | TIMESTAMP | Generation end |

**Usage:** AI usage tracking, debugging, cost monitoring
**Connection:** courses (1) -> (N) ai_generation_logs

---

## Business & Payment Tables

### credit_packages

Purchasable credit bundles.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Package name |
| description | TEXT | Package description |
| credits | INTEGER | Credits included |
| price_inr | INTEGER | Price in INR |
| price_usd | INTEGER | Price in USD |
| discount | INTEGER | Discount percentage |
| is_active | BOOLEAN | Whether available |
| is_featured | BOOLEAN | Featured package |
| validity_days | INTEGER | Credit validity |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Credit purchases, pricing display

---

### vouchers

Promotional voucher codes (Admin-managed).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| code | TEXT | Unique voucher code |
| type | TEXT | Voucher type |
| value | INTEGER | Discount value |
| min_purchase | INTEGER | Minimum purchase required |
| max_uses | INTEGER | Maximum redemptions |
| used_count | INTEGER | Current usage count |
| starts_at | TIMESTAMP | Start date |
| expires_at | TIMESTAMP | Expiration date |
| is_active | BOOLEAN | Whether active |
| applicable_packages | JSONB | Eligible packages |
| created_by | VARCHAR | Admin who created |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Promotions, marketing campaigns

---

### gift_boxes

Gift card products (Admin catalog).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Gift box name |
| description | TEXT | Description |
| credits | INTEGER | Credits included |
| price_inr | INTEGER | Price in INR |
| price_usd | INTEGER | Price in USD |
| template_image | TEXT | Gift card design |
| custom_message | TEXT | Gift message |
| is_active | BOOLEAN | Whether available |
| expiry_days | INTEGER | Validity period |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Gift purchases, gifting features

---

### payment_gateways

Payment gateway configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Gateway name |
| type | TEXT | Gateway type |
| is_active | BOOLEAN | Whether enabled |
| is_test_mode | BOOLEAN | Test mode flag |
| config | JSONB | Gateway configuration |
| priority | INTEGER | Display order |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Payment processing configuration

---

### upi_settings

UPI payment settings.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| upi_id | TEXT | UPI ID |
| display_name | TEXT | Display name |
| is_active | BOOLEAN | Whether enabled |
| qr_code | TEXT | QR code image |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** UPI payment collection

---

### bank_accounts

Bank account details for payments.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| bank_name | TEXT | Bank name |
| account_number | TEXT | Account number |
| account_holder_name | TEXT | Account holder |
| ifsc_code | TEXT | IFSC code |
| branch_name | TEXT | Branch name |
| account_type | TEXT | savings/current |
| is_active | BOOLEAN | Whether active |
| is_primary | BOOLEAN | Primary account |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Bank transfer payments

---

### subscription_plans

Subscription tier definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Plan name |
| description | TEXT | Plan description |
| price_monthly | INTEGER | Monthly price |
| price_yearly | INTEGER | Yearly price |
| currency | TEXT | Currency code |
| features | JSONB | Plan features |
| credits_monthly | INTEGER | Monthly credits |
| max_courses | INTEGER | Course access limit |
| priority_support | BOOLEAN | Priority support |
| is_active | BOOLEAN | Whether available |
| is_featured | BOOLEAN | Featured plan |
| created_at | TIMESTAMP | Creation time |

**Usage:** Subscription management, pricing

---

### user_subscriptions

User subscription records.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| plan_id | INTEGER | FK to subscription_plans.id |
| status | TEXT | active/cancelled/expired |
| starts_at | TIMESTAMP | Start date |
| ends_at | TIMESTAMP | End date |
| auto_renew | BOOLEAN | Auto renewal |
| created_at | TIMESTAMP | Creation time |

**Usage:** Subscription tracking
**Connection:** shishya_users (1) -> (N) user_subscriptions

---

### promotions

Marketing promotions and campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Promotion name |
| description | TEXT | Description |
| type | TEXT | Promotion type |
| value | INTEGER | Discount value |
| code | TEXT | Promo code |
| starts_at | TIMESTAMP | Start date |
| ends_at | TIMESTAMP | End date |
| max_uses | INTEGER | Usage limit |
| used_count | INTEGER | Current usage |
| is_active | BOOLEAN | Whether active |
| created_by | VARCHAR | Admin who created |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Marketing, seasonal discounts

---

### system_settings

Global system configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| key | TEXT | Setting key |
| value | TEXT | Setting value |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** System-wide configuration

---

## Governance & Compliance Tables

### approval_policies

Reward approval policy configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| reward_type | TEXT | Type of reward |
| approval_mode | TEXT | auto/manual/dual approval |
| min_value_for_approval | INTEGER | Threshold for approval |
| max_auto_approve_value | INTEGER | Auto-approve limit |
| require_dual_approval | BOOLEAN | Dual approval required |
| dual_approval_threshold | INTEGER | Dual approval threshold |
| cooldown_minutes | INTEGER | Cooldown between rewards |
| daily_limit | INTEGER | Daily limit |
| weekly_limit | INTEGER | Weekly limit |
| is_active | BOOLEAN | Whether active |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Fraud prevention, reward governance

---

### motivation_rules

Admin-defined motivation trigger rules.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Rule name |
| description | TEXT | Rule description |
| trigger_type | TEXT | Event type |
| trigger_condition | JSONB | Trigger conditions |
| reward_type | TEXT | Reward type |
| reward_value | INTEGER | Reward amount |
| reward_metadata | JSONB | Additional reward data |
| approval_mode | TEXT | Approval requirement |
| priority | INTEGER | Rule priority |
| is_active | BOOLEAN | Whether active |
| valid_from | TIMESTAMP | Start date |
| valid_to | TIMESTAMP | End date |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Automated gamification, engagement rules

---

### reward_approvals

Pending reward approvals queue.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| rule_id | INTEGER | FK to motivation_rules.id |
| reward_type | TEXT | Type of reward |
| reward_value | INTEGER | Reward amount |
| trigger_event | TEXT | What triggered this |
| trigger_data | JSONB | Trigger context |
| status | TEXT | pending/approved/rejected |
| first_approver_id | VARCHAR | First approver |
| first_approved_at | TIMESTAMP | First approval time |
| second_approver_id | VARCHAR | Second approver |
| second_approved_at | TIMESTAMP | Second approval time |
| rejected_by | VARCHAR | Rejector if rejected |
| rejection_reason | TEXT | Rejection reason |
| auto_approved | BOOLEAN | Auto-approved flag |
| expires_at | TIMESTAMP | Approval expiry |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Reward approval workflow
**Connection:** shishya_users (1) -> (N) reward_approvals

---

### fraud_flags

Suspicious activity flags.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | INTEGER | FK to shishya_users.id |
| flag_type | TEXT | Type of fraud indicator |
| severity | TEXT | low/medium/high/critical |
| description | TEXT | Flag description |
| detection_data | JSONB | Detection details |
| status | TEXT | active/resolved/dismissed |
| resolved_by | VARCHAR | Admin who resolved |
| resolved_at | TIMESTAMP | Resolution time |
| resolution_notes | TEXT | Resolution notes |
| created_at | TIMESTAMP | Detection time |

**Usage:** Fraud detection, abuse prevention
**Connection:** shishya_users (1) -> (N) fraud_flags

---

### wallet_freezes

Frozen wallet records.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| frozen_by | VARCHAR | Admin who froze |
| reason | TEXT | Freeze reason |
| frozen_at | TIMESTAMP | Freeze time |
| unfrozen_by | VARCHAR | Admin who unfroze |
| unfrozen_at | TIMESTAMP | Unfreeze time |
| is_active | BOOLEAN | Currently frozen |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Usage:** Wallet security, fraud response
**Connection:** shishya_users (1) -> (N) wallet_freezes

---

### reward_overrides

Manual reward adjustments.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| admin_id | VARCHAR | Admin who made override |
| action_type | TEXT | grant_coins/deduct_coins |
| reward_type | TEXT | Type of reward |
| amount | INTEGER | Amount adjusted |
| reason | TEXT | Justification |
| wallet_transaction_id | INTEGER | Related transaction |
| created_at | TIMESTAMP | Override time |

**Usage:** Manual reward management
**Connection:** shishya_users (1) -> (N) reward_overrides

---

### risk_scores

User risk assessment scores.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| overall_score | INTEGER | Combined risk score |
| velocity_score | INTEGER | Activity velocity risk |
| pattern_score | INTEGER | Pattern anomaly risk |
| value_score | INTEGER | Value anomaly risk |
| factors | JSONB | Contributing factors |
| last_calculated | TIMESTAMP | Last calculation |
| created_at | TIMESTAMP | First calculation |
| updated_at | TIMESTAMP | Last update |

**Usage:** Risk assessment, fraud prevention
**Connection:** shishya_users (1) -> (1) risk_scores

---

### admin_action_logs

Detailed admin action audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| admin_id | VARCHAR | FK to users.id |
| action_type | TEXT | Type of action |
| entity_type | TEXT | Entity affected |
| entity_id | TEXT | Entity ID |
| previous_state | JSONB | State before |
| new_state | JSONB | State after |
| reason | TEXT | Action justification |
| ip_address | TEXT | Admin IP |
| user_agent | TEXT | Browser info |
| created_at | TIMESTAMP | Action time |

**Usage:** Admin accountability, compliance
**Connection:** users (1) -> (N) admin_action_logs

---

### scholarships

Scholarship programs managed by admin.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | VARCHAR | FK to shishya_users.id |
| course_id | INTEGER | FK to courses.id |
| title | TEXT | Scholarship title |
| description | TEXT | Description |
| credits | INTEGER | Credits awarded |
| percentage | INTEGER | Discount percentage |
| status | TEXT | pending/approved/rejected |
| approved_by | VARCHAR | Approving admin |
| valid_from | TIMESTAMP | Start date |
| valid_to | TIMESTAMP | End date |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Usage:** Financial aid, access grants
**Connection:** shishya_users (1) -> (N) scholarships

---

### activity_logs

User activity tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| shishya_user_id | INTEGER | FK to shishya_users.id |
| action | TEXT | Action performed |
| entity_type | TEXT | Type of entity |
| entity_id | TEXT | Entity ID |
| metadata | JSONB | Additional data |
| ip_address | TEXT | Client IP |
| user_agent | TEXT | Browser info |
| created_at | TIMESTAMP | Action time |

**Usage:** User behavior analytics
**Connection:** shishya_users (1) -> (N) activity_logs

---

## Shishya Authentication Tables

### shishya_users

Student account credentials.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID v4) |
| email | VARCHAR(255) | Unique email address |
| password_hash | TEXT | Bcrypt hashed password |
| name | VARCHAR(255) | Display name |
| phone | VARCHAR(20) | Phone number |
| status | VARCHAR(20) | active/suspended/deleted |
| email_verified | BOOLEAN | Email verification status |
| phone_verified | BOOLEAN | Phone verification status |
| last_login_at | TIMESTAMP | Last login time |
| last_active_at | TIMESTAMP | Last activity time |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Student authentication, login, identity
**Key:** UUID v4 for distributed ID generation

---

### shishya_sessions

Server-side session storage.

| Column | Type | Description |
|--------|------|-------------|
| sid | VARCHAR(255) | Session ID (Primary key) |
| sess | JSONB | Session data |
| expire | TIMESTAMP | Session expiration time |

**Usage:** Session management, HTTP-only cookies
**Connection:** Express session store

---

### shishya_otp_codes

One-time passwords for verification.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| email | VARCHAR(255) | Target email address |
| otp_hash | TEXT | SHA256 hashed OTP |
| expires_at | TIMESTAMP | OTP expiration time |
| verified | BOOLEAN | Whether OTP was used |
| created_at | TIMESTAMP | OTP creation time |

**Usage:** Email verification, password reset, secure signup

---

### shishya_otp_logs

OTP action audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| email | VARCHAR(255) | Target email |
| action | VARCHAR(50) | Action type (send/verify/fail) |
| ip_address | VARCHAR(45) | Client IP address |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMP | Action timestamp |

**Usage:** Security auditing, abuse detection

---

## Shishya Profile Tables

### shishya_user_profiles

Extended student profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| user_id | VARCHAR(36) | FK to shishya_users.id (Unique) |
| full_name | VARCHAR(255) | Display name |
| username | VARCHAR(50) | Unique public username |
| bio | TEXT | About me (max 500 chars) |
| profile_photo | TEXT | Base64 encoded photo |
| headline | VARCHAR(200) | Professional headline |
| location | VARCHAR(100) | City/Country |
| github_url | TEXT | GitHub profile link |
| linkedin_url | TEXT | LinkedIn profile link |
| website_url | TEXT | Personal website |
| facebook_url | TEXT | Facebook profile |
| instagram_url | TEXT | Instagram profile |
| portfolio_visible | BOOLEAN | Public portfolio enabled |
| created_at | TIMESTAMP | Profile creation time |
| updated_at | TIMESTAMP | Last update time |

**Usage:** Profile page, public portfolio, social links
**Connection:** shishya_users (1) -> (1) shishya_user_profiles

---

## Shishya Progress Tables

### shishya_user_progress

Lesson completion tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| course_id | INTEGER | FK to courses.id |
| lesson_id | INTEGER | FK to lessons.id |
| completed | BOOLEAN | Completion status |
| completed_at | TIMESTAMP | When marked complete |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Progress bars, continue learning, course completion
**Connection:** shishya_users (1) -> (N) shishya_user_progress

---

### shishya_user_lab_progress

Lab completion and code storage.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| lab_id | INTEGER | FK to practice_labs.id |
| completed | BOOLEAN | Completion status |
| user_code | TEXT | Student's saved code |
| completed_at | TIMESTAMP | When completed |
| created_at | TIMESTAMP | Record creation time |

**Usage:** Lab progress, code persistence, skill tracking
**Connection:** shishya_users (1) -> (N) shishya_user_lab_progress

---

### shishya_user_test_attempts

Test attempt history and scores.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| test_id | INTEGER | FK to tests.id |
| course_id | INTEGER | FK to courses.id |
| score | INTEGER | Points earned |
| total_questions | INTEGER | Number of questions |
| passed | BOOLEAN | Met passing percentage |
| answers | JSONB | Student's answers |
| time_taken | INTEGER | Seconds to complete |
| attempted_at | TIMESTAMP | Attempt timestamp |

**Usage:** Test results, certificate eligibility, marksheet grades
**Connection:** shishya_users (1) -> (N) shishya_user_test_attempts

---

### shishya_user_project_submissions

Project submission tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| project_id | INTEGER | FK to projects.id |
| course_id | INTEGER | FK to courses.id |
| submission_url | TEXT | Live demo URL |
| github_url | TEXT | Repository URL |
| description | TEXT | Submission notes |
| status | VARCHAR(20) | pending/approved/rejected |
| feedback | TEXT | Reviewer feedback |
| submitted_at | TIMESTAMP | Submission time |
| reviewed_at | TIMESTAMP | Review timestamp |

**Usage:** Project submissions, portfolio, certificate eligibility
**Connection:** shishya_users (1) -> (N) shishya_user_project_submissions

---

### shishya_user_certificates

Earned certificates.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| course_id | INTEGER | FK to courses.id |
| certificate_number | VARCHAR(50) | Unique verification ID |
| issued_at | TIMESTAMP | Issue date |
| pdf_url | TEXT | Generated PDF URL |

**Usage:** Certificate viewer, public verification, portfolio
**Connection:** shishya_users (1) -> (N) shishya_user_certificates

---

### shishya_course_enrollments

Course enrollment records.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| course_id | INTEGER | FK to courses.id |
| enrolled_at | TIMESTAMP | Enrollment time |
| completed_at | TIMESTAMP | Completion time |
| status | VARCHAR(20) | active/completed/dropped |

**Usage:** Dashboard, course access control, progress tracking
**Connection:** shishya_users (1) -> (N) shishya_course_enrollments

---

## Shishya Credits & Wallet Tables

### shishya_user_credits

Student credit balance.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id (Unique) |
| balance | INTEGER | Current credit balance |
| lifetime_earned | INTEGER | Total credits ever received |
| lifetime_spent | INTEGER | Total credits ever spent |
| updated_at | TIMESTAMP | Last balance change |

**Usage:** Wallet display, enrollment, credit management
**Connection:** shishya_users (1) -> (1) shishya_user_credits

---

### shishya_credit_transactions

Credit transaction history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| amount | INTEGER | Credits (+/-) |
| type | VARCHAR(20) | welcome/purchase/spend/refund |
| description | TEXT | Transaction description |
| reference_id | VARCHAR(100) | External reference (Razorpay) |
| created_at | TIMESTAMP | Transaction time |

**Usage:** Transaction history, wallet page, auditing
**Connection:** shishya_users (1) -> (N) shishya_credit_transactions

---

### shishya_vouchers

Redeemable voucher codes for students.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| code | VARCHAR(50) | Unique voucher code |
| credits | INTEGER | Credits awarded |
| max_uses | INTEGER | Maximum redemptions |
| used_count | INTEGER | Current redemption count |
| expires_at | TIMESTAMP | Expiration date |
| is_active | BOOLEAN | Voucher enabled |
| created_at | TIMESTAMP | Creation time |

**Usage:** Promotions, partnerships, marketing campaigns

---

### shishya_voucher_redemptions

Voucher redemption records.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| voucher_id | INTEGER | FK to shishya_vouchers.id |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| redeemed_at | TIMESTAMP | Redemption time |

**Usage:** Prevent duplicate redemptions, voucher analytics
**Connection:** shishya_users (1) -> (N) shishya_voucher_redemptions

---

### shishya_gift_boxes

Surprise credit gifts for students.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| credits | INTEGER | Gift amount |
| message | TEXT | Gift message |
| opened | BOOLEAN | Whether gift was claimed |
| opened_at | TIMESTAMP | Claim timestamp |
| created_at | TIMESTAMP | Gift creation time |

**Usage:** Gamification, rewards, engagement
**Connection:** shishya_users (1) -> (N) shishya_gift_boxes

---

### shishya_payments

Student payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| amount | INTEGER | Payment amount |
| currency | TEXT | Currency code |
| status | TEXT | pending/success/failed |
| gateway | TEXT | Payment gateway used |
| gateway_transaction_id | TEXT | External transaction ID |
| package_id | INTEGER | FK to credit_packages.id |
| credits_added | INTEGER | Credits received |
| metadata | JSONB | Additional payment data |
| created_at | TIMESTAMP | Payment time |
| updated_at | TIMESTAMP | Last update |

**Usage:** Payment history, credit purchases
**Connection:** shishya_users (1) -> (N) shishya_payments

---

## Shishya Notifications Tables

### shishya_notifications

In-app notifications for students.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Full message |
| type | VARCHAR(50) | info/success/warning/achievement |
| read | BOOLEAN | Read status |
| action_url | TEXT | Click destination |
| created_at | TIMESTAMP | Notification time |

**Usage:** Notification center, alerts, engagement
**Connection:** shishya_users (1) -> (N) shishya_notifications

---

## Shishya AI Motivation Tables

### shishya_motivation_rules

Rules engine for automated motivation triggers.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Rule name |
| description | TEXT | Rule purpose |
| trigger_type | VARCHAR(50) | Event type |
| trigger_condition | JSONB | Condition parameters |
| action_type | VARCHAR(50) | Action type |
| action_data | JSONB | Action parameters |
| is_active | BOOLEAN | Rule enabled |
| priority | INTEGER | Execution order |
| created_at | TIMESTAMP | Creation time |

**Usage:** Automated engagement, gamification rules

---

### shishya_rule_trigger_logs

Audit log for rule executions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| rule_id | INTEGER | FK to shishya_motivation_rules.id |
| user_id | VARCHAR(36) | Triggered for user |
| triggered_at | TIMESTAMP | Execution time |
| action_taken | JSONB | What action was performed |

**Usage:** Analytics, debugging, rule effectiveness
**Connection:** shishya_motivation_rules (1) -> (N) shishya_rule_trigger_logs

---

### shishya_motivation_cards

Personalized motivation messages.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| card_type | VARCHAR(50) | quote/tip/challenge/streak |
| title | VARCHAR(255) | Card headline |
| message | TEXT | Full message |
| action_url | TEXT | Optional CTA link |
| dismissed | BOOLEAN | User dismissed |
| expires_at | TIMESTAMP | Auto-expire time |
| created_at | TIMESTAMP | Creation time |

**Usage:** Dashboard cards, daily motivation, engagement
**Connection:** shishya_users (1) -> (N) shishya_motivation_cards

---

### shishya_ai_nudge_logs

AI-generated nudge history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| nudge_type | VARCHAR(50) | Type of nudge |
| message | TEXT | Generated message |
| context | JSONB | Generation context |
| created_at | TIMESTAMP | Nudge time |

**Usage:** AI engagement, personalized reminders
**Connection:** shishya_users (1) -> (N) shishya_ai_nudge_logs

---

### shishya_student_streaks

Learning streak tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id (Unique) |
| current_streak | INTEGER | Current consecutive days |
| longest_streak | INTEGER | All-time best streak |
| last_activity_date | DATE | Last learning date |
| updated_at | TIMESTAMP | Last update |

**Usage:** Streak badges, gamification, retention
**Connection:** shishya_users (1) -> (1) shishya_student_streaks

---

### shishya_mystery_boxes

Gamified reward boxes.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| box_type | VARCHAR(50) | daily/weekly/achievement |
| reward_type | VARCHAR(50) | credits/badge/feature |
| reward_value | INTEGER | Reward amount |
| opened | BOOLEAN | Whether opened |
| opened_at | TIMESTAMP | Open timestamp |
| expires_at | TIMESTAMP | Expiration time |
| created_at | TIMESTAMP | Creation time |

**Usage:** Daily rewards, engagement, surprise mechanics
**Connection:** shishya_users (1) -> (N) shishya_mystery_boxes

---

### shishya_scholarships

Available scholarship programs for students.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Scholarship name |
| description | TEXT | Full description |
| credits | INTEGER | Credits awarded |
| eligibility_criteria | JSONB | Requirements |
| max_recipients | INTEGER | Maximum awardees |
| current_recipients | INTEGER | Current count |
| is_active | BOOLEAN | Open for applications |
| starts_at | TIMESTAMP | Start date |
| ends_at | TIMESTAMP | End date |
| created_at | TIMESTAMP | Creation time |

**Usage:** Financial aid, credit grants, accessibility

---

### shishya_user_scholarships

Scholarship awards to students.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| scholarship_id | INTEGER | FK to shishya_scholarships.id |
| awarded_at | TIMESTAMP | Award date |
| status | VARCHAR(20) | active/expired/revoked |

**Usage:** Scholarship tracking, student aid history
**Connection:** shishya_users (1) -> (N) shishya_user_scholarships

---

## Shishya Academic Tables

### shishya_marksheets

Consolidated academic records.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| marksheet_number | VARCHAR(50) | Unique verification ID |
| courses_completed | INTEGER | Number of courses |
| total_credits | INTEGER | Credits earned |
| cgpa | DECIMAL(3,2) | Cumulative GPA (10-point) |
| classification | VARCHAR(50) | Distinction/First Class/Pass |
| generated_at | TIMESTAMP | Generation time |

**Usage:** Academic record, transcript, public verification
**Connection:** shishya_users (1) -> (N) shishya_marksheets

---

### shishya_marksheet_verifications

Marksheet verification audit log.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| marksheet_id | VARCHAR(36) | FK to shishya_marksheets.id |
| verified_at | TIMESTAMP | Verification time |
| verifier_ip | VARCHAR(45) | Verifier's IP |
| verifier_agent | TEXT | Browser info |

**Usage:** Verification analytics, authenticity tracking
**Connection:** shishya_marksheets (1) -> (N) shishya_marksheet_verifications

---

## Shishya AI Tutor Tables

### shishya_usha_conversations

Usha AI tutor conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(36) | FK to shishya_users.id |
| course_id | INTEGER | FK to courses.id |
| page_type | VARCHAR(20) | lesson/lab/project/test |
| context_id | INTEGER | Lesson/Lab/Project ID |
| created_at | TIMESTAMP | Session start |
| updated_at | TIMESTAMP | Last activity |

**Usage:** Conversation context, history management
**Connection:** shishya_users (1) -> (N) shishya_usha_conversations

---

### shishya_usha_messages

Individual messages in Usha conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| conversation_id | INTEGER | FK to shishya_usha_conversations.id |
| role | VARCHAR(20) | user/assistant |
| content | TEXT | Message content |
| response_type | VARCHAR(50) | explanation/hint/guidance |
| help_level | VARCHAR(20) | minimal/moderate/detailed |
| created_at | TIMESTAMP | Message time |

**Usage:** Chat history, context for AI responses
**Connection:** shishya_usha_conversations (1) -> (N) shishya_usha_messages

---

## Table Relationships Diagram

```
COURSE CONTENT HIERARCHY:
courses (1) -----+----> (N) modules -----> (N) lessons
                 +----> (N) tests -------> (N) questions
                 +----> (N) projects
                 +----> (N) practice_labs
                 +----> (1) certificates
                 +----> (1) course_rewards
                 +----> (N) achievement_cards
                 +----> (N) motivational_cards

ADMIN USERS:
users (1) -------+----> (N) admin_sessions
                 +----> (N) otp_tokens
                 +----> (N) login_attempts
                 +----> (N) audit_logs
                 +----> (N) admin_action_logs

SHISHYA USERS:
shishya_users (1) ----+----> (1) shishya_user_profiles
                      +----> (N) shishya_sessions
                      +----> (N) shishya_course_enrollments
                      +----> (N) shishya_user_progress
                      +----> (N) shishya_user_lab_progress
                      +----> (N) shishya_user_test_attempts
                      +----> (N) shishya_user_project_submissions
                      +----> (N) shishya_user_certificates
                      +----> (1) shishya_user_credits
                      +----> (N) shishya_credit_transactions
                      +----> (N) shishya_notifications
                      +----> (N) shishya_motivation_cards
                      +----> (N) shishya_mystery_boxes
                      +----> (N) shishya_gift_boxes
                      +----> (1) shishya_student_streaks
                      +----> (N) shishya_usha_conversations
                      +----> (N) shishya_marksheets
                      +----> (N) shishya_user_scholarships
                      +----> (N) shishya_payments

GOVERNANCE:
shishya_users (1) ----+----> (N) reward_approvals
                      +----> (N) fraud_flags
                      +----> (N) wallet_freezes
                      +----> (N) reward_overrides
                      +----> (1) risk_scores
                      +----> (N) scholarships
                      +----> (N) activity_logs
```

---

## Summary

| Category | Tables | Count |
|----------|--------|-------|
| Course Content | courses, modules, lessons, tests, questions, projects, practice_labs, certificates, skills, course_skills, ai_notes, course_rewards, achievement_cards, motivational_cards | 14 |
| Admin Auth & Security | users, otp_tokens, admin_sessions, login_attempts, audit_logs, ai_generation_logs | 6 |
| Business & Payment | credit_packages, vouchers, gift_boxes, payment_gateways, upi_settings, bank_accounts, subscription_plans, user_subscriptions, promotions, system_settings | 10 |
| Governance & Compliance | approval_policies, motivation_rules, reward_approvals, fraud_flags, wallet_freezes, reward_overrides, risk_scores, admin_action_logs, scholarships, activity_logs | 10 |
| Shishya Auth | shishya_users, shishya_sessions, shishya_otp_codes, shishya_otp_logs | 4 |
| Shishya Profile | shishya_user_profiles | 1 |
| Shishya Progress | shishya_user_progress, shishya_user_lab_progress, shishya_user_test_attempts, shishya_user_project_submissions, shishya_user_certificates, shishya_course_enrollments | 6 |
| Shishya Credits | shishya_user_credits, shishya_credit_transactions, shishya_vouchers, shishya_voucher_redemptions, shishya_gift_boxes, shishya_payments | 6 |
| Shishya Notifications | shishya_notifications | 1 |
| Shishya AI Motivation | shishya_motivation_rules, shishya_rule_trigger_logs, shishya_motivation_cards, shishya_ai_nudge_logs, shishya_student_streaks, shishya_mystery_boxes, shishya_scholarships, shishya_user_scholarships | 8 |
| Shishya Academic | shishya_marksheets, shishya_marksheet_verifications | 2 |
| Shishya AI Tutor | shishya_usha_conversations, shishya_usha_messages | 2 |
| Legacy (to be removed) | coin_wallets, coin_transactions, conversations, messages | 4 |
| **Total** | | **74** |

---

## Key Design Decisions

1. **UUID for Shishya Users**: `shishya_users.id` uses VARCHAR(36) UUID for distributed ID generation
2. **Single Course Table**: No draft/published duplication - status field controls visibility
3. **Shishya Prefix**: All student tables prefixed with `shishya_` for clear separation
4. **Shared Database**: Both Guru and Shishya portals share the same PostgreSQL database
5. **Credit System**: Separate from legacy coin system (shishya_user_credits vs coin_wallets)

---

*Last Updated: January 2026*
