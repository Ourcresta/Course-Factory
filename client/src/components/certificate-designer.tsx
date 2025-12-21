import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Award,
  Lock,
  FileCheck,
  FolderKanban,
  QrCode,
  Info,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Certificate, Skill, Course } from "@shared/schema";

const certificateFormSchema = z.object({
  name: z.string().min(1, "Certificate name is required"),
  type: z.enum(["completion", "achievement"]),
  level: z.string().optional(),
  skillTags: z.array(z.string()).optional(),
  requiresTestPass: z.boolean().default(false),
  passingPercentage: z.number().min(1).max(100).default(70),
  requiresProjectCompletion: z.boolean().default(false),
  qrVerification: z.boolean().default(false),
});

type CertificateFormData = z.infer<typeof certificateFormSchema>;

interface CertificateDesignerProps {
  courseId: number;
  courseName: string;
  courseLevel: string;
  isPublished: boolean;
}

export function CertificateDesigner({
  courseId,
  courseName,
  courseLevel,
  isPublished,
}: CertificateDesignerProps) {
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: certificate, isLoading: isLoadingCertificate } = useQuery<Certificate | null>({
    queryKey: ["/api/courses", courseId, "certificate"],
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      name: "",
      type: "completion",
      level: courseLevel,
      skillTags: [],
      requiresTestPass: false,
      passingPercentage: 70,
      requiresProjectCompletion: false,
      qrVerification: false,
    },
  });

  useEffect(() => {
    if (certificate) {
      form.reset({
        name: certificate.name,
        type: certificate.type as "completion" | "achievement",
        level: certificate.level || courseLevel,
        skillTags: certificate.skillTags || [],
        requiresTestPass: certificate.requiresTestPass || false,
        passingPercentage: certificate.passingPercentage || 70,
        requiresProjectCompletion: certificate.requiresProjectCompletion || false,
        qrVerification: certificate.qrVerification || false,
      });
      setSelectedSkills(certificate.skillTags || []);
    } else {
      form.reset({
        name: `Certificate of Completion - ${courseName}`,
        type: "completion",
        level: courseLevel,
        skillTags: [],
        requiresTestPass: false,
        passingPercentage: 70,
        requiresProjectCompletion: false,
        qrVerification: false,
      });
    }
  }, [certificate, courseName, courseLevel, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CertificateFormData) => {
      return await apiRequest<Certificate>("POST", `/api/courses/${courseId}/certificate`, {
        ...data,
        skillTags: selectedSkills,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "certificate"] });
      toast({
        title: "Certificate Created",
        description: "The certificate configuration has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CertificateFormData) => {
      if (!certificate) return;
      return await apiRequest<Certificate>("PATCH", `/api/certificates/${certificate.id}`, {
        ...data,
        skillTags: selectedSkills,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "certificate"] });
      toast({
        title: "Certificate Updated",
        description: "The certificate configuration has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update certificate.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CertificateFormData) => {
    if (data.requiresTestPass && (!data.passingPercentage || data.passingPercentage < 1)) {
      toast({
        title: "Validation Error",
        description: "Passing percentage is required when test pass is required.",
        variant: "destructive",
      });
      return;
    }

    if (certificate) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleSkill = (skillName: string) => {
    if (isPublished) return;
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoadingCertificate) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const watchRequiresTestPass = form.watch("requiresTestPass");

  return (
    <div className="space-y-6">
      {isPublished && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Certificate rules are locked after publishing
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Unpublish the course to make changes to the certificate configuration.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificate Designer
              </CardTitle>
              <CardDescription>
                Configure the certificate that learners will receive upon completing this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Certificate of Completion - Full Stack Developer"
                            {...field}
                            disabled={isPublished}
                            data-testid="input-certificate-name"
                          />
                        </FormControl>
                        <FormDescription>
                          This name will appear on the certificate issued to learners
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPublished}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-certificate-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="completion">Completion Certificate</SelectItem>
                              <SelectItem value="achievement">Achievement Certificate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPublished}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-certificate-level">
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
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Skill Tags</h4>
                    <p className="text-sm text-muted-foreground">
                      Select skills that this certificate validates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant={selectedSkills.includes(skill.name) ? "default" : "outline"}
                            className={`cursor-pointer ${isPublished ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => toggleSkill(skill.name)}
                            data-testid={`badge-skill-${skill.id}`}
                          >
                            {skill.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No skills available. Add skills in the Skills section.
                        </p>
                      )}
                    </div>
                    {selectedSkills.length === 0 && !isPublished && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Skill tags are optional but recommended for better discoverability
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      Define what learners need to complete to earn this certificate
                    </p>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="requiresTestPass"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <FileCheck className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Requires Test Pass
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Learner must pass the final assessment
                                </p>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPublished}
                                data-testid="switch-requires-test"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchRequiresTestPass && (
                        <FormField
                          control={form.control}
                          name="passingPercentage"
                          render={({ field }) => (
                            <FormItem className="ml-8">
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
                                    data-testid="input-passing-percentage"
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="requiresProjectCompletion"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <FolderKanban className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Requires Project Completion
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Learner must complete the hands-on project
                                </p>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPublished}
                                data-testid="switch-requires-project"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Verification</h4>
                    
                    <FormField
                      control={form.control}
                      name="qrVerification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <QrCode className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <FormLabel className="text-sm font-medium cursor-pointer">
                                QR Verification
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Add a QR code for certificate authenticity verification
                              </p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPublished}
                              data-testid="switch-qr-verification"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isPublished && (
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isPending} data-testid="button-save-certificate">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {certificate ? "Update Certificate" : "Save Certificate"}
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
              <CardTitle className="text-lg">Certificate Preview</CardTitle>
              <CardDescription>
                How the certificate will appear to learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-lg border-2 border-dashed bg-muted/30 space-y-4">
                <div className="text-center space-y-2">
                  <Award className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="font-semibold text-lg" data-testid="preview-certificate-name">
                    {form.watch("name") || "Certificate Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Awarded for completing
                  </p>
                  <p className="font-medium" data-testid="preview-course-name">{courseName}</p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize font-medium">{form.watch("type")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="capitalize font-medium">{form.watch("level") || courseLevel}</span>
                  </div>
                </div>

                {selectedSkills.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Skills Validated:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                      Complete all modules
                    </li>
                    {form.watch("requiresTestPass") && (
                      <li className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        Pass assessment ({form.watch("passingPercentage")}%)
                      </li>
                    )}
                    {form.watch("requiresProjectCompletion") && (
                      <li className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        Complete project
                      </li>
                    )}
                  </ul>
                </div>

                {form.watch("qrVerification") && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <QrCode className="h-4 w-4" />
                      QR Verification Enabled
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {!certificate && !isPublished && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">No Certificate Configured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This course will be publishable without a certificate, but learners will not receive one upon completion.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
