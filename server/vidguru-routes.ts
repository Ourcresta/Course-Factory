import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertLessonVideoSchema, insertLessonScriptSchema, insertVidguruAiLogSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  // ========== STATS ==========
  app.get("/api/vidguru/stats", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      const videos = await storage.getAllLessonVideos();
      const scripts = await storage.getAllLessonScripts();
      const aiLogs = await storage.getVidguruAiLogs({ limit: 100 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aiGenerationsToday = aiLogs.filter(
        (log) => new Date(log.createdAt) >= today
      ).length;

      res.json({
        totalCourses: courses.length,
        draftCourses: courses.filter((c) => c.status === "draft").length,
        publishedCourses: courses.filter((c) => c.status === "published").length,
        totalVideos: videos.length,
        totalScripts: scripts.length,
        aiGenerationsToday,
        languages: ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"],
      });
    } catch (error) {
      console.error("VidGuru stats error:", error);
      res.status(500).json({ error: "Failed to fetch VidGuru stats" });
    }
  });

  // ========== AI LOGS ==========
  app.get("/api/vidguru/ai-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getVidguruAiLogs({ limit });
      res.json(logs);
    } catch (error) {
      console.error("VidGuru AI logs error:", error);
      res.status(500).json({ error: "Failed to fetch AI logs" });
    }
  });

  // ========== VIDEOS ==========
  app.get("/api/vidguru/videos", async (req, res) => {
    try {
      const videos = await storage.getAllLessonVideos();
      res.json(videos);
    } catch (error) {
      console.error("VidGuru videos error:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/vidguru/videos", async (req, res) => {
    try {
      const data = insertLessonVideoSchema.parse(req.body);
      const video = await storage.createLessonVideo(data);
      
      await storage.createVidguruAiLog({
        action: "video_added",
        entityType: "lesson_video",
        entityId: video.id,
        status: "success",
      });
      
      res.status(201).json(video);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru add video error:", error);
      res.status(500).json({ error: "Failed to add video" });
    }
  });

  app.delete("/api/vidguru/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLessonVideo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete video error:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.post("/api/vidguru/videos/:id/generate-summary", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getLessonVideo(id);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const startTime = Date.now();
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes educational video content. Based on the video URL and title, generate a concise summary of what the video likely covers.",
          },
          {
            role: "user",
            content: `Generate a brief summary for this educational video:\nTitle: ${video.title || "Untitled"}\nURL: ${video.url}\n\nProvide a 2-3 sentence summary describing the likely content and learning objectives.`,
          },
        ],
        max_tokens: 200,
      });

      const summary = completion.choices[0]?.message?.content || "No summary available.";
      const tokensUsed = completion.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      await storage.updateLessonVideo(id, { aiSummary: summary });
      
      await storage.createVidguruAiLog({
        action: "generate_video_summary",
        entityType: "lesson_video",
        entityId: id,
        inputPrompt: video.url,
        outputSummary: summary.substring(0, 200),
        tokensUsed,
        model: "gpt-4o",
        durationMs,
        status: "success",
      });

      res.json({ summary });
    } catch (error) {
      console.error("VidGuru generate summary error:", error);
      
      await storage.createVidguruAiLog({
        action: "generate_video_summary",
        entityType: "lesson_video",
        entityId: parseInt(req.params.id),
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // ========== SCRIPTS ==========
  app.get("/api/vidguru/scripts", async (req, res) => {
    try {
      const scripts = await storage.getAllLessonScripts();
      res.json(scripts);
    } catch (error) {
      console.error("VidGuru scripts error:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.post("/api/vidguru/scripts", async (req, res) => {
    try {
      const data = insertLessonScriptSchema.parse(req.body);
      const script = await storage.createLessonScript(data);
      
      await storage.createVidguruAiLog({
        action: "script_created",
        entityType: "lesson_script",
        entityId: script.id,
        status: "success",
      });
      
      res.status(201).json(script);
    } catch (error) {
      handleValidationError(error, res);
      console.error("VidGuru add script error:", error);
      res.status(500).json({ error: "Failed to add script" });
    }
  });

  app.patch("/api/vidguru/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { script, title } = req.body;
      await storage.updateLessonScript(id, { script, title });
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru update script error:", error);
      res.status(500).json({ error: "Failed to update script" });
    }
  });

  app.delete("/api/vidguru/scripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLessonScript(id);
      res.json({ success: true });
    } catch (error) {
      console.error("VidGuru delete script error:", error);
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  app.post("/api/vidguru/scripts/:id/translate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { targetLanguage } = req.body;
      
      const script = await storage.getLessonScript(id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }

      const languageNames: Record<string, string> = {
        en: "English",
        hi: "Hindi",
        ta: "Tamil",
        te: "Telugu",
        kn: "Kannada",
        ml: "Malayalam",
        bn: "Bengali",
        mr: "Marathi",
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in educational content. Translate the following lesson script to ${targetLangName}. Maintain the educational tone and clarity. Only output the translated text, no explanations.`,
          },
          {
            role: "user",
            content: script.script,
          },
        ],
        max_tokens: 2000,
      });

      const translatedText = completion.choices[0]?.message?.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      const newScript = await storage.createLessonScript({
        lessonId: script.lessonId,
        language: targetLanguage,
        script: translatedText,
        title: script.title ? `${script.title} (${targetLangName})` : undefined,
        aiGenerated: true,
        status: "draft",
      });

      await storage.createVidguruAiLog({
        action: "translate_script",
        entityType: "lesson_script",
        entityId: newScript.id,
        inputPrompt: `Translate to ${targetLangName}`,
        outputSummary: translatedText.substring(0, 200),
        tokensUsed,
        model: "gpt-4o",
        durationMs,
        status: "success",
      });

      res.json(newScript);
    } catch (error) {
      console.error("VidGuru translate script error:", error);
      
      await storage.createVidguruAiLog({
        action: "translate_script",
        entityType: "lesson_script",
        entityId: parseInt(req.params.id),
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      res.status(500).json({ error: "Failed to translate script" });
    }
  });
}
