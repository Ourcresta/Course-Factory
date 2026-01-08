import type { Express } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import { 
  draftCourses, draftModules, draftLessons, draftTests, draftQuestions,
  draftProjects, draftPracticeLabs, draftCertificates,
  insertDraftCourseSchema, insertDraftModuleSchema, insertDraftLessonSchema,
  insertDraftTestSchema, insertDraftQuestionSchema, insertDraftProjectSchema,
  insertDraftPracticeLabSchema, insertDraftCertificateSchema
} from "@shared/draft-schema";
import { eq, asc, sql } from "drizzle-orm";
import { publishService } from "./services/publish-service";
import { storage } from "./storage";

function handleValidationError(error: unknown, res: any) {
  if (error instanceof z.ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({ 
      error: "Validation failed", 
      details: validationError.message 
    });
  }
  throw error;
}

export function registerDraftRoutes(app: Express) {
  // ==================== DRAFT COURSES ====================
  
  app.get("/api/draft-courses", async (req, res) => {
    try {
      const allDraftCourses = await db
        .select()
        .from(draftCourses)
        .orderBy(asc(draftCourses.createdAt));
      res.json(allDraftCourses);
    } catch (error) {
      console.error("Error fetching draft courses:", error);
      res.status(500).json({ error: "Failed to fetch draft courses" });
    }
  });

  app.get("/api/draft-courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [draftCourse] = await db
        .select()
        .from(draftCourses)
        .where(eq(draftCourses.id, id))
        .limit(1);

      if (!draftCourse) {
        return res.status(404).json({ error: "Draft course not found" });
      }

      const modules = await db
        .select()
        .from(draftModules)
        .where(eq(draftModules.draftCourseId, id))
        .orderBy(asc(draftModules.orderIndex));

      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await db
            .select()
            .from(draftLessons)
            .where(eq(draftLessons.draftModuleId, mod.id))
            .orderBy(asc(draftLessons.orderIndex));
          return { ...mod, lessons };
        })
      );

      const tests = await db
        .select()
        .from(draftTests)
        .where(eq(draftTests.draftCourseId, id));

      const projects = await db
        .select()
        .from(draftProjects)
        .where(eq(draftProjects.draftCourseId, id));

      const labs = await db
        .select()
        .from(draftPracticeLabs)
        .where(eq(draftPracticeLabs.draftCourseId, id));

      const certificates = await db
        .select()
        .from(draftCertificates)
        .where(eq(draftCertificates.draftCourseId, id));

      res.json({
        ...draftCourse,
        modules: modulesWithLessons,
        tests,
        projects,
        practiceLabs: labs,
        certificates,
      });
    } catch (error) {
      console.error("Error fetching draft course:", error);
      res.status(500).json({ error: "Failed to fetch draft course" });
    }
  });

  app.post("/api/draft-courses", async (req, res) => {
    try {
      const validatedData = insertDraftCourseSchema.parse(req.body);
      
      const [newCourse] = await db
        .insert(draftCourses)
        .values(validatedData)
        .returning();

      await storage.createAuditLog({
        action: "create",
        entityType: "draft_course",
        entityId: newCourse.id,
      });

      res.status(201).json(newCourse);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft course:", error);
      res.status(500).json({ error: "Failed to create draft course" });
    }
  });

  app.put("/api/draft-courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [existing] = await db
        .select()
        .from(draftCourses)
        .where(eq(draftCourses.id, id))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Draft course not found" });
      }

      if (existing.status === "published") {
        return res.status(403).json({ error: "Cannot edit a published course. Unpublish first." });
      }

      const [updated] = await db
        .update(draftCourses)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftCourses.id, id))
        .returning();

      await storage.createAuditLog({
        action: "update",
        entityType: "draft_course",
        entityId: id,
        oldValue: existing,
        newValue: updated,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft course:", error);
      res.status(500).json({ error: "Failed to update draft course" });
    }
  });

  app.delete("/api/draft-courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.delete(draftCourses).where(eq(draftCourses.id, id));

      await storage.createAuditLog({
        action: "delete",
        entityType: "draft_course",
        entityId: id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft course:", error);
      res.status(500).json({ error: "Failed to delete draft course" });
    }
  });

  // ==================== PUBLISH / UNPUBLISH ====================

  app.post("/api/draft-courses/:id/publish", async (req, res) => {
    try {
      const draftCourseId = parseInt(req.params.id);
      
      const result = await publishService.publishDraftCourse(draftCourseId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      await storage.createAuditLog({
        action: "publish",
        entityType: "draft_course",
        entityId: draftCourseId,
      });

      res.json({ 
        success: true, 
        message: "Course published successfully",
        liveCourseId: result.liveCourseId,
      });
    } catch (error) {
      console.error("Error publishing draft course:", error);
      res.status(500).json({ error: "Failed to publish course" });
    }
  });

  app.post("/api/draft-courses/:id/unpublish", async (req, res) => {
    try {
      const draftCourseId = parseInt(req.params.id);
      
      const [draftCourse] = await db
        .select()
        .from(draftCourses)
        .where(eq(draftCourses.id, draftCourseId))
        .limit(1);

      if (!draftCourse) {
        return res.status(404).json({ error: "Draft course not found" });
      }

      if (!draftCourse.liveCourseId) {
        return res.status(400).json({ error: "This course has not been published yet" });
      }

      const result = await publishService.unpublishLiveCourse(draftCourse.liveCourseId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      await storage.createAuditLog({
        action: "unpublish",
        entityType: "draft_course",
        entityId: draftCourseId,
      });

      res.json({ 
        success: true, 
        message: "Course unpublished successfully",
      });
    } catch (error) {
      console.error("Error unpublishing course:", error);
      res.status(500).json({ error: "Failed to unpublish course" });
    }
  });

  // ==================== DRAFT MODULES ====================

  app.get("/api/draft-courses/:courseId/modules", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const modules = await db
        .select()
        .from(draftModules)
        .where(eq(draftModules.draftCourseId, courseId))
        .orderBy(asc(draftModules.orderIndex));
      res.json(modules);
    } catch (error) {
      console.error("Error fetching draft modules:", error);
      res.status(500).json({ error: "Failed to fetch draft modules" });
    }
  });

  app.post("/api/draft-courses/:courseId/modules", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const validatedData = insertDraftModuleSchema.parse({
        ...req.body,
        draftCourseId: courseId,
      });

      const [newModule] = await db
        .insert(draftModules)
        .values(validatedData)
        .returning();

      res.status(201).json(newModule);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft module:", error);
      res.status(500).json({ error: "Failed to create draft module" });
    }
  });

  app.put("/api/draft-modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftModules)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftModules.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft module not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft module:", error);
      res.status(500).json({ error: "Failed to update draft module" });
    }
  });

  app.delete("/api/draft-modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftModules).where(eq(draftModules.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft module:", error);
      res.status(500).json({ error: "Failed to delete draft module" });
    }
  });

  // ==================== DRAFT LESSONS ====================

  app.get("/api/draft-modules/:moduleId/lessons", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await db
        .select()
        .from(draftLessons)
        .where(eq(draftLessons.draftModuleId, moduleId))
        .orderBy(asc(draftLessons.orderIndex));
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching draft lessons:", error);
      res.status(500).json({ error: "Failed to fetch draft lessons" });
    }
  });

  app.post("/api/draft-modules/:moduleId/lessons", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const validatedData = insertDraftLessonSchema.parse({
        ...req.body,
        draftModuleId: moduleId,
      });

      const [newLesson] = await db
        .insert(draftLessons)
        .values(validatedData)
        .returning();

      res.status(201).json(newLesson);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft lesson:", error);
      res.status(500).json({ error: "Failed to create draft lesson" });
    }
  });

  app.put("/api/draft-lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftLessons)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftLessons.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft lesson not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft lesson:", error);
      res.status(500).json({ error: "Failed to update draft lesson" });
    }
  });

  app.delete("/api/draft-lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftLessons).where(eq(draftLessons.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft lesson:", error);
      res.status(500).json({ error: "Failed to delete draft lesson" });
    }
  });

  // ==================== DRAFT TESTS ====================

  app.get("/api/draft-courses/:courseId/tests", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const tests = await db
        .select()
        .from(draftTests)
        .where(eq(draftTests.draftCourseId, courseId));
      res.json(tests);
    } catch (error) {
      console.error("Error fetching draft tests:", error);
      res.status(500).json({ error: "Failed to fetch draft tests" });
    }
  });

  app.post("/api/draft-courses/:courseId/tests", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const validatedData = insertDraftTestSchema.parse({
        ...req.body,
        draftCourseId: courseId,
      });

      const [newTest] = await db
        .insert(draftTests)
        .values(validatedData)
        .returning();

      res.status(201).json(newTest);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft test:", error);
      res.status(500).json({ error: "Failed to create draft test" });
    }
  });

  app.put("/api/draft-tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftTests)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftTests.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft test not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft test:", error);
      res.status(500).json({ error: "Failed to update draft test" });
    }
  });

  app.delete("/api/draft-tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftTests).where(eq(draftTests.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft test:", error);
      res.status(500).json({ error: "Failed to delete draft test" });
    }
  });

  // ==================== DRAFT QUESTIONS ====================

  app.get("/api/draft-tests/:testId/questions", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questions = await db
        .select()
        .from(draftQuestions)
        .where(eq(draftQuestions.draftTestId, testId))
        .orderBy(asc(draftQuestions.orderIndex));
      res.json(questions);
    } catch (error) {
      console.error("Error fetching draft questions:", error);
      res.status(500).json({ error: "Failed to fetch draft questions" });
    }
  });

  app.post("/api/draft-tests/:testId/questions", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const validatedData = insertDraftQuestionSchema.parse({
        ...req.body,
        draftTestId: testId,
      });

      const [newQuestion] = await db
        .insert(draftQuestions)
        .values(validatedData)
        .returning();

      res.status(201).json(newQuestion);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft question:", error);
      res.status(500).json({ error: "Failed to create draft question" });
    }
  });

  app.put("/api/draft-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftQuestions)
        .set(req.body)
        .where(eq(draftQuestions.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft question not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft question:", error);
      res.status(500).json({ error: "Failed to update draft question" });
    }
  });

  app.delete("/api/draft-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftQuestions).where(eq(draftQuestions.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft question:", error);
      res.status(500).json({ error: "Failed to delete draft question" });
    }
  });

  // ==================== DRAFT PROJECTS ====================

  app.get("/api/draft-courses/:courseId/projects", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const projects = await db
        .select()
        .from(draftProjects)
        .where(eq(draftProjects.draftCourseId, courseId))
        .orderBy(asc(draftProjects.orderIndex));
      res.json(projects);
    } catch (error) {
      console.error("Error fetching draft projects:", error);
      res.status(500).json({ error: "Failed to fetch draft projects" });
    }
  });

  app.post("/api/draft-courses/:courseId/projects", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const validatedData = insertDraftProjectSchema.parse({
        ...req.body,
        draftCourseId: courseId,
      });

      const [newProject] = await db
        .insert(draftProjects)
        .values(validatedData)
        .returning();

      res.status(201).json(newProject);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft project:", error);
      res.status(500).json({ error: "Failed to create draft project" });
    }
  });

  app.put("/api/draft-projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftProjects)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftProjects.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft project not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft project:", error);
      res.status(500).json({ error: "Failed to update draft project" });
    }
  });

  app.delete("/api/draft-projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftProjects).where(eq(draftProjects.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft project:", error);
      res.status(500).json({ error: "Failed to delete draft project" });
    }
  });

  // ==================== DRAFT PRACTICE LABS ====================

  app.get("/api/draft-courses/:courseId/labs", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const labs = await db
        .select()
        .from(draftPracticeLabs)
        .where(eq(draftPracticeLabs.draftCourseId, courseId))
        .orderBy(asc(draftPracticeLabs.orderIndex));
      res.json(labs);
    } catch (error) {
      console.error("Error fetching draft labs:", error);
      res.status(500).json({ error: "Failed to fetch draft labs" });
    }
  });

  app.post("/api/draft-courses/:courseId/labs", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const validatedData = insertDraftPracticeLabSchema.parse({
        ...req.body,
        draftCourseId: courseId,
      });

      const [newLab] = await db
        .insert(draftPracticeLabs)
        .values(validatedData)
        .returning();

      res.status(201).json(newLab);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft lab:", error);
      res.status(500).json({ error: "Failed to create draft lab" });
    }
  });

  app.put("/api/draft-labs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftPracticeLabs)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftPracticeLabs.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft lab not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft lab:", error);
      res.status(500).json({ error: "Failed to update draft lab" });
    }
  });

  app.delete("/api/draft-labs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftPracticeLabs).where(eq(draftPracticeLabs.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft lab:", error);
      res.status(500).json({ error: "Failed to delete draft lab" });
    }
  });

  // ==================== DRAFT CERTIFICATES ====================

  app.get("/api/draft-courses/:courseId/certificates", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const certs = await db
        .select()
        .from(draftCertificates)
        .where(eq(draftCertificates.draftCourseId, courseId));
      res.json(certs);
    } catch (error) {
      console.error("Error fetching draft certificates:", error);
      res.status(500).json({ error: "Failed to fetch draft certificates" });
    }
  });

  app.post("/api/draft-courses/:courseId/certificates", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const validatedData = insertDraftCertificateSchema.parse({
        ...req.body,
        draftCourseId: courseId,
      });

      const [newCert] = await db
        .insert(draftCertificates)
        .values(validatedData)
        .returning();

      res.status(201).json(newCert);
    } catch (error) {
      handleValidationError(error, res);
      console.error("Error creating draft certificate:", error);
      res.status(500).json({ error: "Failed to create draft certificate" });
    }
  });

  app.put("/api/draft-certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [updated] = await db
        .update(draftCertificates)
        .set({
          ...req.body,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftCertificates.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Draft certificate not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating draft certificate:", error);
      res.status(500).json({ error: "Failed to update draft certificate" });
    }
  });

  app.delete("/api/draft-certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(draftCertificates).where(eq(draftCertificates.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting draft certificate:", error);
      res.status(500).json({ error: "Failed to delete draft certificate" });
    }
  });
}
