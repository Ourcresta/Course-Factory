import { db } from "../db";
import { 
  courses, modules, lessons, tests, questions, projects, projectSteps,
  practiceLabs, certificates, courseRewards, achievementCards, motivationalCards, aiNotes
} from "@shared/schema";
import {
  draftCourses, draftModules, draftLessons, draftTests, draftQuestions, 
  draftProjects, draftProjectSteps, draftPracticeLabs, draftCertificates, 
  draftCourseRewards, draftAchievementCards, draftMotivationalCards, draftAiNotes
} from "@shared/draft-schema";
import { eq, sql } from "drizzle-orm";

interface PublishResult {
  success: boolean;
  liveCourseId?: number;
  error?: string;
}

interface UnpublishResult {
  success: boolean;
  error?: string;
}

export class PublishService {
  async publishDraftCourse(draftCourseId: number): Promise<PublishResult> {
    try {
      const [draftCourse] = await db
        .select()
        .from(draftCourses)
        .where(eq(draftCourses.id, draftCourseId))
        .limit(1);

      if (!draftCourse) {
        return { success: false, error: "Draft course not found" };
      }

      if (draftCourse.status === "generating") {
        return { success: false, error: "Cannot publish while AI is generating content" };
      }

      const draftModulesList = await db
        .select()
        .from(draftModules)
        .where(eq(draftModules.draftCourseId, draftCourseId));

      if (draftModulesList.length === 0) {
        return { success: false, error: "Course must have at least one module" };
      }

      let hasLessons = false;
      for (const mod of draftModulesList) {
        const lessonCount = await db
          .select()
          .from(draftLessons)
          .where(eq(draftLessons.draftModuleId, mod.id));
        if (lessonCount.length > 0) {
          hasLessons = true;
          break;
        }
      }

      if (!hasLessons) {
        return { success: false, error: "Course must have at least one lesson" };
      }

      let liveCourseId: number;

      if (draftCourse.liveCourseId) {
        const [existingLive] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, draftCourse.liveCourseId))
          .limit(1);

        if (existingLive) {
          await this.clearLiveCourseContent(draftCourse.liveCourseId);

          const [updatedCourse] = await db
            .update(courses)
            .set({
              name: draftCourse.name,
              description: draftCourse.description,
              level: draftCourse.level,
              targetAudience: draftCourse.targetAudience,
              duration: draftCourse.duration,
              overview: draftCourse.overview,
              learningOutcomes: draftCourse.learningOutcomes,
              jobRoles: draftCourse.jobRoles,
              includeProjects: draftCourse.includeProjects,
              includeTests: draftCourse.includeTests,
              includeLabs: draftCourse.includeLabs,
              certificateType: draftCourse.certificateType,
              aiCommand: draftCourse.aiCommand,
              thumbnailUrl: draftCourse.thumbnailUrl,
              creditCost: draftCourse.creditCost,
              isFree: draftCourse.isFree,
              originalCreditCost: draftCourse.originalCreditCost,
              status: "published",
              draftCourseId: draftCourseId,
              version: (existingLive.version || 1) + 1,
              updatedAt: sql`CURRENT_TIMESTAMP`,
              publishedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(courses.id, draftCourse.liveCourseId))
            .returning();

          liveCourseId = updatedCourse.id;
        } else {
          liveCourseId = await this.createLiveCourse(draftCourse, draftCourseId);
        }
      } else {
        liveCourseId = await this.createLiveCourse(draftCourse, draftCourseId);
      }

      const moduleIdMap = new Map<number, number>();
      const lessonIdMap = new Map<number, number>();

      for (const draftMod of draftModulesList) {
        const [liveMod] = await db
          .insert(modules)
          .values({
            courseId: liveCourseId,
            title: draftMod.title,
            description: draftMod.description,
            orderIndex: draftMod.orderIndex,
            estimatedTime: draftMod.estimatedTime,
          })
          .returning();

        moduleIdMap.set(draftMod.id, liveMod.id);

        const draftLessonsList = await db
          .select()
          .from(draftLessons)
          .where(eq(draftLessons.draftModuleId, draftMod.id));

        for (const draftLesson of draftLessonsList) {
          const [liveLesson] = await db
            .insert(lessons)
            .values({
              moduleId: liveMod.id,
              title: draftLesson.title,
              objectives: draftLesson.objectives,
              estimatedTime: draftLesson.estimatedTime,
              keyConceptS: draftLesson.keyConcepts,
              videoUrl: draftLesson.videoUrl,
              externalLinks: draftLesson.externalLinks,
              youtubeReferences: draftLesson.youtubeReferences,
              orderIndex: draftLesson.orderIndex,
            })
            .returning();

          lessonIdMap.set(draftLesson.id, liveLesson.id);

          const draftAiNotesList = await db
            .select()
            .from(draftAiNotes)
            .where(eq(draftAiNotes.draftLessonId, draftLesson.id));

          for (const note of draftAiNotesList) {
            await db.insert(aiNotes).values({
              lessonId: liveLesson.id,
              content: note.content,
              simplifiedExplanation: note.simplifiedExplanation,
              bulletNotes: note.bulletNotes,
              keyTakeaways: note.keyTakeaways,
              interviewQuestions: note.interviewQuestions,
              version: note.version,
            });
          }
        }
      }

      const draftTestsList = await db
        .select()
        .from(draftTests)
        .where(eq(draftTests.draftCourseId, draftCourseId));

      for (const draftTest of draftTestsList) {
        const liveModuleId = draftTest.draftModuleId ? moduleIdMap.get(draftTest.draftModuleId) : null;

        const [liveTest] = await db
          .insert(tests)
          .values({
            courseId: liveCourseId,
            moduleId: liveModuleId || null,
            title: draftTest.title,
            description: draftTest.description,
            passingPercentage: draftTest.passingPercentage,
            isLocked: draftTest.isLocked,
            timeLimit: draftTest.timeLimit,
            difficulty: draftTest.difficulty,
            category: draftTest.category,
            tags: draftTest.tags,
            status: "published",
          })
          .returning();

        const draftQuestionsList = await db
          .select()
          .from(draftQuestions)
          .where(eq(draftQuestions.draftTestId, draftTest.id));

        for (const draftQ of draftQuestionsList) {
          await db.insert(questions).values({
            testId: liveTest.id,
            type: draftQ.type,
            difficulty: draftQ.difficulty,
            questionText: draftQ.questionText,
            options: draftQ.options,
            correctAnswer: draftQ.correctAnswer,
            explanation: draftQ.explanation,
            orderIndex: draftQ.orderIndex,
          });
        }
      }

      const draftProjectsList = await db
        .select()
        .from(draftProjects)
        .where(eq(draftProjects.draftCourseId, draftCourseId));

      for (const draftProj of draftProjectsList) {
        const liveModuleId = draftProj.draftModuleId ? moduleIdMap.get(draftProj.draftModuleId) : null;

        const [liveProj] = await db
          .insert(projects)
          .values({
            courseId: liveCourseId,
            moduleId: liveModuleId || null,
            title: draftProj.title,
            description: draftProj.description,
            objectives: draftProj.objectives,
            deliverables: draftProj.deliverables,
            submissionInstructions: draftProj.submissionInstructions,
            evaluationNotes: draftProj.evaluationNotes,
            problemStatement: draftProj.problemStatement,
            techStack: draftProj.techStack,
            folderStructure: draftProj.folderStructure,
            evaluationChecklist: draftProj.evaluationChecklist,
            difficulty: draftProj.difficulty,
            category: draftProj.category,
            tags: draftProj.tags,
            status: "published",
            orderIndex: draftProj.orderIndex,
          })
          .returning();

        const draftStepsList = await db
          .select()
          .from(draftProjectSteps)
          .where(eq(draftProjectSteps.draftProjectId, draftProj.id));

        for (const step of draftStepsList) {
          await db.insert(projectSteps).values({
            projectId: liveProj.id,
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            codeSnippet: step.codeSnippet,
            tips: step.tips,
          });
        }
      }

      const draftLabsList = await db
        .select()
        .from(draftPracticeLabs)
        .where(eq(draftPracticeLabs.draftCourseId, draftCourseId));

      for (const draftLab of draftLabsList) {
        const liveModuleId = draftLab.draftModuleId ? moduleIdMap.get(draftLab.draftModuleId) : null;
        const liveLessonId = draftLab.draftLessonId ? lessonIdMap.get(draftLab.draftLessonId) : null;

        await db.insert(practiceLabs).values({
          courseId: liveCourseId,
          moduleId: liveModuleId || null,
          lessonId: liveLessonId || null,
          category: draftLab.category,
          tags: draftLab.tags,
          slug: draftLab.slug,
          title: draftLab.title,
          description: draftLab.description,
          difficulty: draftLab.difficulty,
          language: draftLab.language,
          estimatedTime: draftLab.estimatedTime,
          instructions: draftLab.instructions,
          starterCode: draftLab.starterCode,
          solutionCode: draftLab.solutionCode,
          expectedOutput: draftLab.expectedOutput,
          validationType: draftLab.validationType,
          unlockType: draftLab.unlockType,
          unlockRefId: draftLab.unlockRefId,
          hints: draftLab.hints,
          aiPromptContext: draftLab.aiPromptContext,
          markLabComplete: draftLab.markLabComplete,
          unlockNext: draftLab.unlockNext,
          contributesToCertificate: draftLab.contributesToCertificate,
          certificateWeight: draftLab.certificateWeight,
          status: "published",
          orderIndex: draftLab.orderIndex,
        });
      }

      const draftCertsList = await db
        .select()
        .from(draftCertificates)
        .where(eq(draftCertificates.draftCourseId, draftCourseId));

      for (const draftCert of draftCertsList) {
        await db.insert(certificates).values({
          courseId: liveCourseId,
          name: draftCert.name,
          description: draftCert.description,
          templateId: draftCert.templateId,
          category: draftCert.category,
          tags: draftCert.tags,
          status: "published",
          type: draftCert.type,
          skillTags: draftCert.skillTags,
          level: draftCert.level,
          requiresTestPass: draftCert.requiresTestPass,
          passingPercentage: draftCert.passingPercentage,
          requiresProjectCompletion: draftCert.requiresProjectCompletion,
          requiresLabCompletion: draftCert.requiresLabCompletion,
          qrVerification: draftCert.qrVerification,
        });
      }

      const [draftReward] = await db
        .select()
        .from(draftCourseRewards)
        .where(eq(draftCourseRewards.draftCourseId, draftCourseId))
        .limit(1);

      if (draftReward) {
        await db.insert(courseRewards).values({
          courseId: liveCourseId,
          coinsEnabled: draftReward.coinsEnabled,
          coinName: draftReward.coinName,
          coinIcon: draftReward.coinIcon,
          rulesJson: draftReward.rulesJson,
          bonusJson: draftReward.bonusJson,
          scholarshipEnabled: draftReward.scholarshipEnabled,
          scholarshipJson: draftReward.scholarshipJson,
        });
      }

      const draftAchievementsList = await db
        .select()
        .from(draftAchievementCards)
        .where(eq(draftAchievementCards.draftCourseId, draftCourseId));

      for (const card of draftAchievementsList) {
        await db.insert(achievementCards).values({
          courseId: liveCourseId,
          title: card.title,
          description: card.description,
          icon: card.icon,
          conditionJson: card.conditionJson,
          rarity: card.rarity,
          isActive: card.isActive,
          sortOrder: card.sortOrder,
        });
      }

      const draftMotivationalList = await db
        .select()
        .from(draftMotivationalCards)
        .where(eq(draftMotivationalCards.draftCourseId, draftCourseId));

      for (const card of draftMotivationalList) {
        await db.insert(motivationalCards).values({
          courseId: liveCourseId,
          message: card.message,
          triggerType: card.triggerType,
          triggerValue: card.triggerValue,
          icon: card.icon,
          isActive: card.isActive,
          sortOrder: card.sortOrder,
        });
      }

      await db
        .update(draftCourses)
        .set({
          liveCourseId: liveCourseId,
          status: "published",
          publishedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(draftCourses.id, draftCourseId));

      return { success: true, liveCourseId };
    } catch (error) {
      console.error("Publish error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Publish failed" };
    }
  }

