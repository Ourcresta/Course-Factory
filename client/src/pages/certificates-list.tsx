import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Edit, Trash2, Link2, Award, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Certificate, Course } from "@shared/schema";

export default function CertificatesListPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "completion",
    level: "",
    category: "",
    requiresTestPass: false,
    passingPercentage: 70,
    requiresProjectCompletion: false,
    requiresLabCompletion: false,
    qrVerification: true,
  });

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "completion",
        level: "",
        category: "",
        requiresTestPass: false,
        passingPercentage: 70,
        requiresProjectCompletion: false,
        requiresLabCompletion: false,
        qrVerification: true,
      });
      toast({ title: "Certificate template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create certificate", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Certificate deleted successfully" });
    },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ certId, courseId }: { certId: number; courseId: number }) => {
      return apiRequest("POST", `/api/certificates/${certId}/link`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setIsLinkOpen(false);
      setSelectedCert(null);
      toast({ title: "Certificate linked to course successfully" });
    },
  });

  const filteredCerts = certificates.filter((cert) => {
    const matchesSearch = cert.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "completion":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Completion</Badge>;
      case "achievement":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Achievement</Badge>;
      case "skill":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Skill</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Design certificate templates and link them to courses
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-certificate">
              <Plus className="h-4 w-4 mr-2" />
              Create Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Certificate Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Certificate Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Web Development Professional"
                  data-testid="input-cert-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this certificate represents..."
                  data-testid="input-cert-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-cert-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completion">Completion</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger data-testid="select-cert-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Requirements</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresTestPass" className="text-sm">Requires Test Pass</Label>
                  <Switch
                    id="requiresTestPass"
                    checked={formData.requiresTestPass}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresTestPass: checked })}
                  />
                </div>
                {formData.requiresTestPass && (
                  <div>
                    <Label htmlFor="passingPercentage" className="text-sm">Passing Percentage</Label>
                    <Input
                      id="passingPercentage"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.passingPercentage}
                      onChange={(e) => setFormData({ ...formData, passingPercentage: parseInt(e.target.value) || 70 })}
                      className="mt-1"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresProjectCompletion" className="text-sm">Requires Project Completion</Label>
                  <Switch
                    id="requiresProjectCompletion"
                    checked={formData.requiresProjectCompletion}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresProjectCompletion: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresLabCompletion" className="text-sm">Requires Lab Completion</Label>
                  <Switch
                    id="requiresLabCompletion"
                    checked={formData.requiresLabCompletion}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresLabCompletion: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="qrVerification" className="text-sm">QR Code Verification</Label>
                  <Switch
                    id="qrVerification"
                    checked={formData.qrVerification}
                    onCheckedChange={(checked) => setFormData({ ...formData, qrVerification: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.name || createMutation.isPending}
                  data-testid="button-submit-certificate"
                >
                  {createMutation.isPending ? "Creating..." : "Create Certificate"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-certs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading certificates...</div>
          </div>
        ) : filteredCerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No certificates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Create your first certificate template"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-cert">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Certificate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Linked Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => (
                  <TableRow key={cert.id} data-testid={`row-cert-${cert.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        {cert.level && (
                          <div className="text-xs text-muted-foreground capitalize">{cert.level}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(cert.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cert.requiresTestPass && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Test
                          </Badge>
                        )}
                        {cert.requiresProjectCompletion && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Project
                          </Badge>
                        )}
                        {cert.requiresLabCompletion && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Labs
                          </Badge>
                        )}
                        {!cert.requiresTestPass && !cert.requiresProjectCompletion && !cert.requiresLabCompletion && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cert.courseId ? (
                        <Badge variant="outline" className="text-xs">
                          Course #{cert.courseId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(cert.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-cert-menu-${cert.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = `/certificates/${cert.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCert(cert);
                              setIsLinkOpen(true);
                            }}
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Link to Course
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(cert.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Certificate to Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a course to link "{selectedCert?.name}" to:
            </p>
            <Select
              onValueChange={(value) => {
                if (selectedCert) {
                  linkMutation.mutate({ certId: selectedCert.id, courseId: parseInt(value) });
                }
              }}
            >
              <SelectTrigger data-testid="select-link-course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
