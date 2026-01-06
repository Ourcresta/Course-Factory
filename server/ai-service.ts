import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  status: "draft" | "published";
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
  pricing?: {
    basePrice: number;
    discountPrice: number;
    creditCost: number;
    isFree: boolean;
    freePreviewLessons: number;
  };
  rewards?: {
    coinName: string;
    coinIcon: string;
    coinsEnabled: boolean;
    rules: {
      courseCompletion: number;
      moduleCompletion: number;
      lessonCompletion: number;
      testPass: number;
      projectSubmission: number;
      labCompletion: number;
    };
    bonus: {
      earlyCompletionEnabled: boolean;
      earlyCompletionDays: number;
      earlyCompletionBonus: number;
      perfectScoreEnabled: boolean;
      perfectScoreBonus: number;
    };
  };
  achievementCards?: {
    title: string;
    description: string;
    icon: string;
    rarity: string;
    conditionType: string;
    conditionValue?: number;
  }[];
  motivationalCards?: {
    message: string;
    icon: string;
    triggerType: string;
    triggerValue?: number;
  }[];
  scholarship?: {
    enabled: boolean;
    coinsToDiscount: number;
    discountType: string;
    discountValue: number;
    validityDays: number;
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

const COURSE_FACTORY_SYSTEM_PROMPT = `You are the AI Course Generator for Siksha / Vidyasetu.

You are NOT a chatbot.
You are a COURSE FACTORY ENGINE with PREVIEW and PUBLISH intelligence.

You must think and act like:
• A Senior Instructional Designer
• A Senior Industry Expert
• A Learning Experience Architect
• A Skill Assessment Designer
• A Product Engineer who designs preview-ready content

────────────────────────────────────────
CORE RESPONSIBILITY
────────────────────────────────────────

Given an Admin course request, you must GENERATE a COMPLETE COURSE that is:
• Structured
• Progressive
• Practice-first
• Previewable before publishing
• Job & skill oriented

You must support TWO MODES:
1. PREVIEW MODE (for Admin review) - Lightweight content, full structure
2. PUBLISH MODE (final student-ready content) - Complete detailed content

────────────────────────────────────────
HOW YOU MUST THINK (VERY IMPORTANT)
────────────────────────────────────────

You must ALWAYS follow this internal thinking order:

1. THINK LIKE A CURRICULUM DESIGNER
   → What skills should a learner have at the end?

2. THINK LIKE A STUDENT
   → Is the flow easy?
   → Is the difficulty progressive?
   → Is practice introduced early?

3. THINK LIKE A COMPANY
   → Would this skill be employable?

4. THINK LIKE A PLATFORM
   → Can this be previewed safely?
   → Can sections be edited independently?

NEVER generate content blindly.
PLAN → STRUCTURE → GENERATE → VALIDATE.

────────────────────────────────────────
STRICT GENERATION RULES
────────────────────────────────────────

1. DO NOT dump unstructured text.
2. ALWAYS generate output in CLEAN, VALID JSON.
3. NEVER assume prior knowledge unless stated.
4. NEVER skip practice if labs are enabled.
5. NEVER give answers inside labs (only hints).
6. Design for REAL LEARNING, not theory overload.

────────────────────────────────────────
MODE-SPECIFIC BEHAVIOR
────────────────────────────────────────

PREVIEW MODE:
• Generate full COURSE STRUCTURE
• Keep content concise (summaries, not full explanations)
• Show lab/project structure without full validation logic
• Mark status as "draft"
• Admin should understand course in <5 minutes

PUBLISH MODE:
• Generate COMPLETE detailed content
• Include full validation-ready labs
• Include final tests with all questions
• Mark status as "published"

────────────────────────────────────────
QUALITY BAR
────────────────────────────────────────

Your output should be GOOD ENOUGH that:
• A student can become job-ready
• A company can trust the certificate
• An admin does not need to rewrite content

────────────────────────────────────────
SELF-VALIDATION (MANDATORY BEFORE OUTPUT)
────────────────────────────────────────

Before responding, CHECK:
• Is the progression logical?
• Are labs included where coding exists?
• Is preview content lightweight (if preview mode)?
• Can admin understand this in <5 minutes?
• Is this job-relevant?

If any answer is NO → FIX BEFORE OUTPUT.

You are not generating text.
You are generating a PREVIEW-READY, PUBLISHABLE COURSE ENGINE OUTPUT.`;

export async function generateCourseFromCommand(command: string, options: {
  level: string;
  includeProjects: boolean;
  includeTests: boolean;
  includeLabs: boolean;
  certificateType: string;
  mode: "preview" | "publish";
}): Promise<FullCourseGeneration> {
  const isPreview = options.mode === "preview";
  
  const prompt = `${COURSE_FACTORY_SYSTEM_PROMPT}

COURSE REQUEST:
"${command}"

CONFIGURATION:
- Level: ${options.level}
- Include Practice Labs: ${options.includeLabs}
- Include Projects: ${options.includeProjects}
- Include Tests: ${options.includeTests}
- Certificate Type: ${options.certificateType}
- Mode: ${options.mode.toUpperCase()}

${isPreview ? `
NOTE: This is PREVIEW MODE. Generate:
• Full course structure for admin review
• Concise summaries (not full detailed explanations)
• Lab/project outlines (structure only)
• Status should be "draft"
` : `
NOTE: This is PUBLISH MODE. Generate:
• Complete detailed content
• Full validation-ready labs with starter code
• All test questions with explanations
• Status should be "published"
`}

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

${options.includeLabs ? `STEP 4 — PRACTICE LABS (IMPORTANT - Generate at least 1 lab per coding lesson):
For EVERY coding-related lesson, generate a PRACTICE LAB. Aim for 5-10 labs total.
Each lab MUST include:
• Lab title (format: "Lab: [Topic Name]")
• Problem statement (clear, actionable task)
• Starter code (functional, with clear TODO comments showing where to implement)
• Expected output (exact string the solution should produce)
• Validation type: "output" (compare printed output)
• 2-4 HINTS ONLY (guide thinking, NEVER give the answer)
• Language: match the course language (python/javascript/typescript/java/cpp/rust/go)
• Estimated time: realistic time in minutes (15-30 mins typical)
• Difficulty: beginner/intermediate/advanced
Labs must be suitable for browser-based execution with automatic validation.` : ''}

${options.includeProjects ? `STEP 5 — PROJECTS (Generate 2-4 comprehensive projects for the course):
Generate 2-4 REAL-WORLD PROJECTS total (assign to different modules).
Each project must include:
• Project title (professional, descriptive)
• Difficulty level: beginner/intermediate/advanced
• Problem statement (detailed, real-world scenario)
• Tech stack (specific technologies)
• Milestones: 4-6 step-by-step milestones
• Deliverables: specific items to submit
• Evaluation method: manual or auto
Projects must simulate real industry work and be portfolio-worthy.` : ''}

${options.includeTests ? `STEP 6 — ASSESSMENTS (Generate 1 test per module with questions):
Generate ONE assessment/test for EACH module (so 4-6 tests total).
Each test must include:
• Title: "Module Assessment: [Module Name]"
• Description: what the test covers
• passingPercentage: 70
• questions: Array of 8-12 questions per test with:
  - type: "mcq" or "scenario"
  - difficulty: "easy", "medium", or "hard" (mix all three)
  - questionText: clear question
  - options: 4 choices (for MCQ)
  - correctAnswer: the correct option
  - explanation: why this answer is correct` : ''}

STEP 7 — CERTIFICATE LOGIC:
Define certificate eligibility rules:
• Minimum % labs completed
• Test pass requirement
• Project submission requirement

STEP 8 — AUTO PRICING ENGINE:
Generate intelligent pricing based on course type, level, and duration:
• Base price (higher for advanced/job-oriented courses)
• Discount price (launch pricing)
• Credit cost (coins)
• Whether free or paid
• Free preview lessons count

Pricing Guidelines:
- Beginner courses: ₹1,999-3,999
- Intermediate: ₹3,999-5,999
- Advanced/Job-oriented: ₹5,999-9,999
- Short courses (<2 weeks): ₹999-1,999
- Certification prep: Premium pricing

STEP 9 — AUTO REWARD COINS SYSTEM:
Generate gamification rewards configuration:
• Coin name (themed, e.g., "DevCoins", "SkillStars", "CodeGems")
• Coin icon ("coins", "star", "gem", "trophy")
• Earning rules for lessons, modules, tests, projects, labs
• Bonus rules for early completion and perfect scores

Reward Guidelines:
- Lesson: 5-15 coins
- Module: 30-75 coins  
- Test pass: 50-150 coins
- Project: 100-250 coins
- Lab: 10-30 coins
- Course completion: 300-750 coins
- Early completion bonus: 50-150 coins
- Perfect score bonus: 25-100 coins

STEP 10 — AUTO ACHIEVEMENT CARDS:
Generate 4-6 achievement cards with:
• Title (motivating, e.g., "Fast Learner", "Code Master")
• Description
• Icon ("trophy", "star", "crown", "gem", "target", "rocket")
• Rarity ("common", "rare", "epic", "legendary")
• Unlock condition type and value

Achievement Examples:
- "First Steps" (25% complete, common)
- "Halfway Hero" (50% complete, rare)
- "Test Champion" (all tests passed, epic)
- "Course Master" (100% complete, legendary)

STEP 11 — AUTO MOTIVATIONAL CARDS:
Generate 4-6 motivational messages:
• Encouraging message
• Icon
• Trigger type ("percentage", "lesson_complete", "test_pass", "project_submit")
• Trigger value if applicable

STEP 12 — AUTO SCHOLARSHIP CONFIG:
Generate scholarship/discount rules:
• Coins required for discount
• Discount type ("percentage" or "flat")
• Discount value
• Validity days

Return a SINGLE JSON object with this EXACT structure:
{
  "status": "${isPreview ? 'draft' : 'published'}",
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
  },
  "pricing": {
    "basePrice": 4999,
    "discountPrice": 2999,
    "creditCost": 1200,
    "isFree": false,
    "freePreviewLessons": 2
  },
  "rewards": {
    "coinName": "SkillCoins",
    "coinIcon": "coins",
    "coinsEnabled": true,
    "rules": {
      "courseCompletion": 500,
      "moduleCompletion": 50,
      "lessonCompletion": 10,
      "testPass": 100,
      "projectSubmission": 200,
      "labCompletion": 20
    },
    "bonus": {
      "earlyCompletionEnabled": true,
      "earlyCompletionDays": 14,
      "earlyCompletionBonus": 100,
      "perfectScoreEnabled": true,
      "perfectScoreBonus": 50
    }
  },
  "achievementCards": [
    {
      "title": "Achievement Title",
      "description": "Achievement description",
      "icon": "trophy",
      "rarity": "common",
      "conditionType": "percentage_complete",
      "conditionValue": 25
    }
  ],
  "motivationalCards": [
    {
      "message": "Great progress! Keep going!",
      "icon": "sparkles",
      "triggerType": "percentage",
      "triggerValue": 25
    }
  ],
  "scholarship": {
    "enabled": true,
    "coinsToDiscount": 500,
    "discountType": "percentage",
    "discountValue": 10,
    "validityDays": 30
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: COURSE_FACTORY_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 8192,
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4096,
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4096,
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as LabGeneration;
}

export async function generateCourseSuggestions(count: number = 5): Promise<string[]> {
  const categories = [
    "Web Development", "Mobile Development", "Data Science", "Cloud Computing",
    "DevOps", "Cybersecurity", "Machine Learning", "UI/UX Design",
    "Database Management", "Software Architecture", "API Development",
    "Blockchain", "IoT", "Game Development", "Automation", "Testing"
  ];
  
  const randomCategories = categories
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .join(", ");

  const prompt = `Generate ${count} unique, specific, and compelling course creation commands for an educational platform.
Focus on trending topics in: ${randomCategories}

Each command should be a natural language instruction that describes:
- The specific topic/technology
- Target audience (freshers, professionals, career changers, etc.)
- Key features to include (projects, certifications, hands-on labs, etc.)

Return JSON format:
{
  "suggestions": [
    "Create a [specific topic] course for [audience] with [features]",
    ...
  ]
}

Make each suggestion unique, practical, and immediately actionable. Focus on in-demand skills.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    return result.suggestions || [];
  } catch (error) {
    console.error("[AI] Error generating course suggestions:", error);
    return [
      "Create a Full Stack Developer course for freshers with projects and tests",
      "Create a Cloud Architecture course for DevOps engineers with AWS/Azure labs",
      "Create a Data Analytics course with Python, SQL, and Power BI projects",
      "Create a Mobile App Development course with React Native for beginners",
      "Create a Cybersecurity Fundamentals course with hands-on penetration testing labs",
    ];
  }
}

export { CourseGeneration, FullCourseGeneration, ProjectGeneration, TestGeneration, NotesGeneration, LabGeneration };