  private async createLiveCourse(draftCourse: any, draftCourseId: number): Promise<number> {
    const [newLiveCourse] = await db
      .insert(courses)
      .values({
        name: draftCourse.name,
        description: draftCourse.description,
        level: draftCourse.level,
        targetAudience: draftCourse.targetAudience,
        duration: draftCourse.duration,
        overview: draftCourse.overview,
        learningOutcomes: draftCourse.learningOutcomes,
        jobRoles: draftCourse.jobRoles,
        includeProjects: draftCourse.includeProjects,
        includeTests: draftCourse.includeTests,
        includeLabs: draftCourse.includeLabs,
        certificateType: draftCourse.certificateType,
        aiCommand: draftCourse.aiCommand,
        thumbnailUrl: draftCourse.thumbnailUrl,
        creditCost: draftCourse.creditCost,
        isFree: draftCourse.isFree,
        originalCreditCost: draftCourse.originalCreditCost,
        status: "published",
        draftCourseId: draftCourseId,
        version: 1,
        publishedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    return newLiveCourse.id;
  }

  private async clearLiveCourseContent(liveCourseId: number): Promise<void> {
    await db.delete(modules).where(eq(modules.courseId, liveCourseId));
    await db.delete(tests).where(eq(tests.courseId, liveCourseId));
    await db.delete(projects).where(eq(projects.courseId, liveCourseId));
    await db.delete(practiceLabs).where(eq(practiceLabs.courseId, liveCourseId));
    await db.delete(certificates).where(eq(certificates.courseId, liveCourseId));
    await db.delete(courseRewards).where(eq(courseRewards.courseId, liveCourseId));
    await db.delete(achievementCards).where(eq(achievementCards.courseId, liveCourseId));
    await db.delete(motivationalCards).where(eq(motivationalCards.courseId, liveCourseId));
  }

  async unpublishLiveCourse(liveCourseId: number): Promise<UnpublishResult> {
    try {
      const [liveCourse] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, liveCourseId))
        .limit(1);

      if (!liveCourse) {
        return { success: false, error: "Course not found" };
      }

      if (liveCourse.status !== "published") {
        return { success: false, error: "Only published courses can be unpublished" };
      }

      await db
        .update(courses)
        .set({
          status: "unpublished",
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(courses.id, liveCourseId));

      if (liveCourse.draftCourseId) {
        await db
          .update(draftCourses)
          .set({
            status: "draft",
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(draftCourses.id, liveCourse.draftCourseId));
      }

      return { success: true };
    } catch (error) {
      console.error("Unpublish error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unpublish failed" };
    }
  }
}

export const publishService = new PublishService();
