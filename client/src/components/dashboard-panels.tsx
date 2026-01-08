import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  FileText,
  FlaskConical,
  ClipboardCheck,
  FolderKanban,
  Award,
  Tags,
  CreditCard,
  Shield,
  Users,
  TrendingUp,
  RefreshCw,
  Eye,
  Send,
  Link2,
  Power,
  PowerOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface CourseFactoryStatus {
  lastRunTime: string | null;
  mode: "preview" | "publish" | null;
  generatedEntities: {
    modules: number;
    lessons: number;
    labs: number;
    tests: number;
    projects: number;
  };
  validationResult: "pass" | "fail" | null;
  errorReason: string | null;
}

interface AcademicHealth {
  coursesWithoutLabs: number;
  coursesWithoutTests: number;
  coursesWithoutCertificates: number;
  coursesWithoutSkills: number;
  totalCourses: number;
}

interface PracticeQuality {
  labsMissingValidation: number;
  labsMissingHints: number;
  labsNotLinkedToCertificates: number;
  unlockMechanismCoverage: number;
  totalLabs: number;
}

interface CertificateSkillHealth {
  certificatesConfigured: number;
  certificatesMissing: number;
  skillsCovered: number;
  skillsGaps: number;
  totalSkills: number;
}

interface CreditStatus {
  coursesWithPricing: number;
  coursesWithoutPricing: number;
  aiCreditsUsedToday: number;
  totalCreditsUsed: number;
}

interface SecurityStatus {
  totalAdmins: number;
  pendingApprovals: number;
  failedLoginAttempts: number;
}

