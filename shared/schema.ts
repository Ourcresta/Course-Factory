import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export chat models
export * from "./models/chat";


// ==================== USERS (ADMIN) ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").default(true).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  invitedBy: varchar("invited_by").references((): any => users.id),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== OTP TOKENS ====================
export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const otpTokensRelations = relations(otpTokens, ({ one }) => ({
  user: one(users, { fields: [otpTokens.userId], references: [users.id] }),
}));

export const insertOtpTokenSchema = createInsertSchema(otpTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertOtpToken = z.infer<typeof insertOtpTokenSchema>;
export type OtpToken = typeof otpTokens.$inferSelect;

// ==================== SKILLS ====================
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
});

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

// ==================== COURSES (SINGLE TABLE - SOURCE OF TRUTH) ====================
// Status: 'draft' (editable), 'published' (visible to students), 'archived' (hidden, preserved for audit)
// is_active: Controls visibility to Shishya portal (true = visible when published)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  level: text("level").notNull().default("beginner"),
  targetAudience: text("target_audience"),
  duration: text("duration"),
  overview: text("overview"),
  learningOutcomes: jsonb("learning_outcomes").$type<string[]>(),
  jobRoles: jsonb("job_roles").$type<string[]>(),
  includeProjects: boolean("include_projects").default(true),
  includeTests: boolean("include_tests").default(true),
  includeLabs: boolean("include_labs").default(true),
  certificateType: text("certificate_type").default("completion"),
  status: text("status").notNull().default("draft"), // 'draft' | 'published' | 'archived'
  isActive: boolean("is_active").default(false).notNull(), // Must be true for Shishya visibility
  aiCommand: text("ai_command"),
  thumbnailUrl: text("thumbnail_url"),
  creditCost: integer("credit_cost").default(0).notNull(),
  isFree: boolean("is_free").default(true).notNull(),
  originalCreditCost: integer("original_credit_cost"),
  pricingUpdatedAt: timestamp("pricing_updated_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  publishedAt: timestamp("published_at"),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  courseSkills: many(courseSkills),
  certificates: many(certificates),
  projects: many(projects),
  practiceLabs: many(practiceLabs),
}));

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  deletedAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ==================== COURSE SKILLS ====================
export const courseSkills = pgTable("course_skills", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
});

export const courseSkillsRelations = relations(courseSkills, ({ one }) => ({
  course: one(courses, { fields: [courseSkills.courseId], references: [courses.id] }),
  skill: one(skills, { fields: [courseSkills.skillId], references: [skills.id] }),
}));

export const insertCourseSkillSchema = createInsertSchema(courseSkills).omit({
  id: true,
});

export type InsertCourseSkill = z.infer<typeof insertCourseSkillSchema>;
export type CourseSkill = typeof courseSkills.$inferSelect;

// ==================== MODULES ====================
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
  projects: many(projects),
  tests: many(tests),
}));

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

// YouTube Reference type for lessons
export interface YouTubeReference {
  url: string;
  title: string;
  description?: string;
}

