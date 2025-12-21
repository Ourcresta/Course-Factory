import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ModuleListSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Module, Lesson, Course } from "@shared/schema";

interface ModuleWithLessons extends Module {
  lessons?: Lesson[];
}

interface CourseWithModules extends Course {
  modules?: ModuleWithLessons[];
}

export default function ModuleDetail() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    estimatedTime: "",
  });

  const parsedCourseId = courseId ? parseInt(courseId) : undefined;
  const parsedModuleId = moduleId ? parseInt(moduleId) : undefined;

  const { data: course, isLoading } = useQuery<CourseWithModules>({
    queryKey: ["/api/courses", parsedCourseId],
    enabled: !!parsedCourseId && !isNaN(parsedCourseId),
  });

  const module = course?.modules?.find((m) => m.id === parsedModuleId);
  const lessons = module?.lessons || [];

  const createLessonMutation = useMutation({
    mutationFn: async (data: { title: string; estimatedTime: string }) => {
      const orderIndex = lessons.length;
      return apiRequest("POST", "/api/lessons", {
        moduleId: parsedModuleId,
        title: data.title,
        estimatedTime: data.estimatedTime,
        orderIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setShowAddDialog(false);
      setFormData({ title: "", estimatedTime: "" });
      toast({ title: "Lesson created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create lesson", variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Lesson> }) => {
      return apiRequest("PATCH", `/api/lessons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setEditingLesson(null);
      setShowAddDialog(false);
      setFormData({ title: "", estimatedTime: "" });
      toast({ title: "Lesson updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update lesson", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setShowDeleteDialog(false);
      setDeletingLessonId(null);
      toast({ title: "Lesson deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete lesson", variant: "destructive" });
    },
  });

  const generateNotesMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest("POST", `/api/lessons/${lessonId}/generate-notes`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      toast({
        title: "AI notes generation started",
        description: "Notes will be ready shortly.",
      });
    },
    onError: () => {
      toast({ title: "Failed to generate notes", variant: "destructive" });
    },
  });

  const handleMoveLesson = async (lessonId: number, direction: "up" | "down") => {
    const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedLessons.length) return;

    const currentLesson = sortedLessons[currentIndex];
    const targetLesson = sortedLessons[targetIndex];

    await Promise.all([
      apiRequest("PATCH", `/api/lessons/${currentLesson.id}`, { orderIndex: targetLesson.orderIndex }),
      apiRequest("PATCH", `/api/lessons/${targetLesson.id}`, { orderIndex: currentLesson.orderIndex }),
    ]);

    queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
  };

  const handleOpenAddDialog = () => {
    setEditingLesson(null);
    setFormData({ title: "", estimatedTime: "" });
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      estimatedTime: lesson.estimatedTime || "",
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: formData });
    } else {
      createLessonMutation.mutate(formData);
    }
  };

  const handleDelete = (lessonId: number) => {
    setDeletingLessonId(lessonId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingLessonId) {
      deleteLessonMutation.mutate(deletingLessonId);
    }
  };

  if (!parsedCourseId || isNaN(parsedCourseId) || !parsedModuleId || isNaN(parsedModuleId)) {
    navigate("/courses");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <ModuleListSkeleton />
      </div>
    );
  }

  if (!course || !module) {
    navigate(`/courses/${courseId}/modules`);
    return null;
  }

  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={module.title}
        description={module.description || "Manage lessons in this module"}
        backLink={`/courses/${courseId}/modules`}
        backLabel="Back to Modules"
        actions={
          <Button onClick={handleOpenAddDialog} data-testid="button-add-lesson">
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        }
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground">
          {course.name}
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}/modules`} className="hover:text-foreground">
          Modules
        </Link>
        <span>/</span>
        <span className="text-foreground">{module.title}</span>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {module.estimatedTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{module.estimatedTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{lessons.length} lessons</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {sortedLessons.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No lessons yet"
          description="Add lessons to this module to start building your course content."
          action={
            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Lesson
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedLessons.map((lesson, index) => (
            <Card key={lesson.id} className="group" data-testid={`card-lesson-${lesson.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => handleMoveLesson(lesson.id, "up")}
                      data-testid={`button-move-up-${lesson.id}`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === sortedLessons.length - 1}
                      onClick={() => handleMoveLesson(lesson.id, "down")}
                      data-testid={`button-move-down-${lesson.id}`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium">
                          <span className="text-muted-foreground mr-2">
                            {(index + 1).toString().padStart(2, "0")}.
                          </span>
                          {lesson.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {lesson.estimatedTime && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {lesson.estimatedTime}
                          </Badge>
                        )}
                        {lesson.objectives && lesson.objectives.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Target className="h-3 w-3 mr-1" />
                            {lesson.objectives.length} objectives
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 justify-end flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateNotesMutation.mutate(lesson.id)}
                    disabled={generateNotesMutation.isPending}
                    data-testid={`button-generate-notes-${lesson.id}`}
                  >
                    {generateNotesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    AI Notes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(lesson)}
                    data-testid={`button-edit-lesson-${lesson.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lesson.id)}
                    data-testid={`button-delete-lesson-${lesson.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                    <Button size="sm" data-testid={`button-open-lesson-${lesson.id}`}>
                      <FileText className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Update the lesson details below."
                : "Create a new lesson for this module."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Lesson title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-lesson-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time</Label>
              <Input
                id="estimatedTime"
                placeholder="e.g., 30 minutes"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                data-testid="input-lesson-time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
              data-testid="button-save-lesson"
            >
              {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingLesson ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lesson and all its content. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLessonMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
