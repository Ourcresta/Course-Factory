-- ============================================
-- OUSHIKSHA GURU - POSTGRESQL DATABASE SCHEMA
-- Version 1.0 - Production Deployment
-- ============================================
-- 
-- This schema is auto-generated from Drizzle ORM definitions.
-- For migrations, use: npm run db:push
-- 
-- IMPORTANT: Do not run this file directly in production.
-- Use Drizzle ORM's migration system instead.
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== ADMIN USERS ====================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    invited_by VARCHAR REFERENCES users(id),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ==================== OTP TOKENS ====================
CREATE TABLE IF NOT EXISTS otp_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_tokens_user_id ON otp_tokens(user_id);
CREATE INDEX idx_otp_tokens_expires ON otp_tokens(expires_at);

-- ==================== SKILLS ====================
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== COURSES ====================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL DEFAULT 'beginner',
    target_audience TEXT,
    duration TEXT,
    overview TEXT,
    learning_outcomes JSONB,
    job_roles JSONB,
    include_projects BOOLEAN DEFAULT true,
    include_tests BOOLEAN DEFAULT true,
    include_labs BOOLEAN DEFAULT true,
    certificate_type TEXT DEFAULT 'completion',
    status TEXT NOT NULL DEFAULT 'draft',
    ai_command TEXT,
    thumbnail_url TEXT,
    credit_cost INTEGER NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT true,
    original_credit_cost INTEGER,
    pricing_updated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_deleted ON courses(deleted_at);

-- ==================== COURSE SKILLS ====================
CREATE TABLE IF NOT EXISTS course_skills (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_skills_course ON course_skills(course_id);

-- ==================== MODULES ====================
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_time TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- ==================== LESSONS ====================
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    objectives JSONB,
    estimated_time TEXT,
    key_concepts JSONB,
    video_url TEXT,
    external_links JSONB,
    youtube_references JSONB,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);

