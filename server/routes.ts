import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { insertCourseSchema, insertModuleSchema, insertLessonSchema, insertSkillSchema, insertCertificateSchema, insertTestSchema, insertQuestionSchema, insertProjectSchema, insertPracticeLabSchema } from "@shared/schema";
import {
  generateCourseFromCommand,
  generateModulesForCourse,
  generateProjectForModule,
  generateTestForModule,
  generateNotesForLesson,
  generateCourseSuggestions,
} from "./ai-service";
import { registerPublicRoutes } from "./public-routes";
import { registerAuthRoutes } from "./auth-routes";
import { apiRateLimiter } from "./auth-middleware";

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

// Helper to check if a course is published and block modifications
async function checkCourseNotPublished(courseId: number): Promise<{ blocked: boolean; message: string }> {
  const course = await storage.getCourse(courseId);
  if (!course) {
    return { blocked: true, message: "Course not found" };
  }
  if (course.status === "published") {
    return { blocked: true, message: "This course is published and locked. Unpublish first to make changes." };
  }
  return { blocked: false, message: "" };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register authentication routes first
  registerAuthRoutes(app);
  
  // Apply rate limiting to API routes
  app.use('/api', apiRateLimiter);
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // AI Course Suggestions - must be before :id route
  app.get("/api/courses/suggestions", async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 5;
      const suggestions = await generateCourseSuggestions(count);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating course suggestions:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourseWithRelations(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      
      await storage.createAuditLog({
        action: "create",
        entityType: "course",
        entityId: course.id,
        newValue: course,
      });
      
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.post("/api/courses/generate", async (req, res) => {
    try {
      const { command, level = "beginner", includeProjects = true, includeTests = true, includeLabs = true, certificateType = "completion" } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      // Create course in generating state
      const course = await storage.createCourse({
        name: "Generating...",
        status: "generating",
        aiCommand: command,
        level,
        includeProjects,
        includeTests,
        includeLabs,
        certificateType,
      });

      // Generate course content with AI (async)
      (async () => {
        console.log(`[AI] Starting course generation for course ${course.id}: "${command}"`);
        try {
          const mode = req.body.mode || "publish";
          console.log(`[AI] Calling OpenAI API for course ${course.id}...`);
          const generated = await generateCourseFromCommand(command, {
            level,
            includeProjects,
            includeTests,
            includeLabs,
            certificateType,
            mode,
          });

          // Update course with generated content
          await storage.updateCourse(course.id, {
            name: generated.name,
            description: generated.description,
            overview: generated.overview,
            level: generated.level || level,
            targetAudience: generated.targetAudience,
            duration: generated.duration,
            learningOutcomes: generated.learningOutcomes,
            jobRoles: generated.jobRoles,
            status: "draft",
          });

          // Track created modules and lessons for linking labs
          const createdModules: { id: number; index: number; lessons: { id: number; index: number }[] }[] = [];

          // Create modules and lessons
          for (let i = 0; i < generated.modules.length; i++) {
            const moduleData = generated.modules[i];
            const module = await storage.createModule({
              courseId: course.id,
              title: moduleData.title,
              description: moduleData.description,
              estimatedTime: moduleData.estimatedTime,
              orderIndex: i,
            });

            const createdLessons: { id: number; index: number }[] = [];

            // Create lessons for this module
            for (let j = 0; j < moduleData.lessons.length; j++) {
              const lessonData = moduleData.lessons[j];
              const lesson = await storage.createLesson({
                moduleId: module.id,
                title: lessonData.title,
                objectives: lessonData.objectives,
                estimatedTime: lessonData.estimatedTime,
                keyConceptS: lessonData.keyConceptS,
                orderIndex: j,
              });
              createdLessons.push({ id: lesson.id, index: j });
            }

            createdModules.push({ id: module.id, index: i, lessons: createdLessons });
          }

          // Create practice labs if generated
          if (generated.labs && generated.labs.length > 0) {
            for (let i = 0; i < generated.labs.length; i++) {
              const labData = generated.labs[i];
              const targetModule = createdModules.find(m => m.index === labData.moduleIndex);
              const targetLesson = targetModule?.lessons.find(l => l.index === labData.lessonIndex);

              // Parse estimatedTime to number (e.g., "15 minutes" -> 15)
              const timeMatch = labData.estimatedTime?.match(/(\d+)/);
              const estimatedMinutes = timeMatch ? parseInt(timeMatch[1]) : 15;

              // Generate slug from title
              const labSlug = labData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

              await storage.createPracticeLab({
                courseId: course.id,
                moduleId: targetModule?.id || null,
                lessonId: targetLesson?.id || null,
                slug: `${labSlug}-${Date.now()}-${i}`,
                title: labData.title,
                instructions: labData.problemStatement,
                language: labData.language || "javascript",
                starterCode: labData.starterCode,
                expectedOutput: labData.expectedOutput,
                validationType: labData.validationType || "output",
                hints: labData.hints || [],
                estimatedTime: estimatedMinutes,
                difficulty: labData.difficulty || "beginner",
                unlockType: "always",
                orderIndex: i,
              });
            }
          }

          // Create projects if generated
          if (generated.projects && generated.projects.length > 0) {
            for (let i = 0; i < generated.projects.length; i++) {
              const projectData = generated.projects[i];
              const targetModule = createdModules.find(m => m.index === projectData.moduleIndex);

              await storage.createProject({
                courseId: course.id,
                moduleId: targetModule?.id || null,
                title: projectData.title,
                problemStatement: projectData.problemStatement,
                techStack: projectData.techStack || [],
                difficulty: projectData.difficulty || "intermediate",
                evaluationChecklist: projectData.deliverables || [],
                orderIndex: i,
              });
            }
          }

          // Create tests if generated
          if (generated.tests && generated.tests.length > 0) {
            for (const testData of generated.tests) {
              const targetModule = createdModules.find(m => m.index === testData.moduleIndex);

              const createdTest = await storage.createTest({
                moduleId: targetModule?.id || createdModules[0]?.id,
                title: testData.title,
                description: testData.description,
                passingPercentage: testData.passingPercentage || 70,
              });

              // Create questions for the test
              if (testData.questions && testData.questions.length > 0) {
                for (let q = 0; q < testData.questions.length; q++) {
                  const questionData = testData.questions[q];
                  await storage.createQuestion({
                    testId: createdTest.id,
                    type: questionData.type || "mcq",
                    difficulty: questionData.difficulty || "medium",
                    questionText: questionData.questionText,
                    options: questionData.options || [],
                    correctAnswer: questionData.correctAnswer,
                    explanation: questionData.explanation,
                    orderIndex: q,
                  });
                }
              }
            }
          }

          // Create certificate with eligibility rules
          if (generated.certificateRules) {
            await storage.createCertificate({
              courseId: course.id,
              name: `${generated.name} Certificate`,
              type: certificateType,
              level: level,
              requiresTestPass: generated.certificateRules.testPassRequired ?? includeTests,
              passingPercentage: generated.certificateRules.minScore ?? 70,
              requiresProjectCompletion: generated.certificateRules.projectSubmissionRequired ?? includeProjects,
              requiresLabCompletion: (generated.certificateRules.minLabsCompleted ?? 0) > 0,
              skillTags: generated.skills || [],
            });
          }

          await storage.createAuditLog({
            action: "ai_generate",
            entityType: "course",
            entityId: course.id,
            metadata: { 
              command, 
              modules: generated.modules.length,
              labs: generated.labs?.length || 0,
              projects: generated.projects?.length || 0,
              tests: generated.tests?.length || 0,
              certificate: !!generated.certificateRules,
            },
          });
          console.log(`[AI] Course ${course.id} generation completed successfully`);
        } catch (error: any) {
          console.error(`[AI] Course ${course.id} generation failed:`, error?.message || error);
          console.error("[AI] Full error details:", JSON.stringify(error, null, 2));
          await storage.updateCourse(course.id, {
            name: "Generation Failed",
            status: "error",
            description: error?.message || "Unknown error occurred during AI generation",
          });
        }
      })();

      res.status(201).json({ id: course.id });
    } catch (error) {
      console.error("Error generating course:", error);
      res.status(500).json({ error: "Failed to generate course" });
    }
  });

  // Reset stuck "generating" courses to "error" status (for recovery)
  app.post("/api/courses/reset-stuck", async (_req, res) => {
    try {
      const allCourses = await storage.getAllCourses();
      const stuckCourses = allCourses.filter(c => c.status === "generating");
      
      for (const course of stuckCourses) {
        await storage.updateCourse(course.id, {
          name: course.aiCommand ? `Failed: ${course.aiCommand.substring(0, 50)}` : "Generation Failed",
          status: "error",
          description: "Generation was interrupted. Please delete and try again.",
        });
        console.log(`[AI] Reset stuck course ${course.id} to error status`);
      }
      
      res.json({ 
        message: `Reset ${stuckCourses.length} stuck course(s)`,
        courseIds: stuckCourses.map(c => c.id)
      });
    } catch (error) {
      console.error("Error resetting stuck courses:", error);
      res.status(500).json({ error: "Failed to reset stuck courses" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const oldCourse = await storage.getCourse(id);
      
      if (!oldCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Guard: Prevent editing published courses
      if (oldCourse.status === "published") {
        return res.status(403).json({ error: "This course is published and locked. Unpublish first to make changes." });
      }

      const course = await storage.updateCourse(id, req.body);

      await storage.createAuditLog({
        action: "update",
        entityType: "course",
        entityId: id,
        oldValue: oldCourse,
        newValue: course,
      });

      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(400).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourse(id);
      
      await storage.createAuditLog({
        action: "delete",
        entityType: "course",
        entityId: id,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.post("/api/courses/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourseWithRelations(id);
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Validation: Check if course is already published
      if (course.status === "published") {
        return res.status(400).json({ error: "Course is already published" });
      }

      // Validation: Check if course is generating
      if (course.status === "generating") {
        return res.status(400).json({ error: "Cannot publish a course while AI is generating content" });
      }

      // Validation: Check for at least 1 module
      if (!course.modules || course.modules.length === 0) {
        return res.status(400).json({ error: "Course must have at least 1 module before publishing" });
      }

      // Validation: Check each module has at least 1 lesson
      for (const module of course.modules) {
        if (!module.lessons || module.lessons.length === 0) {
          return res.status(400).json({ 
            error: `Module "${module.title}" must have at least 1 lesson before publishing` 
          });
        }
      }

      const publishedCourse = await storage.publishCourse(id);

      await storage.createAuditLog({
        action: "publish",
        entityType: "course",
        entityId: id,
      });

      res.json(publishedCourse);
    } catch (error) {
      console.error("Error publishing course:", error);
      res.status(500).json({ error: "Failed to publish course" });
    }
  });

  // Unpublish course (move back to draft)
  app.post("/api/courses/:id/unpublish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (course.status !== "published") {
        return res.status(400).json({ error: "Only published courses can be unpublished" });
      }

      const updatedCourse = await storage.unpublishCourse(id);

      await storage.createAuditLog({
        action: "unpublish",
        entityType: "course",
        entityId: id,
      });

      res.json(updatedCourse);
    } catch (error) {
      console.error("Error unpublishing course:", error);
      res.status(500).json({ error: "Failed to unpublish course" });
    }
  });

  // Course Pricing - GET
  app.get("/api/courses/:id/pricing", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      res.json({
        courseId: course.id,
        courseName: course.name,
        creditCost: course.creditCost ?? 0,
        isFree: course.isFree ?? true,
        originalCreditCost: course.originalCreditCost,
        pricingUpdatedAt: course.pricingUpdatedAt,
        status: course.status,
      });
    } catch (error) {
      console.error("Error fetching course pricing:", error);
      res.status(500).json({ error: "Failed to fetch course pricing" });
    }
  });

  // Course Pricing - UPDATE
  app.put("/api/courses/:id/pricing", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Validate input
      const pricingSchema = z.object({
        creditCost: z.number().min(0).max(100000),
        isFree: z.boolean(),
      });

      const validated = pricingSchema.parse(req.body);

      // If setting to free, store original cost for potential restore
      const originalCreditCost = validated.isFree && !course.isFree 
        ? course.creditCost 
        : (course.originalCreditCost ?? course.creditCost);

      // If free, force creditCost to 0
      const finalCreditCost = validated.isFree ? 0 : validated.creditCost;

      const updatedCourse = await storage.updateCoursePricing(id, {
        creditCost: finalCreditCost,
        isFree: validated.isFree,
        originalCreditCost,
        pricingUpdatedAt: new Date(),
      });

      if (!updatedCourse) {
        return res.status(500).json({ error: "Failed to update course pricing" });
      }

      // Log the pricing change
      await storage.createAuditLog({
        action: "update_pricing",
        entityType: "course",
        entityId: id,
        oldValue: {
          creditCost: course.creditCost,
          isFree: course.isFree,
        },
        newValue: {
          creditCost: finalCreditCost,
          isFree: validated.isFree,
        },
      });

      res.json({
        courseId: updatedCourse.id,
        courseName: updatedCourse.name,
        creditCost: updatedCourse.creditCost,
        isFree: updatedCourse.isFree,
        originalCreditCost: updatedCourse.originalCreditCost,
        pricingUpdatedAt: updatedCourse.pricingUpdatedAt,
        status: updatedCourse.status,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error updating course pricing:", error);
      res.status(500).json({ error: "Failed to update course pricing" });
    }
  });

  app.post("/api/courses/:id/generate/:type", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const type = req.params.type;
      
      const course = await storage.getCourseWithRelations(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Start async generation based on type
      (async () => {
        try {
          if (type === "modules") {
            const modules = await generateModulesForCourse(course.name, course.description || "", course.level);
            for (let i = 0; i < modules.length; i++) {
              const moduleData = modules[i];
              const module = await storage.createModule({
                courseId: id,
                title: moduleData.title,
                description: moduleData.description,
                estimatedTime: moduleData.estimatedTime,
                orderIndex: i,
              });

              for (let j = 0; j < moduleData.lessons.length; j++) {
                const lessonData = moduleData.lessons[j];
                await storage.createLesson({
                  moduleId: module.id,
                  title: lessonData.title,
                  objectives: lessonData.objectives,
                  estimatedTime: lessonData.estimatedTime,
                  keyConceptS: lessonData.keyConceptS,
                  orderIndex: j,
                });
              }
            }
          } else if (type === "projects" && course.modules) {
            for (const module of course.modules) {
              const project = await generateProjectForModule(module.title, course.name);
              const createdProject = await storage.createProject({
                courseId: id,
                moduleId: module.id,
                title: project.title,
                problemStatement: project.problemStatement,
                techStack: project.techStack,
                folderStructure: project.folderStructure,
                evaluationChecklist: project.evaluationChecklist,
                difficulty: project.difficulty,
                orderIndex: 0,
              });

              for (const step of project.steps) {
                await storage.createProjectStep({
                  projectId: createdProject.id,
                  stepNumber: step.stepNumber,
                  title: step.title,
                  description: step.description,
                  codeSnippet: step.codeSnippet,
                  tips: step.tips,
                });
              }
            }
          } else if (type === "tests" && course.modules) {
            for (const module of course.modules) {
              const lessonTitles = module.lessons?.map((l: any) => l.title) || [];
              const test = await generateTestForModule(module.title, lessonTitles);
              const createdTest = await storage.createTest({
                moduleId: module.id,
                title: test.title,
                description: test.description,
                passingPercentage: test.passingPercentage,
              });

              for (let i = 0; i < test.questions.length; i++) {
                const q = test.questions[i];
                await storage.createQuestion({
                  testId: createdTest.id,
                  type: q.type,
                  difficulty: q.difficulty,
                  questionText: q.questionText,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  orderIndex: i,
                });
              }
            }
          } else if (type === "notes" && course.modules) {
            for (const module of course.modules) {
              for (const lesson of module.lessons || []) {
                const notes = await generateNotesForLesson(
                  lesson.title,
                  lesson.objectives || [],
                  lesson.keyConceptS || []
                );
                await storage.createAiNote({
                  lessonId: lesson.id,
                  content: notes.content,
                  simplifiedExplanation: notes.simplifiedExplanation,
                  bulletNotes: notes.bulletNotes,
                  keyTakeaways: notes.keyTakeaways,
                  interviewQuestions: notes.interviewQuestions,
                  version: 1,
                });
              }
            }
          }

          await storage.createAuditLog({
            action: `ai_generate_${type}`,
            entityType: "course",
            entityId: id,
          });
        } catch (error) {
          console.error(`Error generating ${type}:`, error);
        }
      })();

      res.json({ message: `Started generating ${type}` });
    } catch (error) {
      console.error("Error starting generation:", error);
      res.status(500).json({ error: "Failed to start generation" });
    }
  });

  // Modules
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const module = await storage.getModule(id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.post("/api/modules", async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      
      // Guard: Check if course is published
      const guard = await checkCourseNotPublished(validatedData.courseId);
      if (guard.blocked) {
        return res.status(403).json({ error: guard.message });
      }
      
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingModule = await storage.getModule(id);
      if (!existingModule) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      // Guard: Check if course is published
      const guard = await checkCourseNotPublished(existingModule.courseId);
      if (guard.blocked) {
        return res.status(403).json({ error: guard.message });
      }
      
      const module = await storage.updateModule(id, req.body);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(400).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingModule = await storage.getModule(id);
      if (!existingModule) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      // Guard: Check if course is published
      const guard = await checkCourseNotPublished(existingModule.courseId);
      if (guard.blocked) {
        return res.status(403).json({ error: guard.message });
      }
      
      await storage.deleteModule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  // Lessons
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLessonWithNotes(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      
      // Guard: Get module to find courseId, then check if course is published
      const module = await storage.getModule(validatedData.moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const guard = await checkCourseNotPublished(module.courseId);
      if (guard.blocked) {
        return res.status(403).json({ error: guard.message });
      }
      
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(400).json({ error: "Failed to create lesson" });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingLesson = await storage.getLesson(id);
      if (!existingLesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Guard: Get module to find courseId, then check if course is published
      const module = await storage.getModule(existingLesson.moduleId);
      if (module) {
        const guard = await checkCourseNotPublished(module.courseId);
        if (guard.blocked) {
          return res.status(403).json({ error: guard.message });
        }
      }
      
      const lesson = await storage.updateLesson(id, req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(400).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingLesson = await storage.getLesson(id);
      if (!existingLesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Guard: Get module to find courseId, then check if course is published
      const module = await storage.getModule(existingLesson.moduleId);
      if (module) {
        const guard = await checkCourseNotPublished(module.courseId);
        if (guard.blocked) {
          return res.status(403).json({ error: guard.message });
        }
      }
      
      await storage.deleteLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.post("/api/lessons/:id/generate-notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Start async generation
      (async () => {
        try {
          const notes = await generateNotesForLesson(
            lesson.title,
            lesson.objectives || [],
            lesson.keyConceptS || []
          );
          
          // Check if notes already exist for this lesson
          const existingNotes = await storage.getAiNoteByLessonId(lesson.id);
          
          if (existingNotes) {
            await storage.updateAiNote(existingNotes.id, {
              content: notes.content,
              simplifiedExplanation: notes.simplifiedExplanation,
              bulletNotes: notes.bulletNotes,
              keyTakeaways: notes.keyTakeaways,
              interviewQuestions: notes.interviewQuestions,
              version: existingNotes.version + 1,
            });
          } else {
            await storage.createAiNote({
              lessonId: lesson.id,
              content: notes.content,
              simplifiedExplanation: notes.simplifiedExplanation,
              bulletNotes: notes.bulletNotes,
              keyTakeaways: notes.keyTakeaways,
              interviewQuestions: notes.interviewQuestions,
              version: 1,
            });
          }
        } catch (error) {
          console.error("Error generating notes:", error);
        }
      })();

      res.json({ message: "Started generating notes" });
    } catch (error) {
      console.error("Error starting note generation:", error);
      res.status(500).json({ error: "Failed to start note generation" });
    }
  });

  // Skills
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      console.error("Error creating skill:", error);
      res.status(400).json({ error: "Failed to create skill" });
    }
  });

  app.patch("/api/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const skill = await storage.updateSkill(id, req.body);
      if (!skill) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json(skill);
    } catch (error) {
      console.error("Error updating skill:", error);
      res.status(400).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSkill(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // Certificates - Course-scoped endpoints
  app.get("/api/courses/:courseId/certificate", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const certificates = await storage.getCertificatesByCourse(courseId);
      res.json(certificates[0] || null);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/courses/:courseId/certificate", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      if (course.status === "published") {
        return res.status(403).json({ error: "Cannot create certificate for a published course. Unpublish first." });
      }

      const existing = await storage.getCertificatesByCourse(courseId);
      if (existing.length > 0) {
        return res.status(400).json({ error: "Certificate already exists for this course. Use PATCH to update." });
      }

      const validatedData = insertCertificateSchema.parse({ ...req.body, courseId });
      const certificate = await storage.createCertificate(validatedData);
      
      await storage.createAuditLog({
        action: "CERTIFICATE_CREATED",
        entityType: "certificate",
        entityId: certificate.id,
        newValue: certificate,
      });
      
      res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating certificate:", error);
      res.status(400).json({ error: "Failed to create certificate" });
    }
  });

  app.patch("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getCertificate(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      const course = await storage.getCourse(existing.courseId);
      if (course?.status === "published") {
        return res.status(403).json({ error: "Cannot update certificate for a published course. Unpublish first." });
      }

      const certificate = await storage.updateCertificate(id, req.body);
      
      await storage.createAuditLog({
        action: "CERTIFICATE_UPDATED",
        entityType: "certificate",
        entityId: id,
        oldValue: existing,
        newValue: certificate,
      });
      
      res.json(certificate);
    } catch (error) {
      console.error("Error updating certificate:", error);
      res.status(400).json({ error: "Failed to update certificate" });
    }
  });

  app.delete("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getCertificate(id);
      
      if (existing) {
        const course = await storage.getCourse(existing.courseId);
        if (course?.status === "published") {
          return res.status(403).json({ error: "Cannot delete certificate for a published course. Unpublish first." });
        }
      }
      
      await storage.deleteCertificate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting certificate:", error);
      res.status(500).json({ error: "Failed to delete certificate" });
    }
  });

  app.get("/api/certificates", async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  // Tests - Course-scoped endpoints
  app.get("/api/courses/:courseId/tests", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const tests = await storage.getTestsByCourse(courseId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getTestWithQuestions(id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const { moduleId } = req.body;
      
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (course?.status === "published") {
        return res.status(403).json({ error: "Cannot create test for a published course. Unpublish first." });
      }

      const validatedData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(validatedData);
      
      await storage.createAuditLog({
        action: "TEST_CREATED",
        entityType: "test",
        entityId: test.id,
        newValue: test,
      });
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating test:", error);
      res.status(400).json({ error: "Failed to create test" });
    }
  });

  app.patch("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getTest(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Test not found" });
      }

      const module = await storage.getModule(existing.moduleId);
      if (module) {
        const course = await storage.getCourse(module.courseId);
        if (course?.status === "published") {
          return res.status(403).json({ error: "Cannot update test for a published course. Unpublish first." });
        }
      }

      const test = await storage.updateTest(id, req.body);
      
      await storage.createAuditLog({
        action: "TEST_UPDATED",
        entityType: "test",
        entityId: id,
        oldValue: existing,
        newValue: test,
      });
      
      res.json(test);
    } catch (error) {
      console.error("Error updating test:", error);
      res.status(400).json({ error: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getTest(id);
      
      if (existing) {
        const module = await storage.getModule(existing.moduleId);
        if (module) {
          const course = await storage.getCourse(module.courseId);
          if (course?.status === "published") {
            return res.status(403).json({ error: "Cannot delete test for a published course. Unpublish first." });
          }
        }
      }
      
      await storage.deleteTest(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ error: "Failed to delete test" });
    }
  });

  // Questions
  app.get("/api/tests/:testId/questions", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questions = await storage.getQuestionsByTest(testId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const { testId } = req.body;
      
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      const module = await storage.getModule(test.moduleId);
      if (module) {
        const course = await storage.getCourse(module.courseId);
        if (course?.status === "published") {
          return res.status(403).json({ error: "Cannot add questions to a published course's test. Unpublish first." });
        }
      }

      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      
      await storage.createAuditLog({
        action: "QUESTION_CREATED",
        entityType: "question",
        entityId: question.id,
        newValue: question,
      });
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating question:", error);
      res.status(400).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getQuestion(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Question not found" });
      }

      const test = await storage.getTest(existing.testId);
      if (test) {
        const module = await storage.getModule(test.moduleId);
        if (module) {
          const course = await storage.getCourse(module.courseId);
          if (course?.status === "published") {
            return res.status(403).json({ error: "Cannot update questions for a published course. Unpublish first." });
          }
        }
      }

      const question = await storage.updateQuestion(id, req.body);
      
      await storage.createAuditLog({
        action: "QUESTION_UPDATED",
        entityType: "question",
        entityId: id,
        oldValue: existing,
        newValue: question,
      });
      
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getQuestion(id);
      
      if (existing) {
        const test = await storage.getTest(existing.testId);
        if (test) {
          const module = await storage.getModule(test.moduleId);
          if (module) {
            const course = await storage.getCourse(module.courseId);
            if (course?.status === "published") {
              return res.status(403).json({ error: "Cannot delete questions for a published course. Unpublish first." });
            }
          }
        }
      }
      
      await storage.deleteQuestion(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Projects - Course-scoped endpoints
  app.get("/api/courses/:courseId/projects", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const projects = await storage.getProjectsByCourse(courseId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectWithSkills(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { courseId, skillIds, ...projectData } = req.body;
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      if (course.status === "published") {
        return res.status(403).json({ error: "Cannot create project for a published course. Unpublish first." });
      }

      const existingProjects = await storage.getProjectsByCourse(courseId);
      const orderIndex = existingProjects.length;

      const validatedData = insertProjectSchema.parse({ 
        ...projectData, 
        courseId,
        orderIndex,
        status: "draft"
      });
      const project = await storage.createProject(validatedData);
      
      if (skillIds && Array.isArray(skillIds) && skillIds.length > 0) {
        await storage.setProjectSkills(project.id, skillIds);
      }
      
      await storage.createAuditLog({
        action: "PROJECT_CREATED",
        entityType: "project",
        entityId: project.id,
        newValue: project,
      });
      
      const projectWithSkills = await storage.getProjectWithSkills(project.id);
      res.status(201).json(projectWithSkills);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating project:", error);
      res.status(400).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { skillIds, ...projectData } = req.body;
      const existing = await storage.getProject(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Project not found" });
      }

      const course = await storage.getCourse(existing.courseId);
      if (course?.status === "published") {
        return res.status(403).json({ error: "Cannot update project for a published course. Unpublish first." });
      }

      if (existing.status === "locked") {
        return res.status(403).json({ error: "Project is locked and cannot be edited." });
      }

      const project = await storage.updateProject(id, projectData);
      
      if (skillIds && Array.isArray(skillIds)) {
        await storage.setProjectSkills(id, skillIds);
      }
      
      await storage.createAuditLog({
        action: "PROJECT_UPDATED",
        entityType: "project",
        entityId: id,
        oldValue: existing,
        newValue: project,
      });
      
      const projectWithSkills = await storage.getProjectWithSkills(id);
      res.json(projectWithSkills);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getProject(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Project not found" });
      }

      const course = await storage.getCourse(existing.courseId);
      if (course?.status === "published") {
        return res.status(403).json({ error: "Cannot delete project for a published course. Unpublish first." });
      }

      if (existing.status === "locked") {
        return res.status(403).json({ error: "Project is locked and cannot be deleted." });
      }
      
      await storage.deleteProject(id);
      
      await storage.createAuditLog({
        action: "PROJECT_DELETED",
        entityType: "project",
        entityId: id,
        oldValue: existing,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Lock a project (when course is published)
  app.post("/api/projects/:id/lock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getProject(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = await storage.updateProject(id, { status: "locked" });
      res.json(project);
    } catch (error) {
      console.error("Error locking project:", error);
      res.status(400).json({ error: "Failed to lock project" });
    }
  });

  // ==================== PRACTICE LABS ====================

  // Get all labs for a course (for Shishya distribution)
  app.get("/api/courses/:courseId/labs", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const labs = await storage.getPracticeLabsByCourse(courseId);
      res.json({ courseId, labs });
    } catch (error) {
      console.error("Error fetching labs:", error);
      res.status(500).json({ error: "Failed to fetch labs" });
    }
  });

  // Get a single lab
  app.get("/api/labs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lab = await storage.getPracticeLab(id);
      if (!lab) {
        return res.status(404).json({ error: "Lab not found" });
      }
      res.json(lab);
    } catch (error) {
      console.error("Error fetching lab:", error);
      res.status(500).json({ error: "Failed to fetch lab" });
    }
  });

  // Create a new lab
  app.post("/api/courses/:courseId/labs", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      // Check if course is published
      const check = await checkCourseNotPublished(courseId);
      if (check.blocked) {
        return res.status(403).json({ error: check.message });
      }

      // Generate slug from title
      const title = req.body.title || "Untitled Lab";
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

      const validatedData = insertPracticeLabSchema.parse({
        ...req.body,
        courseId,
        slug,
      });

      const lab = await storage.createPracticeLab(validatedData);
      
      await storage.createAuditLog({
        action: "LAB_CREATED",
        entityType: "practice_lab",
        entityId: lab.id,
        newValue: lab,
      });

      res.status(201).json(lab);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating lab:", error);
      res.status(500).json({ error: "Failed to create lab" });
    }
  });

  // Update a lab
  app.patch("/api/labs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getPracticeLab(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Lab not found" });
      }

      // Check if course is published
      const check = await checkCourseNotPublished(existing.courseId);
      if (check.blocked) {
        return res.status(403).json({ error: check.message });
      }

      if (existing.status === "locked") {
        return res.status(403).json({ error: "Lab is locked and cannot be modified." });
      }

      // Update slug if title changes
      let updateData = { ...req.body };
      if (req.body.title && req.body.title !== existing.title) {
        updateData.slug = req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      }

      const lab = await storage.updatePracticeLab(id, updateData);
      
      await storage.createAuditLog({
        action: "LAB_UPDATED",
        entityType: "practice_lab",
        entityId: id,
        oldValue: existing,
        newValue: lab,
      });

      res.json(lab);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error updating lab:", error);
      res.status(500).json({ error: "Failed to update lab" });
    }
  });

  // Delete a lab
  app.delete("/api/labs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getPracticeLab(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Lab not found" });
      }

      // Check if course is published
      const check = await checkCourseNotPublished(existing.courseId);
      if (check.blocked) {
        return res.status(403).json({ error: check.message });
      }

      if (existing.status === "locked") {
        return res.status(403).json({ error: "Lab is locked and cannot be deleted." });
      }

      await storage.deletePracticeLab(id);
      
      await storage.createAuditLog({
        action: "LAB_DELETED",
        entityType: "practice_lab",
        entityId: id,
        oldValue: existing,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lab:", error);
      res.status(500).json({ error: "Failed to delete lab" });
    }
  });

  // Lock a lab (when course is published)
  app.post("/api/labs/:id/lock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getPracticeLab(id);
      
      if (!existing) {
        return res.status(404).json({ error: "Lab not found" });
      }

      const lab = await storage.updatePracticeLab(id, { status: "locked" });
      res.json(lab);
    } catch (error) {
      console.error("Error locking lab:", error);
      res.status(400).json({ error: "Failed to lock lab" });
    }
  });

  // Register public API routes for Shishya integration
  registerPublicRoutes(app);

  return httpServer;
}
