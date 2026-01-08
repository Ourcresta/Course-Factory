import type { Express } from "express";
import { storage } from "./storage";

export function registerPublicRoutes(app: Express) {
  app.get("/api/public/courses", async (req, res) => {
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

  app.get("/api/public/courses/:id", async (req, res) => {
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

  app.get("/api/public/courses/:id/tests", async (req, res) => {
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

  app.get("/api/public/courses/:id/projects", async (req, res) => {
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

  app.get("/api/public/courses/:id/labs", async (req, res) => {
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

  app.get("/api/public/courses/:id/certificate", async (req, res) => {
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
}
