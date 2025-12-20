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

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const courseId = id ? parseInt(id) : undefined;

  const { data: course, isLoading } = useQuery<CourseWithRelations>({
    queryKey: ["/api/courses", courseId],
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
        description: "The course is now live on all platforms.",
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
          <Link href={`/courses/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit-course">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {course.status === "draft" && (
            <Button onClick={() => setShowPublishDialog(true)} data-testid="button-publish-course">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
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
        </div>
      </div>

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
          <TabsTrigger value="certificate" data-testid="tab-certificate">Certificate</TabsTrigger>
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
              <Button size="sm" data-testid="button-add-module">
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
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
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons?.length || 0} lessons
                            {module.estimatedTime && ` • ${module.estimatedTime}`}
                          </p>
                        </div>
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
                  actionLabel="Generate with AI"
                  onAction={() => generateContentMutation.mutate("modules")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg">Course Projects</CardTitle>
              <Button size="sm" data-testid="button-add-project">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </CardHeader>
            <CardContent>
              {projectCount > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {course.modules?.flatMap((module) =>
                    module.projects?.map((project) => (
                      <Card key={project.id} className="overflow-visible">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium">{project.title}</h4>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {project.difficulty}
                            </Badge>
                          </div>
                          {project.problemStatement && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {project.problemStatement}
                            </p>
                          )}
                          {project.techStack && project.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.techStack.map((tech, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Add real-world projects to give students hands-on experience."
                  actionLabel="Generate with AI"
                  onAction={() => generateContentMutation.mutate("projects")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg">Assessments & Tests</CardTitle>
              <Button size="sm" data-testid="button-add-test">
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </CardHeader>
            <CardContent>
              {testCount > 0 ? (
                <div className="space-y-3">
                  {course.modules?.flatMap((module) =>
                    module.tests?.map((test) => (
                      <div key={test.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <FileCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{test.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Pass: {test.passingPercentage}%
                            {test.timeLimit && ` • ${test.timeLimit} min`}
                          </p>
                        </div>
                        {test.isLocked && (
                          <Badge variant="secondary">Locked</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={FileCheck}
                  title="No tests yet"
                  description="Add assessments to evaluate student learning and grant certificates."
                  actionLabel="Generate with AI"
                  onAction={() => generateContentMutation.mutate("tests")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificate Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Certificate Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {course.certificateType || "Completion"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Requirements</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Complete all modules</li>
                      {course.includeTests && <li>Pass final assessment</li>}
                      {course.includeProjects && <li>Complete at least one project</li>}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-center p-8 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Certificate preview will appear here
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Course</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing will make this course available on all Siksha platforms:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>learn.aisiksha.in - Course content</li>
                <li>test.aisiksha.in - Assessments</li>
                <li>profile.aisiksha.in - Skill mapping</li>
                <li>udyog.aisiksha.in - Job relevance</li>
              </ul>
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
    </div>
  );
}
