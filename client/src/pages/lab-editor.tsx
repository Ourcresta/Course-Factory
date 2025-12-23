import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Save,
  Loader2,
  FlaskConical,
  Code,
  Terminal,
  Lightbulb,
  Lock,
  Unlock,
  Settings,
  Play,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PracticeLab, Course, Module, Lesson } from "@shared/schema";

export default function LabEditor() {
  const { courseId, labId } = useParams<{ courseId: string; labId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");

  const [formData, setFormData] = useState<Partial<PracticeLab>>({
    title: "",
    description: "",
    difficulty: "intermediate",
    language: "javascript",
    estimatedTime: 30,
    instructions: "",
    starterCode: "",
    solutionCode: "",
    expectedOutput: "",
    validationType: "output",
    hints: [],
    aiPromptContext: "",
    unlockType: "always",
    unlockRefId: null,
    certificateWeight: 1,
    orderIndex: 0,
  });

  const { data: lab, isLoading: isLabLoading } = useQuery<PracticeLab>({
    queryKey: ["/api/labs", labId],
    enabled: !!labId,
  });

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: courseData } = useQuery<Course & { modules: (Module & { lessons: Lesson[] })[] }>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const isPublished = course?.status === "published";
  const isLocked = lab?.status === "locked";
  const isReadOnly = isPublished || isLocked;

  useEffect(() => {
    if (lab) {
      setFormData({
        title: lab.title || "",
        description: lab.description || "",
        difficulty: lab.difficulty || "intermediate",
        language: lab.language || "javascript",
        estimatedTime: lab.estimatedTime || 30,
        instructions: lab.instructions || "",
        starterCode: lab.starterCode || "",
        solutionCode: lab.solutionCode || "",
        expectedOutput: lab.expectedOutput || "",
        validationType: lab.validationType || "output",
        hints: lab.hints || [],
        aiPromptContext: lab.aiPromptContext || "",
        unlockType: lab.unlockType || "always",
        unlockRefId: lab.unlockRefId,
        certificateWeight: lab.certificateWeight || 1,
        orderIndex: lab.orderIndex || 0,
      });
    }
  }, [lab]);

  const updateLabMutation = useMutation({
    mutationFn: async (data: Partial<PracticeLab>) => {
      return await apiRequest<PracticeLab>("PATCH", `/api/labs/${labId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs", labId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "labs"] });
      setHasChanges(false);
      toast({
        title: "Lab Saved",
        description: "Practice lab has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save lab.",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    updateLabMutation.mutate(formData);
  };

  const handleAddHint = () => {
    const hints = formData.hints || [];
    handleFieldChange("hints", [...hints, ""]);
  };

  const handleUpdateHint = (index: number, value: string) => {
    const hints = [...(formData.hints || [])];
    hints[index] = value;
    handleFieldChange("hints", hints);
  };

  const handleRemoveHint = (index: number) => {
    const hints = [...(formData.hints || [])];
    hints.splice(index, 1);
    handleFieldChange("hints", hints);
  };

  if (isLabLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Lab not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modules = courseData?.modules || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${courseId}`)}
            data-testid="button-back-to-course"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" data-testid="text-lab-title">
                {formData.title || "Untitled Lab"}
              </h1>
              {isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Practice Lab in {course?.name || "Course"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && !isReadOnly && (
            <Badge variant="secondary">Unsaved changes</Badge>
          )}
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={updateLabMutation.isPending || !hasChanges}
              data-testid="button-save-lab"
            >
              {updateLabMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This lab is {isLocked ? "locked" : "in a published course"}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {isLocked ? "Locked labs cannot be modified." : "Unpublish the course to make changes."}
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="basics" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Basics
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <Terminal className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="hints" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Hints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Lab Configuration
              </CardTitle>
              <CardDescription>Basic settings for this practice lab</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g., Build a REST API"
                    data-testid="input-lab-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Programming Language</Label>
                  <Select
                    value={formData.language || "javascript"}
                    onValueChange={(value) => handleFieldChange("language", value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="language" data-testid="select-language">
                      <SelectValue />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Describe what students will learn and build"
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty || "intermediate"}
                    onValueChange={(value) => handleFieldChange("difficulty", value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="difficulty" data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={formData.estimatedTime || 30}
                    onChange={(e) => handleFieldChange("estimatedTime", parseInt(e.target.value) || 30)}
                    disabled={isReadOnly}
                    min={5}
                    max={180}
                    data-testid="input-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificateWeight">Certificate Weight</Label>
                  <Input
                    id="certificateWeight"
                    type="number"
                    value={formData.certificateWeight || 1}
                    onChange={(e) => handleFieldChange("certificateWeight", parseInt(e.target.value) || 1)}
                    disabled={isReadOnly}
                    min={0}
                    max={10}
                    data-testid="input-weight"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Unlock Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="unlockType">Unlock Type</Label>
                    <Select
                      value={formData.unlockType || "always"}
                      onValueChange={(value) => handleFieldChange("unlockType", value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger id="unlockType" data-testid="select-unlock-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always Available</SelectItem>
                        <SelectItem value="module_complete">After Module</SelectItem>
                        <SelectItem value="lesson_complete">After Lesson</SelectItem>
                        <SelectItem value="test_pass">After Test Pass</SelectItem>
                        <SelectItem value="lab_complete">After Lab Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.unlockType === "module_complete" && (
                    <div className="space-y-2">
                      <Label>Required Module</Label>
                      <Select
                        value={formData.unlockRefId?.toString() || ""}
                        onValueChange={(value) => handleFieldChange("unlockRefId", parseInt(value) || null)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger data-testid="select-unlock-module">
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
                  )}

                  {formData.unlockType === "lesson_complete" && (
                    <div className="space-y-2">
                      <Label>Required Lesson</Label>
                      <Select
                        value={formData.unlockRefId?.toString() || ""}
                        onValueChange={(value) => handleFieldChange("unlockRefId", parseInt(value) || null)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger data-testid="select-unlock-lesson">
                          <SelectValue placeholder="Select lesson" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.flatMap((module) =>
                            module.lessons?.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id.toString()}>
                                {module.title} - {lesson.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Lab Content
              </CardTitle>
              <CardDescription>Instructions and starter code for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (Markdown)</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions || ""}
                  onChange={(e) => handleFieldChange("instructions", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Write step-by-step instructions in Markdown format..."
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="input-instructions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starterCode">Starter Code</Label>
                <Textarea
                  id="starterCode"
                  value={formData.starterCode || ""}
                  onChange={(e) => handleFieldChange("starterCode", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="// Initial code students will see..."
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="input-starter-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solutionCode">Solution Code (Hidden from students)</Label>
                <Textarea
                  id="solutionCode"
                  value={formData.solutionCode || ""}
                  onChange={(e) => handleFieldChange("solutionCode", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="// Reference solution..."
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="input-solution-code"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Code Validation
              </CardTitle>
              <CardDescription>How to validate student submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="validationType">Validation Type</Label>
                  <Select
                    value={formData.validationType || "output"}
                    onValueChange={(value) => handleFieldChange("validationType", value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="validationType" data-testid="select-validation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="output">Output Comparison</SelectItem>
                      <SelectItem value="console">Console Output</SelectItem>
                      <SelectItem value="api">API Test</SelectItem>
                      <SelectItem value="regex">Regex Pattern</SelectItem>
                      <SelectItem value="function">Function Tests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedOutput">Expected Output / Test Pattern</Label>
                <Textarea
                  id="expectedOutput"
                  value={formData.expectedOutput || ""}
                  onChange={(e) => handleFieldChange("expectedOutput", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Expected output or test pattern..."
                  rows={6}
                  className="font-mono text-sm"
                  data-testid="input-expected-output"
                />
                <p className="text-xs text-muted-foreground">
                  For output comparison: exact expected output. For regex: pattern to match. For API: test configuration JSON.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hints" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Hints & Context
              </CardTitle>
              <CardDescription>Configure hints and AI assistant context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Progressive Hints</Label>
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddHint}
                      data-testid="button-add-hint"
                    >
                      Add Hint
                    </Button>
                  )}
                </div>
                {(formData.hints?.length || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hints added yet. Add hints that are revealed progressively as students need help.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.hints?.map((hint, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-1">
                          {index + 1}
                        </Badge>
                        <Textarea
                          value={hint}
                          onChange={(e) => handleUpdateHint(index, e.target.value)}
                          disabled={isReadOnly}
                          placeholder={`Hint ${index + 1}...`}
                          rows={2}
                          className="flex-1"
                          data-testid={`input-hint-${index}`}
                        />
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveHint(index)}
                            data-testid={`button-remove-hint-${index}`}
                          >
                            <span className="text-destructive">x</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="aiPromptContext">AI Assistant Context (Mithra)</Label>
                <Textarea
                  id="aiPromptContext"
                  value={formData.aiPromptContext || ""}
                  onChange={(e) => handleFieldChange("aiPromptContext", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Additional context for the AI tutor when helping with this lab..."
                  rows={5}
                  data-testid="input-ai-context"
                />
                <p className="text-xs text-muted-foreground">
                  This context is provided to Mithra (AI tutor) when students ask for help with this specific lab.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