-- ==================== AI NOTES ====================
CREATE TABLE IF NOT EXISTS ai_notes (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    simplified_explanation TEXT,
    bullet_notes JSONB,
    key_takeaways JSONB,
    interview_questions JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_notes_lesson ON ai_notes(lesson_id);

-- ==================== PROJECTS ====================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    deliverables TEXT,
    submission_instructions TEXT,
    evaluation_notes TEXT,
    problem_statement TEXT,
    tech_stack JSONB,
    folder_structure TEXT,
    evaluation_checklist JSONB,
    difficulty TEXT DEFAULT 'intermediate',
    category TEXT,
    tags JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_course ON projects(course_id);
CREATE INDEX idx_projects_module ON projects(module_id);

-- ==================== PROJECT SKILLS ====================
CREATE TABLE IF NOT EXISTS project_skills (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE
);

-- ==================== PROJECT STEPS ====================
CREATE TABLE IF NOT EXISTS project_steps (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    code_snippet TEXT,
    tips JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_steps_project ON project_steps(project_id);

-- ==================== TESTS ====================
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    passing_percentage INTEGER DEFAULT 70,
    is_locked BOOLEAN DEFAULT false,
    time_limit INTEGER,
    difficulty TEXT DEFAULT 'medium',
    category TEXT,
    tags JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_course ON tests(course_id);
CREATE INDEX idx_tests_module ON tests(module_id);

-- ==================== QUESTIONS ====================
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'mcq',
    difficulty TEXT DEFAULT 'medium',
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_test ON questions(test_id);

-- ==================== CERTIFICATES ====================
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_id TEXT,
    category TEXT,
    tags JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    type TEXT NOT NULL DEFAULT 'completion',
    skill_tags JSONB,
    level TEXT,
    requires_test_pass BOOLEAN DEFAULT false,
    passing_percentage INTEGER DEFAULT 70,
    requires_project_completion BOOLEAN DEFAULT false,
    requires_lab_completion BOOLEAN DEFAULT false,
    qr_verification BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_course ON certificates(course_id);

-- ==================== PRACTICE LABS ====================
CREATE TABLE IF NOT EXISTS practice_labs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    category TEXT,
    tags JSONB,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    language TEXT NOT NULL DEFAULT 'javascript',
    estimated_time INTEGER,
    instructions TEXT,
    starter_code TEXT,
    solution_code TEXT,
    expected_output TEXT,
    validation_type TEXT NOT NULL DEFAULT 'console',
    unlock_type TEXT,
    unlock_ref_id INTEGER,
    hints JSONB,
    ai_prompt_context TEXT,
    mark_lab_complete BOOLEAN DEFAULT true,
    unlock_next BOOLEAN DEFAULT true,
    contributes_to_certificate BOOLEAN DEFAULT false,
    certificate_weight INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_labs_course ON practice_labs(course_id);
CREATE INDEX idx_practice_labs_slug ON practice_labs(slug);

-- ==================== AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ==================== LOGIN ATTEMPTS ====================
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    location TEXT,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created ON login_attempts(created_at);

-- ==================== ADMIN SESSIONS ====================
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device TEXT,
    browser TEXT,
    ip_address TEXT,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);

-- ==================== AI GENERATION LOGS ====================
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    generation_type TEXT NOT NULL,
    prompt TEXT,
    response TEXT,
    tokens_used INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_ai_logs_course ON ai_generation_logs(course_id);

-- ==================== API KEYS ====================
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ==================== COURSE REWARDS ====================
CREATE TABLE IF NOT EXISTS course_rewards (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
    coins_enabled BOOLEAN NOT NULL DEFAULT false,
    coin_name TEXT DEFAULT 'Skill Coins',
    coin_icon TEXT DEFAULT 'coins',
    rules_json JSONB DEFAULT '{"courseCompletion":100,"moduleCompletion":20,"lessonCompletion":5,"testPass":15,"projectSubmission":25,"labCompletion":10}',
    bonus_json JSONB DEFAULT '{"earlyCompletionEnabled":false,"earlyCompletionDays":7,"earlyCompletionBonus":50,"perfectScoreEnabled":false,"perfectScoreBonus":25}',
    scholarship_enabled BOOLEAN DEFAULT false,
    scholarship_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_course_rewards_course ON course_rewards(course_id);

-- ==================== ACHIEVEMENT CARDS ====================
CREATE TABLE IF NOT EXISTS achievement_cards (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'trophy',
    condition_json JSONB NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'common',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievement_cards_course ON achievement_cards(course_id);

-- ==================== MOTIVATIONAL CARDS ====================
CREATE TABLE IF NOT EXISTS motivational_cards (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_value INTEGER,
    icon TEXT DEFAULT 'sparkles',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_motivational_cards_course ON motivational_cards(course_id);

-- ==================== CREDIT PACKAGES ====================
CREATE TABLE IF NOT EXISTS credit_packages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    price_inr INTEGER NOT NULL,
    price_usd INTEGER,
    discount INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    validity_days INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== VOUCHERS ====================
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'discount',
    discount_type TEXT DEFAULT 'percentage',
    discount_value INTEGER NOT NULL,
    credit_bonus INTEGER DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    min_purchase INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_active ON vouchers(is_active);

-- ==================== SUBSCRIPTION PLANS ====================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price_monthly INTEGER NOT NULL DEFAULT 0,
    price_yearly INTEGER NOT NULL DEFAULT 0,
    coins_per_month INTEGER NOT NULL DEFAULT 0,
    signup_bonus_coins INTEGER NOT NULL DEFAULT 0,
    features JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SHISHYA USERS (STUDENTS) ====================
CREATE TABLE IF NOT EXISTS shishya_users (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    last_active_at TIMESTAMP,
    total_spend INTEGER NOT NULL DEFAULT 0,
    signup_source TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shishya_users_email ON shishya_users(email);
CREATE INDEX idx_shishya_users_status ON shishya_users(status);

-- ==================== SYSTEM SETTINGS ====================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Additional tables for rewards, fraud detection,
-- and analytics are included in the full schema.
-- Use Drizzle ORM migrations for complete setup.
-- ============================================

-- ==================== INITIAL DATA ====================
-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt with 12 rounds
INSERT INTO users (id, username, email, password, role, is_active, is_email_verified)
VALUES (
    gen_random_uuid(),
    'admin',
    'admin@ourshiksha.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VttYS/DvWVVQiu',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- NOTES FOR PRODUCTION DEPLOYMENT:
-- 1. Change the default admin password immediately
-- 2. Enable SSL connections to the database
-- 3. Configure proper backup schedules
-- 4. Set up monitoring for slow queries
-- 5. Review and adjust connection pool settings
-- ============================================
