import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Clock,
  Target,
  BookOpen,
  Video,
  ExternalLink,
  Plus,
  X,
  Loader2,
  RefreshCw,
  FileText,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { FormSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Module, Lesson, Course, AiNote } from "@shared/schema";

interface LessonWithNotes extends Lesson {
  aiNotes?: AiNote[];
}

interface ModuleWithLessons extends Module {
  lessons?: LessonWithNotes[];
}

interface CourseWithModules extends Course {
  modules?: ModuleWithLessons[];
}

export default function LessonEditor() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    estimatedTime: "",
    videoUrl: "",
    objectives: [] as string[],
    keyConcepts: [] as string[],
    externalLinks: [] as string[],
  });

  const [newObjective, setNewObjective] = useState("");
  const [newConcept, setNewConcept] = useState("");
  const [newLink, setNewLink] = useState("");

  const parsedCourseId = courseId ? parseInt(courseId) : undefined;
  const parsedModuleId = moduleId ? parseInt(moduleId) : undefined;
  const parsedLessonId = lessonId ? parseInt(lessonId) : undefined;

  const { data: course, isLoading } = useQuery<CourseWithModules>({
    queryKey: ["/api/courses", parsedCourseId],
    enabled: !!parsedCourseId && !isNaN(parsedCourseId),
  });

  const { data: lessonData } = useQuery<LessonWithNotes>({
    queryKey: ["/api/lessons", parsedLessonId],
    enabled: !!parsedLessonId && !isNaN(parsedLessonId),
  });

  const module = course?.modules?.find((m) => m.id === parsedModuleId);
  const lesson = lessonData || module?.lessons?.find((l) => l.id === parsedLessonId);
  const aiNotes = lesson?.aiNotes?.[0];

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        estimatedTime: lesson.estimatedTime || "",
        videoUrl: lesson.videoUrl || "",
        objectives: lesson.objectives || [],
        keyConcepts: lesson.keyConceptS || [],
        externalLinks: lesson.externalLinks || [],
      });
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: Partial<Lesson>) => {
      return apiRequest("PATCH", `/api/lessons/${parsedLessonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", parsedLessonId] });
      setHasChanges(false);
      toast({ title: "Lesson saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save lesson", variant: "destructive" });
    },
  });

  const generateNotesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/lessons/${parsedLessonId}/generate-notes`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", parsedCourseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", parsedLessonId] });
      toast({
        title: "AI notes generated",
        description: "The notes have been created successfully.",
      });
    },
    onError: () => {
      toast({ title: "Failed to generate notes", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateLessonMutation.mutate({
      title: formData.title,
      estimatedTime: formData.estimatedTime,
      videoUrl: formData.videoUrl,
      objectives: formData.objectives,
      keyConceptS: formData.keyConcepts,
      externalLinks: formData.externalLinks,
    });
  };

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      handleFieldChange("objectives", [...formData.objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    handleFieldChange(
      "objectives",
      formData.objectives.filter((_, i) => i !== index)
    );
  };

  const addConcept = () => {
    if (newConcept.trim()) {
      handleFieldChange("keyConcepts", [...formData.keyConcepts, newConcept.trim()]);
      setNewConcept("");
    }
  };

  const removeConcept = (index: number) => {
    handleFieldChange(
      "keyConcepts",
      formData.keyConcepts.filter((_, i) => i !== index)
    );
  };

  const addLink = () => {
    if (newLink.trim()) {
      handleFieldChange("externalLinks", [...formData.externalLinks, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    handleFieldChange(
      "externalLinks",
      formData.externalLinks.filter((_, i) => i !== index)
    );
  };

  if (
    !parsedCourseId ||
    isNaN(parsedCourseId) ||
    !parsedModuleId ||
    isNaN(parsedModuleId) ||
    !parsedLessonId ||
    isNaN(parsedLessonId)
  ) {
    navigate("/courses");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <FormSkeleton />
      </div>
    );
  }

  if (!course || !module || !lesson) {
    navigate(`/courses/${courseId}/modules/${moduleId}`);
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={formData.title || "Lesson Editor"}
        description="Edit lesson content and view AI-generated notes"
        backLink={`/courses/${courseId}/modules/${moduleId}`}
        backLabel="Back to Module"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => generateNotesMutation.mutate()}
              disabled={generateNotesMutation.isPending}
              data-testid="button-generate-notes"
            >
              {generateNotesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {aiNotes ? "Regenerate Notes" : "Generate Notes"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateLessonMutation.isPending || !hasChanges}
              data-testid="button-save-lesson"
            >
              {updateLessonMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
        <Link href={`/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground">
          {module.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI Notes
            {aiNotes && (
              <Badge variant="secondary" className="ml-2 text-xs">
                v{aiNotes.version}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  data-testid="input-lesson-title"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time</Label>
                  <Input
                    id="estimatedTime"
                    placeholder="e.g., 30 minutes"
                    value={formData.estimatedTime}
                    onChange={(e) => handleFieldChange("estimatedTime", e.target.value)}
                    data-testid="input-estimated-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://..."
                    value={formData.videoUrl}
                    onChange={(e) => handleFieldChange("videoUrl", e.target.value)}
                    data-testid="input-video-url"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Objectives
              </CardTitle>
              <CardDescription>What learners will achieve by completing this lesson</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1 justify-start py-2 font-normal">
                    {objective}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjective(index)}
                    data-testid={`button-remove-objective-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a learning objective..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addObjective()}
                  data-testid="input-new-objective"
                />
                <Button variant="outline" onClick={addObjective} data-testid="button-add-objective">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Key Concepts
              </CardTitle>
              <CardDescription>Important concepts covered in this lesson</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.keyConcepts.map((concept, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-start py-2 font-normal">
                    {concept}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConcept(index)}
                    data-testid={`button-remove-concept-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a key concept..."
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addConcept()}
                  data-testid="input-new-concept"
                />
                <Button variant="outline" onClick={addConcept} data-testid="button-add-concept">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                External Resources
              </CardTitle>
              <CardDescription>Additional reading materials and references</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.externalLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary hover:underline truncate"
                  >
                    {link}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                    data-testid={`button-remove-link-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add external link (https://...)"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  data-testid="input-new-link"
                />
                <Button variant="outline" onClick={addLink} data-testid="button-add-link">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          {aiNotes ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">AI Generated Notes</CardTitle>
                    <CardDescription>
                      Version {aiNotes.version} - Generated based on lesson objectives and concepts
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateNotesMutation.mutate()}
                    disabled={generateNotesMutation.isPending}
                    data-testid="button-regenerate-notes"
                  >
                    {generateNotesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {aiNotes.content && (
                    <div>
                      <h4 className="font-medium mb-2">Main Content</h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">{aiNotes.content}</p>
                      </div>
                    </div>
                  )}

                  {aiNotes.simplifiedExplanation && (
                    <div>
                      <h4 className="font-medium mb-2">Simplified Explanation</h4>
                      <p className="text-muted-foreground">{aiNotes.simplifiedExplanation}</p>
                    </div>
                  )}

                  {aiNotes.bulletNotes && aiNotes.bulletNotes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Bullet Notes</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {aiNotes.bulletNotes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiNotes.keyTakeaways && aiNotes.keyTakeaways.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Takeaways</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiNotes.keyTakeaways.map((takeaway, index) => (
                          <Badge key={index} variant="secondary">
                            {takeaway}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiNotes.interviewQuestions && aiNotes.interviewQuestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Interview Questions</h4>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        {aiNotes.interviewQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">No AI notes yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate comprehensive notes based on the lesson content
                    </p>
                  </div>
                  <Button
                    onClick={() => generateNotesMutation.mutate()}
                    disabled={generateNotesMutation.isPending}
                    data-testid="button-first-generate-notes"
                  >
                    {generateNotesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate AI Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
