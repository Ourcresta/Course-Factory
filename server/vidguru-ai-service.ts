import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertCourse, InsertModule, InsertLesson, InsertLessonScript, InsertAvatarVideo, InsertPracticeLab, InsertProject, InsertTest, InsertQuestion, InsertVidguruAiLog } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VidGuruGenerationOptions {
  includeVideos?: boolean;
  includeLabs?: boolean;
  includeProjects?: boolean;
  includeTests?: boolean;
  languages?: string[];
  avatarConfigId?: number;
}

interface GeneratedScript {
  title: string;
  hookSection: string;
  explanationSection: string;
  examplesSection: string;
  summarySection: string;
  fullScript: string;
  estimatedSeconds: number;
}

interface GeneratedLesson {
  title: string;
  objectives: string[];
  keyConcepts: string[];
  estimatedTime: string;
  script: GeneratedScript;
}

interface GeneratedModule {
  title: string;
  description: string;
  estimatedTime: string;
  lessons: GeneratedLesson[];
  project?: {
    title: string;
    description: string;
    objectives: string;
    deliverables: string;
    difficulty: string;
  };
}

interface GeneratedTest {
  title: string;
  description: string;
  passingPercentage: number;
  questions: {
    type: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface GeneratedLab {
  title: string;
  description: string;
  difficulty: string;
  language: string;
  instructions: string;
  starterCode: string;
  hints: string[];
  estimatedTime: number;
}

interface GeneratedCourse {
  name: string;
  description: string;
  level: string;
  targetAudience: string;
  duration: string;
  overview: string;
  learningOutcomes: string[];
  jobRoles: string[];
  modules: GeneratedModule[];
  capstoneProject?: {
    title: string;
    description: string;
    objectives: string;
    deliverables: string;
    techStack: string[];
  };
  tests: GeneratedTest[];
  labs: GeneratedLab[];
}

const VIDGURU_SYSTEM_PROMPT = `You are VidGuru AI - an expert AI Avatar Course Factory that creates complete educational courses optimized for AI avatar video teaching.

Your role is to generate production-ready course content that will be delivered by an AI avatar teacher. Every piece of content you create MUST be designed for spoken delivery.

CRITICAL REQUIREMENTS:
1. Every lesson MUST have a teaching script with 4 sections:
   - HOOK: Engaging opening that captures attention (15-30 seconds)
   - EXPLANATION: Clear, conversational explanation of concepts (2-4 minutes)
   - EXAMPLES: Practical examples with step-by-step walkthrough (2-3 minutes)
   - SUMMARY: Key takeaways and recap (30-60 seconds)

2. Scripts MUST be:
   - Written in conversational, spoken language (not academic text)
   - Include natural pauses and transitions
   - Use "you" to address the student directly
   - Include verbal cues like "Now, let's look at..." or "Here's the key thing to remember..."

3. Labs MUST align with what the avatar teaches in the script
4. Tests MUST be generated from script content
5. Projects MUST build on skills taught in lessons

OUTPUT FORMAT: You must respond with valid JSON only, no markdown or explanations.`;

export async function generateVidGuruCourse(
  command: string,
  options: VidGuruGenerationOptions = {},
  jobId?: number
): Promise<{ courseId: number; success: boolean; error?: string }> {
  const startTime = Date.now();
  const {
    includeVideos = true,
    includeLabs = true,
    includeProjects = true,
    includeTests = true,
    languages = ["en"],
  } = options;

  try {
    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        status: "generating",
        currentStep: "Analyzing command and planning course structure",
        startedAt: new Date(),
      });
    }