// ==================== LESSONS ====================
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  objectives: jsonb("objectives").$type<string[]>(),
  estimatedTime: text("estimated_time"),
  keyConceptS: jsonb("key_concepts").$type<string[]>(),
  videoUrl: text("video_url"),
  externalLinks: jsonb("external_links").$type<string[]>(),
  youtubeReferences: jsonb("youtube_references").$type<YouTubeReference[]>(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  aiNotes: many(aiNotes),
}));

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// ==================== AI NOTES ====================
export const aiNotes = pgTable("ai_notes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  simplifiedExplanation: text("simplified_explanation"),
  bulletNotes: jsonb("bullet_notes").$type<string[]>(),
  keyTakeaways: jsonb("key_takeaways").$type<string[]>(),
  interviewQuestions: jsonb("interview_questions").$type<string[]>(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiNotesRelations = relations(aiNotes, ({ one }) => ({
  lesson: one(lessons, { fields: [aiNotes.lessonId], references: [lessons.id] }),
}));

export const insertAiNoteSchema = createInsertSchema(aiNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAiNote = z.infer<typeof insertAiNoteSchema>;
export type AiNote = typeof aiNotes.$inferSelect;

// ==================== PROJECTS ====================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  objectives: text("objectives"),
  deliverables: text("deliverables"),
  submissionInstructions: text("submission_instructions"),
  evaluationNotes: text("evaluation_notes"),
  problemStatement: text("problem_statement"),
  techStack: jsonb("tech_stack").$type<string[]>(),
  folderStructure: text("folder_structure"),
  evaluationChecklist: jsonb("evaluation_checklist").$type<string[]>(),
  difficulty: text("difficulty").default("intermediate"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  status: text("status").notNull().default("draft"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  course: one(courses, { fields: [projects.courseId], references: [courses.id] }),
  module: one(modules, { fields: [projects.moduleId], references: [modules.id] }),
  projectSteps: many(projectSteps),
  projectSkills: many(projectSkills),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ==================== PROJECT SKILLS ====================
export const projectSkills = pgTable("project_skills", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
});

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
  project: one(projects, { fields: [projectSkills.projectId], references: [projects.id] }),
  skill: one(skills, { fields: [projectSkills.skillId], references: [skills.id] }),
}));

export const insertProjectSkillSchema = createInsertSchema(projectSkills).omit({
  id: true,
});

export type InsertProjectSkill = z.infer<typeof insertProjectSkillSchema>;
export type ProjectSkill = typeof projectSkills.$inferSelect;

// ==================== PROJECT STEPS ====================
export const projectSteps = pgTable("project_steps", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  codeSnippet: text("code_snippet"),
  tips: jsonb("tips").$type<string[]>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const projectStepsRelations = relations(projectSteps, ({ one }) => ({
  project: one(projects, { fields: [projectSteps.projectId], references: [projects.id] }),
}));

export const insertProjectStepSchema = createInsertSchema(projectSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectStep = z.infer<typeof insertProjectStepSchema>;
export type ProjectStep = typeof projectSteps.$inferSelect;

// ==================== TESTS ====================
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  passingPercentage: integer("passing_percentage").default(70),
  isLocked: boolean("is_locked").default(false),
  timeLimit: integer("time_limit"),
  difficulty: text("difficulty").default("medium"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const testsRelations = relations(tests, ({ one, many }) => ({
  course: one(courses, { fields: [tests.courseId], references: [courses.id] }),
  module: one(modules, { fields: [tests.moduleId], references: [modules.id] }),
  questions: many(questions),
}));

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

// ==================== QUESTIONS ====================
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mcq"),
  difficulty: text("difficulty").default("medium"),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const questionsRelations = relations(questions, ({ one }) => ({
  test: one(tests, { fields: [questions.testId], references: [tests.id] }),
}));

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// ==================== CERTIFICATES ====================
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  templateId: text("template_id"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  status: text("status").notNull().default("draft"),
  type: text("type").notNull().default("completion"),
  skillTags: jsonb("skill_tags").$type<string[]>(),
  level: text("level"),
  requiresTestPass: boolean("requires_test_pass").default(false),
  passingPercentage: integer("passing_percentage").default(70),
  requiresProjectCompletion: boolean("requires_project_completion").default(false),
  requiresLabCompletion: boolean("requires_lab_completion").default(false),
  qrVerification: boolean("qr_verification").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// ==================== AUDIT LOGS ====================
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ==================== LOGIN ATTEMPTS ====================
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  userId: varchar("user_id").references(() => users.id),
  success: boolean("success").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  reason: text("reason"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, { fields: [loginAttempts.userId], references: [users.id] }),
}));

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  createdAt: true,
});

export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

