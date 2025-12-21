import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Lock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Target,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Skill, Certificate } from "@shared/schema";

interface ProjectWithSkills extends Project {
  skills: Skill[];
}

interface ProjectManagerProps {
  courseId: number;
  isPublished: boolean;
  certificate: Certificate | null;
}

export function ProjectManager({ courseId, isPublished, certificate }: ProjectManagerProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithSkills | null>(null);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    objectives: "",
    deliverables: "",
    difficulty: "intermediate",
  });

  const { data: projects = [], isLoading } = useQuery<ProjectWithSkills[]>({
    queryKey: ["/api/courses", courseId, "projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      return await apiRequest<ProjectWithSkills>("POST", "/api/projects", {
        ...data,
        courseId,
        objectives: data.objectives,
        deliverables: data.deliverables,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowCreateDialog(false);
      setNewProject({ title: "", description: "", objectives: "", deliverables: "", difficulty: "intermediate" });
      toast({
        title: "Project Created",
        description: "The project has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProject.title) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  const handleDeleteProject = (project: ProjectWithSkills) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  const requiresProjectCompletion = certificate?.requiresProjectCompletion;
  const hasProjects = projects.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isPublished && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Projects are locked because the course is published
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Unpublish the course to make changes to projects.
            </p>
          </div>
        </div>
      )}

      {requiresProjectCompletion && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          hasProjects 
            ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" 
            : "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
        }`}>
          <AlertTriangle className={`h-5 w-5 ${
            hasProjects 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-amber-600 dark:text-amber-400"
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              hasProjects 
                ? "text-emerald-800 dark:text-emerald-200" 
                : "text-amber-800 dark:text-amber-200"
            }`}>
              This course certificate requires project completion
            </p>
            <p className={`text-xs ${
              hasProjects 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {hasProjects 
                ? `${projects.length} project${projects.length !== 1 ? "s" : ""} configured.` 
                : "You need at least one project before publishing."}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Projects & Assignments</CardTitle>
            <CardDescription>
              Create hands-on projects for practical learning
            </CardDescription>
          </div>
          {!isPublished && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-add-project"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`project-card-${project.id}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {project.difficulty && (
                        <span className="capitalize">{project.difficulty}</span>
                      )}
                      {project.objectives && (
                        <>
                          {project.difficulty && " • "}
                          {typeof project.objectives === "string" ? "Has objectives" : ""}
                        </>
                      )}
                      {project.deliverables && (
                        <>
                          {(project.difficulty || project.objectives) && " • "}
                          {typeof project.deliverables === "string" ? "Has deliverables" : ""}
                        </>
                      )}
                    </p>
                    {project.skills && project.skills.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {project.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                        {project.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {project.status === "locked" && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    {project.status === "draft" && (
                      <Badge variant="outline">
                        Draft
                      </Badge>
                    )}
                    {!isPublished && project.status !== "locked" && (
                      <>
                        <Link href={`/courses/${courseId}/projects/${project.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-project-${project.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project)}
                          data-testid={`button-delete-project-${project.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Link href={`/courses/${courseId}/projects/${project.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-project-${project.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects configured yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add hands-on projects for practical skill development.
              </p>
              {!isPublished && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a hands-on assignment for practical learning. You can edit details after creating.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="e.g., Build a Todo Application"
                data-testid="input-project-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description of the project..."
                data-testid="input-project-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objectives">Objectives (one per line)</Label>
              <Textarea
                id="objectives"
                value={newProject.objectives}
                onChange={(e) => setNewProject({ ...newProject, objectives: e.target.value })}
                placeholder="Understand component architecture&#10;Implement state management&#10;Build responsive layouts"
                rows={3}
                data-testid="input-project-objectives"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables (one per line)</Label>
              <Textarea
                id="deliverables"
                value={newProject.deliverables}
                onChange={(e) => setNewProject({ ...newProject, deliverables: e.target.value })}
                placeholder="Functional application code&#10;Written documentation&#10;Video demonstration"
                rows={3}
                data-testid="input-project-deliverables"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={newProject.difficulty}
                onValueChange={(value) => setNewProject({ ...newProject, difficulty: value })}
              >
                <SelectTrigger data-testid="select-project-difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
              data-testid="button-create-project"
            >
              {createProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-project"
            >
              {deleteProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