    const prompt = `Generate a complete course based on this command: "${command}"

Requirements:
- Include ${includeLabs ? "practice labs" : "NO practice labs"}
- Include ${includeProjects ? "projects" : "NO projects"}
- Include ${includeTests ? "tests/assessments" : "NO tests"}
- Languages: ${languages.join(", ")}

Generate a comprehensive JSON response with this exact structure:
{
  "name": "Course Title",
  "description": "Course description",
  "level": "beginner|intermediate|advanced",
  "targetAudience": "Who this course is for",
  "duration": "Estimated total duration",
  "overview": "Course overview paragraph",
  "learningOutcomes": ["outcome1", "outcome2", ...],
  "jobRoles": ["role1", "role2", ...],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "estimatedTime": "2 hours",
      "lessons": [
        {
          "title": "Lesson Title",
          "objectives": ["objective1", "objective2"],
          "keyConcepts": ["concept1", "concept2"],
          "estimatedTime": "20 minutes",
          "script": {
            "title": "Script Title",
            "hookSection": "Engaging opening hook text for avatar to speak...",
            "explanationSection": "Main explanation content for avatar...",
            "examplesSection": "Example walkthrough content for avatar...",
            "summarySection": "Recap and key takeaways for avatar...",
            "fullScript": "Complete combined script for avatar video",
            "estimatedSeconds": 300
          }
        }
      ],
      "project": ${includeProjects ? `{
        "title": "Project Title",
        "description": "Project description",
        "objectives": "What students will build",
        "deliverables": "What students will submit",
        "difficulty": "intermediate"
      }` : "null"}
    }
  ],
  "capstoneProject": ${includeProjects ? `{
    "title": "Capstone Project Title",
    "description": "Final project description",
    "objectives": "Capstone objectives",
    "deliverables": "Final deliverables",
    "techStack": ["tech1", "tech2"]
  }` : "null"},
  "tests": ${includeTests ? `[
    {
      "title": "Test Title",
      "description": "Test description",
      "passingPercentage": 70,
      "questions": [
        {
          "type": "mcq",
          "questionText": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Why this is correct"
        }
      ]
    }
  ]` : "[]"},
  "labs": ${includeLabs ? `[
    {
      "title": "Lab Title",
      "description": "Lab description",
      "difficulty": "beginner",
      "language": "javascript",
      "instructions": "Step by step instructions",
      "starterCode": "// Starter code here",
      "hints": ["hint1", "hint2"],
      "estimatedTime": 30
    }
  ]` : "[]"}
}

IMPORTANT: 
- Generate at least 3-5 modules with 3-5 lessons each
- Each lesson script should be 4-6 minutes of spoken content
- Make scripts conversational and engaging for video delivery
- Respond with ONLY valid JSON, no markdown code blocks`;

    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        currentStep: "Generating course structure with AI",
        progress: 10,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: VIDGURU_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 16000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const tokensUsed = completion.usage?.total_tokens || 0;

