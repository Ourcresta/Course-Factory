import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  FileCheck,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Save,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Test, Question, Course, Module } from "@shared/schema";

interface TestWithQuestions extends Test {
  questions: Question[];
}

const testFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  passingPercentage: z.number().min(1).max(100),
  timeLimit: z.number().nullable().optional(),
});

type TestFormData = z.infer<typeof testFormSchema>;

const questionFormSchema = z.object({
  type: z.enum(["mcq", "scenario"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  scenarioText: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export default function TestEditor() {
  const { toast } = useToast();
  const [, params] = useRoute("/courses/:courseId/tests/:testId");
  const courseId = params?.courseId ? parseInt(params.courseId) : null;
  const testId = params?.testId ? parseInt(params.testId) : null;

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", ""]);

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: test, isLoading: isLoadingTest } = useQuery<TestWithQuestions>({
    queryKey: ["/api/tests", testId],
    enabled: !!testId,
  });

  const isPublished = course?.status === "published";

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      passingPercentage: 70,
      timeLimit: null,
    },
  });

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: "mcq",
      difficulty: "medium",
      questionText: "",
      options: [],
      correctAnswer: "",
      explanation: "",
      scenarioText: "",
    },
  });

  useEffect(() => {
    if (test) {
      form.reset({
        title: test.title,
        description: test.description || "",
        passingPercentage: test.passingPercentage || 70,
        timeLimit: test.timeLimit,
      });
    }
  }, [test, form]);

  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormData) => {
      return await apiRequest<Test>("PATCH", `/api/tests/${testId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      toast({
        title: "Test Updated",
        description: "The test has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test.",
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const payload = {
        testId,
        type: data.type,
        difficulty: data.difficulty,
        questionText: data.type === "scenario" && data.scenarioText 
          ? `${data.scenarioText}\n\n${data.questionText}` 
          : data.questionText,
        options: data.type === "mcq" ? mcqOptions.filter(o => o.trim()) : null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        orderIndex: (test?.questions.length || 0),
      };
      return await apiRequest<Question>("POST", "/api/questions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      setShowQuestionDialog(false);
      resetQuestionForm();
      toast({
        title: "Question Created",
        description: "The question has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question.",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      if (!editingQuestion) return;
      const payload = {
        type: data.type,
        difficulty: data.difficulty,
        questionText: data.type === "scenario" && data.scenarioText 
          ? `${data.scenarioText}\n\n${data.questionText}` 
          : data.questionText,
        options: data.type === "mcq" ? mcqOptions.filter(o => o.trim()) : null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
      };
      return await apiRequest<Question>("PATCH", `/api/questions/${editingQuestion.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      resetQuestionForm();
      toast({
        title: "Question Updated",
        description: "The question has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "tests"] });
      setShowDeleteDialog(false);
      setQuestionToDelete(null);
      toast({
        title: "Question Deleted",
        description: "The question has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question.",
        variant: "destructive",
      });
    },
  });

  const reorderQuestionMutation = useMutation({
    mutationFn: async ({ questionId, newIndex }: { questionId: number; newIndex: number }) => {
      return await apiRequest<Question>("PATCH", `/api/questions/${questionId}`, {
        orderIndex: newIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
    },
  });

  const resetQuestionForm = () => {
    questionForm.reset({
      type: "mcq",
      difficulty: "medium",
      questionText: "",
      options: [],
      correctAnswer: "",
      explanation: "",
      scenarioText: "",
    });
    setMcqOptions(["", ""]);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    const isScenario = question.type === "scenario";
    let questionText = question.questionText;
    let scenarioText = "";
    
    if (isScenario && question.questionText.includes("\n\n")) {
      const parts = question.questionText.split("\n\n");
      scenarioText = parts[0];
      questionText = parts.slice(1).join("\n\n");
    }

    questionForm.reset({
      type: question.type as "mcq" | "scenario",
      difficulty: (question.difficulty || "medium") as "easy" | "medium" | "hard",
      questionText,
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      scenarioText,
    });
    setMcqOptions(question.options || ["", ""]);
    setShowQuestionDialog(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete.id);
    }
  };

  const handleSubmitQuestion = (data: QuestionFormData) => {
    if (data.type === "mcq") {
      const validOptions = mcqOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Validation Error",
          description: "MCQ must have at least 2 options.",
          variant: "destructive",
        });
        return;
      }
      if (!data.correctAnswer || !validOptions.includes(data.correctAnswer)) {
        toast({
          title: "Validation Error",
          description: "Please select a valid correct answer from the options.",
          variant: "destructive",
        });
        return;
      }
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate(data);
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const moveQuestion = (question: Question, direction: "up" | "down") => {
    if (!test?.questions) return;
    const currentIndex = test.questions.findIndex(q => q.id === question.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= test.questions.length) return;
    
    const swapQuestion = test.questions[newIndex];
    reorderQuestionMutation.mutate({ questionId: question.id, newIndex });
    reorderQuestionMutation.mutate({ questionId: swapQuestion.id, newIndex: currentIndex });
  };

  const addMcqOption = () => {
    setMcqOptions([...mcqOptions, ""]);
  };

  const removeMcqOption = (index: number) => {
    if (mcqOptions.length <= 2) return;
    const newOptions = mcqOptions.filter((_, i) => i !== index);
    setMcqOptions(newOptions);
    if (questionForm.getValues("correctAnswer") === mcqOptions[index]) {
      questionForm.setValue("correctAnswer", "");
    }
  };

  const updateMcqOption = (index: number, value: string) => {
    const newOptions = [...mcqOptions];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setMcqOptions(newOptions);
    if (questionForm.getValues("correctAnswer") === oldValue) {
      questionForm.setValue("correctAnswer", value);
    }
  };

  if (isLoadingTest) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Test not found</h3>
        <Link href={`/courses/${courseId}`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>
    );
  }

  const watchType = questionForm.watch("type");

  return (
    <div className="space-y-6">
      <PageHeader
        title={test.title}
        description="Edit test details and manage questions"
        backLink={`/courses/${courseId}`}
        backLabel="Back to Course"
      />

      {isPublished && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This test is locked because the course is published
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Unpublish the course to make changes.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Test Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => updateTestMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isPublished} data-testid="input-test-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isPublished} data-testid="input-test-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="passingPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Percentage</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
                                disabled={isPublished}
                                className="w-24"
                                data-testid="input-test-passing"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isPublished}
                                className="w-24"
                                data-testid="input-test-timelimit"
                              />
                              <span className="text-sm text-muted-foreground">minutes</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {!isPublished && (
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={updateTestMutation.isPending} data-testid="button-save-test">
                        {updateTestMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Questions</CardTitle>
                <CardDescription>
                  {test.questions.length} question{test.questions.length !== 1 ? "s" : ""} in this test
                </CardDescription>
              </div>
              {!isPublished && (
                <Button
                  onClick={() => {
                    setEditingQuestion(null);
                    resetQuestionForm();
                    setShowQuestionDialog(true);
                  }}
                  data-testid="button-add-question"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {test.questions.length > 0 ? (
                <div className="space-y-3">
                  {test.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-4 rounded-lg border"
                      data-testid={`question-card-${question.id}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </span>
                        {!isPublished && (
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveQuestion(question, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveQuestion(question, "down")}
                              disabled={index === test.questions.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {question.type === "mcq" ? "MCQ" : "Scenario"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.difficulty || "medium"}
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2">{question.questionText}</p>
                        {question.type === "mcq" && question.options && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {question.options.length} options
                          </p>
                        )}
                      </div>
                      {!isPublished && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuestion(question)}
                            data-testid={`button-edit-question-${question.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuestion(question)}
                            data-testid={`button-delete-question-${question.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add questions to make this test valid for certification.
                  </p>
                  {!isPublished && (
                    <Button
                      onClick={() => {
                        setEditingQuestion(null);
                        resetQuestionForm();
                        setShowQuestionDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{test.questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pass mark:</span>
                <span className="font-medium">{test.passingPercentage}%</span>
              </div>
              {test.timeLimit && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time limit:</span>
                  <span className="font-medium">{test.timeLimit} min</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MCQ:</span>
                <span className="font-medium">
                  {test.questions.filter(q => q.type === "mcq").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scenario:</span>
                <span className="font-medium">
                  {test.questions.filter(q => q.type === "scenario").length}
                </span>
              </div>
            </CardContent>
          </Card>

          {test.questions.length === 0 && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Test needs questions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This test has no questions and cannot be used for certification.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Update the question details below."
                : "Create a new question for this test."}
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(handleSubmitQuestion)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={questionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-question-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                          <SelectItem value="scenario">Scenario-based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-question-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === "scenario" && (
                <FormField
                  control={questionForm.control}
                  name="scenarioText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scenario Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the scenario context..."
                          rows={4}
                          data-testid="input-scenario-text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={questionForm.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter the question..."
                        rows={3}
                        data-testid="input-question-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === "mcq" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMcqOption}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {mcqOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={questionForm.getValues("correctAnswer") === option && option.trim() !== ""}
                        onChange={() => questionForm.setValue("correctAnswer", option)}
                        disabled={!option.trim()}
                        className="shrink-0"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateMcqOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        data-testid={`input-option-${index}`}
                      />
                      {mcqOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMcqOption(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Select the radio button next to the correct answer.
                  </p>
                </div>
              )}

              {watchType === "scenario" && (
                <FormField
                  control={questionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Answer</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What is the expected or ideal answer?"
                          rows={2}
                          data-testid="input-expected-answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Explain why this is the correct answer..."
                        rows={2}
                        data-testid="input-explanation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowQuestionDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                  data-testid="button-save-question"
                >
                  {(createQuestionMutation.isPending || updateQuestionMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-question"
            >
              {deleteQuestionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
