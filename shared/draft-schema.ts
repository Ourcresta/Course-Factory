import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// ============================================
// DRAFT TABLES - Admin Content Creation
// ============================================
// These tables store content being created/edited by admins.
// When published, data is copied to live tables (courses, modules, etc.)
// Students can ONLY access live tables with status='published'
// ============================================

// ==================== DRAFT COURSES ====================
export const draftCourses = pgTable("draft_courses", {
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
  status: text("status").notNull().default("draft"),
  aiCommand: text("ai_command"),
  thumbnailUrl: text("thumbnail_url"),
  creditCost: integer("credit_cost").default(0).notNull(),
  isFree: boolean("is_free").default(true).notNull(),
  originalCreditCost: integer("original_credit_cost"),
  createdBy: varchar("created_by").references(() => users.id),
  liveCourseId: integer("live_course_id"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  publishedAt: timestamp("published_at"),
});

export const draftCoursesRelations = relations(draftCourses, ({ one, many }) => ({
  createdByUser: one(users, { fields: [draftCourses.createdBy], references: [users.id] }),
  modules: many(draftModules),
  projects: many(draftProjects),
  tests: many(draftTests),
  practiceLabs: many(draftPracticeLabs),
  certificates: many(draftCertificates),
  rewards: many(draftCourseRewards),
}));

export const insertDraftCourseSchema = createInsertSchema(draftCourses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertDraftCourse = z.infer<typeof insertDraftCourseSchema>;
export type DraftCourse = typeof draftCourses.$inferSelect;

// ==================== DRAFT MODULES ====================
export const draftModules = pgTable("draft_modules", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").notNull().references(() => draftCourses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftModulesRelations = relations(draftModules, ({ one, many }) => ({
  course: one(draftCourses, { fields: [draftModules.draftCourseId], references: [draftCourses.id] }),
  lessons: many(draftLessons),
  projects: many(draftProjects),
  tests: many(draftTests),
}));