    let generatedCourse: GeneratedCourse;
    try {
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
      generatedCourse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    await storage.createVidguruAiLog({
      action: "generate_course_structure",
      entityType: "course",
      inputPrompt: command,
      outputSummary: `Generated course: ${generatedCourse.name}`,
      tokensUsed,
      model: "gpt-4o",
      durationMs: Date.now() - startTime,
      status: "success",
      jobId,
    });

    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        currentStep: "Creating course in database",
        progress: 20,
        totalTokensUsed: tokensUsed,
      });
    }

    const course = await storage.createCourse({
      name: generatedCourse.name,
      description: generatedCourse.description,
      level: generatedCourse.level,
      targetAudience: generatedCourse.targetAudience,
      duration: generatedCourse.duration,
      overview: generatedCourse.overview,
      learningOutcomes: generatedCourse.learningOutcomes,
      jobRoles: generatedCourse.jobRoles,
      includeLabs,
      includeProjects,
      includeTests,
      status: "draft",
      aiCommand: command,
    });

    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        courseId: course.id,
        currentStep: "Creating modules and lessons",
        progress: 30,
      });
    }

    let totalModules = 0;
    let totalLessons = 0;
    let totalScripts = 0;
    let totalVideos = 0;

    for (let moduleIndex = 0; moduleIndex < generatedCourse.modules.length; moduleIndex++) {
      const moduleData = generatedCourse.modules[moduleIndex];

      const module = await storage.createModule({
        courseId: course.id,
        title: moduleData.title,
        description: moduleData.description,
        estimatedTime: moduleData.estimatedTime,
        orderIndex: moduleIndex,
      });
      totalModules++;

      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
        const lessonData = moduleData.lessons[lessonIndex];

        const lesson = await storage.createLesson({
          moduleId: module.id,
          title: lessonData.title,
          objectives: lessonData.objectives,
          keyConceptS: lessonData.keyConcepts,
          estimatedTime: lessonData.estimatedTime,
          orderIndex: lessonIndex,
        });
        totalLessons++;

        for (const language of languages) {
          const script = await storage.createLessonScript({
            lessonId: lesson.id,
            language,
            title: lessonData.script.title,
            script: lessonData.script.fullScript,
            hookSection: lessonData.script.hookSection,
            explanationSection: lessonData.script.explanationSection,
            examplesSection: lessonData.script.examplesSection,
            summarySection: lessonData.script.summarySection,
            estimatedSeconds: lessonData.script.estimatedSeconds,
            aiGenerated: true,
            status: "draft",
          });
          totalScripts++;

          if (includeVideos) {
            await storage.createAvatarVideo({
              lessonId: lesson.id,
              scriptId: script.id,
              avatarConfigId: options.avatarConfigId,
              language,
              title: lessonData.script.title,
              generationStatus: "pending",
              status: "draft",
              orderIndex: lessonIndex,
            });
            totalVideos++;
          }
        }
      }

      if (includeProjects && moduleData.project) {
        await storage.createProject({
          courseId: course.id,
          moduleId: module.id,
          title: moduleData.project.title,
          description: moduleData.project.description,
          objectives: moduleData.project.objectives,
          deliverables: moduleData.project.deliverables,
          difficulty: moduleData.project.difficulty,
          status: "draft",
          orderIndex: moduleIndex,
        });
      }

      if (jobId) {
        const progress = 30 + Math.floor((moduleIndex + 1) / generatedCourse.modules.length * 40);
        await storage.updateGenerationJob(jobId, {
          currentStep: `Created module ${moduleIndex + 1}/${generatedCourse.modules.length}`,
          progress,
          generatedModules: totalModules,
          generatedLessons: totalLessons,
          generatedScripts: totalScripts,
          generatedVideos: totalVideos,
        });
      }
    }

    if (includeProjects && generatedCourse.capstoneProject) {
      await storage.createProject({
        courseId: course.id,
        title: generatedCourse.capstoneProject.title,
        description: generatedCourse.capstoneProject.description,
        objectives: generatedCourse.capstoneProject.objectives,
        deliverables: generatedCourse.capstoneProject.deliverables,
        techStack: generatedCourse.capstoneProject.techStack,
        difficulty: "advanced",
        category: "capstone",
        status: "draft",
        orderIndex: 999,
      });
    }

    let totalLabs = 0;
    if (includeLabs && generatedCourse.labs?.length) {
      for (let i = 0; i < generatedCourse.labs.length; i++) {
        const labData = generatedCourse.labs[i];
        await storage.createPracticeLab({
          courseId: course.id,
          slug: `lab-${course.id}-${i + 1}`,
          title: labData.title,
          description: labData.description,
          difficulty: labData.difficulty as any,
          language: labData.language,
          instructions: labData.instructions,
          starterCode: labData.starterCode,
          hints: labData.hints,
          estimatedTime: labData.estimatedTime,
          status: "draft",
          orderIndex: i,
        });
        totalLabs++;
      }
    }

    let totalTests = 0;
    let totalQuestions = 0;
    if (includeTests && generatedCourse.tests?.length) {
      for (const testData of generatedCourse.tests) {
        const test = await storage.createTest({
          courseId: course.id,
          title: testData.title,
          description: testData.description,
          passingPercentage: testData.passingPercentage,
          status: "draft",
        });
        totalTests++;

        for (let qIndex = 0; qIndex < testData.questions.length; qIndex++) {
          const q = testData.questions[qIndex];
          await storage.createQuestion({
            testId: test.id,
            type: q.type,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            orderIndex: qIndex,
          });
          totalQuestions++;
        }
      }
    }

    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        status: "completed",
        currentStep: "Course generation complete",
        progress: 100,
        generatedModules: totalModules,
        generatedLessons: totalLessons,
        generatedScripts: totalScripts,
        generatedVideos: totalVideos,
        generatedLabs: totalLabs,
        generatedTests: totalTests,
        completedAt: new Date(),
      });
    }

    return { courseId: course.id, success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await storage.createVidguruAiLog({
      action: "generate_course_structure",
      entityType: "course",
      inputPrompt: command,
      status: "error",
      errorMessage,
      durationMs: Date.now() - startTime,
      jobId,
    });

    if (jobId) {
      await storage.updateGenerationJob(jobId, {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      });
    }

    return { courseId: 0, success: false, error: errorMessage };
  }
}

export async function generateAvatarScript(
  topic: string,
  language: string = "en",
  durationMinutes: number = 5
): Promise<GeneratedScript> {
  const prompt = `Generate an AI avatar teaching script for the topic: "${topic}"
Target duration: ${durationMinutes} minutes
Language: ${language}

The script must have these 4 sections written for spoken delivery by an AI avatar teacher:

1. HOOK (15-30 seconds): An engaging opening that captures attention
2. EXPLANATION (${Math.floor(durationMinutes * 0.4)} minutes): Clear explanation of the concept
3. EXAMPLES (${Math.floor(durationMinutes * 0.35)} minutes): Practical examples with walkthroughs
4. SUMMARY (30-60 seconds): Key takeaways and recap

Write in a conversational, engaging tone as if speaking directly to the student.
Include natural transitions and verbal cues.

Respond with JSON:
{
  "title": "Script title",
  "hookSection": "Hook content...",
  "explanationSection": "Explanation content...",
  "examplesSection": "Examples content...",
  "summarySection": "Summary content...",
  "fullScript": "Complete script combining all sections...",
  "estimatedSeconds": ${durationMinutes * 60}
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: VIDGURU_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: 4000,
  });

  const responseText = completion.choices[0]?.message?.content || "";
  const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleanedResponse);
}

export async function translateScript(
  script: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional translator specializing in educational content. Translate the following teaching script to ${targetLangName}. Maintain the conversational, teaching tone. Keep it natural for spoken delivery by an AI avatar teacher.`,
      },
      { role: "user", content: script },
    ],
    max_tokens: 4000,
  });

  return completion.choices[0]?.message?.content || "";
}
