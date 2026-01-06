import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Coins,
  Lock,
  Unlock,
  Users,
  TrendingUp,
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Loader2,
  Plus,
  Wallet,
  Trophy,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

interface ApprovalStats {
  pending: number;
  flagged: number;
  approved: number;
  rejected: number;
  highValue: number;
}

interface RewardApproval {
  id: number;
  shishyaUserId: number;
  ruleId: number | null;
  rewardType: string;
  originalValue: number;
  adjustedValue: number | null;
  status: string;
  aiReason: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  student: { id: number; name: string; email: string } | null;
  ruleName: string | null;
  reviewerName: string | null;
}

interface FraudFlag {
  id: number;
  shishyaUserId: number;
  flagType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  student: { id: number; name: string; email: string } | null;
}

interface AuditLog {
  id: number;
  adminId: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  createdAt: string;
  adminName: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  wallet: { balance: number; lifetimeEarned: number; lifetimeSpent: number } | null;
  riskScore: number;
  isWalletFrozen: boolean;
}

export default function Governance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("queue");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<RewardApproval | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "approve" | "reject" | "revoke" | "grant" | "deduct" | "freeze" | "unfreeze"; item?: any } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [adjustedValue, setAdjustedValue] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<ApprovalStats>({
    queryKey: ["/api/governance/approvals/stats"],
  });

  const { data: approvals, isLoading: approvalsLoading } = useQuery<RewardApproval[]>({
    queryKey: ["/api/governance/approvals", statusFilter],
  });

  const { data: fraudFlags } = useQuery<FraudFlag[]>({
    queryKey: ["/api/governance/fraud-flags"],
  });

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/governance/audit-logs"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/governance/students", searchQuery],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, adjustedValue, notes }: { id: number; adjustedValue?: number; notes?: string }) => {
      return apiRequest("POST", `/api/governance/approvals/${id}/approve`, { adjustedValue, notes });
    },
    onSuccess: () => {
      toast({ title: "Reward approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals/stats"] });
      setActionDialog(null);
      setActionNotes("");
      setAdjustedValue("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest("POST", `/api/governance/approvals/${id}/reject`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Reward rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals/stats"] });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest("POST", `/api/governance/approvals/${id}/revoke`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Reward revoked and deducted from wallet" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/approvals/stats"] });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to revoke", description: error.message, variant: "destructive" });
    },
  });

  const grantCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) => {
      return apiRequest("POST", "/api/governance/overrides/grant-coins", { userId, amount, reason });
    },
    onSuccess: () => {
      toast({ title: "Coins granted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/students"] });
      setActionDialog(null);
      setActionNotes("");
      setGrantAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to grant coins", description: error.message, variant: "destructive" });
    },
  });

  const deductCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) => {
      return apiRequest("POST", "/api/governance/overrides/deduct-coins", { userId, amount, reason });
    },
    onSuccess: () => {
      toast({ title: "Coins deducted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/students"] });
      setActionDialog(null);
      setActionNotes("");
      setGrantAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to deduct coins", description: error.message, variant: "destructive" });
    },
  });

  const freezeWalletMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest("POST", `/api/governance/wallets/${userId}/freeze`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Wallet frozen successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/students"] });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to freeze wallet", description: error.message, variant: "destructive" });
    },
  });

  const unfreezeWalletMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest("POST", `/api/governance/wallets/${userId}/unfreeze`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Wallet unfrozen successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/students"] });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to unfreeze wallet", description: error.message, variant: "destructive" });
    },
  });

  const handleAction = () => {
    if (!actionDialog) return;

    switch (actionDialog.type) {
      case "approve":
        approveMutation.mutate({
          id: actionDialog.item.id,
          adjustedValue: adjustedValue ? parseInt(adjustedValue) : undefined,
          notes: actionNotes || undefined,
        });
        break;
      case "reject":
        if (!actionNotes) {
          toast({ title: "Rejection reason is required", variant: "destructive" });
          return;
        }
        rejectMutation.mutate({ id: actionDialog.item.id, reason: actionNotes });
        break;
      case "revoke":
        if (!actionNotes) {
          toast({ title: "Revocation reason is required", variant: "destructive" });
          return;
        }
        revokeMutation.mutate({ id: actionDialog.item.id, reason: actionNotes });
        break;
      case "grant":
        if (!grantAmount || !actionNotes) {
          toast({ title: "Amount and reason are required", variant: "destructive" });
          return;
        }
        grantCoinsMutation.mutate({
          userId: actionDialog.item.id,
          amount: parseInt(grantAmount),
          reason: actionNotes,
        });
        break;
      case "deduct":
        if (!grantAmount || !actionNotes) {
          toast({ title: "Amount and reason are required", variant: "destructive" });
          return;
        }
        deductCoinsMutation.mutate({
          userId: actionDialog.item.id,
          amount: parseInt(grantAmount),
          reason: actionNotes,
        });
        break;
      case "freeze":
        if (!actionNotes) {
          toast({ title: "Freeze reason is required", variant: "destructive" });
          return;
        }
        freezeWalletMutation.mutate({ userId: actionDialog.item.id, reason: actionNotes });
        break;
      case "unfreeze":
        unfreezeWalletMutation.mutate({ userId: actionDialog.item.id, reason: actionNotes || "Unfrozen by admin" });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-rose-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "revoked":
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20"><RotateCcw className="w-3 h-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Low</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Medium</Badge>;
      case "high":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">High</Badge>;
      case "critical":
        return <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">Critical</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const isActionPending = approveMutation.isPending || rejectMutation.isPending || revokeMutation.isPending ||
    grantCoinsMutation.isPending || deductCoinsMutation.isPending || freezeWalletMutation.isPending || unfreezeWalletMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Reward Governance</h1>
            <p className="text-sm text-muted-foreground">Manage approvals, detect fraud, and control student wallets</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="text-pending-count">{stats?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                  <p className="text-2xl font-bold text-rose-600" data-testid="text-flagged-count">{stats?.flagged || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-rose-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Value</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-highvalue-count">{stats?.highValue || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-emerald-600" data-testid="text-approved-count">{stats?.approved || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-slate-600" data-testid="text-rejected-count">{stats?.rejected || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-slate-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4" data-testid="tabs-governance">
            <TabsTrigger value="queue" data-testid="tab-queue">Approval Queue</TabsTrigger>
            <TabsTrigger value="students" data-testid="tab-students">Student Wallets</TabsTrigger>
            <TabsTrigger value="fraud" data-testid="tab-fraud">Fraud Flags</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Reward Approvals
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-status-filter">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : approvals && approvals.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Reward Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvals.map((approval) => (
                          <TableRow key={approval.id} className={approval.isFlagged ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{approval.student?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{approval.student?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {approval.rewardType === "coins" && <Coins className="h-3 w-3 mr-1" />}
                                {approval.rewardType === "badge" && <Trophy className="h-3 w-3 mr-1" />}
                                {approval.rewardType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{approval.adjustedValue || approval.originalValue}</span>
                                {approval.adjustedValue && approval.adjustedValue !== approval.originalValue && (
                                  <span className="text-xs text-muted-foreground ml-1">(was {approval.originalValue})</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="truncate text-sm">{approval.aiReason || approval.ruleName || "-"}</p>
                              {approval.isFlagged && (
                                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {approval.flagReason}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(approval.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(approval.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {approval.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-emerald-600"
                                      onClick={() => setActionDialog({ type: "approve", item: approval })}
                                      data-testid={`button-approve-${approval.id}`}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-rose-600"
                                      onClick={() => setActionDialog({ type: "reject", item: approval })}
                                      data-testid={`button-reject-${approval.id}`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {approval.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-600"
                                    onClick={() => setActionDialog({ type: "revoke", item: approval })}
                                    data-testid={`button-revoke-${approval.id}`}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedApproval(approval)}
                                  data-testid={`button-view-${approval.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No {statusFilter} approvals found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Student Wallets & Manual Overrides
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-students"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {students && students.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Lifetime Earned</TableHead>
                          <TableHead>Risk Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Coins className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">{student.wallet?.balance || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.wallet?.lifetimeEarned || 0}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}>
                                  <div
                                    className={`h-full rounded-full ${
                                      student.riskScore > 70 ? "bg-rose-500" :
                                      student.riskScore > 40 ? "bg-amber-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(100, student.riskScore)}%` }}
                                  />
                                </div>
                                <span className="text-sm">{student.riskScore}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.isWalletFrozen ? (
                                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Frozen
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-600"
                                  onClick={() => setActionDialog({ type: "grant", item: student })}
                                  data-testid={`button-grant-${student.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-600"
                                  onClick={() => setActionDialog({ type: "deduct", item: student })}
                                  data-testid={`button-deduct-${student.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                {student.isWalletFrozen ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-600"
                                    onClick={() => setActionDialog({ type: "unfreeze", item: student })}
                                    data-testid={`button-unfreeze-${student.id}`}
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-600"
                                    onClick={() => setActionDialog({ type: "freeze", item: student })}
                                    data-testid={`button-freeze-${student.id}`}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fraud" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Fraud Flags
                </CardTitle>
                <CardDescription>Review and resolve detected suspicious activities</CardDescription>
              </CardHeader>
              <CardContent>
                {fraudFlags && fraudFlags.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Flag Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fraudFlags.map((flag) => (
                          <TableRow key={flag.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{flag.student?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{flag.student?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{flag.flagType.replace(/_/g, " ")}</Badge>
                            </TableCell>
                            <TableCell>{getSeverityBadge(flag.severity)}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="truncate text-sm">{flag.description}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(flag.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" data-testid={`button-resolve-flag-${flag.id}`}>
                                Resolve
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active fraud flags</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Audit Logs
                    </CardTitle>
                    <CardDescription>Complete history of governance actions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-export-logs">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {auditLogs && auditLogs.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.adminName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {log.actionType.replace(/_/g, " ").toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.entityType} {log.entityId && `#${log.entityId}`}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="truncate text-sm text-muted-foreground">{log.reason || "-"}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No audit logs yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setActionNotes(""); setAdjustedValue(""); setGrantAmount(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" && "Approve Reward"}
              {actionDialog?.type === "reject" && "Reject Reward"}
              {actionDialog?.type === "revoke" && "Revoke Reward"}
              {actionDialog?.type === "grant" && "Grant Coins"}
              {actionDialog?.type === "deduct" && "Deduct Coins"}
              {actionDialog?.type === "freeze" && "Freeze Wallet"}
              {actionDialog?.type === "unfreeze" && "Unfreeze Wallet"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve" && `Approve ${actionDialog.item?.originalValue} ${actionDialog.item?.rewardType} for ${actionDialog.item?.student?.name}`}
              {actionDialog?.type === "reject" && `Reject reward for ${actionDialog.item?.student?.name}. Please provide a reason.`}
              {actionDialog?.type === "revoke" && `Revoke approved reward and deduct from wallet. Please provide a reason.`}
              {actionDialog?.type === "grant" && `Grant additional coins to ${actionDialog.item?.name}`}
              {actionDialog?.type === "deduct" && `Deduct coins from ${actionDialog.item?.name}'s wallet`}
              {actionDialog?.type === "freeze" && `Freeze wallet for ${actionDialog.item?.name}. They won't be able to earn or spend coins.`}
              {actionDialog?.type === "unfreeze" && `Unfreeze wallet for ${actionDialog.item?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog?.type === "approve" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjusted Value (optional)</label>
                <Input
                  type="number"
                  placeholder={`Original: ${actionDialog.item?.originalValue}`}
                  value={adjustedValue}
                  onChange={(e) => setAdjustedValue(e.target.value)}
                  data-testid="input-adjusted-value"
                />
              </div>
            )}
            {(actionDialog?.type === "grant" || actionDialog?.type === "deduct") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  data-testid="input-grant-amount"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionDialog?.type === "approve" ? "Notes (optional)" : "Reason"}
              </label>
              <Textarea
                placeholder="Enter reason or notes..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                data-testid="input-action-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} data-testid="button-cancel-action">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isActionPending}
              variant={actionDialog?.type === "reject" || actionDialog?.type === "revoke" || actionDialog?.type === "deduct" || actionDialog?.type === "freeze" ? "destructive" : "default"}
              data-testid="button-confirm-action"
            >
              {isActionPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog?.type === "approve" && "Approve"}
              {actionDialog?.type === "reject" && "Reject"}
              {actionDialog?.type === "revoke" && "Revoke"}
              {actionDialog?.type === "grant" && "Grant Coins"}
              {actionDialog?.type === "deduct" && "Deduct"}
              {actionDialog?.type === "freeze" && "Freeze Wallet"}
              {actionDialog?.type === "unfreeze" && "Unfreeze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approval Details</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedApproval.student?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedApproval.student?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedApproval.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reward Type</p>
                  <Badge variant="outline" className="capitalize">{selectedApproval.rewardType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="font-medium">{selectedApproval.adjustedValue || selectedApproval.originalValue}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Reason</p>
                <p className="text-sm">{selectedApproval.aiReason || "-"}</p>
              </div>
              {selectedApproval.isFlagged && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <p className="text-sm font-medium text-rose-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Flagged
                  </p>
                  <p className="text-sm text-rose-600/80 mt-1">{selectedApproval.flagReason}</p>
                </div>
              )}
              {selectedApproval.reviewNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Review Notes</p>
                  <p className="text-sm">{selectedApproval.reviewNotes}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>Created: {format(new Date(selectedApproval.createdAt), "MMM d, yyyy HH:mm")}</div>
                {selectedApproval.reviewedAt && (
                  <div>Reviewed: {format(new Date(selectedApproval.reviewedAt), "MMM d, yyyy HH:mm")}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
