import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Award, Search, Trash2, Shield, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CardGridSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Certificate, Course } from "@shared/schema";

const certificateFormSchema = z.object({
  courseId: z.number({ required_error: "Course is required" }),
  name: z.string().min(1, "Certificate name is required"),
  level: z.string().optional(),
  requiresTestPass: z.boolean().default(true),
  requiresProjectCompletion: z.boolean().default(false),
  qrVerification: z.boolean().default(true),
});

type CertificateFormValues = z.infer<typeof certificateFormSchema>;

export default function Certificates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      name: "",
      level: "completion",
      requiresTestPass: true,
      requiresProjectCompletion: false,
      qrVerification: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CertificateFormValues) => {
      await apiRequest("POST", "/api/certificates", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Certificate template created" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create certificate template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Certificate template deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete certificate template",
        variant: "destructive",
      });
    },
  });

  const filteredCertificates = certificates.filter((cert) =>
    cert.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCourseNameById = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown Course";
  };

  const onSubmit = (values: CertificateFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Certificates"
        description="Manage certificate templates for course completion"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-certificate">
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Certificate Template</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-certificate-course">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Python Developer Certificate"
                          data-testid="input-certificate-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-certificate-level">
                            <SelectValue placeholder="Select level" />
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

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requiresTestPass"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Requires Test Pass</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Student must pass all tests
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-requires-test"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresProjectCompletion"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Requires Project Completion</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Student must complete all projects
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-requires-project"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qrVerification"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">QR Code Verification</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Include QR code for verification
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-qr-verification"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-certificate"
                >
                  {createMutation.isPending ? "Creating..." : "Create Certificate"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-certificates"
          />
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filteredCertificates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCertificates.map((cert) => (
            <Card key={cert.id} className="overflow-visible" data-testid={`certificate-${cert.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{cert.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getCourseNameById(cert.courseId)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(cert.id)}
                  data-testid={`button-delete-certificate-${cert.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cert.level && (
                    <Badge variant="secondary" className="capitalize">
                      {cert.level}
                    </Badge>
                  )}
                  {cert.requiresTestPass && (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Test Required
                    </Badge>
                  )}
                  {cert.qrVerification && (
                    <Badge variant="outline" className="gap-1">
                      <QrCode className="h-3 w-3" />
                      QR Enabled
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Award}
            title="No certificate templates"
            description="Create certificate templates to award students upon course completion."
            actionLabel="Add Certificate"
            onAction={() => setIsDialogOpen(true)}
          />
        </Card>
      )}
    </div>
  );
}