// ==================== ADMIN SESSIONS ====================
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  device: text("device"),
  browser: text("browser"),
  ipAddress: text("ip_address"),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  lastActiveAt: timestamp("last_active_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(users, { fields: [adminSessions.userId], references: [users.id] }),
}));

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// ==================== AI GENERATION LOGS ====================
export const aiGenerationLogs = pgTable("ai_generation_logs", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  generationType: text("generation_type").notNull(),
  prompt: text("prompt"),
  response: text("response"),
  tokensUsed: integer("tokens_used"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const aiGenerationLogsRelations = relations(aiGenerationLogs, ({ one }) => ({
  course: one(courses, { fields: [aiGenerationLogs.courseId], references: [courses.id] }),
}));

export const insertAiGenerationLogSchema = createInsertSchema(aiGenerationLogs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertAiGenerationLog = z.infer<typeof insertAiGenerationLogSchema>;
export type AiGenerationLog = typeof aiGenerationLogs.$inferSelect;

// ==================== PUBLISH STATUS ====================
export const publishStatus = pgTable("publish_status", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"),
  syncedAt: timestamp("synced_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const publishStatusRelations = relations(publishStatus, ({ one }) => ({
  course: one(courses, { fields: [publishStatus.courseId], references: [courses.id] }),
}));

export const insertPublishStatusSchema = createInsertSchema(publishStatus).omit({
  id: true,
  createdAt: true,
  syncedAt: true,
});

export type InsertPublishStatus = z.infer<typeof insertPublishStatusSchema>;
export type PublishStatus = typeof publishStatus.$inferSelect;

// ==================== PRACTICE LABS ====================
export const practiceLabs = pgTable("practice_labs", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull().default("beginner"),
  language: text("language").notNull().default("javascript"),
  estimatedTime: integer("estimated_time"),
  instructions: text("instructions"),
  starterCode: text("starter_code"),
  solutionCode: text("solution_code"),
  expectedOutput: text("expected_output"),
  validationType: text("validation_type").notNull().default("console"),
  unlockType: text("unlock_type"),
  unlockRefId: integer("unlock_ref_id"),
  hints: jsonb("hints").$type<string[]>(),
  aiPromptContext: text("ai_prompt_context"),
  markLabComplete: boolean("mark_lab_complete").default(true),
  unlockNext: boolean("unlock_next").default(true),
  contributesToCertificate: boolean("contributes_to_certificate").default(false),
  certificateWeight: integer("certificate_weight").default(1),
  status: text("status").notNull().default("draft"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const practiceLabsRelations = relations(practiceLabs, ({ one }) => ({
  course: one(courses, { fields: [practiceLabs.courseId], references: [courses.id] }),
  module: one(modules, { fields: [practiceLabs.moduleId], references: [modules.id] }),
  lesson: one(lessons, { fields: [practiceLabs.lessonId], references: [lessons.id] }),
}));

export const insertPracticeLabSchema = createInsertSchema(practiceLabs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPracticeLab = z.infer<typeof insertPracticeLabSchema>;
export type PracticeLab = typeof practiceLabs.$inferSelect;

// ==================== CREDIT PACKAGES (for Shishya pricing) ====================
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  priceInr: integer("price_inr").notNull(),
  priceUsd: integer("price_usd"),
  discount: integer("discount").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false),
  validityDays: integer("validity_days"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;

// ==================== VOUCHERS ====================
export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("discount"),
  discountType: text("discount_type").default("percentage"),
  discountValue: integer("discount_value").notNull(),
  creditBonus: integer("credit_bonus").default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  minPurchase: integer("min_purchase").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchers.$inferSelect;

// ==================== GIFT BOXES ====================
export const giftBoxes = pgTable("gift_boxes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  priceInr: integer("price_inr").notNull(),
  priceUsd: integer("price_usd"),
  templateImage: text("template_image"),
  customMessage: text("custom_message"),
  isActive: boolean("is_active").default(true).notNull(),
  expiryDays: integer("expiry_days").default(365),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertGiftBoxSchema = createInsertSchema(giftBoxes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGiftBox = z.infer<typeof insertGiftBoxSchema>;
export type GiftBox = typeof giftBoxes.$inferSelect;

// ==================== PAYMENT GATEWAYS ====================
export const paymentGateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  isTestMode: boolean("is_test_mode").default(true).notNull(),
  config: jsonb("config").$type<Record<string, any>>(),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPaymentGatewaySchema = createInsertSchema(paymentGateways).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentGateway = z.infer<typeof insertPaymentGatewaySchema>;
export type PaymentGateway = typeof paymentGateways.$inferSelect;

// ==================== UPI SETTINGS ====================
export const upiSettings = pgTable("upi_settings", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull(),
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  qrCodeImage: text("qr_code_image"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUpiSettingSchema = createInsertSchema(upiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUpiSetting = z.infer<typeof insertUpiSettingSchema>;
export type UpiSetting = typeof upiSettings.$inferSelect;

// ==================== BANK ACCOUNT SETTINGS ====================
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  branchName: text("branch_name"),
  accountType: text("account_type").default("savings"),
  isActive: boolean("is_active").default(true).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// ==================== SYSTEM SETTINGS ====================
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// ==================== SUBSCRIPTION PLANS ====================
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  priceMonthly: integer("price_monthly").default(0).notNull(),
  priceYearly: integer("price_yearly").default(0).notNull(),
  coinsPerMonth: integer("coins_per_month").default(0).notNull(),
  signupBonusCoins: integer("signup_bonus_coins").default(0).notNull(),
  features: jsonb("features").$type<{
    aiUsha: boolean;
    labs: boolean;
    tests: boolean;
    projects: boolean;
    certificates: boolean;
    prioritySupport: boolean;
    maxCoursesAccess: number;
  }>(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ==================== SHISHYA USERS (STUDENTS) ====================
export const shishyaUsers = pgTable("shishya_users", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  status: text("status").default("active").notNull(),
  lastActiveAt: timestamp("last_active_at"),
  totalSpend: integer("total_spend").default(0).notNull(),
  signupSource: text("signup_source"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertShishyaUserSchema = createInsertSchema(shishyaUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertShishyaUser = z.infer<typeof insertShishyaUserSchema>;
export type ShishyaUser = typeof shishyaUsers.$inferSelect;

// ==================== USER SUBSCRIPTIONS ====================
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").default("active").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  billingCycle: text("billing_cycle").default("monthly"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(shishyaUsers, { fields: [userSubscriptions.shishyaUserId], references: [shishyaUsers.id] }),
  plan: one(subscriptionPlans, { fields: [userSubscriptions.planId], references: [subscriptionPlans.id] }),
}));

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// ==================== COIN WALLETS ====================
export const coinWallets = pgTable("coin_wallets", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().unique().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  balance: integer("balance").default(0).notNull(),
  lifetimeEarned: integer("lifetime_earned").default(0).notNull(),
  lifetimeSpent: integer("lifetime_spent").default(0).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const coinWalletsRelations = relations(coinWallets, ({ one }) => ({
  user: one(shishyaUsers, { fields: [coinWallets.shishyaUserId], references: [shishyaUsers.id] }),
}));

export const insertCoinWalletSchema = createInsertSchema(coinWallets).omit({
  id: true,
  updatedAt: true,
});

export type InsertCoinWallet = z.infer<typeof insertCoinWalletSchema>;
export type CoinWallet = typeof coinWallets.$inferSelect;

// ==================== COIN TRANSACTIONS ====================
export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  reason: text("reason"),
  referenceId: text("reference_id"),
  referenceType: text("reference_type"),
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(shishyaUsers, { fields: [coinTransactions.shishyaUserId], references: [shishyaUsers.id] }),
}));

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;

// ==================== PROMOTIONS ====================
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code").unique(),
  type: text("type").default("bonus_coins").notNull(),
  bonusCoins: integer("bonus_coins").default(0),
  discountPercent: integer("discount_percent").default(0),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  isGlobal: boolean("is_global").default(true).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  maxRedemptions: integer("max_redemptions"),
  currentRedemptions: integer("current_redemptions").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  currentRedemptions: true,
  createdAt: true,
});

export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// ==================== SHISHYA PAYMENTS ====================
export const shishyaPayments = pgTable("shishya_payments", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  status: text("status").default("pending").notNull(),
  paymentMethod: text("payment_method"),
  provider: text("provider"),
  providerTransactionId: text("provider_transaction_id"),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const shishyaPaymentsRelations = relations(shishyaPayments, ({ one }) => ({
  user: one(shishyaUsers, { fields: [shishyaPayments.shishyaUserId], references: [shishyaUsers.id] }),
  subscription: one(userSubscriptions, { fields: [shishyaPayments.subscriptionId], references: [userSubscriptions.id] }),
}));

export const insertShishyaPaymentSchema = createInsertSchema(shishyaPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertShishyaPayment = z.infer<typeof insertShishyaPaymentSchema>;
export type ShishyaPayment = typeof shishyaPayments.$inferSelect;

// ==================== ACTIVITY LOGS ====================
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").references(() => shishyaUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(shishyaUsers, { fields: [activityLogs.shishyaUserId], references: [shishyaUsers.id] }),
}));

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// ==================== REWARD TYPES ====================
export type RewardType = "coins" | "scholarship" | "coupon" | "free_course" | "premium_unlock" | "mystery_reward" | "motivation_card";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "revoked" | "adjusted";
export type ApprovalMode = "auto_approved" | "admin_approval_required" | "manual_only";

// ==================== APPROVAL POLICIES ====================
export const approvalPolicies = pgTable("approval_policies", {
  id: serial("id").primaryKey(),
  rewardType: text("reward_type").notNull(),
  approvalMode: text("approval_mode").notNull().default("admin_approval_required"),
  minValueForApproval: integer("min_value_for_approval").default(0),
  maxAutoApproveValue: integer("max_auto_approve_value").default(100),
  requireDualApproval: boolean("require_dual_approval").default(false),
  dualApprovalThreshold: integer("dual_approval_threshold").default(1000),
  cooldownMinutes: integer("cooldown_minutes").default(0),
  dailyLimit: integer("daily_limit"),
  weeklyLimit: integer("weekly_limit"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertApprovalPolicySchema = createInsertSchema(approvalPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApprovalPolicy = z.infer<typeof insertApprovalPolicySchema>;
export type ApprovalPolicy = typeof approvalPolicies.$inferSelect;

// ==================== MOTIVATION RULES (AI Engine Triggers) ====================
export const motivationRules = pgTable("motivation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(),
  triggerCondition: jsonb("trigger_condition").$type<{
    event: string;
    threshold?: number;
    streak?: number;
    courseId?: number;
    moduleId?: number;
  }>(),
  rewardType: text("reward_type").notNull(),
  rewardValue: integer("reward_value").notNull().default(0),
  rewardMetadata: jsonb("reward_metadata").$type<Record<string, any>>(),
  approvalMode: text("approval_mode").notNull().default("admin_approval_required"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMotivationRuleSchema = createInsertSchema(motivationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMotivationRule = z.infer<typeof insertMotivationRuleSchema>;
export type MotivationRule = typeof motivationRules.$inferSelect;

// ==================== REWARD APPROVALS (Queue) ====================
export const rewardApprovals = pgTable("reward_approvals", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  ruleId: integer("rule_id").references(() => motivationRules.id, { onDelete: "set null" }),
  rewardType: text("reward_type").notNull(),
  originalValue: integer("original_value").notNull(),
  adjustedValue: integer("adjusted_value"),
  status: text("status").notNull().default("pending"),
  triggerEvent: text("trigger_event"),
  triggerData: jsonb("trigger_data").$type<Record<string, any>>(),
  aiReason: text("ai_reason"),
  riskScore: integer("risk_score").default(0),
  isFlagged: boolean("is_flagged").default(false),
  flagReason: text("flag_reason"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  secondApprover: varchar("second_approver").references(() => users.id),
  secondApprovedAt: timestamp("second_approved_at"),
  walletTransactionId: integer("wallet_transaction_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rewardApprovalsRelations = relations(rewardApprovals, ({ one }) => ({
  user: one(shishyaUsers, { fields: [rewardApprovals.shishyaUserId], references: [shishyaUsers.id] }),
  rule: one(motivationRules, { fields: [rewardApprovals.ruleId], references: [motivationRules.id] }),
  reviewer: one(users, { fields: [rewardApprovals.reviewedBy], references: [users.id] }),
}));

export const insertRewardApprovalSchema = createInsertSchema(rewardApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRewardApproval = z.infer<typeof insertRewardApprovalSchema>;
export type RewardApproval = typeof rewardApprovals.$inferSelect;

// ==================== FRAUD FLAGS ====================
export const fraudFlags = pgTable("fraud_flags", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  flagType: text("flag_type").notNull(),
  severity: text("severity").notNull().default("medium"),
  description: text("description"),
  detectionData: jsonb("detection_data").$type<{
    pattern: string;
    occurrences: number;
    timeWindow: string;
    relatedRewards?: number[];
  }>(),
  status: text("status").notNull().default("active"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const fraudFlagsRelations = relations(fraudFlags, ({ one }) => ({
  user: one(shishyaUsers, { fields: [fraudFlags.shishyaUserId], references: [shishyaUsers.id] }),
  resolver: one(users, { fields: [fraudFlags.resolvedBy], references: [users.id] }),
}));

export const insertFraudFlagSchema = createInsertSchema(fraudFlags).omit({
  id: true,
  createdAt: true,
});

export type InsertFraudFlag = z.infer<typeof insertFraudFlagSchema>;
export type FraudFlag = typeof fraudFlags.$inferSelect;

// ==================== WALLET FREEZES ====================
export const walletFreezes = pgTable("wallet_freezes", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  frozenBy: varchar("frozen_by").notNull().references(() => users.id),
  frozenAt: timestamp("frozen_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  unfrozenBy: varchar("unfrozen_by").references(() => users.id),
  unfrozenAt: timestamp("unfrozen_at"),
  unfreezeReason: text("unfreeze_reason"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const walletFreezesRelations = relations(walletFreezes, ({ one }) => ({
  user: one(shishyaUsers, { fields: [walletFreezes.shishyaUserId], references: [shishyaUsers.id] }),
  frozenByAdmin: one(users, { fields: [walletFreezes.frozenBy], references: [users.id] }),
}));

export const insertWalletFreezeSchema = createInsertSchema(walletFreezes).omit({
  id: true,
  frozenAt: true,
});

export type InsertWalletFreeze = z.infer<typeof insertWalletFreezeSchema>;
export type WalletFreeze = typeof walletFreezes.$inferSelect;

// ==================== REWARD OVERRIDES (Manual Actions) ====================
export const rewardOverrides = pgTable("reward_overrides", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(),
  rewardType: text("reward_type"),
  amount: integer("amount"),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  walletTransactionId: integer("wallet_transaction_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rewardOverridesRelations = relations(rewardOverrides, ({ one }) => ({
  user: one(shishyaUsers, { fields: [rewardOverrides.shishyaUserId], references: [shishyaUsers.id] }),
  admin: one(users, { fields: [rewardOverrides.adminId], references: [users.id] }),
}));

export const insertRewardOverrideSchema = createInsertSchema(rewardOverrides).omit({
  id: true,
  createdAt: true,
});

export type InsertRewardOverride = z.infer<typeof insertRewardOverrideSchema>;
export type RewardOverride = typeof rewardOverrides.$inferSelect;

// ==================== RISK SCORES ====================
export const riskScores = pgTable("risk_scores", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().unique().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").default(0).notNull(),
  velocityScore: integer("velocity_score").default(0),
  patternScore: integer("pattern_score").default(0),
  accountAgeScore: integer("account_age_score").default(0),
  behaviorScore: integer("behavior_score").default(0),
  lastCalculatedAt: timestamp("last_calculated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  riskFactors: jsonb("risk_factors").$type<{
    rapidCompletions?: boolean;
    multipleRewardsShortTime?: boolean;
    streakManipulation?: boolean;
    repeatedResets?: boolean;
    suspiciousPatterns?: string[];
  }>(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  user: one(shishyaUsers, { fields: [riskScores.shishyaUserId], references: [shishyaUsers.id] }),
}));

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  updatedAt: true,
});

export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScores.$inferSelect;

// ==================== ADMIN ACTION LOGS (Immutable Audit) ====================
export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  previousState: jsonb("previous_state").$type<Record<string, any>>(),
  newState: jsonb("new_state").$type<Record<string, any>>(),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  admin: one(users, { fields: [adminActionLogs.adminId], references: [users.id] }),
}));

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;

// ==================== SCHOLARSHIPS ====================
export const scholarships = pgTable("scholarships", {
  id: serial("id").primaryKey(),
  shishyaUserId: integer("shishya_user_id").notNull().references(() => shishyaUsers.id, { onDelete: "cascade" }),
  rewardApprovalId: integer("reward_approval_id").references(() => rewardApprovals.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR"),
  status: text("status").notNull().default("pending"),
  courseId: integer("course_id").references(() => courses.id),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  issuedBy: varchar("issued_by").references(() => users.id),
  issuedAt: timestamp("issued_at"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scholarshipsRelations = relations(scholarships, ({ one }) => ({
  user: one(shishyaUsers, { fields: [scholarships.shishyaUserId], references: [shishyaUsers.id] }),
  course: one(courses, { fields: [scholarships.courseId], references: [courses.id] }),
  approval: one(rewardApprovals, { fields: [scholarships.rewardApprovalId], references: [rewardApprovals.id] }),
}));

export const insertScholarshipSchema = createInsertSchema(scholarships).omit({
  id: true,
  createdAt: true,
});

export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;
export type Scholarship = typeof scholarships.$inferSelect;

// ==================== COURSE REWARDS ====================
export const courseRewards = pgTable("course_rewards", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().unique().references(() => courses.id, { onDelete: "cascade" }),
  coinsEnabled: boolean("coins_enabled").default(false).notNull(),
  coinName: text("coin_name").default("Skill Coins"),
  coinIcon: text("coin_icon").default("coins"),
  rulesJson: jsonb("rules_json").$type<{
    courseCompletion: number;
    moduleCompletion: number;
    lessonCompletion: number;
    testPass: number;
    projectSubmission: number;
    labCompletion: number;
  }>().default({
    courseCompletion: 100,
    moduleCompletion: 20,
    lessonCompletion: 5,
    testPass: 15,
    projectSubmission: 25,
    labCompletion: 10,
  }),
  bonusJson: jsonb("bonus_json").$type<{
    earlyCompletionEnabled: boolean;
    earlyCompletionDays: number;
    earlyCompletionBonus: number;
    perfectScoreEnabled: boolean;
    perfectScoreBonus: number;
  }>().default({
    earlyCompletionEnabled: false,
    earlyCompletionDays: 7,
    earlyCompletionBonus: 50,
    perfectScoreEnabled: false,
    perfectScoreBonus: 25,
  }),
  scholarshipEnabled: boolean("scholarship_enabled").default(false),
  scholarshipJson: jsonb("scholarship_json").$type<{
    coinsToDiscount: number;
    discountType: "percentage" | "flat";
    discountValue: number;
    validityDays: number;
    eligiblePlans: string[];
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const courseRewardsRelations = relations(courseRewards, ({ one, many }) => ({
  course: one(courses, { fields: [courseRewards.courseId], references: [courses.id] }),
  achievementCards: many(achievementCards),
  motivationalCards: many(motivationalCards),
}));

export const insertCourseRewardSchema = createInsertSchema(courseRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCourseReward = z.infer<typeof insertCourseRewardSchema>;
export type CourseReward = typeof courseRewards.$inferSelect;

// ==================== ACHIEVEMENT CARDS ====================
export const achievementCards = pgTable("achievement_cards", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon").default("trophy"),
  conditionJson: jsonb("condition_json").$type<{
    type: "percentage_complete" | "module_complete" | "all_tests_passed" | "project_approved" | "all_labs_complete" | "custom";
    value?: number;
    moduleId?: number;
    customCondition?: string;
  }>().notNull(),
  rarity: text("rarity").notNull().default("common"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const achievementCardsRelations = relations(achievementCards, ({ one }) => ({
  course: one(courses, { fields: [achievementCards.courseId], references: [courses.id] }),
}));

export const insertAchievementCardSchema = createInsertSchema(achievementCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAchievementCard = z.infer<typeof insertAchievementCardSchema>;
export type AchievementCard = typeof achievementCards.$inferSelect;

// ==================== MOTIVATIONAL CARDS ====================
export const motivationalCards = pgTable("motivational_cards", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerValue: integer("trigger_value"),
  icon: text("icon").default("sparkles"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const motivationalCardsRelations = relations(motivationalCards, ({ one }) => ({
  course: one(courses, { fields: [motivationalCards.courseId], references: [courses.id] }),
}));

export const insertMotivationalCardSchema = createInsertSchema(motivationalCards).omit({
  id: true,
  createdAt: true,
});

export type InsertMotivationalCard = z.infer<typeof insertMotivationalCardSchema>;
export type MotivationalCard = typeof motivationalCards.$inferSelect;

