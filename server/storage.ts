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
  users,
  courses,
  modules,
  lessons,
  aiNotes,
  projects,
  projectSteps,
  tests,
  questions,
  certificates,
  skills,
  courseSkills,
  auditLogs,
  aiGenerationLogs,
  publishStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Courses
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithRelations(id: number): Promise<any>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  publishCourse(id: number): Promise<Course | undefined>;
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
  getProjectsByModule(moduleId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Project Steps
  getProjectSteps(projectId: number): Promise<ProjectStep[]>;
  createProjectStep(step: InsertProjectStep): Promise<ProjectStep>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestsByModule(moduleId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;

  // Questions
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

  async getProjectsByModule(moduleId: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.moduleId, moduleId))
      .orderBy(projects.orderIndex);
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
    await db.delete(projects).where(eq(projects.id, id));
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

  async getTestsByModule(moduleId: number): Promise<Test[]> {
    return db.select().from(tests).where(eq(tests.moduleId, moduleId));
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
}

export const storage = new DatabaseStorage();
