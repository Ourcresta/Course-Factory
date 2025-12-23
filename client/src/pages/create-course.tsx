import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  Wand2,
  ArrowRight,
  BookOpen,
  FolderKanban,
  FileCheck,
  FlaskConical,
  Award,
  Loader2,
  Eye,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { AIGeneratingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const courseFormSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters"),
  description: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  includeProjects: z.boolean(),
  includeTests: z.boolean(),
  includeLabs: z.boolean(),
  certificateType: z.enum(["completion", "achievement", "professional"]),
  aiCommand: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const exampleCommands = [
  "Create a Full Stack Developer course for freshers with projects and tests",
  "Create PMP certification prep course with mock exams and case studies",
  "Create Data Analyst course with SQL, Power BI projects for beginners",
  "Create Python Machine Learning course for intermediate developers",
  "Create DevOps Engineer course with CI/CD pipeline projects",
];

export default function CreateCourse() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [generationMode, setGenerationMode] = useState<"preview" | "publish">("preview");

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      level: "beginner",
      targetAudience: "",
      duration: "",
      includeProjects: true,
      includeTests: true,
      includeLabs: true,
      certificateType: "completion",
      aiCommand: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const response = await apiRequest("POST", "/api/courses", data);
      return response;
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Course created",
        description: "Your course has been created successfully.",
      });
      navigate(`/courses/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const generateWithAI = useMutation({
    mutationFn: async (command: string) => {
      setIsGenerating(true);
      const { level, includeProjects, includeTests, includeLabs, certificateType } = form.getValues();
      const response = await apiRequest("POST", "/api/courses/generate", { 
        command,
        level,
        includeProjects,
        includeTests,
        includeLabs,
        certificateType,
        mode: generationMode,
      });
      return response;
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Course generated",
        description: "AI has created your course. Review and publish when ready.",
      });
      setIsGenerating(false);
      navigate(`/courses/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate course with AI. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const onSubmit = (data: CourseFormValues) => {
    if (activeTab === "ai" && data.aiCommand) {
      generateWithAI.mutate(data.aiCommand);
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const handleExampleClick = (example: string) => {
    form.setValue("aiCommand", example);
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col gap-8 p-8 max-w-4xl mx-auto">
        <PageHeader
          title="Generating Course"
          description="AI is creating your complete course with modules, lessons, and content."
        />
        <Card>
          <AIGeneratingSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Create New Course"
        description="Use AI to generate a complete course or create one manually."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2" data-testid="tab-ai-create">
            <Sparkles className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2" data-testid="tab-manual-create">
            <BookOpen className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="ai" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    AI Course Generator
                  </CardTitle>
                  <CardDescription>
                    Describe the course you want to create in natural language. AI will generate
                    the complete syllabus, modules, lessons, projects, and assessments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="aiCommand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Command</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: Create a Full Stack Developer course for freshers with hands-on projects and certification tests..."
                            className="min-h-32 resize-none text-base"
                            data-testid="input-ai-command"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific about the topic, target audience, and what you want included.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Try an example:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {exampleCommands.map((example, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleExampleClick(example)}
                          data-testid={`button-example-${index}`}
                        >
                          {example.slice(0, 40)}...
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-level">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="certificateType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-certificate">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="achievement">Achievement</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <FormField
                      control={form.control}
                      name="includeProjects"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-include-projects"
                            />
                          </FormControl>
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="!mt-0">Include Projects</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeTests"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-include-tests"
                            />
                          </FormControl>
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="!mt-0">Include Tests</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeLabs"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-include-labs"
                            />
                          </FormControl>
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="!mt-0">Include Practice Labs</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border rounded-md p-4 bg-muted/30">
                    <Label className="text-sm font-medium mb-3 block">Generation Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={generationMode === "preview" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setGenerationMode("preview")}
                        data-testid="button-mode-preview"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Mode
                      </Button>
                      <Button
                        type="button"
                        variant={generationMode === "publish" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setGenerationMode("publish")}
                        data-testid="button-mode-publish"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Publish Mode
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {generationMode === "preview" 
                        ? "Preview creates a draft with concise content for quick review. Faster generation."
                        : "Publish creates complete, detailed content ready for students. Takes longer."
                      }
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!form.watch("aiCommand") || generateWithAI.isPending}
                    data-testid="button-generate-course"
                  >
                    {generateWithAI.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {generationMode === "preview" ? "Generating Preview..." : "Generating Full Course..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generationMode === "preview" ? "Generate Preview" : "Generate Full Course"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Manual Course Creation
                  </CardTitle>
                  <CardDescription>
                    Create a course step by step with full control over every detail.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Full Stack Web Development"
                            data-testid="input-course-name"
                            {...field}
                          />
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
                          <Textarea
                            placeholder="Describe what students will learn..."
                            className="min-h-24 resize-none"
                            data-testid="input-course-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-manual-level">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 8 weeks"
                              data-testid="input-duration"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Fresh graduates, Career changers"
                            data-testid="input-target-audience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="certificateType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-manual-certificate">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="achievement">Achievement</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="includeProjects"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Include Projects</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeTests"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Include Tests</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeLabs"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Include Practice Labs</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!form.watch("name") || createCourseMutation.isPending}
                    data-testid="button-create-manual-course"
                  >
                    {createCourseMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Course
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="text-lg">What AI Will Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Structured Modules</h4>
                <p className="text-xs text-muted-foreground">
                  Organized learning path with clear progression
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">AI Notes</h4>
                <p className="text-xs text-muted-foreground">
                  Simplified explanations and key takeaways
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FolderKanban className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Real Projects</h4>
                <p className="text-xs text-muted-foreground">
                  Job-oriented projects with step-by-step guides
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Assessments</h4>
                <p className="text-xs text-muted-foreground">
                  MCQs and scenario-based questions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FlaskConical className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Practice Labs</h4>
                <p className="text-xs text-muted-foreground">
                  Hands-on coding exercises with validation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
