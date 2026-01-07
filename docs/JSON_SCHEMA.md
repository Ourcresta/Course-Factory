# JSON Course Import Schema - OurShiksha Guru v1.0

This document describes the JSON schema for importing courses into the OurShiksha Guru platform.

## Endpoint

```
POST /api/courses/import
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>
```

## Minimal Required Schema

The minimum required fields to import a course:

```json
{
  "name": "Course Name",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title"
        }
      ]
    }
  ]
}
```

## Complete Schema Reference

```json
{
  "name": "Full Stack Web Development Bootcamp",
  "description": "Comprehensive course covering frontend and backend development",
  "overview": "Detailed overview of the course structure and goals",
  "level": "intermediate",
  "targetAudience": "Junior developers looking to level up",
  "duration": "12 weeks",
  "learningOutcomes": [
    "Build full-stack applications",
    "Master React and Node.js",
    "Deploy to cloud platforms"
  ],
  "jobRoles": [
    "Full Stack Developer",
    "Web Developer",
    "Software Engineer"
  ],
  "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  
  "modules": [
    {
      "title": "Module 1: JavaScript Fundamentals",
      "description": "Learn core JavaScript concepts",
      "estimatedTime": "10 hours",
      "lessons": [
        {
          "title": "Variables and Data Types",
          "objectives": ["Understand variable declarations", "Master data types"],
          "estimatedTime": "45 minutes",
          "keyConcepts": ["let", "const", "var", "primitives", "objects"]
        },
        {
          "title": "Functions and Scope",
          "objectives": ["Create reusable functions", "Understand closure"],
          "estimatedTime": "60 minutes",
          "keyConcepts": ["arrow functions", "closures", "hoisting"]
        }
      ]
    },
    {
      "title": "Module 2: React Basics",
      "description": "Introduction to React framework",
      "estimatedTime": "15 hours",
      "lessons": [
        {
          "title": "Components and JSX",
          "objectives": ["Build React components"],
          "keyConcepts": ["JSX", "props", "state"]
        }
      ]
    }
  ],

  "labs": [
    {
      "title": "Build a Calculator",
      "moduleIndex": 0,
      "lessonIndex": 1,
      "language": "javascript",
      "difficulty": "beginner",
      "instructions": "Create a simple calculator with add, subtract, multiply, divide operations",
      "starterCode": "function add(a, b) {\n  // Your code here\n}",
      "expectedOutput": "10",
      "hints": [
        "Use the + operator for addition",
        "Remember to handle edge cases"
      ],
      "estimatedTime": "30 minutes"
    }
  ],

  "projects": [
    {
      "title": "Todo Application",
      "moduleIndex": 1,
      "difficulty": "intermediate",
      "problemStatement": "Build a fully functional todo app with CRUD operations",
      "techStack": ["React", "TypeScript", "CSS"],
      "deliverables": [
        "Working todo app",
        "Add, edit, delete tasks",
        "Local storage persistence",
        "Responsive design"
      ]
    }
  ],

  "tests": [
    {
      "title": "JavaScript Fundamentals Quiz",
      "moduleIndex": 0,
      "description": "Test your JavaScript knowledge",
      "passingPercentage": 70,
      "questions": [
        {
          "questionText": "What is the difference between let and var?",
          "type": "mcq",
          "difficulty": "easy",
          "options": [
            "let is block-scoped, var is function-scoped",
            "They are the same",
            "var is block-scoped, let is function-scoped",
            "Neither has scope"
          ],
          "correctAnswer": "let is block-scoped, var is function-scoped",
          "explanation": "let creates block-scoped variables while var creates function-scoped variables"
        }
      ]
    }
  ],

  "pricing": {
    "basePrice": 4999,
    "discountPrice": 2999,
    "creditCost": 1200,
    "isFree": false,
    "freePreviewLessons": 3
  },

  "rewards": {
    "coinName": "DevCoins",
    "coinIcon": "coins",
    "coinsEnabled": true,
    "rules": {
      "lessonCompletion": 10,
      "moduleCompletion": 50,
      "testPass": 100,
      "projectSubmission": 200,
      "labCompletion": 20,
      "courseCompletion": 500
    },
    "bonus": {
      "firstAttemptPass": 50,
      "perfectScore": 100,
      "streakBonus": 25
    }
  },

  "achievementCards": [
    {
      "title": "JavaScript Master",
      "description": "Completed all JavaScript modules",
      "icon": "award",
      "rarity": "rare",
      "conditionType": "module_complete",
      "conditionValue": 1
    }
  ],

  "motivationalCards": [
    {
      "message": "Great start! You've completed 25% of the course!",
      "icon": "sparkles",
      "triggerType": "percentage",
      "triggerValue": 25
    }
  ],

  "certificateRules": {
    "testPassRequired": true,
    "projectSubmissionRequired": true,
    "minScore": 70,
    "minLabsCompleted": 5
  },

  "scholarship": {
    "enabled": true,
    "coinsToDiscount": 500,
    "discountType": "percentage",
    "discountValue": 10,
    "validityDays": 30
  }
}
```

