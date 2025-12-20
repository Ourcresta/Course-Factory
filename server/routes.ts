import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { insertCourseSchema, insertModuleSchema, insertLessonSchema, insertSkillSchema } from "@shared/schema";
import {
  generateCourseFromCommand,
  generateModulesForCourse,
  generateProjectForModule,
  generateTestForModule,
  generateNotesForLesson,
} from "./ai-service";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      const { command, level = "beginner", includeProjects = true, includeTests = true, certificateType = "completion" } = req.body;
      
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
        certificateType,
      });

      // Generate course content with AI (async)
      (async () => {
        try {
          const generated = await generateCourseFromCommand(command, {
            level,
            includeProjects,
            includeTests,
            certificateType,
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

            // Create lessons for this module
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

          await storage.createAuditLog({
            action: "ai_generate",
            entityType: "course",
            entityId: course.id,
            metadata: { command, modules: generated.modules.length },
          });
        } catch (error) {
          console.error("AI generation error:", error);
          await storage.updateCourse(course.id, {
            name: "Generation Failed",
            status: "error",
          });
        }
      })();

      res.status(201).json({ id: course.id });
    } catch (error) {
      console.error("Error generating course:", error);
      res.status(500).json({ error: "Failed to generate course" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const oldCourse = await storage.getCourse(id);
      
      const course = await storage.updateCourse(id, req.body);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

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
      const course = await storage.publishCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      await storage.createAuditLog({
        action: "publish",
        entityType: "course",
        entityId: id,
      });

      res.json(course);
    } catch (error) {
      console.error("Error publishing course:", error);
      res.status(500).json({ error: "Failed to publish course" });
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
      const module = await storage.updateModule(id, req.body);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(400).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteModule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  // Lessons
  app.post("/api/lessons", async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
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
      const lesson = await storage.updateLesson(id, req.body);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(400).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
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

  return httpServer;
}
