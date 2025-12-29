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
  Globe,
  Youtube,
  Play,
  Trash2,
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
import type { Module, Lesson, Course, AiNote, YouTubeReference } from "@shared/schema";

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
    youtubeReferences: [] as YouTubeReference[],
  });

  const [newObjective, setNewObjective] = useState("");
  const [newConcept, setNewConcept] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newYoutubeTitle, setNewYoutubeTitle] = useState("");

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
        youtubeReferences: lesson.youtubeReferences || [],
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
      youtubeReferences: formData.youtubeReferences,
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

  const addYoutubeReference = () => {
    if (newYoutubeUrl.trim() && newYoutubeTitle.trim()) {
      const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeUrlPattern.test(newYoutubeUrl.trim())) {
        toast({ title: "Please enter a valid YouTube URL", variant: "destructive" });
        return;
      }
      handleFieldChange("youtubeReferences", [
        ...formData.youtubeReferences,
        { url: newYoutubeUrl.trim(), title: newYoutubeTitle.trim() },
      ]);
      setNewYoutubeUrl("");
      setNewYoutubeTitle("");
    }
  };

  const removeYoutubeReference = (index: number) => {
    handleFieldChange(
      "youtubeReferences",
      formData.youtubeReferences.filter((_, i) => i !== index)
    );
  };

  const getYoutubeThumbnail = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
    }
    return "";
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

  const isPublished = course.status === "published";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={formData.title || "Lesson Editor"}
        description={isPublished ? "View lesson content (read-only)" : "Edit lesson content and view AI-generated notes"}
        backLink={`/courses/${courseId}/modules/${moduleId}`}
        backLabel="Back to Module"
        actions={
          !isPublished ? (
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
                  disabled={isPublished}
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
                    disabled={isPublished}
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
                    disabled={isPublished}
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
                  {!isPublished && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjective(index)}
                      data-testid={`button-remove-objective-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isPublished && (
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
              )}
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
                  {!isPublished && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConcept(index)}
                      data-testid={`button-remove-concept-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isPublished && (
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
              )}
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
                  {!isPublished && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                      data-testid={`button-remove-link-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isPublished && (
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
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-b">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">YouTube References</CardTitle>
                    <CardDescription>Supplementary video tutorials for enhanced learning</CardDescription>
                  </div>
                </div>
                {formData.youtubeReferences.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {formData.youtubeReferences.length} video{formData.youtubeReferences.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {formData.youtubeReferences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">No videos added yet</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Add YouTube tutorials to give learners additional resources and perspectives on the topic.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {formData.youtubeReferences.map((ref, index) => {
                    const thumbnail = getYoutubeThumbnail(ref.url);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 group transition-colors hover:bg-muted/50"
                        data-testid={`youtube-reference-${index}`}
                      >
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative shrink-0 rounded-xl overflow-hidden w-36 h-20 bg-gradient-to-br from-muted to-muted/50 shadow-sm group/thumb"
                        >
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={ref.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/10">
                              <Youtube className="h-8 w-8 text-red-500/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/50 transition-all duration-300">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg opacity-0 scale-75 group-hover/thumb:opacity-100 group-hover/thumb:scale-100 transition-all duration-300">
                              <Play className="h-5 w-5 text-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            Watch
                          </div>
                        </a>
                        <div className="flex-1 min-w-0 space-y-1">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2 block"
                          >
                            {ref.title}
                          </a>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Youtube className="h-3 w-3 text-red-500" />
                            <span className="truncate max-w-xs">{ref.url}</span>
                          </div>
                        </div>
                        {!isPublished && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeYoutubeReference(index)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10"
                            data-testid={`button-remove-youtube-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!isPublished && (
                <div className="p-4 bg-muted/30 border-t space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    Add New Video
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="youtube-title" className="text-xs font-medium">Video Title</Label>
                      <Input
                        id="youtube-title"
                        placeholder="e.g., React Hooks Tutorial"
                        value={newYoutubeTitle}
                        onChange={(e) => setNewYoutubeTitle(e.target.value)}
                        className="bg-background"
                        data-testid="input-youtube-title"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="youtube-url" className="text-xs font-medium">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={newYoutubeUrl}
                        onChange={(e) => setNewYoutubeUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addYoutubeReference()}
                        className="bg-background"
                        data-testid="input-youtube-url"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addYoutubeReference}
                    disabled={!newYoutubeUrl.trim() || !newYoutubeTitle.trim()}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20"
                    data-testid="button-add-youtube"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Add YouTube Reference
                  </Button>
                </div>
              )}
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
                  {!isPublished && (
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
                  )}
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