export function CourseFactoryPanel() {
  const { data, isLoading } = useQuery<CourseFactoryStatus>({
    queryKey: ["/api/dashboard/course-factory-status"],
  });

  const mockData: CourseFactoryStatus = {
    lastRunTime: new Date().toISOString(),
    mode: "preview",
    generatedEntities: { modules: 5, lessons: 24, labs: 8, tests: 3, projects: 2 },
    validationResult: "pass",
    errorReason: null,
  };

  const status = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Course Factory Status
          </CardTitle>
          <CardDescription>Last AI generation run details</CardDescription>
        </div>
        <Badge 
          variant={status.validationResult === "pass" ? "default" : "destructive"}
          className="text-xs"
        >
          {status.validationResult === "pass" ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> PASS</>
          ) : status.validationResult === "fail" ? (
            <><XCircle className="h-3 w-3 mr-1" /> FAIL</>
          ) : (
            "No runs yet"
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Run</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {status.lastRunTime 
                ? new Date(status.lastRunTime).toLocaleString()
                : "Never"
              }
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mode Used</p>
            <Badge variant="secondary" className="text-xs">
              {status.mode === "preview" ? (
                <><Eye className="h-3 w-3 mr-1" /> Preview</>
              ) : status.mode === "publish" ? (
                <><Send className="h-3 w-3 mr-1" /> Publish</>
              ) : (
                "N/A"
              )}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">Generated Entities</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-bold">{status.generatedEntities.modules}</p>
              <p className="text-xs text-muted-foreground">Modules</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-bold">{status.generatedEntities.lessons}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-bold">{status.generatedEntities.labs}</p>
              <p className="text-xs text-muted-foreground">Labs</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-bold">{status.generatedEntities.tests}</p>
              <p className="text-xs text-muted-foreground">Tests</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-bold">{status.generatedEntities.projects}</p>
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>

        {status.errorReason && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive font-medium">Error: {status.errorReason}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => window.location.href = "/courses/new"}
            data-testid="button-rerun-ai"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Re-run AI
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => window.open("/api/ai/system-prompt", "_blank")}
            data-testid="button-view-system-role"
          >
            <Brain className="h-3 w-3 mr-1" /> View System Role
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AcademicHealthPanel() {
  const { data, isLoading } = useQuery<AcademicHealth>({
    queryKey: ["/api/dashboard/academic-health"],
  });

  const mockData: AcademicHealth = {
    coursesWithoutLabs: 3,
    coursesWithoutTests: 2,
    coursesWithoutCertificates: 4,
    coursesWithoutSkills: 1,
    totalCourses: 12,
  };

  const health = data || mockData;
  const issues = [
    { label: "Without Labs", value: health.coursesWithoutLabs, icon: FlaskConical, severity: health.coursesWithoutLabs > 0 ? "warning" : "success" },
    { label: "Without Tests", value: health.coursesWithoutTests, icon: ClipboardCheck, severity: health.coursesWithoutTests > 0 ? "warning" : "success" },
    { label: "Without Certificates", value: health.coursesWithoutCertificates, icon: Award, severity: health.coursesWithoutCertificates > 0 ? "error" : "success" },
    { label: "Without Skills", value: health.coursesWithoutSkills, icon: Tags, severity: health.coursesWithoutSkills > 0 ? "warning" : "success" },
  ];

  const blockers = issues.filter(i => i.value > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Academic Health
        </CardTitle>
        <CardDescription>
          Course quality gates ({health.totalCourses} total courses)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <issue.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Courses {issue.label}</span>
            </div>
            <Badge 
              variant={issue.severity === "success" ? "secondary" : issue.severity === "error" ? "destructive" : "outline"}
              className="text-xs"
            >
              {issue.value}
            </Badge>
          </div>
        ))}

        {blockers.length > 0 && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{blockers.length} publish blockers detected</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PracticeQualityPanel() {
  const { data, isLoading } = useQuery<PracticeQuality>({
    queryKey: ["/api/dashboard/practice-quality"],
  });

  const mockData: PracticeQuality = {
    labsMissingValidation: 2,
    labsMissingHints: 1,
    labsNotLinkedToCertificates: 3,
    unlockMechanismCoverage: 75,
    totalLabs: 24,
  };

  const quality = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Practice-First Quality
        </CardTitle>
        <CardDescription>
          Lab quality metrics ({quality.totalLabs} total labs)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Missing Validation Logic</span>
          <Badge variant={quality.labsMissingValidation > 0 ? "destructive" : "secondary"} className="text-xs">
            {quality.labsMissingValidation}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Missing Hints</span>
          <Badge variant={quality.labsMissingHints > 0 ? "outline" : "secondary"} className="text-xs">
            {quality.labsMissingHints}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Not Linked to Certificates</span>
          <Badge variant={quality.labsNotLinkedToCertificates > 0 ? "outline" : "secondary"} className="text-xs">
            {quality.labsNotLinkedToCertificates}
          </Badge>
        </div>
        
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Unlock Mechanism Coverage</span>
            <span className="text-xs font-medium">{quality.unlockMechanismCoverage}%</span>
          </div>
          <Progress value={quality.unlockMechanismCoverage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateSkillPanel() {
  const { data, isLoading } = useQuery<CertificateSkillHealth>({
    queryKey: ["/api/dashboard/certificate-skill-health"],
  });

  const mockData: CertificateSkillHealth = {
    certificatesConfigured: 8,
    certificatesMissing: 4,
    skillsCovered: 45,
    skillsGaps: 12,
    totalSkills: 57,
  };

  const health = data || mockData;
  const certCoverage = health.certificatesConfigured / (health.certificatesConfigured + health.certificatesMissing) * 100;
  const skillCoverage = health.skillsCovered / health.totalSkills * 100;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certificate & Skill Governance
        </CardTitle>
        <CardDescription>
          Certification and skill mapping health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <p className="text-2xl font-bold">{health.certificatesConfigured}</p>
            <p className="text-xs text-muted-foreground">Certificates Configured</p>
          </div>
          <div className="p-3 rounded-md bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{health.certificatesMissing}</p>
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Certificate Coverage</span>
            <span className="text-xs font-medium">{Math.round(certCoverage)}%</span>
          </div>
          <Progress value={certCoverage} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Skill Coverage ({health.skillsCovered}/{health.totalSkills})</span>
            <span className="text-xs font-medium">{Math.round(skillCoverage)}%</span>
          </div>
          <Progress value={skillCoverage} className="h-2" />
        </div>

        {health.skillsGaps > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            {health.skillsGaps} skill gaps detected
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CreditPanel() {
  const { data, isLoading } = useQuery<CreditStatus>({
    queryKey: ["/api/dashboard/credit-status"],
  });

  const mockData: CreditStatus = {
    coursesWithPricing: 10,
    coursesWithoutPricing: 2,
    aiCreditsUsedToday: 450,
    totalCreditsUsed: 12500,
  };

  const credit = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Credit & Monetization
        </CardTitle>
        <CardDescription>
          Pricing and credit usage (1 Credit = 1 INR)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <p className="text-2xl font-bold">{credit.coursesWithPricing}</p>
            <p className="text-xs text-muted-foreground">Courses Priced</p>
          </div>
          <div className="p-3 rounded-md bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{credit.coursesWithoutPricing}</p>
            <p className="text-xs text-muted-foreground">Missing Pricing</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> AI Credits Today
            </span>
            <span className="font-medium">{credit.aiCreditsUsedToday} INR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Credits Used</span>
            <span className="font-medium">{credit.totalCreditsUsed.toLocaleString()} INR</span>
          </div>
        </div>

        {credit.coursesWithoutPricing > 0 && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{credit.coursesWithoutPricing} courses blocked from publishing (no pricing)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SecurityPanel() {
  const { data, isLoading } = useQuery<SecurityStatus>({
    queryKey: ["/api/dashboard/security-status"],
  });

  const mockData: SecurityStatus = {
    totalAdmins: 3,
    pendingApprovals: 1,
    failedLoginAttempts: 5,
  };

  const security = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security & Governance
        </CardTitle>
        <CardDescription>
          Admin access and login security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Active Admins</span>
          </div>
          <Badge variant="secondary" className="text-xs">{security.totalAdmins}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Pending Approvals</span>
          </div>
          <Badge variant={security.pendingApprovals > 0 ? "destructive" : "secondary"} className="text-xs">
            {security.pendingApprovals}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Failed Login Attempts (24h)</span>
          </div>
          <Badge variant={security.failedLoginAttempts > 10 ? "destructive" : "outline"} className="text-xs">
            {security.failedLoginAttempts}
          </Badge>
        </div>

        {security.pendingApprovals > 0 && (
          <div className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{security.pendingApprovals} admin approval(s) pending</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ShishyaStatus {
  isEnabled: boolean;
  lastSyncAt: string | null;
}

export function ShishyaControlPanel() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<ShishyaStatus>({
    queryKey: ["/api/dashboard/shishya-status"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("POST", "/api/system-settings", {
        key: "shishya_enabled",
        value: enabled ? "true" : "false",
        description: "Controls whether Shishya student portal integration is active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/shishya-status"] });
      toast({
        title: "Shishya Integration Updated",
        description: "The student portal integration status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update Shishya integration status",
        variant: "destructive",
      });
    },
  });

  const mockData: ShishyaStatus = {
    isEnabled: false,
    lastSyncAt: null,
  };

  const status = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Shishya Integration
        </CardTitle>
        <CardDescription>
          Control student portal connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-4 rounded-md bg-background/80 border">
          <div className="flex items-center gap-3">
            {status.isEnabled ? (
              <Power className="h-5 w-5 text-green-500" />
            ) : (
              <PowerOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Portal Status</p>
              <p className="text-xs text-muted-foreground">
                {status.isEnabled ? "Active and receiving data" : "Disabled - no data sync"}
              </p>
            </div>
          </div>
          <Switch
            checked={status.isEnabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending}
            data-testid="switch-shishya-toggle"
          />
        </div>

        {!status.isEnabled && (
          <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Enable to start syncing courses with Shishya</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
