import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileCheck,
  Plus,
  Pencil,
  Trash2,
  Lock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  HelpCircle,
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
import type { Test, Question, Module, Certificate } from "@shared/schema";

interface TestWithDetails extends Test {
  questions: Question[];
  moduleName?: string;
}

interface TestManagerProps {
  courseId: number;
  modules: Module[];
  isPublished: boolean;
  certificate: Certificate | null;
}

export function TestManager({ courseId, modules, isPublished, certificate }: TestManagerProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState<TestWithDetails | null>(null);
  const [newTest, setNewTest] = useState({
    moduleId: "",
    title: "",
    description: "",
    passingPercentage: 70,
  });

  const { data: tests = [], isLoading } = useQuery<TestWithDetails[]>({
    queryKey: ["/api/courses", courseId, "tests"],
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: typeof newTest) => {
      return await apiRequest<Test>("POST", "/api/tests", {
        ...data,
        moduleId: parseInt(data.moduleId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowCreateDialog(false);
      setNewTest({ moduleId: "", title: "", description: "", passingPercentage: 70 });
      toast({
        title: "Test Created",
        description: "The test has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test.",
        variant: "destructive",
      });
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      await apiRequest("DELETE", `/api/tests/${testId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      setShowDeleteDialog(false);
      setTestToDelete(null);
      toast({
        title: "Test Deleted",
        description: "The test has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTest = () => {
    if (!newTest.moduleId || !newTest.title) {
      toast({
        title: "Validation Error",
        description: "Module and title are required.",
        variant: "destructive",
      });
      return;
    }
    createTestMutation.mutate(newTest);
  };

  const handleDeleteTest = (test: TestWithDetails) => {
    setTestToDelete(test);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      deleteTestMutation.mutate(testToDelete.id);
    }
  };

  const requiresTestPass = certificate?.requiresTestPass;
  const hasValidTests = tests.some((test) => test.questions.length > 0);

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
              Tests are locked because the course is published
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Unpublish the course to make changes to tests and questions.
            </p>
          </div>
        </div>
      )}

      {requiresTestPass && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          hasValidTests 
            ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" 
            : "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
        }`}>
          <AlertTriangle className={`h-5 w-5 ${
            hasValidTests 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-amber-600 dark:text-amber-400"
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              hasValidTests 
                ? "text-emerald-800 dark:text-emerald-200" 
                : "text-amber-800 dark:text-amber-200"
            }`}>
              This course certificate requires a test pass
            </p>
            <p className={`text-xs ${
              hasValidTests 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {hasValidTests 
                ? "At least one test with questions is configured." 
                : "You need at least one valid test with questions before publishing."}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Assessments & Tests</CardTitle>
            <CardDescription>
              Create and manage tests for this course
            </CardDescription>
          </div>
          {!isPublished && modules.length > 0 && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-add-test"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No modules available</h3>
              <p className="text-sm text-muted-foreground">
                Create modules first before adding tests. Tests belong to modules.
              </p>
            </div>
          ) : tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`test-card-${test.id}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{test.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {test.moduleName && `${test.moduleName} • `}
                      {test.questions.length} question{test.questions.length !== 1 ? "s" : ""}
                      {" • "}Pass: {test.passingPercentage}%
                      {test.timeLimit && ` • ${test.timeLimit} min`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.questions.length === 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        No questions
                      </Badge>
                    )}
                    {test.isLocked && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    {!isPublished && (
                      <>
                        <Link href={`/courses/${courseId}/tests/${test.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-test-${test.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTest(test)}
                          data-testid={`button-delete-test-${test.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Link href={`/courses/${courseId}/tests/${test.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-test-${test.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tests configured yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add assessments to evaluate student learning and grant certificates.
              </p>
              {!isPublished && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              Add a new assessment for this course. You can add questions after creating the test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Select
                value={newTest.moduleId}
                onValueChange={(value) => setNewTest({ ...newTest, moduleId: value })}
              >
                <SelectTrigger data-testid="select-test-module">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Test Title</Label>
              <Input
                id="title"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                placeholder="e.g., Module 1 Assessment"
                data-testid="input-test-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Brief description of what this test covers..."
                data-testid="input-test-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingPercentage">Passing Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="passingPercentage"
                  type="number"
                  min={1}
                  max={100}
                  value={newTest.passingPercentage}
                  onChange={(e) => setNewTest({ ...newTest, passingPercentage: parseInt(e.target.value) || 70 })}
                  className="w-24"
                  data-testid="input-test-passing"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTest}
              disabled={createTestMutation.isPending}
              data-testid="button-create-test-submit"
            >
              {createTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testToDelete?.title}"? This will also delete all questions in this test. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-test"
            >
              {deleteTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
