import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  BookOpen,
  Clock,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  FolderOpen,
  Loader2,
  GripVertical,
  Globe,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ModuleListSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Course, Module, Lesson } from "@shared/schema";

interface ModuleWithLessons extends Module {
  lessons?: Lesson[];
}

interface CourseWithModules extends Course {
  modules?: ModuleWithLessons[];
}

export default function CourseModules() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimatedTime: "",
  });

  const parsedCourseId = courseId ? parseInt(courseId) : undefined;

  const { data: course, isLoading } = useQuery<CourseWithModules>({
    queryKey: ["/api/courses", parsedCourseId],
    enabled: !!parsedCourseId && !isNaN(parsedCourseId),
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; estimatedTime: string }) => {
      const orderIndex = course?.modules?.length || 0;
      return apiRequest("POST", "/api/modules", {
        courseId: parsedCourseId,
        title: data.title,
        description: data.description,
        estimatedTime: data.estimatedTime,
        orderIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setShowAddDialog(false);
      setFormData({ title: "", description: "", estimatedTime: "" });
      toast({ title: "Module created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create module", variant: "destructive" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Module> }) => {
      return apiRequest("PATCH", `/api/modules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setEditingModule(null);
      setFormData({ title: "", description: "", estimatedTime: "" });
      toast({ title: "Module updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update module", variant: "destructive" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      setShowDeleteDialog(false);
      setDeletingModuleId(null);
      toast({ title: "Module deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete module", variant: "destructive" });
    },
  });

  const generateModulesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/courses/${parsedCourseId}/generate/modules`);
    },
    onSuccess: () => {
      setIsGenerating(true);
      toast({
        title: "AI generation started",
        description: "Modules are being generated. This may take a moment.",
      });
      const pollInterval = setInterval(async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      }, 3000);
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsGenerating(false);
        queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      }, 30000);
    },
    onError: () => {
      toast({ title: "Failed to generate modules", variant: "destructive" });
    },
  });

  const handleMoveModule = async (moduleId: number, direction: "up" | "down") => {
    if (!course?.modules) return;
    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIndex = modules.findIndex((m) => m.id === moduleId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const currentModule = modules[currentIndex];
    const targetModule = modules[targetIndex];

    await Promise.all([
      apiRequest("PATCH", `/api/modules/${currentModule.id}`, { orderIndex: targetModule.orderIndex }),
      apiRequest("PATCH", `/api/modules/${targetModule.id}`, { orderIndex: currentModule.orderIndex }),
    ]);

    queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
  };

  const handleOpenAddDialog = () => {
    setEditingModule(null);
    setFormData({ title: "", description: "", estimatedTime: "" });
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || "",
      estimatedTime: module.estimatedTime || "",
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: formData });
    } else {
      createModuleMutation.mutate(formData);
    }
  };

  const handleDelete = (moduleId: number) => {
    setDeletingModuleId(moduleId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingModuleId) {
      deleteModuleMutation.mutate(deletingModuleId);
    }
  };

  if (!parsedCourseId || isNaN(parsedCourseId)) {
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

  if (!course) {
    navigate("/courses");
    return null;
  }

  const sortedModules = [...(course.modules || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const isPublished = course.status === "published";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Modules - ${course.name}`}
        description="Manage course modules and their content"
        backLink={`/courses/${courseId}`}
        backLabel="Back to Course"
        actions={
          !isPublished ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => generateModulesMutation.mutate()}
                disabled={isGenerating || generateModulesMutation.isPending}
                data-testid="button-generate-modules"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
              <Button onClick={handleOpenAddDialog} data-testid="button-add-module">
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          ) : undefined
        }
      />

      {isPublished && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">This course is published and locked</p>
            <p className="text-xs text-green-600 dark:text-green-400">Unpublish from the course detail page to make changes.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground">
          {course.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Modules</span>
      </div>

      {sortedModules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={isPublished ? "No modules in this published course" : "No modules yet"}
          description={isPublished ? "This course was published without modules." : "Create modules manually or use AI to generate a complete module structure with lessons."}
          action={
            !isPublished ? (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateModulesMutation.mutate()}
                  disabled={isGenerating || generateModulesMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module Manually
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedModules.map((module, index) => (
            <Card key={module.id} className="group" data-testid={`card-module-${module.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {!isPublished && (
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleMoveModule(module.id, "up")}
                        data-testid={`button-move-up-${module.id}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === sortedModules.length - 1}
                        onClick={() => handleMoveModule(module.id, "down")}
                        data-testid={`button-move-down-${module.id}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium">
                          <span className="text-muted-foreground mr-2">
                            {(index + 1).toString().padStart(2, "0")}.
                          </span>
                          {module.title}
                        </CardTitle>
                        {module.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {module.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {module.estimatedTime && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.estimatedTime}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {module.lessons?.length || 0} lessons
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 justify-end">
                  {!isPublished && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDialog(module)}
                        data-testid={`button-edit-module-${module.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(module.id)}
                        data-testid={`button-delete-module-${module.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Link href={`/courses/${courseId}/modules/${module.id}`}>
                    <Button size="sm" data-testid={`button-open-module-${module.id}`}>
                      <FolderOpen className="h-4 w-4 mr-1" />
                      {isPublished ? "View" : "Open"}
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
            <DialogTitle>{editingModule ? "Edit Module" : "Add New Module"}</DialogTitle>
            <DialogDescription>
              {editingModule
                ? "Update the module details below."
                : "Create a new module for this course."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Module title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-module-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Module description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-module-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time</Label>
              <Input
                id="estimatedTime"
                placeholder="e.g., 2 hours"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                data-testid="input-module-time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
              data-testid="button-save-module"
            >
              {(createModuleMutation.isPending || updateModuleMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingModule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module and all its lessons. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteModuleMutation.isPending && (
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