export const insertDraftModuleSchema = createInsertSchema(draftModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftModule = z.infer<typeof insertDraftModuleSchema>;
export type DraftModule = typeof draftModules.$inferSelect;

// ==================== DRAFT LESSONS ====================
export interface YouTubeReference {
  url: string;
  title: string;
  description?: string;
}

export const draftLessons = pgTable("draft_lessons", {
  id: serial("id").primaryKey(),
  draftModuleId: integer("draft_module_id").notNull().references(() => draftModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  objectives: jsonb("objectives").$type<string[]>(),
  estimatedTime: text("estimated_time"),
  keyConcepts: jsonb("key_concepts").$type<string[]>(),
  videoUrl: text("video_url"),
  externalLinks: jsonb("external_links").$type<string[]>(),
  youtubeReferences: jsonb("youtube_references").$type<YouTubeReference[]>(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftLessonsRelations = relations(draftLessons, ({ one, many }) => ({
  module: one(draftModules, { fields: [draftLessons.draftModuleId], references: [draftModules.id] }),
  aiNotes: many(draftAiNotes),
}));

export const insertDraftLessonSchema = createInsertSchema(draftLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftLesson = z.infer<typeof insertDraftLessonSchema>;
export type DraftLesson = typeof draftLessons.$inferSelect;

// ==================== DRAFT AI NOTES ====================
export const draftAiNotes = pgTable("draft_ai_notes", {
  id: serial("id").primaryKey(),
  draftLessonId: integer("draft_lesson_id").notNull().references(() => draftLessons.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  simplifiedExplanation: text("simplified_explanation"),
  bulletNotes: jsonb("bullet_notes").$type<string[]>(),
  keyTakeaways: jsonb("key_takeaways").$type<string[]>(),
  interviewQuestions: jsonb("interview_questions").$type<string[]>(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftAiNotesRelations = relations(draftAiNotes, ({ one }) => ({
  lesson: one(draftLessons, { fields: [draftAiNotes.draftLessonId], references: [draftLessons.id] }),
}));

export const insertDraftAiNoteSchema = createInsertSchema(draftAiNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftAiNote = z.infer<typeof insertDraftAiNoteSchema>;
export type DraftAiNote = typeof draftAiNotes.$inferSelect;

// ==================== DRAFT TESTS ====================
export const draftTests = pgTable("draft_tests", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").references(() => draftCourses.id, { onDelete: "set null" }),
  draftModuleId: integer("draft_module_id").references(() => draftModules.id, { onDelete: "set null" }),
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

export const draftTestsRelations = relations(draftTests, ({ one, many }) => ({
  course: one(draftCourses, { fields: [draftTests.draftCourseId], references: [draftCourses.id] }),
  module: one(draftModules, { fields: [draftTests.draftModuleId], references: [draftModules.id] }),
  questions: many(draftQuestions),
}));

export const insertDraftTestSchema = createInsertSchema(draftTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftTest = z.infer<typeof insertDraftTestSchema>;
export type DraftTest = typeof draftTests.$inferSelect;

// ==================== DRAFT QUESTIONS ====================
export const draftQuestions = pgTable("draft_questions", {
  id: serial("id").primaryKey(),
  draftTestId: integer("draft_test_id").notNull().references(() => draftTests.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mcq"),
  difficulty: text("difficulty").default("medium"),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftQuestionsRelations = relations(draftQuestions, ({ one }) => ({
  test: one(draftTests, { fields: [draftQuestions.draftTestId], references: [draftTests.id] }),
}));

export const insertDraftQuestionSchema = createInsertSchema(draftQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertDraftQuestion = z.infer<typeof insertDraftQuestionSchema>;
export type DraftQuestion = typeof draftQuestions.$inferSelect;

// ==================== DRAFT PROJECTS ====================
export const draftProjects = pgTable("draft_projects", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").references(() => draftCourses.id, { onDelete: "set null" }),
  draftModuleId: integer("draft_module_id").references(() => draftModules.id, { onDelete: "set null" }),
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

export const draftProjectsRelations = relations(draftProjects, ({ one, many }) => ({
  course: one(draftCourses, { fields: [draftProjects.draftCourseId], references: [draftCourses.id] }),
  module: one(draftModules, { fields: [draftProjects.draftModuleId], references: [draftModules.id] }),
  steps: many(draftProjectSteps),
}));

export const insertDraftProjectSchema = createInsertSchema(draftProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftProject = z.infer<typeof insertDraftProjectSchema>;
export type DraftProject = typeof draftProjects.$inferSelect;

// ==================== DRAFT PROJECT STEPS ====================
export const draftProjectSteps = pgTable("draft_project_steps", {
  id: serial("id").primaryKey(),
  draftProjectId: integer("draft_project_id").notNull().references(() => draftProjects.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  codeSnippet: text("code_snippet"),
  tips: jsonb("tips").$type<string[]>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftProjectStepsRelations = relations(draftProjectSteps, ({ one }) => ({
  project: one(draftProjects, { fields: [draftProjectSteps.draftProjectId], references: [draftProjects.id] }),
}));

export const insertDraftProjectStepSchema = createInsertSchema(draftProjectSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertDraftProjectStep = z.infer<typeof insertDraftProjectStepSchema>;
export type DraftProjectStep = typeof draftProjectSteps.$inferSelect;

// ==================== DRAFT PRACTICE LABS ====================
export const draftPracticeLabs = pgTable("draft_practice_labs", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").references(() => draftCourses.id, { onDelete: "set null" }),
  draftModuleId: integer("draft_module_id").references(() => draftModules.id, { onDelete: "set null" }),
  draftLessonId: integer("draft_lesson_id").references(() => draftLessons.id, { onDelete: "set null" }),
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

export const draftPracticeLabsRelations = relations(draftPracticeLabs, ({ one }) => ({
  course: one(draftCourses, { fields: [draftPracticeLabs.draftCourseId], references: [draftCourses.id] }),
  module: one(draftModules, { fields: [draftPracticeLabs.draftModuleId], references: [draftModules.id] }),
  lesson: one(draftLessons, { fields: [draftPracticeLabs.draftLessonId], references: [draftLessons.id] }),
}));

export const insertDraftPracticeLabSchema = createInsertSchema(draftPracticeLabs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftPracticeLab = z.infer<typeof insertDraftPracticeLabSchema>;
export type DraftPracticeLab = typeof draftPracticeLabs.$inferSelect;

// ==================== DRAFT CERTIFICATES ====================
export const draftCertificates = pgTable("draft_certificates", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").references(() => draftCourses.id, { onDelete: "set null" }),
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

export const draftCertificatesRelations = relations(draftCertificates, ({ one }) => ({
  course: one(draftCourses, { fields: [draftCertificates.draftCourseId], references: [draftCourses.id] }),
}));

export const insertDraftCertificateSchema = createInsertSchema(draftCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftCertificate = z.infer<typeof insertDraftCertificateSchema>;
export type DraftCertificate = typeof draftCertificates.$inferSelect;

// ==================== DRAFT COURSE REWARDS ====================
export const draftCourseRewards = pgTable("draft_course_rewards", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").notNull().unique().references(() => draftCourses.id, { onDelete: "cascade" }),
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

export const draftCourseRewardsRelations = relations(draftCourseRewards, ({ one, many }) => ({
  course: one(draftCourses, { fields: [draftCourseRewards.draftCourseId], references: [draftCourses.id] }),
  achievementCards: many(draftAchievementCards),
  motivationalCards: many(draftMotivationalCards),
}));

export const insertDraftCourseRewardSchema = createInsertSchema(draftCourseRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftCourseReward = z.infer<typeof insertDraftCourseRewardSchema>;
export type DraftCourseReward = typeof draftCourseRewards.$inferSelect;

// ==================== DRAFT ACHIEVEMENT CARDS ====================
export const draftAchievementCards = pgTable("draft_achievement_cards", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").notNull().references(() => draftCourses.id, { onDelete: "cascade" }),
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

export const draftAchievementCardsRelations = relations(draftAchievementCards, ({ one }) => ({
  course: one(draftCourses, { fields: [draftAchievementCards.draftCourseId], references: [draftCourses.id] }),
}));

export const insertDraftAchievementCardSchema = createInsertSchema(draftAchievementCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDraftAchievementCard = z.infer<typeof insertDraftAchievementCardSchema>;
export type DraftAchievementCard = typeof draftAchievementCards.$inferSelect;

// ==================== DRAFT MOTIVATIONAL CARDS ====================
export const draftMotivationalCards = pgTable("draft_motivational_cards", {
  id: serial("id").primaryKey(),
  draftCourseId: integer("draft_course_id").notNull().references(() => draftCourses.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerValue: integer("trigger_value"),
  icon: text("icon").default("sparkles"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const draftMotivationalCardsRelations = relations(draftMotivationalCards, ({ one }) => ({
  course: one(draftCourses, { fields: [draftMotivationalCards.draftCourseId], references: [draftCourses.id] }),
}));

export const insertDraftMotivationalCardSchema = createInsertSchema(draftMotivationalCards).omit({
  id: true,
  createdAt: true,
});

export type InsertDraftMotivationalCard = z.infer<typeof insertDraftMotivationalCardSchema>;
export type DraftMotivationalCard = typeof draftMotivationalCards.$inferSelect;
