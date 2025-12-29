import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertLessonVideoSchema, insertLessonScriptSchema, insertAvatarConfigSchema, insertAvatarVideoSchema } from "@shared/schema";
import { generateVidGuruCourse, generateAvatarScript, translateScript, generateCourseSuggestions, generateYouTubeRecommendations, generateLessonYouTubeReferences, generateMultiLanguageAvatarVideo } from "./vidguru-ai-service";
import { verifyToken, JWTPayload } from "./auth-middleware";

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

function handleValidationError(error: unknown, res: any) {
  if (error instanceof z.ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({
      error: "Validation failed",
      details: validationError.message,
    });
  }
  throw error;
}

export function registerVidGuruRoutes(app: Express) {
  // ========== ENHANCED STATS ==========
  app.get("/api/vidguru/stats", requireAuth, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      const avatarVideos = await storage.getAllAvatarVideos();
      const scripts = await storage.getAllLessonScripts();
      const avatarConfigs = await storage.getAllAvatarConfigs();
      const jobs = await storage.getAllGenerationJobs();
      const aiLogs = await storage.getVidguruAiLogs({ limit: 100 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aiGenerationsToday = aiLogs.filter(
        (log) => new Date(log.createdAt) >= today
      ).length;

      const totalVideoMinutes = avatarVideos.reduce((sum, v) => {
        return sum + (v.durationSeconds || 0) / 60;
      }, 0);

      const languageCoverage: Record<string, number> = {};
      scripts.forEach((s) => {
        languageCoverage[s.language] = (languageCoverage[s.language] || 0) + 1;
      });

      const pendingJobs = jobs.filter((j) => j.status === "pending" || j.status === "generating");
      const completedJobs = jobs.filter((j) => j.status === "completed");

      res.json({
        totalCourses: courses.length,
        draftCourses: courses.filter((c) => c.status === "draft").length,
        publishedCourses: courses.filter((c) => c.status === "published").length,
        totalAvatarVideos: avatarVideos.length,
        pendingVideos: avatarVideos.filter((v) => v.generationStatus === "pending").length,
        generatedVideos: avatarVideos.filter((v) => v.generationStatus === "completed").length,
        approvedVideos: avatarVideos.filter((v) => v.status === "approved").length,
        publishedVideos: avatarVideos.filter((v) => v.status === "published").length,
        totalVideoMinutes: Math.round(totalVideoMinutes * 10) / 10,
        totalScripts: scripts.length,
        draftScripts: scripts.filter((s) => s.status === "draft").length,
        approvedScripts: scripts.filter((s) => s.status === "approved").length,
        totalAvatarConfigs: avatarConfigs.length,
        activeAvatarConfigs: avatarConfigs.filter((c) => c.isActive).length,
        aiGenerationsToday,
        pendingJobs: pendingJobs.length,
        completedJobs: completedJobs.length,
        languageCoverage,
        languages: ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"],
      });
    } catch (error) {
      console.error("VidGuru stats error:", error);
      res.status(500).json({ error: "Failed to fetch VidGuru stats" });
    }
  });

  // ========== AI COURSE SUGGESTIONS ==========
  app.get("/api/vidguru/suggestions", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const count = parseInt(req.query.count as string) || 6;
      const suggestions = await generateCourseSuggestions(category, count);
      res.json(suggestions);
    } catch (error) {
      console.error("VidGuru suggestions error:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // ========== AI COURSE FACTORY ==========
  app.post("/api/vidguru/generate-course", requireAuth, async (req, res) => {
    try {
      const { command, options } = req.body;

      if (!command || typeof command !== "string") {
        return res.status(400).json({ error: "Command is required" });
      }

      const job = await storage.createGenerationJob({
        command,
        status: "pending",
        options: options || {},
      });

      generateVidGuruCourse(command, options || {}, job.id)
        .then(() => console.log(`VidGuru course generation job ${job.id} completed`))
        .catch((err) => console.error(`VidGuru course generation job ${job.id} failed:`, err));

      res.status(202).json({
        jobId: job.id,
        message: "Course generation started",
        status: "pending",
      });
    } catch (error) {
      console.error("VidGuru generate course error:", error);
      res.status(500).json({ error: "Failed to start course generation" });
    }
  });

  // ========== GENERATION JOBS ==========
  app.get("/api/vidguru/jobs", requireAuth, async (req, res) => {
    try {
      const jobs = await storage.getAllGenerationJobs();
      res.json(jobs);
    } catch (error) {
      console.error("VidGuru jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/vidguru/jobs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getGenerationJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("VidGuru job error:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // ========== AI LOGS ==========
  app.get("/api/vidguru/ai-logs", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getVidguruAiLogs({ limit });
      res.json(logs);
    } catch (error) {
      console.error("VidGuru AI logs error:", error);
      res.status(500).json({ error: "Failed to fetch AI logs" });
    }
  });

  // ========== AVATAR CONFIGS ==========
  app.get("/api/vidguru/avatar-configs", requireAuth, async (req, res) => {
    try {
      const configs = await storage.getAllAvatarConfigs();
      res.json(configs);
    } catch (error) {
      console.error("VidGuru avatar configs error:", error);
      res.status(500).json({ error: "Failed to fetch avatar configs" });
    }
  });

  app.post("/api/vidguru/avatar-configs", requireAuth, async (req, res) => {
    try {
      const data = insertAvatarConfigSchema.parse(req.body);
      const config = await storage.createAvatarConfig(data);
      res.status(201).json(config);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru create avatar config error:", error);
      res.status(500).json({ error: "Failed to create avatar config" });
    }
  });

  app.patch("/api/vidguru/avatar-configs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAvatarConfig(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru update avatar config error:", error);
      res.status(500).json({ error: "Failed to update avatar config" });
    }
  });

  app.delete("/api/vidguru/avatar-configs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAvatarConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete avatar config error:", error);
      res.status(500).json({ error: "Failed to delete avatar config" });
    }
  });

  // ========== AVATAR VIDEOS ==========
  app.get("/api/vidguru/avatar-videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getAllAvatarVideos();
      res.json(videos);
    } catch (error) {
      console.error("VidGuru avatar videos error:", error);
      res.status(500).json({ error: "Failed to fetch avatar videos" });
    }
  });

  app.get("/api/vidguru/avatar-videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getAvatarVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("VidGuru avatar video error:", error);
      res.status(500).json({ error: "Failed to fetch avatar video" });
    }
  });

  app.post("/api/vidguru/avatar-videos", requireAuth, async (req, res) => {
    try {
      const data = insertAvatarVideoSchema.parse(req.body);
      const video = await storage.createAvatarVideo(data);
      res.status(201).json(video);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru create avatar video error:", error);
      res.status(500).json({ error: "Failed to create avatar video" });
    }
  });

  app.patch("/api/vidguru/avatar-videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAvatarVideo(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru update avatar video error:", error);
      res.status(500).json({ error: "Failed to update avatar video" });
    }
  });

  app.patch("/api/vidguru/avatar-videos/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAvatarVideo(id, {
        status: "approved",
        approvedAt: new Date(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru approve video error:", error);
      res.status(500).json({ error: "Failed to approve video" });
    }
  });

  app.patch("/api/vidguru/avatar-videos/:id/publish", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateAvatarVideo(id, {
        status: "published",
        publishedAt: new Date(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru publish video error:", error);
      res.status(500).json({ error: "Failed to publish video" });
    }
  });

  app.delete("/api/vidguru/avatar-videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAvatarVideo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete avatar video error:", error);
      res.status(500).json({ error: "Failed to delete avatar video" });
    }
  });

  // ========== SCRIPTS ==========
  app.get("/api/vidguru/scripts", requireAuth, async (req, res) => {
    try {
      const scripts = await storage.getAllLessonScripts();
      res.json(scripts);
    } catch (error) {
      console.error("VidGuru scripts error:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.get("/api/vidguru/scripts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const script = await storage.getLessonScript(id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      console.error("VidGuru script error:", error);
      res.status(500).json({ error: "Failed to fetch script" });
    }
  });

  app.post("/api/vidguru/scripts", requireAuth, async (req, res) => {
    try {
      const data = insertLessonScriptSchema.parse(req.body);
      const script = await storage.createLessonScript(data);
      res.status(201).json(script);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru create script error:", error);
      res.status(500).json({ error: "Failed to create script" });
    }
  });

  app.post("/api/vidguru/scripts/generate", requireAuth, async (req, res) => {
    try {
      const { topic, language, durationMinutes } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const script = await generateAvatarScript(topic, language || "en", durationMinutes || 5);
      res.json(script);
    } catch (error) {
      console.error("VidGuru generate script error:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  app.patch("/api/vidguru/scripts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateLessonScript(id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru update script error:", error);
      res.status(500).json({ error: "Failed to update script" });
    }
  });

  app.patch("/api/vidguru/scripts/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateLessonScript(id, {
        status: "approved",
        approvedAt: new Date(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru approve script error:", error);
      res.status(500).json({ error: "Failed to approve script" });
    }
  });

  app.post("/api/vidguru/scripts/:id/translate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { targetLanguage } = req.body;

      const script = await storage.getLessonScript(id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }

      const translatedText = await translateScript(
        script.script,
        script.language,
        targetLanguage
      );

      const newScript = await storage.createLessonScript({
        lessonId: script.lessonId,
        language: targetLanguage,
        title: script.title,
        script: translatedText,
        aiGenerated: true,
        status: "draft",
      });

      await storage.createVidguruAiLog({
        action: "translate_script",
        entityType: "lesson_script",
        entityId: newScript.id,
        inputPrompt: `Translate from ${script.language} to ${targetLanguage}`,
        outputSummary: translatedText.substring(0, 200),
        model: "gpt-4o",
        status: "success",
      });

      res.json(newScript);
    } catch (error) {
      console.error("VidGuru translate script error:", error);
      res.status(500).json({ error: "Failed to translate script" });
    }
  });

  app.delete("/api/vidguru/scripts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLessonScript(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete script error:", error);
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  // ========== YOUTUBE REFERENCE VIDEOS (OPTIONAL) ==========
  app.get("/api/vidguru/reference-videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getAllLessonVideos();
      res.json(videos);
    } catch (error) {
      console.error("VidGuru reference videos error:", error);
      res.status(500).json({ error: "Failed to fetch reference videos" });
    }
  });

  app.post("/api/vidguru/reference-videos", requireAuth, async (req, res) => {
    try {
      const data = insertLessonVideoSchema.parse(req.body);
      const video = await storage.createLessonVideo({ ...data, isReference: true });
      res.status(201).json(video);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru add reference video error:", error);
      res.status(500).json({ error: "Failed to add reference video" });
    }
  });

  app.delete("/api/vidguru/reference-videos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLessonVideo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete reference video error:", error);
      res.status(500).json({ error: "Failed to delete reference video" });
    }
  });

  // ========== AI YOUTUBE RECOMMENDATIONS ==========
  app.post("/api/vidguru/youtube-recommendations", requireAuth, async (req, res) => {
    try {
      const { lessonTitle, keyConcepts, courseLevel } = req.body;

      if (!lessonTitle) {
        return res.status(400).json({ error: "Lesson title is required" });
      }

      const recommendations = await generateYouTubeRecommendations(
        lessonTitle,
        keyConcepts || [],
        courseLevel || "beginner"
      );

      await storage.createVidguruAiLog({
        action: "generate_youtube_recommendations",
        entityType: "lesson",
        inputPrompt: lessonTitle,
        outputSummary: `Generated ${recommendations.length} YouTube recommendations`,
        model: "gpt-4o",
        status: "success",
      });

      res.json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      console.error("VidGuru YouTube recommendations error:", error);
      res.status(500).json({ error: "Failed to generate YouTube recommendations" });
    }
  });

  app.post("/api/vidguru/lessons/:lessonId/youtube-references", requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const { courseLevel } = req.body;

      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      const result = await generateLessonYouTubeReferences(
        lessonId,
        lesson.title,
        (lesson.keyConceptS as string[]) || [],
        courseLevel || "beginner"
      );

      res.json(result);
    } catch (error) {
      console.error("VidGuru lesson YouTube references error:", error);
      res.status(500).json({ error: "Failed to generate YouTube references for lesson" });
    }
  });

  // ========== MULTI-LANGUAGE AVATAR VIDEO GENERATION ==========
  app.post("/api/vidguru/lessons/:lessonId/multi-language-videos", requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const { scriptId, languages, avatarConfigId } = req.body;

      if (!scriptId || !languages || !Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({ error: "Script ID and languages array are required" });
      }

      const result = await generateMultiLanguageAvatarVideo(
        lessonId,
        scriptId,
        languages,
        avatarConfigId
      );

      await storage.createVidguruAiLog({
        action: "create_multi_language_videos",
        entityType: "avatar_video",
        entityId: lessonId,
        inputPrompt: `Languages: ${languages.join(", ")}`,
        outputSummary: `Created ${result.videos.length} multi-language avatar videos`,
        model: "gpt-4o",
        status: result.success ? "success" : "error",
      });

      res.json(result);
    } catch (error) {
      console.error("VidGuru multi-language videos error:", error);
      res.status(500).json({ error: "Failed to create multi-language avatar videos" });
    }
  });

  // ========== LESSON VIDEOS BY LESSON ==========
  app.get("/api/vidguru/lessons/:lessonId/videos", requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const allVideos = await storage.getAllLessonVideos();
      const lessonVideos = allVideos.filter(v => v.lessonId === lessonId);
      res.json(lessonVideos);
    } catch (error) {
      console.error("VidGuru lesson videos error:", error);
      res.status(500).json({ error: "Failed to fetch lesson videos" });
    }
  });
}
