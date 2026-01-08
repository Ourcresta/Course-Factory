CREATE TABLE "achievement_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'trophy',
	"condition_json" jsonb NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36),
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_action_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" varchar NOT NULL,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"previous_state" jsonb,
	"new_state" jsonb,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"device" text,
	"browser" text,
	"ip_address" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"generation_type" text NOT NULL,
	"prompt" text,
	"response" text,
	"tokens_used" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"content" text NOT NULL,
	"simplified_explanation" text,
	"bullet_notes" jsonb,
	"key_takeaways" jsonb,
	"interview_questions" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_type" text NOT NULL,
	"approval_mode" text DEFAULT 'admin_approval_required' NOT NULL,
	"min_value_for_approval" integer DEFAULT 0,
	"max_auto_approve_value" integer DEFAULT 100,
	"require_dual_approval" boolean DEFAULT false,
	"dual_approval_threshold" integer DEFAULT 1000,
	"cooldown_minutes" integer DEFAULT 0,
	"daily_limit" integer,
	"weekly_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_holder_name" text NOT NULL,
	"ifsc_code" text NOT NULL,
	"branch_name" text,
	"account_type" text DEFAULT 'savings',
	"is_active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"name" text NOT NULL,
	"description" text,
	"template_id" text,
	"category" text,
	"tags" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"type" text DEFAULT 'completion' NOT NULL,
	"skill_tags" jsonb,
	"level" text,
	"requires_test_pass" boolean DEFAULT false,
	"passing_percentage" integer DEFAULT 70,
	"requires_project_completion" boolean DEFAULT false,
	"requires_lab_completion" boolean DEFAULT false,
	"qr_verification" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"coins_enabled" boolean DEFAULT false NOT NULL,
	"coin_name" text DEFAULT 'Skill Coins',
	"coin_icon" text DEFAULT 'coins',
	"rules_json" jsonb DEFAULT '{"courseCompletion":100,"moduleCompletion":20,"lessonCompletion":5,"testPass":15,"projectSubmission":25,"labCompletion":10}'::jsonb,
	"bonus_json" jsonb DEFAULT '{"earlyCompletionEnabled":false,"earlyCompletionDays":7,"earlyCompletionBonus":50,"perfectScoreEnabled":false,"perfectScoreBonus":25}'::jsonb,
	"scholarship_enabled" boolean DEFAULT false,
	"scholarship_json" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "course_rewards_course_id_unique" UNIQUE("course_id")
);
--> statement-breakpoint
CREATE TABLE "course_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"skill_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"level" text DEFAULT 'beginner' NOT NULL,
	"target_audience" text,
	"duration" text,
	"overview" text,
	"learning_outcomes" jsonb,
	"job_roles" jsonb,
	"include_projects" boolean DEFAULT true,
	"include_tests" boolean DEFAULT true,
	"include_labs" boolean DEFAULT true,
	"certificate_type" text DEFAULT 'completion',
	"status" text DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"ai_command" text,
	"thumbnail_url" text,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"original_credit_cost" integer,
	"pricing_updated_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"published_at" timestamp,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"price_inr" integer NOT NULL,
	"price_usd" integer,
	"discount" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false,
	"validity_days" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"flag_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"description" text,
	"detection_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"price_inr" integer NOT NULL,
	"price_usd" integer,
	"template_image" text,
	"custom_message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expiry_days" integer DEFAULT 365,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" text NOT NULL,
	"objectives" jsonb,
	"estimated_time" text,
	"key_concepts" jsonb,
	"video_url" text,
	"external_links" jsonb,
	"youtube_references" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" varchar,
	"success" boolean NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"reason" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"estimated_time" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motivation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_condition" jsonb,
	"reward_type" text NOT NULL,
	"reward_value" integer DEFAULT 0 NOT NULL,
	"reward_metadata" jsonb,
	"approval_mode" text DEFAULT 'admin_approval_required' NOT NULL,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motivational_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"message" text NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_value" integer,
	"icon" text DEFAULT 'sparkles',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"otp" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_test_mode" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_labs" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"module_id" integer,
	"lesson_id" integer,
	"category" text,
	"tags" jsonb,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"language" text DEFAULT 'javascript' NOT NULL,
	"estimated_time" integer,
	"instructions" text,
	"starter_code" text,
	"solution_code" text,
	"expected_output" text,
	"validation_type" text DEFAULT 'console' NOT NULL,
	"unlock_type" text,
	"unlock_ref_id" integer,
	"hints" jsonb,
	"ai_prompt_context" text,
	"mark_lab_complete" boolean DEFAULT true,
	"unlock_next" boolean DEFAULT true,
	"contributes_to_certificate" boolean DEFAULT false,
	"certificate_weight" integer DEFAULT 1,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"skill_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"code_snippet" text,
	"tips" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"module_id" integer,
	"title" text NOT NULL,
	"description" text,
	"objectives" text,
	"deliverables" text,
	"submission_instructions" text,
	"evaluation_notes" text,
	"problem_statement" text,
	"tech_stack" jsonb,
	"folder_structure" text,
	"evaluation_checklist" jsonb,
	"difficulty" text DEFAULT 'intermediate',
	"category" text,
	"tags" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"code" text,
	"type" text DEFAULT 'bonus_coins' NOT NULL,
	"bonus_coins" integer DEFAULT 0,
	"discount_percent" integer DEFAULT 0,
	"plan_id" integer,
	"is_global" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp NOT NULL,
	"max_redemptions" integer,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "publish_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"synced_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"type" text DEFAULT 'mcq' NOT NULL,
	"difficulty" text DEFAULT 'medium',
	"question_text" text NOT NULL,
	"options" jsonb,
	"correct_answer" text,
	"explanation" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"rule_id" integer,
	"reward_type" text NOT NULL,
	"original_value" integer NOT NULL,
	"adjusted_value" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger_event" text,
	"trigger_data" jsonb,
	"ai_reason" text,
	"risk_score" integer DEFAULT 0,
	"is_flagged" boolean DEFAULT false,
	"flag_reason" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"second_approver" varchar,
	"second_approved_at" timestamp,
	"wallet_transaction_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"admin_id" varchar NOT NULL,
	"action_type" text NOT NULL,
	"reward_type" text,
	"amount" integer,
	"reason" text NOT NULL,
	"metadata" jsonb,
	"wallet_transaction_id" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"velocity_score" integer DEFAULT 0,
	"pattern_score" integer DEFAULT 0,
	"account_age_score" integer DEFAULT 0,
	"behavior_score" integer DEFAULT 0,
	"last_calculated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"risk_factors" jsonb,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "risk_scores_shishya_user_id_unique" UNIQUE("shishya_user_id")
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"reward_approval_id" integer,
	"title" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR',
	"status" text DEFAULT 'pending' NOT NULL,
	"course_id" integer,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"issued_by" varchar,
	"issued_at" timestamp,
	"redeemed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_ai_nudge_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"nudge_type" text NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_course_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"reference_id" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_gift_boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"credits" integer NOT NULL,
	"message" text,
	"opened" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_marksheet_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"marksheet_id" varchar(36) NOT NULL,
	"verified_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"verifier_ip" text,
	"verifier_agent" text
);
--> statement-breakpoint
CREATE TABLE "shishya_marksheets" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"marksheet_number" text NOT NULL,
	"courses_completed" integer DEFAULT 0 NOT NULL,
	"total_credits" integer DEFAULT 0 NOT NULL,
	"cgpa" text,
	"classification" text,
	"generated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_marksheets_marksheet_number_unique" UNIQUE("marksheet_number")
);
--> statement-breakpoint
CREATE TABLE "shishya_motivation_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"card_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"dismissed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_motivation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_condition" jsonb NOT NULL,
	"action_type" text NOT NULL,
	"action_data" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_mystery_boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"box_type" text NOT NULL,
	"reward_type" text,
	"reward_value" integer,
	"opened" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_otp_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"provider" text,
	"provider_transaction_id" text,
	"subscription_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shishya_rule_trigger_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"triggered_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action_taken" jsonb
);
--> statement-breakpoint
CREATE TABLE "shishya_scholarships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"eligibility_criteria" jsonb,
	"max_recipients" integer,
	"current_recipients" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_sessions" (
	"sid" varchar(255) PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_student_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" timestamp,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_student_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "shishya_user_certificates" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"course_id" integer NOT NULL,
	"certificate_number" text NOT NULL,
	"issued_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"pdf_url" text,
	CONSTRAINT "shishya_user_certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "shishya_user_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "shishya_user_lab_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"lab_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"user_code" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_user_profiles" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"full_name" text,
	"username" text,
	"bio" text,
	"profile_photo" text,
	"headline" text,
	"location" text,
	"github_url" text,
	"linkedin_url" text,
	"website_url" text,
	"facebook_url" text,
	"instagram_url" text,
	"portfolio_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "shishya_user_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "shishya_user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"course_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_user_project_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"project_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"submission_url" text,
	"github_url" text,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"feedback" text,
	"submitted_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shishya_user_scholarships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"scholarship_id" integer NOT NULL,
	"awarded_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_user_test_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"test_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"answers" jsonb,
	"time_taken" integer,
	"attempted_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_active_at" timestamp,
	"total_spend" integer DEFAULT 0 NOT NULL,
	"signup_source" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "shishya_usha_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"course_id" integer NOT NULL,
	"page_type" text NOT NULL,
	"context_id" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_usha_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"response_type" text,
	"help_level" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_voucher_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" integer NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"redeemed_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shishya_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"credits" integer NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shishya_vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"coins_per_month" integer DEFAULT 0 NOT NULL,
	"signup_bonus_coins" integer DEFAULT 0 NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"module_id" integer,
	"title" text NOT NULL,
	"description" text,
	"passing_percentage" integer DEFAULT 70,
	"is_locked" boolean DEFAULT false,
	"time_limit" integer,
	"difficulty" text DEFAULT 'medium',
	"category" text,
	"tags" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upi_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"upi_id" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"qr_code_image" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"plan_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"billing_cycle" text DEFAULT 'monthly',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"invited_by" varchar,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'discount' NOT NULL,
	"discount_type" text DEFAULT 'percentage',
	"discount_value" integer NOT NULL,
	"credit_bonus" integer DEFAULT 0,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"min_purchase" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wallet_freezes" (
	"id" serial PRIMARY KEY NOT NULL,
	"shishya_user_id" varchar(36) NOT NULL,
	"reason" text NOT NULL,
	"frozen_by" varchar NOT NULL,
	"frozen_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"unfrozen_by" varchar,
	"unfrozen_at" timestamp,
	"unfreeze_reason" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievement_cards" ADD CONSTRAINT "achievement_cards_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_notes" ADD CONSTRAINT "ai_notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_rewards" ADD CONSTRAINT "course_rewards_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motivational_cards" ADD CONSTRAINT "motivational_cards_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_labs" ADD CONSTRAINT "practice_labs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_labs" ADD CONSTRAINT "practice_labs_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_labs" ADD CONSTRAINT "practice_labs_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_steps" ADD CONSTRAINT "project_steps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publish_status" ADD CONSTRAINT "publish_status_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_approvals" ADD CONSTRAINT "reward_approvals_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_approvals" ADD CONSTRAINT "reward_approvals_rule_id_motivation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."motivation_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_approvals" ADD CONSTRAINT "reward_approvals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_approvals" ADD CONSTRAINT "reward_approvals_second_approver_users_id_fk" FOREIGN KEY ("second_approver") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_overrides" ADD CONSTRAINT "reward_overrides_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_overrides" ADD CONSTRAINT "reward_overrides_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_reward_approval_id_reward_approvals_id_fk" FOREIGN KEY ("reward_approval_id") REFERENCES "public"."reward_approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_ai_nudge_logs" ADD CONSTRAINT "shishya_ai_nudge_logs_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_course_enrollments" ADD CONSTRAINT "shishya_course_enrollments_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_course_enrollments" ADD CONSTRAINT "shishya_course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_credit_transactions" ADD CONSTRAINT "shishya_credit_transactions_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_gift_boxes" ADD CONSTRAINT "shishya_gift_boxes_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_marksheet_verifications" ADD CONSTRAINT "shishya_marksheet_verifications_marksheet_id_shishya_marksheets_id_fk" FOREIGN KEY ("marksheet_id") REFERENCES "public"."shishya_marksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_marksheets" ADD CONSTRAINT "shishya_marksheets_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_motivation_cards" ADD CONSTRAINT "shishya_motivation_cards_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_mystery_boxes" ADD CONSTRAINT "shishya_mystery_boxes_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_notifications" ADD CONSTRAINT "shishya_notifications_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_payments" ADD CONSTRAINT "shishya_payments_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_payments" ADD CONSTRAINT "shishya_payments_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_rule_trigger_logs" ADD CONSTRAINT "shishya_rule_trigger_logs_rule_id_shishya_motivation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."shishya_motivation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_rule_trigger_logs" ADD CONSTRAINT "shishya_rule_trigger_logs_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_student_streaks" ADD CONSTRAINT "shishya_student_streaks_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_certificates" ADD CONSTRAINT "shishya_user_certificates_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_certificates" ADD CONSTRAINT "shishya_user_certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_credits" ADD CONSTRAINT "shishya_user_credits_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_lab_progress" ADD CONSTRAINT "shishya_user_lab_progress_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_lab_progress" ADD CONSTRAINT "shishya_user_lab_progress_lab_id_practice_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."practice_labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_profiles" ADD CONSTRAINT "shishya_user_profiles_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_progress" ADD CONSTRAINT "shishya_user_progress_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_progress" ADD CONSTRAINT "shishya_user_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_progress" ADD CONSTRAINT "shishya_user_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_project_submissions" ADD CONSTRAINT "shishya_user_project_submissions_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_project_submissions" ADD CONSTRAINT "shishya_user_project_submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_project_submissions" ADD CONSTRAINT "shishya_user_project_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_scholarships" ADD CONSTRAINT "shishya_user_scholarships_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_scholarships" ADD CONSTRAINT "shishya_user_scholarships_scholarship_id_shishya_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."shishya_scholarships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_test_attempts" ADD CONSTRAINT "shishya_user_test_attempts_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_test_attempts" ADD CONSTRAINT "shishya_user_test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_user_test_attempts" ADD CONSTRAINT "shishya_user_test_attempts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_usha_conversations" ADD CONSTRAINT "shishya_usha_conversations_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_usha_conversations" ADD CONSTRAINT "shishya_usha_conversations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_usha_messages" ADD CONSTRAINT "shishya_usha_messages_conversation_id_shishya_usha_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."shishya_usha_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_voucher_redemptions" ADD CONSTRAINT "shishya_voucher_redemptions_voucher_id_shishya_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."shishya_vouchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shishya_voucher_redemptions" ADD CONSTRAINT "shishya_voucher_redemptions_user_id_shishya_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_freezes" ADD CONSTRAINT "wallet_freezes_shishya_user_id_shishya_users_id_fk" FOREIGN KEY ("shishya_user_id") REFERENCES "public"."shishya_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_freezes" ADD CONSTRAINT "wallet_freezes_frozen_by_users_id_fk" FOREIGN KEY ("frozen_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_freezes" ADD CONSTRAINT "wallet_freezes_unfrozen_by_users_id_fk" FOREIGN KEY ("unfrozen_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;