import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Loader2,
  ChevronRight,
  Play,
  Code,
  Terminal,
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
import type { PracticeLab, Certificate } from "@shared/schema";

interface LabsResponse {
  courseId: number;
  labs: PracticeLab[];
}

interface LabManagerProps {
  courseId: number;
  isPublished: boolean;
  certificate: Certificate | null;
}

export function LabManager({ courseId, isPublished, certificate }: LabManagerProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [labToDelete, setLabToDelete] = useState<PracticeLab | null>(null);
  const [newLab, setNewLab] = useState({
    title: "",
    description: "",
    difficulty: "intermediate",
    language: "javascript",
    estimatedTime: 30,
  });

  const { data: labsResponse, isLoading } = useQuery<LabsResponse>({
    queryKey: ["/api/courses", courseId, "labs"],
  });

  const labs = labsResponse?.labs || [];

  const createLabMutation = useMutation({
    mutationFn: async (data: typeof newLab) => {
      return await apiRequest<PracticeLab>("POST", `/api/courses/${courseId}/labs`, {
        ...data,
        orderIndex: labs.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowCreateDialog(false);
      setNewLab({ title: "", description: "", difficulty: "intermediate", language: "javascript", estimatedTime: 30 });
      toast({
        title: "Lab Created",
        description: "The practice lab has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lab.",
        variant: "destructive",
      });
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: async (labId: number) => {
      await apiRequest("DELETE", `/api/labs/${labId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowDeleteDialog(false);
      setLabToDelete(null);
      toast({
        title: "Lab Deleted",
        description: "The practice lab has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lab.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLab = () => {
    if (!newLab.title) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    createLabMutation.mutate(newLab);
  };

  const handleDeleteLab = (lab: PracticeLab) => {
    setLabToDelete(lab);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (labToDelete) {
      deleteLabMutation.mutate(labToDelete.id);
    }
  };

  const requiresLabCompletion = (certificate as any)?.requiresLabCompletion;
  const hasLabs = labs.length > 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getLanguageIcon = (lang: string) => {
    switch (lang) {
      case "python":
        return "py";
      case "javascript":
        return "js";
      case "typescript":
        return "ts";
      case "java":
        return "java";
      case "cpp":
        return "c++";
      case "rust":
        return "rs";
      default:
        return lang?.slice(0, 2).toUpperCase() || "?";
    }
  };

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
              Labs are locked because the course is published
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Unpublish the course to make changes to practice labs.
            </p>
          </div>
        </div>
      )}

      {requiresLabCompletion && !hasLabs && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
          <Terminal className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Certificate requires lab completion
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Add at least one practice lab because the certificate requires lab completion.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Practice Labs
            </CardTitle>
            <CardDescription>
              Hands-on coding exercises with validation and AI hints
            </CardDescription>
          </div>
          {!isPublished && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              data-testid="button-add-lab"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Lab
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {labs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No practice labs yet</p>
              {!isPublished && (
                <p className="text-xs mt-1">
                  Add labs to let students practice coding with validation
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {labs.map((lab) => (
                <div
                  key={lab.id}
                  className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`lab-item-${lab.id}`}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-mono text-sm font-semibold">
                    {getLanguageIcon(lab.language || "js")}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate" data-testid={`lab-title-${lab.id}`}>
                        {lab.title}
                      </span>
                      <Badge className={getDifficultyColor(lab.difficulty || "intermediate")} variant="secondary">
                        {lab.difficulty || "intermediate"}
                      </Badge>
                      {lab.status === "locked" && (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    {lab.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {lab.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {lab.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {lab.estimatedTime} min
                        </span>
                      )}
                      {lab.validationType && (
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {lab.validationType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isPublished && lab.status !== "locked" && (
                      <>
                        <Link href={`/courses/${courseId}/labs/${lab.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-lab-${lab.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLab(lab)}
                          data-testid={`button-delete-lab-${lab.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Link href={`/courses/${courseId}/labs/${lab.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-lab-${lab.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Practice Lab</DialogTitle>
            <DialogDescription>
              Add a new hands-on coding exercise for students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lab-title">Title</Label>
              <Input
                id="lab-title"
                value={newLab.title}
                onChange={(e) => setNewLab({ ...newLab, title: e.target.value })}
                placeholder="e.g., Build a REST API"
                data-testid="input-lab-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-description">Description</Label>
              <Textarea
                id="lab-description"
                value={newLab.description}
                onChange={(e) => setNewLab({ ...newLab, description: e.target.value })}
                placeholder="What will students build in this lab?"
                rows={3}
                data-testid="input-lab-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lab-language">Language</Label>
                <Select
                  value={newLab.language}
                  onValueChange={(value) => setNewLab({ ...newLab, language: value })}
                >
                  <SelectTrigger id="lab-language" data-testid="select-lab-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab-difficulty">Difficulty</Label>
                <Select
                  value={newLab.difficulty}
                  onValueChange={(value) => setNewLab({ ...newLab, difficulty: value })}
                >
                  <SelectTrigger id="lab-difficulty" data-testid="select-lab-difficulty">
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
            <div className="space-y-2">
              <Label htmlFor="lab-time">Estimated Time (minutes)</Label>
              <Input
                id="lab-time"
                type="number"
                value={newLab.estimatedTime}
                onChange={(e) => setNewLab({ ...newLab, estimatedTime: parseInt(e.target.value) || 30 })}
                min={5}
                max={180}
                data-testid="input-lab-time"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateLab}
              disabled={createLabMutation.isPending}
              data-testid="button-confirm-create-lab"
            >
              {createLabMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Practice Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{labToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-lab"
            >
              {deleteLabMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
