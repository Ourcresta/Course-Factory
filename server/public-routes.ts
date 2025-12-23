import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import crypto from "crypto";

async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: "API key required. Pass it in X-API-Key header." });
  }

  const keyRecord = await storage.getApiKeyByKey(apiKey);
  
  if (!keyRecord) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  if (!keyRecord.isActive) {
    return res.status(403).json({ error: "API key is inactive" });
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return res.status(403).json({ error: "API key has expired" });
  }

  await storage.updateApiKeyLastUsed(keyRecord.id);
  next();
}

export function registerPublicRoutes(app: Express) {
  app.get("/api/public/courses", validateApiKey, async (req, res) => {
    try {
      const publishedCourses = await storage.getPublishedCourses();
      
      const coursesForShishya = publishedCourses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        level: course.level,
        targetAudience: course.targetAudience,
        duration: course.duration,
        overview: course.overview,
        learningOutcomes: course.learningOutcomes,
        jobRoles: course.jobRoles,
        thumbnailUrl: course.thumbnailUrl,
        publishedAt: course.publishedAt,
        creditCost: course.creditCost,
        isFree: course.isFree,
        pricingUpdatedAt: course.pricingUpdatedAt,
      }));

      res.json({
        success: true,
        count: coursesForShishya.length,
        courses: coursesForShishya,
      });
    } catch (error) {
      console.error("Public API - Error fetching courses:", error);
      res.status(500).json({ success: false, error: "Failed to fetch courses" });
    }
  });

  app.get("/api/public/courses/:id", validateApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getPublishedCourseById(id);

      if (!course) {
        return res.status(404).json({ 
          success: false, 
          error: "Course not found or not published" 
        });
      }

      res.json({
        success: true,
        course,
      });
    } catch (error) {
      console.error("Public API - Error fetching course:", error);
      res.status(500).json({ success: false, error: "Failed to fetch course" });
    }
  });

  app.get("/api/public/courses/:id/tests", validateApiKey, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const tests = await storage.getPublishedCourseTests(courseId);

      if (tests.length === 0) {
        const course = await storage.getCourse(courseId);
        if (!course || course.status !== "published") {
          return res.status(404).json({ 
            success: false, 
            error: "Course not found or not published" 
          });
        }
      }

      const testsForShishya = tests.map(test => ({
        id: test.id,
        moduleId: test.moduleId,
        moduleName: test.moduleName,
        title: test.title,
        description: test.description,
        passingPercentage: test.passingPercentage,
        timeLimit: test.timeLimit,
        questionCount: test.questions.length,
        questions: test.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
        })),
      }));

      res.json({
        success: true,
        count: testsForShishya.length,
        tests: testsForShishya,
      });
    } catch (error) {
      console.error("Public API - Error fetching tests:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tests" });
    }
  });

  app.get("/api/public/courses/:id/projects", validateApiKey, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const projects = await storage.getPublishedCourseProjects(courseId);

      if (projects.length === 0) {
        const course = await storage.getCourse(courseId);
        if (!course || course.status !== "published") {
          return res.status(404).json({ 
            success: false, 
            error: "Course not found or not published" 
          });
        }
      }

      const projectsForShishya = projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        objectives: project.objectives,
        deliverables: project.deliverables,
        submissionInstructions: project.submissionInstructions,
        evaluationNotes: project.evaluationNotes,
        problemStatement: project.problemStatement,
        techStack: project.techStack,
        folderStructure: project.folderStructure,
        evaluationChecklist: project.evaluationChecklist,
        difficulty: project.difficulty,
        skills: project.skills.map((s: any) => ({ id: s.id, name: s.name })),
        steps: project.steps,
      }));

      res.json({
        success: true,
        count: projectsForShishya.length,
        projects: projectsForShishya,
      });
    } catch (error) {
      console.error("Public API - Error fetching projects:", error);
      res.status(500).json({ success: false, error: "Failed to fetch projects" });
    }
  });

  app.get("/api/public/courses/:id/labs", validateApiKey, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const labs = await storage.getPublishedCourseLabs(courseId);

      if (labs.length === 0) {
        const course = await storage.getCourse(courseId);
        if (!course || course.status !== "published") {
          return res.status(404).json({ 
            success: false, 
            error: "Course not found or not published" 
          });
        }
      }

      const labsForShishya = labs.map(lab => ({
        id: lab.id,
        slug: lab.slug,
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        language: lab.language,
        estimatedTime: lab.estimatedTime,
        instructions: lab.instructions,
        starterCode: lab.starterCode,
        expectedOutput: lab.expectedOutput,
        validationType: lab.validationType,
        unlockType: lab.unlockType,
        unlockRefId: lab.unlockRefId,
        hints: lab.hints,
        aiPromptContext: lab.aiPromptContext,
        contributesToCertificate: lab.contributesToCertificate,
        certificateWeight: lab.certificateWeight,
        moduleId: lab.moduleId,
        lessonId: lab.lessonId,
        orderIndex: lab.orderIndex,
      }));

      res.json({
        success: true,
        count: labsForShishya.length,
        labs: labsForShishya,
      });
    } catch (error) {
      console.error("Public API - Error fetching labs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch labs" });
    }
  });

  app.get("/api/public/courses/:id/certificate", validateApiKey, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const certificate = await storage.getPublishedCourseCertificate(courseId);

      if (!certificate) {
        const course = await storage.getCourse(courseId);
        if (!course || course.status !== "published") {
          return res.status(404).json({ 
            success: false, 
            error: "Course not found or not published" 
          });
        }
        return res.json({
          success: true,
          certificate: null,
          message: "No certificate configured for this course",
        });
      }

      res.json({
        success: true,
        certificate: {
          id: certificate.id,
          name: certificate.name,
          type: certificate.type,
          skillTags: certificate.skillTags,
          level: certificate.level,
          requiresTestPass: certificate.requiresTestPass,
          passingPercentage: certificate.passingPercentage,
          requiresProjectCompletion: certificate.requiresProjectCompletion,
          requiresLabCompletion: certificate.requiresLabCompletion,
          qrVerification: certificate.qrVerification,
        },
      });
    } catch (error) {
      console.error("Public API - Error fetching certificate:", error);
      res.status(500).json({ success: false, error: "Failed to fetch certificate" });
    }
  });

  app.get("/api/api-keys", async (req, res) => {
    try {
      const keys = await storage.getAllApiKeys();
      const safeKeys = keys.map(k => ({
        id: k.id,
        name: k.name,
        description: k.description,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        keyPreview: k.key.substring(0, 8) + "..." + k.key.substring(k.key.length - 4),
      }));
      res.json(safeKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", async (req, res) => {
    try {
      const { name, description, expiresAt } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const key = `ais_${crypto.randomBytes(32).toString("hex")}`;
      
      const apiKey = await storage.createApiKey({
        name,
        key,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        description: apiKey.description,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        message: "API key created. Save this key securely - it won't be shown again.",
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.patch("/api/api-keys/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, isActive, expiresAt } = req.body;

      const updated = await storage.updateApiKey(id, {
        name,
        description,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      if (!updated) {
        return res.status(404).json({ error: "API key not found" });
      }

      res.json({
        id: updated.id,
        name: updated.name,
        description: updated.description,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        expiresAt: updated.expiresAt,
        keyPreview: updated.key.substring(0, 8) + "..." + updated.key.substring(updated.key.length - 4),
      });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });
}
