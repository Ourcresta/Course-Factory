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

interface FullCourseGeneration extends CourseGeneration {
  skills: string[];
  labs?: {
    moduleIndex: number;
    lessonIndex: number;
    title: string;
    problemStatement: string;
    language: string;
    starterCode: string;
    expectedOutput: string;
    validationType: string;
    hints: string[];
    estimatedTime: string;
    difficulty: string;
  }[];
  projects?: {
    moduleIndex: number;
    title: string;
    problemStatement: string;
    techStack: string[];
    difficulty: string;
    milestones: string[];
    deliverables: string[];
    evaluationMethod: string;
  }[];
  tests?: {
    moduleIndex: number;
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
  }[];
  certificateRules?: {
    minLabsCompleted: number;
    testPassRequired: boolean;
    projectSubmissionRequired: boolean;
    minScore: number;
  };
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

interface LabGeneration {
  title: string;
  problemStatement: string;
  language: string;
  starterCode: string;
  expectedOutput: string;
  validationType: string;
  hints: string[];
  estimatedTime: string;
  difficulty: string;
}

const COURSE_FACTORY_SYSTEM_PROMPT = `You are an AI Course Factory Engine for Siksha / Vidyasetu.

Your role is to DESIGN and GENERATE a COMPLETE, JOB-READY COURSE—not just content.

You must think and act like:
• A Senior Instructional Designer
• A Senior Industry Subject Matter Expert
• A Skill Assessment Architect
• A Hands-on Practice Platform Designer (LeetCode / Crio style)

CORE OBJECTIVE:
Given a natural language course request, you must AUTOMATICALLY CREATE a FULL COURSE STRUCTURE.

The course must be:
• Structured and Progressive
• Practice-first
• Job-oriented
• Beginner-friendly (if specified)
• Industry-aligned

STRICT GENERATION RULES:
1. DO NOT dump unstructured text.
2. ALWAYS think in steps: Plan → Structure → Generate → Validate.
3. ALWAYS generate output in CLEAN, VALID JSON.
4. NEVER assume prior knowledge unless stated.
5. NEVER skip practice if labs are enabled.
6. NEVER give answers inside labs (only hints).
7. Design for REAL LEARNING, not theory overload.

QUALITY BAR:
Your output should be GOOD ENOUGH that:
• A student can become job-ready
• A company can trust the certificate
• An admin does not need to rewrite content

You are NOT a chatbot. You are a COURSE FACTORY ENGINE.
Generate with discipline, clarity, and educational integrity.`;

export async function generateCourseFromCommand(command: string, options: {
  level: string;
  includeProjects: boolean;
  includeTests: boolean;
  includeLabs: boolean;
  certificateType: string;
}): Promise<FullCourseGeneration> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

COURSE REQUEST:
"${command}"

CONFIGURATION:
- Level: ${options.level}
- Include Practice Labs: ${options.includeLabs}
- Include Projects: ${options.includeProjects}
- Include Tests: ${options.includeTests}
- Certificate Type: ${options.certificateType}

GENERATION STEPS:

STEP 1 — COURSE BLUEPRINT:
Create a comprehensive course with:
• Course title (clear, professional)
• Target audience description
• 5-8 specific learning outcomes
• Skills covered (for tagging)
• Duration (weeks/hours)
• 4-6 well-structured modules
• High-level progression plan

STEP 2 — MODULE GENERATION:
For each module, generate:
• Module title and objective
• Skills covered
• Estimated duration
• 3-5 lessons per module

STEP 3 — LESSON GENERATION:
For each lesson, include:
• Lesson title
• Clear objectives
• Key concepts
• Estimated time

${options.includeLabs ? `STEP 4 — PRACTICE LABS:
For EVERY coding-related lesson, generate a PRACTICE LAB.
Each lab MUST include:
• Lab title
• Problem statement
• Starter code (functional, with TODO comments)
• Expected output
• Validation type (output/console/regex/function)
• 2-4 HINTS ONLY (no direct answers)
• Language (javascript/python/typescript/java/cpp/rust/go)
Labs must be suitable for browser-based execution with automatic validation.` : ''}

${options.includeProjects ? `STEP 5 — PROJECTS:
Generate 1-2 REAL-WORLD PROJECTS per module.
Each project must include:
• Project title
• Difficulty level
• Problem statement
• Tech stack
• Step-by-step milestones
• Deliverables checklist
• Evaluation method (manual/auto)
Projects must simulate real industry work.` : ''}

${options.includeTests ? `STEP 6 — ASSESSMENTS:
Generate assessments per module including:
• 10-15 MCQs (mix of easy/medium/hard)
• Scenario-based questions
• Passing percentage (typically 70%)
• Clear explanations for each answer` : ''}

STEP 7 — CERTIFICATE LOGIC:
Define certificate eligibility rules:
• Minimum % labs completed
• Test pass requirement
• Project submission requirement

Return a SINGLE JSON object with this EXACT structure:
{
  "name": "Course Name",
  "description": "2-3 sentence course description",
  "overview": "Detailed overview paragraph",
  "level": "${options.level}",
  "targetAudience": "Target audience description",
  "duration": "X weeks / Y hours",
  "learningOutcomes": ["outcome1", "outcome2", ...],
  "jobRoles": ["role1", "role2", ...],
  "skills": ["skill1", "skill2", ...],
  "modules": [
    {
      "title": "Module Title",
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
  ]${options.includeLabs ? `,
  "labs": [
    {
      "moduleIndex": 0,
      "lessonIndex": 0,
      "title": "Lab Title",
      "problemStatement": "Clear problem description",
      "language": "javascript",
      "starterCode": "// Starter code with TODO comments\\nfunction solution() {\\n  // TODO: Implement\\n}",
      "expectedOutput": "Expected output string",
      "validationType": "output",
      "hints": ["hint1", "hint2"],
      "estimatedTime": "15 minutes",
      "difficulty": "beginner"
    }
  ]` : ''}${options.includeProjects ? `,
  "projects": [
    {
      "moduleIndex": 0,
      "title": "Project Title",
      "problemStatement": "Clear problem description",
      "techStack": ["tech1", "tech2"],
      "difficulty": "intermediate",
      "milestones": ["milestone1", "milestone2"],
      "deliverables": ["deliverable1", "deliverable2"],
      "evaluationMethod": "manual"
    }
  ]` : ''}${options.includeTests ? `,
  "tests": [
    {
      "moduleIndex": 0,
      "title": "Module Assessment",
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
    }
  ]` : ''},
  "certificateRules": {
    "minLabsCompleted": ${options.includeLabs ? 80 : 0},
    "testPassRequired": ${options.includeTests},
    "projectSubmissionRequired": ${options.includeProjects},
    "minScore": 70
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as FullCourseGeneration;
}

export async function generateModulesForCourse(courseName: string, courseDescription: string, level: string): Promise<CourseGeneration["modules"]> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

Generate 5 well-structured learning modules for the following course:

Course: ${courseName}
Description: ${courseDescription}
Level: ${level}

For each module, provide:
- A clear title
- A brief description
- Estimated time to complete
- 3-5 lessons with objectives, key concepts, and time estimates

Modules must follow logical difficulty progression.

Return as a JSON object with this structure:
{
  "modules": [
    {
      "title": "Module Title",
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
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  return parsed.modules || parsed;
}

export async function generateProjectForModule(moduleTitle: string, courseName: string): Promise<ProjectGeneration> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

Generate a realistic, job-oriented project for the following module:

Course: ${courseName}
Module: ${moduleTitle}

Create a project that:
1. Is practical and industry-relevant
2. Can be completed in 4-8 hours
3. Has clear step-by-step implementation guide
4. Includes proper tech stack recommendations
5. Simulates real industry work

Return as JSON with this structure:
{
  "title": "Project Title",
  "problemStatement": "Clear, detailed problem description",
  "techStack": ["tech1", "tech2"],
  "folderStructure": "project/\\n├── src/\\n│   ├── index.js\\n│   └── ...",
  "difficulty": "intermediate",
  "evaluationChecklist": ["criterion1", "criterion2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title",
      "description": "Detailed step description",
      "codeSnippet": "optional code example",
      "tips": ["tip1", "tip2"]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as ProjectGeneration;
}

export async function generateTestForModule(moduleTitle: string, lessonTitles: string[]): Promise<TestGeneration> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

Generate an assessment test for the following module:

Module: ${moduleTitle}
Lessons covered: ${lessonTitles.join(", ")}

Create a test with:
- 10-15 questions
- Mix of MCQ (easy, medium, hard) and scenario-based questions
- Clear explanations for each answer
- Passing percentage of 70%

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
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as TestGeneration;
}

export async function generateNotesForLesson(lessonTitle: string, objectives: string[], keyConcepts: string[]): Promise<NotesGeneration> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

Generate comprehensive learning notes for the following lesson:

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
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as NotesGeneration;
}

export async function generateLabForLesson(lessonTitle: string, objectives: string[], keyConcepts: string[], language: string = "javascript"): Promise<LabGeneration> {
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

Generate a PRACTICE LAB for the following lesson:

Lesson: ${lessonTitle}
Objectives: ${objectives.join(", ")}
Key Concepts: ${keyConcepts.join(", ")}
Programming Language: ${language}

Create a lab that:
1. Reinforces the lesson concepts through hands-on practice
2. Is suitable for browser-based execution
3. Has automatic validation
4. Provides hints but NEVER the direct answer
5. Is beginner-friendly but challenging

Return as JSON with this structure:
{
  "title": "Lab: ${lessonTitle}",
  "problemStatement": "Clear problem description with requirements",
  "language": "${language}",
  "starterCode": "// Starter code with TODO comments\\nfunction solution() {\\n  // TODO: Implement your solution here\\n}",
  "expectedOutput": "Expected output string for validation",
  "validationType": "output",
  "hints": ["hint1", "hint2", "hint3"],
  "estimatedTime": "15-20 minutes",
  "difficulty": "beginner"
}

IMPORTANT:
- starterCode must be functional with TODO comments showing where to implement
- hints should guide thinking, not give away the solution
- expectedOutput must match what the correct solution produces
- validationType can be: output, console, regex, function`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as LabGeneration;
}

export { CourseGeneration, FullCourseGeneration, ProjectGeneration, TestGeneration, NotesGeneration, LabGeneration };
