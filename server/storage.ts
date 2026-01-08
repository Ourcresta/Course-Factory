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
  type OtpToken,
  type InsertOtpToken,
  type LoginAttempt,
  type InsertLoginAttempt,
  type AdminSession,
  type InsertAdminSession,
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
  otpTokens,
  loginAttempts,
  adminSessions,
  creditPackages,
  vouchers,
  giftBoxes,
  paymentGateways,
  upiSettings,
  bankAccounts,
  systemSettings,
  courseRewards,
  achievementCards,
  motivationalCards,
  type CourseReward,
  type InsertCourseReward,
  type AchievementCard,
  type InsertAchievementCard,
  type MotivationalCard,
  type InsertMotivationalCard,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllAdmins(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<void>;
  updateUserStatus(id: string, isActive: boolean): Promise<void>;
  updateUserInvitedBy(id: string, invitedBy: string): Promise<void>;
  unlockUser(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Login Attempts
  createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(options: { success?: boolean; limit?: number }): Promise<LoginAttempt[]>;

  // Admin Sessions
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAllActiveSessions(): Promise<AdminSession[]>;
  revokeSession(sessionId: string): Promise<void>;
  revokeUserSessions(userId: string): Promise<void>;
  revokeAllSessionsExcept(userId: string): Promise<void>;
  getAllAuditLogs(options: { entityType?: string; limit?: number; offset?: number }): Promise<AuditLog[]>;


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
  getAllProjects(): Promise<Project[]>;
  getProjectsByModule(moduleId: number): Promise<Project[]>;
  getProjectsByCourse(courseId: number): Promise<(Project & { skills: Skill[] })[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  setProjectSkills(projectId: number, skillIds: number[]): Promise<void>;
  linkProjectToCourse(projectId: number, courseId: number): Promise<Project | undefined>;

  // Project Steps
  getProjectSteps(projectId: number): Promise<ProjectStep[]>;
  createProjectStep(step: InsertProjectStep): Promise<ProjectStep>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestWithQuestions(id: number): Promise<(Test & { questions: Question[] }) | undefined>;
  getAllTests(): Promise<Test[]>;
  getTestsByModule(moduleId: number): Promise<Test[]>;
  getTestsByCourse(courseId: number): Promise<(Test & { questions: Question[]; moduleName?: string })[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;
  linkTestToCourse(testId: number, courseId: number): Promise<Test | undefined>;

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
  linkCertificateToCourse(certId: number, courseId: number): Promise<Certificate | undefined>;

  // Credit Packages
  getCreditPackage(id: number): Promise<any | undefined>;
  getAllCreditPackages(): Promise<any[]>;
  createCreditPackage(pkg: any): Promise<any>;
  updateCreditPackage(id: number, pkg: any): Promise<any | undefined>;
  deleteCreditPackage(id: number): Promise<void>;

  // Vouchers
  getVoucher(id: number): Promise<any | undefined>;
  getAllVouchers(): Promise<any[]>;
  createVoucher(voucher: any): Promise<any>;
  updateVoucher(id: number, voucher: any): Promise<any | undefined>;
  deleteVoucher(id: number): Promise<void>;

  // Gift Boxes
  getGiftBox(id: number): Promise<any | undefined>;
  getAllGiftBoxes(): Promise<any[]>;
  createGiftBox(giftBox: any): Promise<any>;
  updateGiftBox(id: number, giftBox: any): Promise<any | undefined>;
  deleteGiftBox(id: number): Promise<void>;

  // Payment Gateways
  getPaymentGateway(id: number): Promise<any | undefined>;
  getAllPaymentGateways(): Promise<any[]>;
  createPaymentGateway(gateway: any): Promise<any>;
  updatePaymentGateway(id: number, gateway: any): Promise<any | undefined>;
  deletePaymentGateway(id: number): Promise<void>;

  // UPI Settings
  getUpiSetting(id: number): Promise<any | undefined>;
  getAllUpiSettings(): Promise<any[]>;
  createUpiSetting(upi: any): Promise<any>;
  updateUpiSetting(id: number, upi: any): Promise<any | undefined>;
  deleteUpiSetting(id: number): Promise<void>;

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
  getAllPracticeLabs(): Promise<PracticeLab[]>;
  getPracticeLabsByCourse(courseId: number): Promise<PracticeLab[]>;
  getPracticeLabsByModule(moduleId: number): Promise<PracticeLab[]>;
  createPracticeLab(lab: InsertPracticeLab): Promise<PracticeLab>;
  updatePracticeLab(id: number, lab: Partial<InsertPracticeLab>): Promise<PracticeLab | undefined>;
  deletePracticeLab(id: number): Promise<void>;
  linkLabToCourse(labId: number, courseId: number): Promise<PracticeLab | undefined>;

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

  async updateUserStatus(id: string, isActive: boolean): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }

  async updateUserInvitedBy(id: string, invitedBy: string): Promise<void> {
    await db.update(users).set({ invitedBy }).where(eq(users.id, id));
  }

  async unlockUser(id: string): Promise<void> {
    await db.update(users).set({ 
      lockedUntil: null, 
      failedLoginAttempts: 0 
    }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllAdmins(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Login Attempts
  async createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const [newAttempt] = await db.insert(loginAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getLoginAttempts(options: { success?: boolean; limit?: number }): Promise<LoginAttempt[]> {
    const { success, limit = 100 } = options;
    
    if (success !== undefined) {
      return db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.success, success))
        .orderBy(desc(loginAttempts.createdAt))
        .limit(limit);
    }
    
    return db
      .select()
      .from(loginAttempts)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(limit);
  }

  // Admin Sessions
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [newSession] = await db.insert(adminSessions).values(session).returning();
    return newSession;
  }

  async getAllActiveSessions(): Promise<AdminSession[]> {
    return db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.isActive, true))
      .orderBy(desc(adminSessions.lastActiveAt));
  }

  async revokeSession(sessionId: string): Promise<void> {
    await db.update(adminSessions).set({ isActive: false }).where(eq(adminSessions.id, sessionId));
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await db.update(adminSessions).set({ isActive: false }).where(eq(adminSessions.userId, userId));
  }

  async revokeAllSessionsExcept(userId: string): Promise<void> {
    await db.update(adminSessions).set({ isActive: false }).where(
      and(
        eq(adminSessions.isActive, true),
        sql`${adminSessions.userId} != ${userId}`
      )
    );
  }

  async getAllAuditLogs(options: { entityType?: string; limit?: number; offset?: number }): Promise<AuditLog[]> {
    const { entityType, limit = 100, offset = 0 } = options;
    
    if (entityType) {
      return db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityType, entityType))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
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
    // Publish: Update status to 'published', set is_active to true, record publishedAt timestamp
    const [updated] = await db
      .update(courses)
      .set({ 
        status: "published", 
        isActive: true, 
        publishedAt: new Date(), 
        updatedAt: new Date() 
      })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async unpublishCourse(id: number): Promise<Course | undefined> {
    // Unpublish: Set status to 'archived' (preserved for audit), deactivate
    const [updated] = await db
      .update(courses)
      .set({ 
        status: "archived", 
        isActive: false, 
        updatedAt: new Date() 
      })
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
      archivedCourses: allCourses.filter((c) => c.status === "archived").length,
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

  // Public API methods for Shishya integration
  // Shishya query rule (MANDATORY): status = 'published' AND is_active = true
  async getPublishedCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(and(
        eq(courses.status, "published"), 
        eq(courses.isActive, true),
        isNull(courses.deletedAt)
      ))
      .orderBy(desc(courses.publishedAt));
  }

  async getPublishedCourseById(id: number): Promise<any> {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(
        eq(courses.id, id), 
        eq(courses.status, "published"), 
        eq(courses.isActive, true),
        isNull(courses.deletedAt)
      ));
    
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

  // New getAllTests, getAllProjects, getAllPracticeLabs, link methods
  async getAllTests(): Promise<Test[]> {
    return db.select().from(tests).orderBy(desc(tests.createdAt));
  }

  async linkTestToCourse(testId: number, courseId: number): Promise<Test | undefined> {
    const [updated] = await db.update(tests).set({ courseId }).where(eq(tests.id, testId)).returning();
    return updated;
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async linkProjectToCourse(projectId: number, courseId: number): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set({ courseId }).where(eq(projects.id, projectId)).returning();
    return updated;
  }

  async getAllPracticeLabs(): Promise<PracticeLab[]> {
    return db.select().from(practiceLabs).orderBy(desc(practiceLabs.createdAt));
  }

  async linkLabToCourse(labId: number, courseId: number): Promise<PracticeLab | undefined> {
    const [updated] = await db.update(practiceLabs).set({ courseId }).where(eq(practiceLabs.id, labId)).returning();
    return updated;
  }

  async linkCertificateToCourse(certId: number, courseId: number): Promise<Certificate | undefined> {
    const [updated] = await db.update(certificates).set({ courseId }).where(eq(certificates.id, certId)).returning();
    return updated;
  }

  // Credit Packages
  async getCreditPackage(id: number) {
    const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, id));
    return pkg;
  }

  async getAllCreditPackages() {
    return db.select().from(creditPackages).orderBy(desc(creditPackages.createdAt));
  }

  async createCreditPackage(pkg: any) {
    const [created] = await db.insert(creditPackages).values(pkg).returning();
    return created;
  }

  async updateCreditPackage(id: number, pkg: any) {
    const [updated] = await db.update(creditPackages).set({ ...pkg, updatedAt: new Date() }).where(eq(creditPackages.id, id)).returning();
    return updated;
  }

  async deleteCreditPackage(id: number) {
    await db.delete(creditPackages).where(eq(creditPackages.id, id));
  }

  // Vouchers
  async getVoucher(id: number) {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, id));
    return voucher;
  }

  async getAllVouchers() {
    return db.select().from(vouchers).orderBy(desc(vouchers.createdAt));
  }

  async createVoucher(voucher: any) {
    const [created] = await db.insert(vouchers).values(voucher).returning();
    return created;
  }

  async updateVoucher(id: number, voucher: any) {
    const [updated] = await db.update(vouchers).set({ ...voucher, updatedAt: new Date() }).where(eq(vouchers.id, id)).returning();
    return updated;
  }

  async deleteVoucher(id: number) {
    await db.delete(vouchers).where(eq(vouchers.id, id));
  }

  // Gift Boxes
  async getGiftBox(id: number) {
    const [box] = await db.select().from(giftBoxes).where(eq(giftBoxes.id, id));
    return box;
  }

  async getAllGiftBoxes() {
    return db.select().from(giftBoxes).orderBy(desc(giftBoxes.createdAt));
  }

  async createGiftBox(giftBox: any) {
    const [created] = await db.insert(giftBoxes).values(giftBox).returning();
    return created;
  }

  async updateGiftBox(id: number, giftBox: any) {
    const [updated] = await db.update(giftBoxes).set({ ...giftBox, updatedAt: new Date() }).where(eq(giftBoxes.id, id)).returning();
    return updated;
  }

  async deleteGiftBox(id: number) {
    await db.delete(giftBoxes).where(eq(giftBoxes.id, id));
  }

  // Payment Gateways
  async getPaymentGateway(id: number) {
    const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, id));
    return gateway;
  }

  async getAllPaymentGateways() {
    return db.select().from(paymentGateways).orderBy(paymentGateways.priority);
  }

  async createPaymentGateway(gateway: any) {
    const [created] = await db.insert(paymentGateways).values(gateway).returning();
    return created;
  }

  async updatePaymentGateway(id: number, gateway: any) {
    const [updated] = await db.update(paymentGateways).set({ ...gateway, updatedAt: new Date() }).where(eq(paymentGateways.id, id)).returning();
    return updated;
  }

  async deletePaymentGateway(id: number) {
    await db.delete(paymentGateways).where(eq(paymentGateways.id, id));
  }

  // UPI Settings
  async getUpiSetting(id: number) {
    const [upi] = await db.select().from(upiSettings).where(eq(upiSettings.id, id));
    return upi;
  }

  async getAllUpiSettings() {
    return db.select().from(upiSettings).orderBy(desc(upiSettings.createdAt));
  }

  async createUpiSetting(upi: any) {
    const [created] = await db.insert(upiSettings).values(upi).returning();
    return created;
  }

  async updateUpiSetting(id: number, upi: any) {
    const [updated] = await db.update(upiSettings).set({ ...upi, updatedAt: new Date() }).where(eq(upiSettings.id, id)).returning();
    return updated;
  }

  async deleteUpiSetting(id: number) {
    await db.delete(upiSettings).where(eq(upiSettings.id, id));
  }

  // Bank Accounts
  async getBankAccount(id: number) {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async getAllBankAccounts() {
    return db.select().from(bankAccounts).orderBy(desc(bankAccounts.createdAt));
  }

  async createBankAccount(account: any) {
    const [created] = await db.insert(bankAccounts).values(account).returning();
    return created;
  }

  async updateBankAccount(id: number, account: any) {
    const [updated] = await db.update(bankAccounts).set({ ...account, updatedAt: new Date() }).where(eq(bankAccounts.id, id)).returning();
    return updated;
  }

  async deleteBankAccount(id: number) {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  // System Settings
  async getSystemSetting(key: string) {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings() {
    return db.select().from(systemSettings);
  }

  async upsertSystemSetting(key: string, value: string, description?: string) {
    const existing = await this.getSystemSetting(key);
    if (existing) {
      const [updated] = await db.update(systemSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(systemSettings)
        .values({ key, value, description })
        .returning();
      return created;
    }
  }

  // Course Rewards
  async getCourseReward(courseId: number): Promise<CourseReward | undefined> {
    const [reward] = await db.select().from(courseRewards).where(eq(courseRewards.courseId, courseId));
    return reward;
  }

  async getCourseRewardWithCards(courseId: number) {
    const [reward] = await db.select().from(courseRewards).where(eq(courseRewards.courseId, courseId));
    const achievements = await db.select().from(achievementCards)
      .where(eq(achievementCards.courseId, courseId))
      .orderBy(achievementCards.sortOrder);
    const motivationals = await db.select().from(motivationalCards)
      .where(eq(motivationalCards.courseId, courseId))
      .orderBy(motivationalCards.sortOrder);
    return { reward, achievementCards: achievements, motivationalCards: motivationals };
  }

  async createCourseReward(reward: InsertCourseReward): Promise<CourseReward> {
    const [created] = await db.insert(courseRewards).values(reward).returning();
    return created;
  }

  async updateCourseReward(courseId: number, reward: Partial<InsertCourseReward>): Promise<CourseReward | undefined> {
    const [updated] = await db.update(courseRewards)
      .set({ ...reward, updatedAt: new Date() })
      .where(eq(courseRewards.courseId, courseId))
      .returning();
    return updated;
  }

  async upsertCourseReward(courseId: number, reward: Partial<InsertCourseReward>): Promise<CourseReward> {
    const existing = await this.getCourseReward(courseId);
    if (existing) {
      return (await this.updateCourseReward(courseId, reward))!;
    } else {
      return await this.createCourseReward({ ...reward, courseId } as InsertCourseReward);
    }
  }

  // Achievement Cards
  async getAchievementCard(id: number): Promise<AchievementCard | undefined> {
    const [card] = await db.select().from(achievementCards).where(eq(achievementCards.id, id));
    return card;
  }

  async getAchievementCardsByCourse(courseId: number): Promise<AchievementCard[]> {
    return db.select().from(achievementCards)
      .where(eq(achievementCards.courseId, courseId))
      .orderBy(achievementCards.sortOrder);
  }

  async createAchievementCard(card: InsertAchievementCard): Promise<AchievementCard> {
    const [created] = await db.insert(achievementCards).values(card).returning();
    return created;
  }

  async updateAchievementCard(id: number, card: Partial<InsertAchievementCard>): Promise<AchievementCard | undefined> {
    const [updated] = await db.update(achievementCards)
      .set({ ...card, updatedAt: new Date() })
      .where(eq(achievementCards.id, id))
      .returning();
    return updated;
  }

  async deleteAchievementCard(id: number): Promise<void> {
    await db.delete(achievementCards).where(eq(achievementCards.id, id));
  }

  // Motivational Cards
  async getMotivationalCard(id: number): Promise<MotivationalCard | undefined> {
    const [card] = await db.select().from(motivationalCards).where(eq(motivationalCards.id, id));
    return card;
  }

  async getMotivationalCardsByCourse(courseId: number): Promise<MotivationalCard[]> {
    return db.select().from(motivationalCards)
      .where(eq(motivationalCards.courseId, courseId))
      .orderBy(motivationalCards.sortOrder);
  }

  async createMotivationalCard(card: InsertMotivationalCard): Promise<MotivationalCard> {
    const [created] = await db.insert(motivationalCards).values(card).returning();
    return created;
  }

  async updateMotivationalCard(id: number, card: Partial<InsertMotivationalCard>): Promise<MotivationalCard | undefined> {
    const [updated] = await db.update(motivationalCards)
      .set(card)
      .where(eq(motivationalCards.id, id))
      .returning();
    return updated;
  }

  async deleteMotivationalCard(id: number): Promise<void> {
    await db.delete(motivationalCards).where(eq(motivationalCards.id, id));
  }

}

export const storage = new DatabaseStorage();
