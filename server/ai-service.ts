import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface CourseGeneration {
  name: string;
  description: string;
  overview: string;
  level: string;
  targetAudience: string;
  duration: string;
  learningOutcomes: string[];
  jobRoles: string[];
  modules: {
    title: string;
    description: string;
    estimatedTime: string;
    lessons: {
      title: string;
      objectives: string[];
      estimatedTime: string;
      keyConceptS: string[];
    }[];
  }[];
}

interface ProjectGeneration {
  title: string;
  problemStatement: string;
  techStack: string[];
  folderStructure: string;
  difficulty: string;
  evaluationChecklist: string[];
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    codeSnippet?: string;
    tips: string[];
  }[];
}

interface TestGeneration {
  title: string;
  description: string;
  passingPercentage: number;
  questions: {
    type: string;
    difficulty: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface NotesGeneration {
  content: string;
  simplifiedExplanation: string;
  bulletNotes: string[];
  keyTakeaways: string[];
  interviewQuestions: string[];
}

export async function generateCourseFromCommand(command: string, options: {
  level: string;
  includeProjects: boolean;
  includeTests: boolean;
  includeLabs: boolean;
  certificateType: string;
}): Promise<CourseGeneration> {
  const prompt = `You are an expert course designer. Based on the following command, generate a complete course structure.

Command: "${command}"

Level: ${options.level}
Include Projects: ${options.includeProjects}
Include Tests: ${options.includeTests}
Include Practice Labs: ${options.includeLabs}
Certificate Type: ${options.certificateType}

Generate a comprehensive course with:
1. A clear, professional course name
2. A detailed description (2-3 sentences)
3. A comprehensive overview paragraph
4. Target audience description
5. Estimated duration (e.g., "8 weeks", "40 hours")
6. 5-8 specific learning outcomes
7. 3-5 relevant job roles this course prepares for
8. 4-6 well-structured modules with:
   - Module title
   - Module description
   - Estimated time
   - 3-5 lessons per module with objectives, key concepts, and time estimates

Return the response as a valid JSON object with the following structure:
{
  "name": "Course Name",
  "description": "Course description",
  "overview": "Detailed overview paragraph",
  "level": "${options.level}",
  "targetAudience": "Target audience description",
  "duration": "Duration estimate",
  "learningOutcomes": ["outcome1", "outcome2", ...],
  "jobRoles": ["role1", "role2", ...],
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "estimatedTime": "X hours",
      "lessons": [
        {
          "title": "Lesson Title",
          "objectives": ["objective1", "objective2"],
          "estimatedTime": "X minutes",
          "keyConceptS": ["concept1", "concept2"]
        }
      ]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as CourseGeneration;
}

export async function generateModulesForCourse(courseName: string, courseDescription: string, level: string): Promise<CourseGeneration["modules"]> {
  const prompt = `Generate 5 well-structured learning modules for the following course:

Course: ${courseName}
Description: ${courseDescription}
Level: ${level}

For each module, provide:
- A clear title
- A brief description
- Estimated time to complete
- 3-5 lessons with objectives, key concepts, and time estimates

Return as a JSON array of modules.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  return parsed.modules || parsed;
}

export async function generateProjectForModule(moduleTitle: string, courseName: string): Promise<ProjectGeneration> {
  const prompt = `Generate a realistic, job-oriented project for the following module:

Course: ${courseName}
Module: ${moduleTitle}

Create a project that:
1. Is practical and industry-relevant
2. Can be completed in 4-8 hours
3. Has clear step-by-step implementation guide
4. Includes proper tech stack recommendations

Return as JSON with this structure:
{
  "title": "Project Title",
  "problemStatement": "Clear problem description",
  "techStack": ["tech1", "tech2"],
  "folderStructure": "project/\\n├── src/\\n│   ├── index.js\\n│   └── ...",
  "difficulty": "intermediate",
  "evaluationChecklist": ["criterion1", "criterion2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title",
      "description": "Step description",
      "codeSnippet": "optional code",
      "tips": ["tip1", "tip2"]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as ProjectGeneration;
}

export async function generateTestForModule(moduleTitle: string, lessonTitles: string[]): Promise<TestGeneration> {
  const prompt = `Generate an assessment test for the following module:

Module: ${moduleTitle}
Lessons covered: ${lessonTitles.join(", ")}

Create a test with:
- 10-15 questions
- Mix of MCQ (easy, medium, hard) and scenario-based questions
- Clear explanations for each answer

Return as JSON with this structure:
{
  "title": "Module Assessment - ${moduleTitle}",
  "description": "Test description",
  "passingPercentage": 70,
  "questions": [
    {
      "type": "mcq",
      "difficulty": "easy",
      "questionText": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as TestGeneration;
}

export async function generateNotesForLesson(lessonTitle: string, objectives: string[], keyConcepts: string[]): Promise<NotesGeneration> {
  const prompt = `Generate comprehensive learning notes for the following lesson:

Lesson: ${lessonTitle}
Objectives: ${objectives.join(", ")}
Key Concepts: ${keyConcepts.join(", ")}

Create notes that include:
1. Detailed content in markdown format
2. A simplified explanation for beginners
3. Bullet-point summary notes
4. Key takeaways
5. Interview questions and answers

Return as JSON with this structure:
{
  "content": "# Lesson Notes\\n\\n## Introduction\\n...",
  "simplifiedExplanation": "Simple explanation text",
  "bulletNotes": ["point1", "point2"],
  "keyTakeaways": ["takeaway1", "takeaway2"],
  "interviewQuestions": ["Q: question? A: answer", ...]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as NotesGeneration;
}
