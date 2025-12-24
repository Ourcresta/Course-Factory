# Shishya Portal - Data Requirements from Guru Admin Portal

## Overview

This document outlines all data that the OurShiksha Shishya student portal needs to fetch from the Guru Admin Portal via the Public API.

---

## Authentication

All API requests must include:
```
X-API-Key: ais_<64_hex_characters>
```

API keys are managed in Guru Admin Portal under Settings > API Keys.

---

## Public API Endpoints

### 1. GET /api/public/courses

**Purpose**: List all published courses for course catalog/browse page

**Response Structure**:
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": 1,
      "name": "Full Stack Web Development",
      "description": "Complete course on modern web development...",
      "level": "intermediate",
      "targetAudience": "Aspiring web developers",
      "duration": "40 hours",
      "learningOutcomes": ["Build REST APIs", "Create React apps", ...],
      "jobRoles": ["Frontend Developer", "Full Stack Developer"],
      "thumbnailUrl": "https://...",
      "publishedAt": "2024-01-15T10:30:00Z",
      "creditCost": 500,
      "isFree": false,
      "skillTags": ["React", "Node.js", "TypeScript"],
      "moduleCount": 8,
      "lessonCount": 45,
      "labCount": 20,
      "testCount": 8,
      "projectCount": 3,
      "hasCertificate": true
    }
  ]
}
```

**Shishya Usage**:
- Course catalog/browse page
- Search and filter courses
- Display course cards with metadata
- Show pricing (credits/free)

---

### 2. GET /api/public/courses/:id

**Purpose**: Get complete course details including modules, lessons, and AI notes

**Response Structure**:
```json
{
  "success": true,
  "course": {
    "id": 1,
    "name": "Full Stack Web Development",
    "description": "Complete course on modern web development...",
    "level": "intermediate",
    "targetAudience": "Aspiring web developers",
    "duration": "40 hours",
    "learningOutcomes": ["Build REST APIs", "Create React apps"],
    "jobRoles": ["Frontend Developer", "Full Stack Developer"],
    "thumbnailUrl": "https://...",
    "publishedAt": "2024-01-15T10:30:00Z",
    "creditCost": 500,
    "isFree": false,
    "modules": [
      {
        "id": 1,
        "title": "Introduction to Web Development",
        "description": "Overview of web technologies",
        "estimatedTime": "2 hours",
        "order": 1,
        "lessons": [
          {
            "id": 1,
            "title": "What is Web Development?",
            "objectives": ["Understand web architecture", "Learn HTTP basics"],
            "keyConceptsList": ["Client-Server", "HTTP/HTTPS", "DNS"],
            "order": 1,
            "aiMithraContext": "Focus on practical examples...",
            "mithraContent": "Detailed AI tutor content..."
          }
        ]
      }
    ],
    "skills": [
      {
        "id": 1,
        "name": "React",
        "category": "Frontend"
      }
    ]
  }
}
```

**Shishya Usage**:
- Course detail page
- Course syllabus/outline display
- Lesson navigation
- AI Mithra tutor integration (using aiMithraContext & mithraContent)
- Track learning progress per lesson/module

---

### 3. GET /api/public/courses/:id/tests

**Purpose**: Get all tests and questions for a course

**Response Structure**:
```json
{
  "success": true,
  "count": 8,
  "tests": [
    {
      "id": 1,
      "title": "Module 1 Assessment",
      "description": "Test your understanding of web basics",
      "moduleId": 1,
      "moduleName": "Introduction to Web Development",
      "passingPercentage": 70,
      "timeLimitMinutes": 30,
      "order": 1,
      "questions": [
        {
          "id": 1,
          "questionText": "What protocol is used for secure web communication?",
          "questionType": "mcq",
          "difficulty": "easy",
          "options": ["HTTP", "HTTPS", "FTP", "SMTP"],
          "correctAnswer": "HTTPS",
          "explanation": "HTTPS uses TLS/SSL encryption...",
          "points": 10,
          "order": 1
        },
        {
          "id": 2,
          "questionText": "You're building an e-commerce site. A customer reports...",
          "questionType": "scenario",
          "difficulty": "hard",
          "options": ["Debug frontend", "Check server logs", "Review database"],
          "correctAnswer": "Check server logs",
          "explanation": "Server logs provide the most direct insight...",
          "points": 20,
          "order": 2
        }
      ]
    }
  ]
}
```

**Shishya Usage**:
- Render test interface for students
- Timer functionality (timeLimitMinutes)
- Auto-grading based on correctAnswer
- Show explanations after submission
- Calculate scores and passing status
- Track test attempts and results

---

### 4. GET /api/public/courses/:id/projects

**Purpose**: Get all projects with requirements and skill mappings

**Response Structure**:
```json
{
  "success": true,
  "count": 3,
  "projects": [
    {
      "id": 1,
      "title": "Build a Todo App",
      "description": "Create a full-stack todo application...",
      "objectives": ["Implement CRUD operations", "Use React state management"],
      "deliverables": ["Working frontend", "REST API", "Documentation"],
      "submissionInstructions": "Submit GitHub repo link...",
      "evaluationNotes": "Focus on code quality and UX...",
      "estimatedTime": "8 hours",
      "order": 1,
      "skills": [
        {
          "id": 1,
          "name": "React",
          "category": "Frontend"
        },
        {
          "id": 2,
          "name": "Node.js",
          "category": "Backend"
        }
      ]
    }
  ]
}
```

**Shishya Usage**:
- Display project requirements page
- Show skill tags students will earn
- Submission form with instructions
- Track project completion status
- Faculty/AI evaluation integration

---

### 5. GET /api/public/courses/:id/labs

**Purpose**: Get all practice labs with code exercises and validation

**Response Structure**:
```json
{
  "success": true,
  "count": 20,
  "labs": [
    {
      "id": 1,
      "title": "Create Your First React Component",
      "description": "Learn to build functional components",
      "lessonId": 5,
      "lessonName": "React Components",
      "starterCode": "function App() {\n  // Your code here\n  return null;\n}",
      "solutionCode": "function App() {\n  return <h1>Hello World</h1>;\n}",
      "validationType": "output",
      "expectedOutput": "<h1>Hello World</h1>",
      "hints": [
        {
          "level": 1,
          "text": "Think about what JSX returns"
        },
        {
          "level": 2,
          "text": "Use HTML-like syntax inside the return statement"
        },
        {
          "level": 3,
          "text": "Try: return <h1>Hello World</h1>"
        }
      ],
      "aiContext": "Student is learning React basics...",
      "unlockMechanism": "lesson_complete",
      "unlockReferenceId": "5",
      "certificateWeight": 5,
      "order": 1
    }
  ]
}
```

**Shishya Usage**:
- Code editor interface with starterCode
- Run and validate student code
- Progressive hint system (no direct answers)
- AI Mithra integration using aiContext
- Unlock logic based on unlockMechanism:
  - `always`: Always available
  - `lesson_complete`: After completing lessonId
  - `test_pass`: After passing specific test
  - `lab_complete`: After completing previous lab
  - `module_complete`: After completing module
- Track lab completions for certificate progress

---

### 6. GET /api/public/courses/:id/certificate

**Purpose**: Get certificate requirements and configuration

**Response Structure**:
```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "courseId": 1,
    "title": "Full Stack Web Development Certificate",
    "description": "Awarded upon successful completion...",
    "templateUrl": "https://...",
    "requiredTestIds": [1, 2, 3, 4, 5, 6, 7, 8],
    "requiredTestPassPercent": 100,
    "requiredProjectIds": [1, 2, 3],
    "requiredProjectCompletion": 100,
    "requiredLabIds": [1, 2, 3, 4, 5, 10, 15, 20],
    "requiredLabCompletion": 80,
    "minimumLabWeight": 40,
    "skills": [
      {
        "id": 1,
        "name": "React",
        "category": "Frontend"
      },
      {
        "id": 2,
        "name": "Node.js",
        "category": "Backend"
      }
    ],
    "isActive": true
  }
}
```

**Shishya Usage**:
- Display certificate requirements on course page
- Track student progress toward certificate:
  - Tests passed vs required
  - Projects completed vs required
  - Labs completed vs required
  - Total lab weight accumulated
- Generate certificate when requirements met
- Add earned skills to student profile

---

## Data Needed for Shishya Features

### Course Catalog & Browse
- All published courses with metadata
- Skill tags for filtering
- Price/credit information
- Course stats (modules, lessons, labs count)

### Course Learning Experience
- Module and lesson structure
- Lesson content and AI context
- Navigation between lessons
- Progress tracking per lesson

### AI Mithra Tutor
- `aiMithraContext` from lessons
- `mithraContent` for detailed AI responses
- `aiContext` from labs for contextual help

### Assessments
- Test questions with MCQ and scenario types
- Timer functionality
- Auto-grading logic
- Score calculation

### Practice Labs
- Code editor with starter code
- Validation against expected output
- Progressive hints (no solutions)
- Unlock conditions

### Projects
- Project requirements and deliverables
- Skill mappings
- Submission workflow

### Certificates
- Eligibility requirements
- Progress tracking
- Certificate generation
- Skill badge awards

### Gamification (Future)
- Lab weights for points
- Skill badges earned
- Leaderboard data
- Streak tracking

---

## Implementation Notes

### Caching Strategy
- Course list: Cache for 5 minutes
- Course details: Cache for 15 minutes
- Tests/Labs: Cache until course unpublished

### Error Handling
- 401: Prompt re-authentication or API key setup
- 403: Show subscription required message
- 404: Course not found or unpublished
- 500: Retry with exponential backoff

### Security
- Never expose API keys in frontend code
- Validate all API responses
- Sanitize lesson/lab content for XSS

---

## Next Steps

1. Implement public API endpoints in Guru (server/routes.ts)
2. Add API key validation middleware
3. Create response formatters for each endpoint
4. Test with Shishya portal integration
5. Add rate limiting for public API
