import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Briefcase,
  Save,
  Loader2,
  Lock,
  AlertTriangle,
  Tag,
  X,
  Check,
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
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Skill, Course } from "@shared/schema";

interface ProjectWithSkills extends Project {
  skills: Skill[];
}

const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  objectives: z.string().optional(),
  deliverables: z.string().optional(),
  submissionInstructions: z.string().optional(),
  evaluationNotes: z.string().optional(),
  problemStatement: z.string().optional(),
  folderStructure: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function ProjectEditor() {
  const { toast } = useToast();
  const [, params] = useRoute("/courses/:courseId/projects/:projectId");
  const courseId = params?.courseId ? parseInt(params.courseId) : null;
  const projectId = params?.projectId ? parseInt(params.projectId) : null;

  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: project, isLoading: isLoadingProject } = useQuery<ProjectWithSkills>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: allSkills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const isPublished = course?.status === "published";
  const isLocked = project?.status === "locked";
  const isReadOnly = isPublished || isLocked;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      objectives: "",
      deliverables: "",
      submissionInstructions: "",
      evaluationNotes: "",
      problemStatement: "",
      folderStructure: "",
      difficulty: "intermediate",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        description: project.description || "",
        objectives: project.objectives || "",
        deliverables: project.deliverables || "",
        submissionInstructions: project.submissionInstructions || "",
        evaluationNotes: project.evaluationNotes || "",
        problemStatement: project.problemStatement || "",
        folderStructure: project.folderStructure || "",
        difficulty: (project.difficulty as "beginner" | "intermediate" | "advanced") || "intermediate",
      });
      if (project.skills) {
        setSelectedSkills(project.skills.map(s => s.id));
      }
    }
  }, [project, form]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData & { skillIds: number[] }) => {
      return await apiRequest<ProjectWithSkills>("PATCH", `/api/projects/${projectId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "projects"] });
      toast({
        title: "Project Updated",
        description: "Changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProjectFormData) => {
    updateProjectMutation.mutate({ ...data, skillIds: selectedSkills });
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost">Return to course</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <PageHeader
        backLink={`/courses/${courseId}`}
        backLabel="Back to Course"
        title={project.title}
        description={isReadOnly ? "View project details (read-only)" : "Edit project details and requirements"}
      />

      {isReadOnly && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {isPublished ? "Course is published" : "Project is locked"}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {isPublished 
                ? "Unpublish the course to make changes to this project."
                : "This project is locked and cannot be edited."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Project Details
              </CardTitle>
              <CardDescription>
                Configure the project information and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Build a Todo Application"
                            disabled={isReadOnly}
                            data-testid="input-project-title"
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
                            {...field} 
                            placeholder="Brief overview of the project..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="problemStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Statement</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe the problem this project solves..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-problem"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-project-difficulty">
                                <SelectValue placeholder="Select difficulty" />
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
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Objectives</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="What will students learn from this project..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-objectives"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliverables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deliverables</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="What should students submit..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-deliverables"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="submissionInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="How should students submit their work..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-submission"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="evaluationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evaluation Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Criteria for evaluating student submissions..."
                            rows={3}
                            disabled={isReadOnly}
                            data-testid="input-project-evaluation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="folderStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommended Folder Structure</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="project/
  src/
    components/
    pages/
  public/
  package.json"
                            rows={6}
                            className="font-mono text-sm"
                            disabled={isReadOnly}
                            data-testid="input-project-folder"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isReadOnly && (
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProjectMutation.isPending}
                        data-testid="button-save-project"
                      >
                        {updateProjectMutation.isPending ? (
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>
                Skills students will develop from this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSkills.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill.id);
                      return (
                        <Badge
                          key={skill.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                          onClick={() => !isReadOnly && toggleSkill(skill.id)}
                          data-testid={`skill-tag-${skill.id}`}
                        >
                          {skill.name}
                          {isSelected && <Check className="h-3 w-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                  {selectedSkills.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No skills available. Create skills in the Skills Library first.
                  </p>
                  <Link href="/skills">
                    <Button variant="ghost" size="sm">
                      Go to Skills Library
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={project.status === "locked" ? "secondary" : "outline"}>
                  {project.status === "locked" ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </>
                  ) : (
                    "Draft"
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {project.status === "locked" 
                  ? "This project is locked and cannot be modified."
                  : "This project is in draft mode and can be edited."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
