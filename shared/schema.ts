import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export chat models
export * from "./models/chat";

// ==================== USERS ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// ==================== COURSES ====================
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
  certificateType: text("certificate_type").default("completion"),
  status: text("status").notNull().default("draft"),
  aiCommand: text("ai_command"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  publishedAt: timestamp("published_at"),
  deletedAt: timestamp("deleted_at"),
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
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
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
  moduleId: integer("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingPercentage: integer("passing_percentage").default(70),
  isLocked: boolean("is_locked").default(false),
  timeLimit: integer("time_limit"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const testsRelations = relations(tests, ({ one, many }) => ({
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
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
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
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
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
