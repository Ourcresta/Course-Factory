import {
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Module,
  type InsertModule,
  type Lesson,
  type InsertLesson,
  type AiNote,
  type InsertAiNote,
  type Project,
  type InsertProject,
  type ProjectStep,
  type InsertProjectStep,
  type Test,
  type InsertTest,
  type Question,
  type InsertQuestion,
  type Certificate,
  type InsertCertificate,
  type Skill,
  type InsertSkill,
  type AuditLog,
  type InsertAuditLog,
  type PracticeLab,
  type InsertPracticeLab,
  type ApiKey,
  type InsertApiKey,
  type OtpToken,
  type InsertOtpToken,
  users,
  courses,
  modules,
  lessons,
  aiNotes,
  projects,
  projectSteps,
  projectSkills,
  tests,
  questions,
  certificates,
  skills,
  courseSkills,
  auditLogs,
  aiGenerationLogs,
  publishStatus,
  practiceLabs,
  apiKeys,
  otpTokens,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<void>;

  // OTP Tokens
  createOtpToken(token: InsertOtpToken): Promise<OtpToken>;
  getLatestOtpToken(userId: string): Promise<OtpToken | undefined>;
  incrementOtpAttempts(id: number): Promise<void>;
  markOtpAsUsed(id: number): Promise<void>;
  invalidateUserOtps(userId: string): Promise<void>;

  // Courses
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithRelations(id: number): Promise<any>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  publishCourse(id: number): Promise<Course | undefined>;
  unpublishCourse(id: number): Promise<Course | undefined>;
  updateCoursePricing(id: number, pricing: {
    creditCost: number;
    isFree: boolean;
    originalCreditCost: number | null;
    pricingUpdatedAt: Date;
  }): Promise<Course | undefined>;
  getDashboardStats(): Promise<{
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    generatingCourses: number;
  }>;

  // Modules
  getModule(id: number): Promise<Module | undefined>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<void>;

  // Lessons
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonWithNotes(id: number): Promise<(Lesson & { aiNotes?: AiNote[] }) | undefined>;
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<void>;

  // AI Notes
  getAiNote(id: number): Promise<AiNote | undefined>;
  getAiNoteByLessonId(lessonId: number): Promise<AiNote | undefined>;
  getAiNotesByLesson(lessonId: number): Promise<AiNote[]>;
  createAiNote(note: InsertAiNote): Promise<AiNote>;
  updateAiNote(id: number, note: Partial<InsertAiNote>): Promise<AiNote | undefined>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectWithSkills(id: number): Promise<(Project & { skills: Skill[] }) | undefined>;
  getProjectsByModule(moduleId: number): Promise<Project[]>;
  getProjectsByCourse(courseId: number): Promise<(Project & { skills: Skill[] })[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  setProjectSkills(projectId: number, skillIds: number[]): Promise<void>;

  // Project Steps
  getProjectSteps(projectId: number): Promise<ProjectStep[]>;
  createProjectStep(step: InsertProjectStep): Promise<ProjectStep>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestWithQuestions(id: number): Promise<(Test & { questions: Question[] }) | undefined>;
  getTestsByModule(moduleId: number): Promise<Test[]>;
  getTestsByCourse(courseId: number): Promise<(Test & { questions: Question[]; moduleName?: string })[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;

  // Questions
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByTest(testId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<void>;

  // Certificates
  getCertificate(id: number): Promise<Certificate | undefined>;
  getAllCertificates(): Promise<Certificate[]>;
  getCertificatesByCourse(courseId: number): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, certificate: Partial<InsertCertificate>): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<void>;

  // Skills
  getSkill(id: number): Promise<Skill | undefined>;
  getAllSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, skill: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: number): Promise<AuditLog[]>;

  // Practice Labs
  getPracticeLab(id: number): Promise<PracticeLab | undefined>;
  getPracticeLabsByCourse(courseId: number): Promise<PracticeLab[]>;
  getPracticeLabsByModule(moduleId: number): Promise<PracticeLab[]>;
  createPracticeLab(lab: InsertPracticeLab): Promise<PracticeLab>;
  updatePracticeLab(id: number, lab: Partial<InsertPracticeLab>): Promise<PracticeLab | undefined>;
  deletePracticeLab(id: number): Promise<void>;

  // API Keys
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  getAllApiKeys(): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<void>;
  updateApiKeyLastUsed(id: number): Promise<void>;

  // Public API methods for Shishya integration
  getPublishedCourses(): Promise<Course[]>;
  getPublishedCourseById(id: number): Promise<any>;
  getPublishedCourseTests(courseId: number): Promise<any[]>;
  getPublishedCourseProjects(courseId: number): Promise<any[]>;
  getPublishedCourseLabs(courseId: number): Promise<PracticeLab[]>;
  getPublishedCourseCertificate(courseId: number): Promise<Certificate | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  // OTP Tokens
  async createOtpToken(token: InsertOtpToken): Promise<OtpToken> {
    const [newToken] = await db.insert(otpTokens).values(token).returning();
    return newToken;
  }

  async getLatestOtpToken(userId: string): Promise<OtpToken | undefined> {
    const [token] = await db
      .select()
      .from(otpTokens)
      .where(eq(otpTokens.userId, userId))
      .orderBy(desc(otpTokens.createdAt))
      .limit(1);
    return token;
  }

  async incrementOtpAttempts(id: number): Promise<void> {
    await db
      .update(otpTokens)
      .set({ attempts: sql`${otpTokens.attempts} + 1` })
      .where(eq(otpTokens.id, id));
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db.update(otpTokens).set({ isUsed: true }).where(eq(otpTokens.id, id));
  }

  async invalidateUserOtps(userId: string): Promise<void> {
    await db.update(otpTokens).set({ isUsed: true }).where(eq(otpTokens.userId, userId));
  }

  // Courses
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)));
    return course;
  }

  async getCourseWithRelations(id: number): Promise<any> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const courseModules = await this.getModulesByCourse(id);
    const modulesWithContent = await Promise.all(
      courseModules.map(async (module) => {
        const [moduleLessons, moduleProjects, moduleTests] = await Promise.all([
          this.getLessonsByModule(module.id),
          this.getProjectsByModule(module.id),
          this.getTestsByModule(module.id),
        ]);
        return {
          ...module,
          lessons: moduleLessons,
          projects: moduleProjects,
          tests: moduleTests,
        };
      })
    );

    return {
      ...course,
      modules: modulesWithContent,
    };
  }

  async getAllCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(isNull(courses.deletedAt))
      .orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, id));
  }

  async publishCourse(id: number): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async unpublishCourse(id: number): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async updateCoursePricing(id: number, pricing: {
    creditCost: number;
    isFree: boolean;
    originalCreditCost: number | null;
    pricingUpdatedAt: Date;
  }): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set({
        creditCost: pricing.creditCost,
        isFree: pricing.isFree,
        originalCreditCost: pricing.originalCreditCost,
        pricingUpdatedAt: pricing.pricingUpdatedAt,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async getDashboardStats() {
    const allCourses = await db
      .select()
      .from(courses)
      .where(isNull(courses.deletedAt));

    return {
      totalCourses: allCourses.length,
      publishedCourses: allCourses.filter((c) => c.status === "published").length,
      draftCourses: allCourses.filter((c) => c.status === "draft").length,
      generatingCourses: allCourses.filter((c) => c.status === "generating").length,
    };
  }

  // Modules
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.orderIndex);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: number, module: Partial<InsertModule>): Promise<Module | undefined> {
    const [updated] = await db
      .update(modules)
      .set({ ...module, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    return updated;
  }

  async deleteModule(id: number): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  // Lessons
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.orderIndex);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db
      .update(lessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updated;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async getLessonWithNotes(id: number): Promise<(Lesson & { aiNotes?: AiNote[] }) | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!lesson) return undefined;
    
    const notes = await db.select().from(aiNotes).where(eq(aiNotes.lessonId, id)).orderBy(desc(aiNotes.version));
    return { ...lesson, aiNotes: notes };
  }

  // AI Notes
  async getAiNote(id: number): Promise<AiNote | undefined> {
    const [note] = await db.select().from(aiNotes).where(eq(aiNotes.id, id));
    return note;
  }

  async getAiNoteByLessonId(lessonId: number): Promise<AiNote | undefined> {
    const [note] = await db
      .select()
      .from(aiNotes)
      .where(eq(aiNotes.lessonId, lessonId))
      .orderBy(desc(aiNotes.version))
      .limit(1);
    return note;
  }

  async getAiNotesByLesson(lessonId: number): Promise<AiNote[]> {
    return db.select().from(aiNotes).where(eq(aiNotes.lessonId, lessonId));
  }

  async createAiNote(note: InsertAiNote): Promise<AiNote> {
    const [newNote] = await db.insert(aiNotes).values(note).returning();
    return newNote;
  }

  async updateAiNote(id: number, note: Partial<InsertAiNote>): Promise<AiNote | undefined> {
    const [updated] = await db
      .update(aiNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(aiNotes.id, id))
      .returning();
    return updated;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectWithSkills(id: number): Promise<(Project & { skills: Skill[] }) | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;
    
    const projectSkillRows = await db
      .select()
      .from(projectSkills)
      .where(eq(projectSkills.projectId, id));
    
    const skillIds = projectSkillRows.map(ps => ps.skillId);
    let projectSkillsList: Skill[] = [];
    if (skillIds.length > 0) {
      projectSkillsList = await Promise.all(
        skillIds.map(async (skillId) => {
          const [skill] = await db.select().from(skills).where(eq(skills.id, skillId));
          return skill;
        })
      );
      projectSkillsList = projectSkillsList.filter(Boolean);
    }
    
    return { ...project, skills: projectSkillsList };
  }

  async getProjectsByModule(moduleId: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.moduleId, moduleId))
      .orderBy(projects.orderIndex);
  }

  async getProjectsByCourse(courseId: number): Promise<(Project & { skills: Skill[] })[]> {
    const courseProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.courseId, courseId))
      .orderBy(projects.orderIndex);
    
    const projectsWithSkills = await Promise.all(
      courseProjects.map(async (project) => {
        const projectSkillRows = await db
          .select()
          .from(projectSkills)
          .where(eq(projectSkills.projectId, project.id));
        
        const skillIds = projectSkillRows.map(ps => ps.skillId);
        let projectSkillsList: Skill[] = [];
        if (skillIds.length > 0) {
          projectSkillsList = await Promise.all(
            skillIds.map(async (skillId) => {
              const [skill] = await db.select().from(skills).where(eq(skills.id, skillId));
              return skill;
            })
          );
          projectSkillsList = projectSkillsList.filter(Boolean);
        }
        
        return { ...project, skills: projectSkillsList };
      })
    );
    
    return projectsWithSkills;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projectSkills).where(eq(projectSkills.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async setProjectSkills(projectId: number, skillIds: number[]): Promise<void> {
    await db.delete(projectSkills).where(eq(projectSkills.projectId, projectId));
    if (skillIds.length > 0) {
      await db.insert(projectSkills).values(
        skillIds.map(skillId => ({ projectId, skillId }))
      );
    }
  }

  // Project Steps
  async getProjectSteps(projectId: number): Promise<ProjectStep[]> {
    return db
      .select()
      .from(projectSteps)
      .where(eq(projectSteps.projectId, projectId))
      .orderBy(projectSteps.stepNumber);
  }

  async createProjectStep(step: InsertProjectStep): Promise<ProjectStep> {
    const [newStep] = await db.insert(projectSteps).values(step).returning();
    return newStep;
  }

  // Tests
  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async getTestWithQuestions(id: number): Promise<(Test & { questions: Question[] }) | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    if (!test) return undefined;
    const testQuestions = await this.getQuestionsByTest(id);
    return { ...test, questions: testQuestions };
  }

  async getTestsByModule(moduleId: number): Promise<Test[]> {
    return db.select().from(tests).where(eq(tests.moduleId, moduleId));
  }

  async getTestsByCourse(courseId: number): Promise<(Test & { questions: Question[]; moduleName?: string })[]> {
    const courseModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    const allTests: (Test & { questions: Question[]; moduleName?: string })[] = [];
    
    for (const module of courseModules) {
      const moduleTests = await db.select().from(tests).where(eq(tests.moduleId, module.id));
      for (const test of moduleTests) {
        const testQuestions = await this.getQuestionsByTest(test.id);
        allTests.push({ ...test, questions: testQuestions, moduleName: module.title });
      }
    }
    
    return allTests;
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const [updated] = await db
      .update(tests)
      .set({ ...test, updatedAt: new Date() })
      .where(eq(tests.id, id))
      .returning();
    return updated;
  }

  async deleteTest(id: number): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  // Questions
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByTest(testId: number): Promise<Question[]> {
    return db
      .select()
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(questions.orderIndex);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updated] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Certificates
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate;
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return db.select().from(certificates).orderBy(desc(certificates.createdAt));
  }

  async getCertificatesByCourse(courseId: number): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.courseId, courseId));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
  }

  async updateCertificate(id: number, certificate: Partial<InsertCertificate>): Promise<Certificate | undefined> {
    const [updated] = await db
      .update(certificates)
      .set({ ...certificate, updatedAt: new Date() })
      .where(eq(certificates.id, id))
      .returning();
    return updated;
  }

  async deleteCertificate(id: number): Promise<void> {
    await db.delete(certificates).where(eq(certificates.id, id));
  }

  // Skills
  async getSkill(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }

  async getAllSkills(): Promise<Skill[]> {
    return db.select().from(skills).orderBy(skills.name);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async updateSkill(id: number, skill: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [updated] = await db
      .update(skills)
      .set(skill)
      .where(eq(skills.id, id))
      .returning();
    return updated;
  }

  async deleteSkill(id: number): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(entityType?: string, entityId?: number): Promise<AuditLog[]> {
    if (entityType && entityId) {
      return db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(desc(auditLogs.createdAt));
    }
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  }

  // Practice Labs
  async getPracticeLab(id: number): Promise<PracticeLab | undefined> {
    const [lab] = await db.select().from(practiceLabs).where(eq(practiceLabs.id, id));
    return lab;
  }

  async getPracticeLabsByCourse(courseId: number): Promise<PracticeLab[]> {
    return db
      .select()
      .from(practiceLabs)
      .where(eq(practiceLabs.courseId, courseId))
      .orderBy(practiceLabs.orderIndex);
  }

  async getPracticeLabsByModule(moduleId: number): Promise<PracticeLab[]> {
    return db
      .select()
      .from(practiceLabs)
      .where(eq(practiceLabs.moduleId, moduleId))
      .orderBy(practiceLabs.orderIndex);
  }

  async createPracticeLab(lab: InsertPracticeLab): Promise<PracticeLab> {
    const [newLab] = await db.insert(practiceLabs).values(lab).returning();
    return newLab;
  }

  async updatePracticeLab(id: number, lab: Partial<InsertPracticeLab>): Promise<PracticeLab | undefined> {
    const [updated] = await db
      .update(practiceLabs)
      .set({ ...lab, updatedAt: new Date() })
      .where(eq(practiceLabs.id, id))
      .returning();
    return updated;
  }

  async deletePracticeLab(id: number): Promise<void> {
    await db.delete(practiceLabs).where(eq(practiceLabs.id, id));
  }

  // API Keys
  async getApiKey(id: number): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return key;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return apiKey;
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newKey;
  }

  async updateApiKey(id: number, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [updated] = await db
      .update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  // Public API methods for Shishya integration
  async getPublishedCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(and(eq(courses.status, "published"), isNull(courses.deletedAt)))
      .orderBy(desc(courses.publishedAt));
  }

  async getPublishedCourseById(id: number): Promise<any> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.status, "published"), isNull(courses.deletedAt)));
    
    if (!course) return undefined;

    const courseModules = await this.getModulesByCourse(id);
    const courseSkillsData = await db
      .select({ skillId: courseSkills.skillId })
      .from(courseSkills)
      .where(eq(courseSkills.courseId, id));
    
    const skillIds = courseSkillsData.map(cs => cs.skillId);
    const courseSkillsList = skillIds.length > 0 
      ? await db.select().from(skills).where(sql`${skills.id} IN (${sql.join(skillIds, sql`, `)})`)
      : [];

    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await this.getLessonsByModule(module.id);
        const lessonsWithNotes = await Promise.all(
          moduleLessons.map(async (lesson) => {
            const notes = await this.getAiNotesByLesson(lesson.id);
            return { ...lesson, aiNotes: notes };
          })
        );
        return { ...module, lessons: lessonsWithNotes };
      })
    );

    return {
      ...course,
      skills: courseSkillsList,
      modules: modulesWithLessons,
    };
  }

  async getPublishedCourseTests(courseId: number): Promise<any[]> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
    
    if (!course) return [];

    const courseModules = await this.getModulesByCourse(courseId);
    const allTests: any[] = [];

    for (const module of courseModules) {
      const moduleTests = await db
        .select()
        .from(tests)
        .where(eq(tests.moduleId, module.id));

      for (const test of moduleTests) {
        const testQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.testId, test.id))
          .orderBy(questions.orderIndex);
        
        allTests.push({
          ...test,
          moduleName: module.title,
          moduleId: module.id,
          questions: testQuestions,
        });
      }
    }

    return allTests;
  }

  async getPublishedCourseProjects(courseId: number): Promise<any[]> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
    
    if (!course) return [];

    const courseProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.courseId, courseId))
      .orderBy(projects.orderIndex);

    const projectsWithSkills = await Promise.all(
      courseProjects.map(async (project) => {
        const projectSkillsData = await db
          .select({ skillId: projectSkills.skillId })
          .from(projectSkills)
          .where(eq(projectSkills.projectId, project.id));
        
        const skillIds = projectSkillsData.map(ps => ps.skillId);
        const projectSkillsList = skillIds.length > 0
          ? await db.select().from(skills).where(sql`${skills.id} IN (${sql.join(skillIds, sql`, `)})`)
          : [];

        const steps = await this.getProjectSteps(project.id);

        return { ...project, skills: projectSkillsList, steps };
      })
    );

    return projectsWithSkills;
  }

  async getPublishedCourseLabs(courseId: number): Promise<PracticeLab[]> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
    
    if (!course) return [];

    return db
      .select()
      .from(practiceLabs)
      .where(eq(practiceLabs.courseId, courseId))
      .orderBy(practiceLabs.orderIndex);
  }

  async getPublishedCourseCertificate(courseId: number): Promise<Certificate | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")));
    
    if (!course) return undefined;

    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.courseId, courseId));

    return certificate;
  }
}

export const storage = new DatabaseStorage();
