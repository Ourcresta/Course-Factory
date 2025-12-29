import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Languages, Plus, Search, Bot, Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LessonScript, Course, Lesson } from "@shared/schema";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
];

export default function VidGuruLanguages() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [scriptContent, setScriptContent] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [editingScript, setEditingScript] = useState<LessonScript | null>(null);

  const { data: scripts, isLoading } = useQuery<LessonScript[]>({
    queryKey: ["/api/vidguru/scripts"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: courseDetails } = useQuery<{ modules: any[] }>({
    queryKey: ["/api/courses", selectedCourse],
    enabled: !!selectedCourse,
  });

  const addScriptMutation = useMutation({
    mutationFn: async (data: { lessonId: number; language: string; script: string; title?: string }) => {
      return apiRequest("POST", "/api/vidguru/scripts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/scripts"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Script saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save script", variant: "destructive" });
    },
  });

  const updateScriptMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; script: string; title?: string }) => {
      return apiRequest("PATCH", `/api/vidguru/scripts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/scripts"] });
      setEditingScript(null);
      toast({ title: "Script updated" });
    },
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      return apiRequest("DELETE", `/api/vidguru/scripts/${scriptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/scripts"] });
      toast({ title: "Script deleted" });
    },
  });

  const translateMutation = useMutation({
    mutationFn: async ({ scriptId, targetLanguage }: { scriptId: number; targetLanguage: string }) => {
      return apiRequest("POST", `/api/vidguru/scripts/${scriptId}/translate`, { targetLanguage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/scripts"] });
      toast({ title: "Translation generated" });
    },
    onError: () => {
      toast({ title: "Translation failed", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setScriptContent("");
    setScriptTitle("");
    setSelectedCourse("");
    setSelectedLesson("");
    setSelectedLanguage("en");
  };

  const handleAddScript = () => {
    if (!selectedLesson || !scriptContent) {
      toast({ title: "Please select a lesson and enter script content", variant: "destructive" });
      return;
    }
    addScriptMutation.mutate({
      lessonId: parseInt(selectedLesson),
      language: selectedLanguage,
      script: scriptContent,
      title: scriptTitle || undefined,
    });
  };

  const filteredScripts = scripts?.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.script.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allLessons = courseDetails?.modules?.flatMap((m: any) => m.lessons || []) || [];

  const groupedByLanguage = SUPPORTED_LANGUAGES.map((lang) => ({
    ...lang,
    scripts: filteredScripts?.filter((s) => s.language === lang.code) || [],
  }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Languages className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Language Manager</h1>
            <p className="text-muted-foreground">Manage multilingual lesson scripts</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Languages className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Language Manager</h1>
            <p className="text-muted-foreground">Create and manage multilingual lesson scripts</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-script">
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Lesson Script</DialogTitle>
              <DialogDescription>
                Create a new script for a lesson in your chosen language.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger data-testid="select-course">
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Choose language" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCourse && (
                <div className="space-y-2">
                  <Label>Select Lesson</Label>
                  <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                    <SelectTrigger data-testid="select-lesson">
                      <SelectValue placeholder="Choose a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLessons.map((lesson: Lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Script Title (optional)</Label>
                <Input
                  placeholder="Introduction Script"
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                  data-testid="input-script-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Script Content</Label>
                <Textarea
                  placeholder="Enter the lesson script content here..."
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={8}
                  data-testid="textarea-script-content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddScript}
                disabled={addScriptMutation.isPending}
                data-testid="button-save-script"
              >
                {addScriptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Script
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-scripts"
          />
        </div>
        <Badge variant="secondary">{filteredScripts?.length || 0} scripts</Badge>
      </div>

      <Tabs defaultValue="en" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TabsTrigger key={lang.code} value={lang.code} className="relative">
              {lang.name}
              {groupedByLanguage.find((g) => g.code === lang.code)?.scripts.length ? (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {groupedByLanguage.find((g) => g.code === lang.code)?.scripts.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {SUPPORTED_LANGUAGES.map((lang) => {
          const langScripts = groupedByLanguage.find((g) => g.code === lang.code)?.scripts || [];
          return (
            <TabsContent key={lang.code} value={lang.code} className="space-y-4">
              {langScripts.length > 0 ? (
                <div className="grid gap-4">
                  {langScripts.map((script) => (
                    <Card key={script.id} data-testid={`card-script-${script.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            {script.title || "Untitled Script"}
                            {script.aiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Lesson #{script.lessonId} | {script.status}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingScript(script)}
                            data-testid={`button-edit-script-${script.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteScriptMutation.mutate(script.id)}
                            data-testid={`button-delete-script-${script.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {script.script}
                        </p>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {SUPPORTED_LANGUAGES.filter((l) => l.code !== lang.code).slice(0, 3).map((targetLang) => (
                            <Button
                              key={targetLang.code}
                              size="sm"
                              variant="outline"
                              onClick={() => translateMutation.mutate({ scriptId: script.id, targetLanguage: targetLang.code })}
                              disabled={translateMutation.isPending}
                              data-testid={`button-translate-${script.id}-${targetLang.code}`}
                            >
                              {translateMutation.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Languages className="h-3 w-3 mr-1" />
                              )}
                              Translate to {targetLang.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Languages className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No {lang.name} scripts</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-4">
                      Create scripts in {lang.name} or translate existing scripts.
                    </p>
                    <Button onClick={() => { setSelectedLanguage(lang.code); setIsAddDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add {lang.name} Script
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {editingScript && (
        <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Script</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingScript.title || ""}
                  onChange={(e) => setEditingScript({ ...editingScript, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editingScript.script}
                  onChange={(e) => setEditingScript({ ...editingScript, script: e.target.value })}
                  rows={12}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingScript(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => updateScriptMutation.mutate({
                  id: editingScript.id,
                  script: editingScript.script,
                  title: editingScript.title || undefined,
                })}
                disabled={updateScriptMutation.isPending}
              >
                {updateScriptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
