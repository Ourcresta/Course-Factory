import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Pencil,
  Send,
  MoreVertical,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FolderKanban,
  FileCheck,
  Award,
  Loader2,
  Target,
  Briefcase,
  Check,
  X,
  Globe,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { FormSkeleton, ModuleListSkeleton } from "@/components/loading-skeleton";
import { CertificateDesigner } from "@/components/certificate-designer";
import { TestManager } from "@/components/test-manager";
import { ProjectManager } from "@/components/project-manager";
import { LabManager } from "@/components/lab-manager";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Course, Module, Lesson, Project, Test } from "@shared/schema";

interface CourseWithRelations extends Course {
  modules?: (Module & {
    lessons?: Lesson[];
    projects?: Project[];
    tests?: Test[];
  })[];
}

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function ChecklistItem({ label, checked, description }: { label: string; checked: boolean; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${checked ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
        {checked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const courseId = id ? parseInt(id) : undefined;

  const { data: course, isLoading } = useQuery<CourseWithRelations>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId && !isNaN(courseId),
  });

  const { data: certificate } = useQuery<import("@shared/schema").Certificate | null>({
    queryKey: ["/api/courses", courseId, "certificate"],
    enabled: !!courseId && !isNaN(courseId),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Course published",
        description: "The course is now available via the public API.",
      });
      setShowPublishDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish the course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/unpublish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Course unpublished",
        description: "The course is now in draft mode and editable.",
      });
      setShowUnpublishDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unpublish the course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async (type: string) => {
      await apiRequest("POST", `/api/courses/${id}/generate/${type}`);
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      toast({
        title: "Generation started",
        description: `AI is generating ${type}. This may take a moment.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <FormSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
        <Link href="/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Course not found"
            description="The course you're looking for doesn't exist or has been deleted."
            actionLabel="View All Courses"
            onAction={() => window.location.href = "/courses"}
          />
        </Card>
      </div>
    );
  }

  const moduleCount = course.modules?.length || 0;
  const lessonCount = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const projectCount = course.modules?.reduce((acc, m) => acc + (m.projects?.length || 0), 0) || 0;
  const testCount = course.modules?.reduce((acc, m) => acc + (m.tests?.length || 0), 0) || 0;

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/courses">
          <Button variant="ghost" size="sm" data-testid="button-back-to-courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <StatusBadge status={course.status as "draft" | "published" | "generating" | "error"} />
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${levelColors[course.level] || levelColors.beginner}`}>
              {course.level}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-course-name">
            {course.name}
          </h1>
          {course.description && (
            <p className="text-muted-foreground max-w-2xl">{course.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.status !== "published" && (
            <Link href={`/courses/${id}/edit`}>
              <Button variant="outline" data-testid="button-edit-course">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {course.status === "draft" && (
            <Button onClick={() => setShowPublishDialog(true)} data-testid="button-publish-course">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {course.status === "published" && (
            <Button variant="outline" onClick={() => setShowUnpublishDialog(true)} data-testid="button-unpublish-course">
              <X className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          )}
          {course.status !== "published" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-course-actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateContentMutation.mutate("modules")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Modules with AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateContentMutation.mutate("notes")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Notes with AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateContentMutation.mutate("projects")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Projects with AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateContentMutation.mutate("tests")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Tests with AI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {course.status === "published" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">This course is published and live</p>
            <p className="text-xs text-green-600 dark:text-green-400">Unpublish to make changes to the course content.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{moduleCount}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lessonCount}</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectCount}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{testCount}</p>
              <p className="text-sm text-muted-foreground">Tests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">Modules</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
          <TabsTrigger value="tests" data-testid="tab-tests">Tests</TabsTrigger>
          <TabsTrigger value="labs" data-testid="tab-labs">Labs</TabsTrigger>
          <TabsTrigger value="certificate" data-testid="tab-certificate">Certificate</TabsTrigger>
          <TabsTrigger value="publish" data-testid="tab-publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {course.overview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.overview}</p>
                  </CardContent>
                </Card>
              )}

              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Learning Outcomes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">{course.duration}</p>
                      </div>
                    </div>
                  )}
                  {course.targetAudience && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Target Audience</p>
                        <p className="text-sm text-muted-foreground">{course.targetAudience}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Certificate</p>
                      <p className="text-sm text-muted-foreground capitalize">{course.certificateType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {course.jobRoles && course.jobRoles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Job Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {course.jobRoles.map((role, index) => (
                        <Badge key={index} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg">Course Modules</CardTitle>
              <div className="flex items-center gap-2">
                <Link href={`/courses/${id}/modules`}>
                  <Button variant="outline" size="sm" data-testid="button-manage-modules">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Modules
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <Collapsible
                      key={module.id}
                      open={expandedModules.has(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-3 p-4 rounded-lg border hover-elevate" data-testid={`module-${module.id}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <Link href={`/courses/${id}/modules/${module.id}`} className="flex-1 min-w-0">
                          <h4 className="font-medium truncate hover:text-primary">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons?.length || 0} lessons
                            {module.estimatedTime && ` • ${module.estimatedTime}`}
                          </p>
                        </Link>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {expandedModules.has(module.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="pl-16 pr-4 py-2">
                        {module.lessons && module.lessons.length > 0 ? (
                          <ul className="space-y-2">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                                <Sparkles className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.estimatedTime && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {lesson.estimatedTime}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            No lessons yet. Generate lessons with AI or add them manually.
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No modules yet"
                  description="Add modules to structure your course content, or let AI generate them for you."
                  action={
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => generateContentMutation.mutate("modules")}
                        disabled={generateContentMutation.isPending}
                      >
                        {generateContentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate with AI
                      </Button>
                      <Link href={`/courses/${id}/modules`}>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Manually
                        </Button>
                      </Link>
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectManager
            courseId={courseId!}
            isPublished={course.status === "published"}
            certificate={certificate || null}
          />
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <TestManager
            courseId={courseId!}
            modules={course.modules || []}
            isPublished={course.status === "published"}
            certificate={certificate || null}
          />
        </TabsContent>

        <TabsContent value="labs" className="mt-6">
          <LabManager
            courseId={courseId!}
            isPublished={course.status === "published"}
            certificate={certificate || null}
          />
        </TabsContent>

        <TabsContent value="certificate" className="mt-6">
          <CertificateDesigner
            courseId={courseId!}
            courseName={course.name}
            courseLevel={course.level}
            isPublished={course.status === "published"}
          />
        </TabsContent>

        <TabsContent value="publish" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Publication Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={course.status as "draft" | "published" | "generating" | "error"} />
                      <div>
                        <p className="font-medium">
                          {course.status === "published" ? "Course is Live" : "Course is in Draft"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.publishedAt
                            ? `Published on ${new Date(course.publishedAt).toLocaleDateString()}`
                            : "Not published yet"}
                        </p>
                      </div>
                    </div>
                    {course.status === "draft" && (
                      <Button onClick={() => setShowPublishDialog(true)} data-testid="button-publish-from-tab">
                        <Send className="h-4 w-4 mr-2" />
                        Publish Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Publication Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <ChecklistItem
                      label="Course has modules"
                      checked={moduleCount > 0}
                      description={`${moduleCount} modules created`}
                    />
                    <ChecklistItem
                      label="Lessons are added"
                      checked={lessonCount > 0}
                      description={`${lessonCount} lessons across all modules`}
                    />
                    <ChecklistItem
                      label="Projects configured"
                      checked={!course.includeProjects || projectCount > 0}
                      description={course.includeProjects ? `${projectCount} projects created` : "Projects not required"}
                    />
                    <ChecklistItem
                      label="Tests configured"
                      checked={!course.includeTests || testCount > 0}
                      description={course.includeTests ? `${testCount} tests created` : "Tests not required"}
                    />
                    <ChecklistItem
                      label="Learning outcomes defined"
                      checked={(course.learningOutcomes?.length || 0) > 0}
                      description={`${course.learningOutcomes?.length || 0} outcomes defined`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Course</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing will make this course available via the public API. External platforms like Shishya can then fetch the course content using their API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-publish">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              data-testid="button-confirm-publish"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Course</AlertDialogTitle>
            <AlertDialogDescription>
              Unpublishing will remove this course from the public API and return it to draft mode. The course will become editable again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unpublish">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
              data-testid="button-confirm-unpublish"
            >
              {unpublishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                "Unpublish Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
