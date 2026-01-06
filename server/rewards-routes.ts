import type { Express } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { insertAchievementCardSchema, insertMotivationalCardSchema } from "@shared/schema";

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

export function registerRewardsRoutes(app: Express) {
  // Get course rewards with all cards
  app.get("/api/courses/:id/rewards", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const data = await storage.getCourseRewardWithCards(courseId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching course rewards:", error);
      res.status(500).json({ error: "Failed to fetch course rewards" });
    }
  });

  // Update or create course rewards settings
  app.post("/api/courses/:id/rewards", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const rewardSchema = z.object({
        coinsEnabled: z.boolean().optional(),
        coinName: z.string().optional(),
        coinIcon: z.string().optional(),
        rulesJson: z.object({
          courseCompletion: z.number().min(0),
          moduleCompletion: z.number().min(0),
          lessonCompletion: z.number().min(0),
          testPass: z.number().min(0),
          projectSubmission: z.number().min(0),
          labCompletion: z.number().min(0),
        }).optional(),
        bonusJson: z.object({
          earlyCompletionEnabled: z.boolean(),
          earlyCompletionDays: z.number().min(1),
          earlyCompletionBonus: z.number().min(0),
          perfectScoreEnabled: z.boolean(),
          perfectScoreBonus: z.number().min(0),
        }).optional(),
        scholarshipEnabled: z.boolean().optional(),
        scholarshipJson: z.object({
          coinsToDiscount: z.number().min(1),
          discountType: z.enum(["percentage", "flat"]),
          discountValue: z.number().min(0),
          validityDays: z.number().min(1),
          eligiblePlans: z.array(z.string()),
        }).nullable().optional(),
      });

      const validatedData = rewardSchema.parse(req.body);
      const reward = await storage.upsertCourseReward(courseId, validatedData);
      res.json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error updating course rewards:", error);
      res.status(500).json({ error: "Failed to update course rewards" });
    }
  });

  // Create achievement card
  app.post("/api/courses/:id/achievement-cards", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const cardSchema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        icon: z.string().default("trophy"),
        conditionJson: z.object({
          type: z.enum(["percentage_complete", "module_complete", "all_tests_passed", "project_approved", "all_labs_complete", "custom"]),
          value: z.number().optional(),
          moduleId: z.number().optional(),
          customCondition: z.string().optional(),
        }),
        rarity: z.enum(["common", "rare", "epic", "legendary"]).default("common"),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      });

      const validatedData = cardSchema.parse(req.body);
      const card = await storage.createAchievementCard({ ...validatedData, courseId });
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating achievement card:", error);
      res.status(500).json({ error: "Failed to create achievement card" });
    }
  });

  // Update achievement card
  app.put("/api/achievement-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }

      const existing = await storage.getAchievementCard(id);
      if (!existing) {
        return res.status(404).json({ error: "Achievement card not found" });
      }

      const cardSchema = z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        conditionJson: z.object({
          type: z.enum(["percentage_complete", "module_complete", "all_tests_passed", "project_approved", "all_labs_complete", "custom"]),
          value: z.number().optional(),
          moduleId: z.number().optional(),
          customCondition: z.string().optional(),
        }).optional(),
        rarity: z.enum(["common", "rare", "epic", "legendary"]).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      });

      const validatedData = cardSchema.parse(req.body);
      const card = await storage.updateAchievementCard(id, validatedData);
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error updating achievement card:", error);
      res.status(500).json({ error: "Failed to update achievement card" });
    }
  });

  // Delete achievement card
  app.delete("/api/achievement-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }

      const existing = await storage.getAchievementCard(id);
      if (!existing) {
        return res.status(404).json({ error: "Achievement card not found" });
      }

      await storage.deleteAchievementCard(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting achievement card:", error);
      res.status(500).json({ error: "Failed to delete achievement card" });
    }
  });

  // Create motivational card
  app.post("/api/courses/:id/motivational-cards", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const cardSchema = z.object({
        message: z.string().min(1, "Message is required"),
        triggerType: z.enum(["percentage", "module_complete", "lesson_complete", "test_pass", "project_submit", "custom"]),
        triggerValue: z.number().optional(),
        icon: z.string().default("sparkles"),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      });

      const validatedData = cardSchema.parse(req.body);
      const card = await storage.createMotivationalCard({ ...validatedData, courseId });
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error creating motivational card:", error);
      res.status(500).json({ error: "Failed to create motivational card" });
    }
  });

  // Update motivational card
  app.put("/api/motivational-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }

      const existing = await storage.getMotivationalCard(id);
      if (!existing) {
        return res.status(404).json({ error: "Motivational card not found" });
      }

      const cardSchema = z.object({
        message: z.string().min(1).optional(),
        triggerType: z.enum(["percentage", "module_complete", "lesson_complete", "test_pass", "project_submit", "custom"]).optional(),
        triggerValue: z.number().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      });

      const validatedData = cardSchema.parse(req.body);
      const card = await storage.updateMotivationalCard(id, validatedData);
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      console.error("Error updating motivational card:", error);
      res.status(500).json({ error: "Failed to update motivational card" });
    }
  });

  // Delete motivational card
  app.delete("/api/motivational-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }

      const existing = await storage.getMotivationalCard(id);
      if (!existing) {
        return res.status(404).json({ error: "Motivational card not found" });
      }

      await storage.deleteMotivationalCard(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting motivational card:", error);
      res.status(500).json({ error: "Failed to delete motivational card" });
    }
  });

  // Generate default motivational cards for a course
  app.post("/api/courses/:id/generate-motivational-cards", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const defaultCards = [
        { message: "Great start! You've begun your learning journey.", triggerType: "percentage" as const, triggerValue: 10, icon: "rocket" },
        { message: "You're making progress! Keep going!", triggerType: "percentage" as const, triggerValue: 25, icon: "trending-up" },
        { message: "Halfway there! You're doing amazing!", triggerType: "percentage" as const, triggerValue: 50, icon: "target" },
        { message: "Almost there! The finish line is in sight!", triggerType: "percentage" as const, triggerValue: 75, icon: "flag" },
        { message: "Congratulations! You've completed the course!", triggerType: "percentage" as const, triggerValue: 100, icon: "award" },
      ];

      const created = [];
      for (const card of defaultCards) {
        const newCard = await storage.createMotivationalCard({
          ...card,
          courseId,
          isActive: true,
          sortOrder: card.triggerValue || 0,
        });
        created.push(newCard);
      }

      res.status(201).json({ success: true, cards: created });
    } catch (error) {
      console.error("Error generating motivational cards:", error);
      res.status(500).json({ error: "Failed to generate motivational cards" });
    }
  });
}