## Field Reference

### Course Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Course title |
| description | string | No | "" | Short description |
| overview | string | No | "" | Detailed overview |
| level | enum | No | "beginner" | beginner, intermediate, advanced |
| targetAudience | string | No | "" | Who is this for |
| duration | string | No | "" | Estimated duration |
| learningOutcomes | string[] | No | [] | What students will learn |
| jobRoles | string[] | No | [] | Career paths |
| skills | string[] | No | [] | Skills covered |

### Module Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Module title |
| description | string | No | Module description |
| estimatedTime | string | No | Time to complete |
| lessons | array | Yes | Array of lessons |

### Lesson Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Lesson title |
| objectives | string[] | No | Learning objectives |
| estimatedTime | string | No | Time to complete |
| keyConcepts | string[] | No | Key topics covered |

### Lab Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Lab title |
| moduleIndex | number | No | Which module (0-indexed) |
| lessonIndex | number | No | Which lesson (0-indexed) |
| language | string | No | Programming language |
| difficulty | string | No | beginner, intermediate, advanced |
| instructions | string | No | Lab instructions |
| starterCode | string | No | Initial code template |
| expectedOutput | string | No | Expected result |
| hints | string[] | No | Hints for students |

### Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Project title |
| moduleIndex | number | No | Which module (0-indexed) |
| problemStatement | string | No | What to build |
| difficulty | string | No | Difficulty level |
| techStack | string[] | No | Technologies used |
| deliverables | string[] | No | Expected outputs |

### Test Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Test title |
| moduleIndex | number | No | Which module |
| description | string | No | Test description |
| passingPercentage | number | No | Pass threshold (default: 70) |
| questions | array | No | Array of questions |

### Question Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questionText | string | Yes | The question |
| type | string | No | mcq, true_false, short_answer |
| difficulty | string | No | easy, medium, hard |
| options | string[] | No | Answer choices for MCQ |
| correctAnswer | string | Yes | Correct answer |
| explanation | string | No | Why this is correct |

### Pricing Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| basePrice | number | Level-based | Original price in ₹ |
| discountPrice | number | - | Sale price in ₹ |
| creditCost | number | 40% of price | Credit cost |
| isFree | boolean | false | Free course flag |

**Default Pricing by Level:**
- Beginner: ₹1,999
- Intermediate: ₹3,999
- Advanced: ₹5,999

## Response Format

### Success Response

```json
{
  "success": true,
  "id": 123,
  "name": "Course Name",
  "message": "Course \"Course Name\" imported successfully with 5 modules"
}
```

### Validation Error Response

```json
{
  "success": false,
  "errors": [
    "Course name is required",
    "Module 1: at least one lesson is required"
  ],
  "message": "Validation failed with 2 error(s)"
}
```

### Server Error Response

```json
{
  "success": false,
  "error": "Failed to import course"
}
```

## Best Practices

1. **Validate Locally First**: Use the frontend JSON Import tab to validate before API calls
2. **Start Simple**: Import with minimal fields first, add complexity gradually
3. **Use Module/Lesson Indexes**: Labs, projects, and tests reference modules by 0-indexed position
4. **Include Pricing**: If not included, default pricing is applied based on level
5. **Test Questions**: Ensure correctAnswer matches one of the options exactly

## Example: Minimal Import

```bash
curl -X POST https://yourdomain.com/api/courses/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Quick Start Course",
    "level": "beginner",
    "modules": [
      {
        "title": "Getting Started",
        "lessons": [
          {"title": "Welcome"},
          {"title": "Setup Guide"}
        ]
      }
    ]
  }'
```

---

**Version**: 1.0
**Last Updated**: January 2026
