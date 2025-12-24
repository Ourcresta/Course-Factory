import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { 
  Shield, Users, UserPlus, Lock, Key, Clock, Activity, 
  AlertTriangle, CheckCircle, XCircle, Mail, MoreVertical,
  Trash2, UserX, UserCheck, History, Fingerprint, Globe,
  Laptop, Smartphone, LogOut, ShieldAlert, ShieldCheck,
  Eye, Ban, RefreshCw, Download, Filter, Search,
  Crown, UserCog, ClipboardList, AlertCircle, Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "super_admin" | "admin" | "reviewer" | "pending";
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
  invitedBy?: string;
}

interface LoginAttempt {
  id: number;
  email: string;
  username?: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location: string;
  reason?: string;
  createdAt: string;
}

interface AuditLog {
  id: number;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

interface Session {
  id: string;
  userId: string;
  username: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  lastActive: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface IpRule {
  id: string;
  ipAddress: string;
  type: "allow" | "block";
  description: string;
  createdAt: string;
  createdBy: string;
}

const ROLE_CONFIG = {
  super_admin: {
    label: "Super Admin",
    description: "Full platform access, can manage all admins and settings",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    description: "Manage courses, content, and view analytics",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: UserCog,
  },
  reviewer: {
    label: "Reviewer",
    description: "Review and approve content, read-only access to settings",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: ClipboardList,
  },
  pending: {
    label: "Pending",
    description: "Awaiting approval",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    icon: Clock,
  },
};

function SecurityOverview() {
  const stats = [
    {
      title: "Active Admins",
      value: "4",
      subtitle: "2 Super, 2 Admin",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "2FA Coverage",
      value: "75%",
      subtitle: "3 of 4 enabled",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      progress: 75,
    },
    {
      title: "Active Sessions",
      value: "6",
      subtitle: "Across 4 admins",
      icon: Fingerprint,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Failed Logins",
      value: "3",
      subtitle: "Last 24 hours",
      icon: ShieldAlert,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      alert: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                {stat.progress !== undefined && (
                  <Progress value={stat.progress} className="h-1.5 mt-2 w-20" />
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminUsersSection() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: admins = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; role: string }) => {
      return await apiRequest("POST", "/api/admin/invite", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Invitation Sent", description: "Admin invitation has been sent via email." });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("admin");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role Updated", description: "Admin role has been updated." });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ 
        title: variables.isActive ? "Admin Activated" : "Admin Deactivated", 
        description: variables.isActive 
          ? "Admin can now access the portal."
          : "Admin has been deactivated and logged out."
      });
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/users/${id}/force-logout`);
    },
    onSuccess: () => {
      toast({ title: "Sessions Revoked", description: "All sessions for this admin have been terminated." });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/users/${id}/unlock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Account Unlocked", description: "Admin account has been unlocked." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin Removed", description: "Admin has been removed from the system." });
    },
  });

  const mockAdmins: AdminUser[] = admins.length > 0 ? admins : [
    {
      id: "1",
      username: "Rajesh Kumar",
      email: "rajesh@ourshiksha.ai",
      role: "super_admin",
      createdAt: "2024-01-01T00:00:00Z",
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      twoFactorEnabled: true,
      failedLoginAttempts: 0,
    },
    {
      id: "2",
      username: "Priya Sharma",
      email: "priya@ourshiksha.ai",
      role: "super_admin",
      createdAt: "2024-02-15T00:00:00Z",
      lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: true,
      twoFactorEnabled: true,
      failedLoginAttempts: 0,
      invitedBy: "Rajesh Kumar",
    },
    {
      id: "3",
      username: "Amit Patel",
      email: "amit@ourshiksha.ai",
      role: "admin",
      createdAt: "2024-03-10T00:00:00Z",
      lastLoginAt: new Date(Date.now() - 172800000).toISOString(),
      isActive: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 2,
      invitedBy: "Rajesh Kumar",
    },
    {
      id: "4",
      username: "Sneha Reddy",
      email: "sneha@ourshiksha.ai",
      role: "reviewer",
      createdAt: "2024-06-20T00:00:00Z",
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
      isActive: true,
      twoFactorEnabled: true,
      failedLoginAttempts: 0,
      invitedBy: "Priya Sharma",
    },
    {
      id: "5",
      username: "Vikram Singh",
      email: "vikram@ourshiksha.ai",
      role: "pending",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: false,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      invitedBy: "Amit Patel",
    },
  ];

  const filteredAdmins = mockAdmins.filter((admin) => {
    const matchesSearch = 
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || admin.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: keyof typeof ROLE_CONFIG) => {
    const config = ROLE_CONFIG[role];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bgColor} ${config.color} ${config.borderColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const isLocked = (admin: AdminUser) => {
    if (!admin.lockedUntil) return false;
    return new Date(admin.lockedUntil) > new Date();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Manage administrators and their access levels.</CardDescription>
              </div>
            </div>
            <Button onClick={() => setIsInviteOpen(true)} data-testid="button-invite-admin">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-admins"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40" data-testid="select-role-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Security</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id} className={!admin.isActive ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(admin.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {admin.username}
                            {admin.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{admin.email}</div>
                          {admin.invitedBy && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Invited by {admin.invitedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>
                      {isLocked(admin) ? (
                        <Badge variant="outline" className="text-red-600 border-red-500/30">
                          <Ban className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      ) : admin.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : admin.role === "pending" ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Approval
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.twoFactorEnabled ? (
                          <Badge variant="outline" className="text-green-600 border-green-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            2FA
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No 2FA
                          </Badge>
                        )}
                        {admin.failedLoginAttempts > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {admin.failedLoginAttempts} failed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(admin.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-admin-menu-${admin.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {admin.role === "pending" && (
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ id: admin.id, role: "admin" })}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve as Admin
                            </DropdownMenuItem>
                          )}
                          
                          {admin.role !== "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => forceLogoutMutation.mutate(admin.id)}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Force Logout
                              </DropdownMenuItem>
                              
                              {isLocked(admin) && (
                                <DropdownMenuItem onClick={() => unlockMutation.mutate(admin.id)}>
                                  <Key className="h-4 w-4 mr-2" />
                                  Unlock Account
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem disabled={admin.id === currentUser?.id}>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => toggleStatusMutation.mutate({ id: admin.id, isActive: !admin.isActive })}
                            disabled={admin.id === currentUser?.id}
                          >
                            {admin.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate(admin.id)}
                            disabled={admin.id === currentUser?.id || admin.role === "super_admin"}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(ROLE_CONFIG).filter(([key]) => key !== "pending").map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{config.label}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new administrator. They will receive an OTP to complete registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Enter full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                data-testid="input-invite-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewer">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Reviewer
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_CONFIG[inviteRole as keyof typeof ROLE_CONFIG]?.description}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, name: inviteName, role: inviteRole })}
              disabled={!inviteEmail || !inviteName || inviteMutation.isPending}
              data-testid="button-send-invite"
            >
              <Mail className="h-4 w-4 mr-2" />
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityPoliciesSection() {
  const { toast } = useToast();
  const [isIpDialogOpen, setIsIpDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpType, setNewIpType] = useState<"allow" | "block">("allow");
  const [newIpDescription, setNewIpDescription] = useState("");

  const mockIpRules: IpRule[] = [
    {
      id: "1",
      ipAddress: "103.45.67.0/24",
      type: "allow",
      description: "Office network",
      createdAt: "2024-06-01T00:00:00Z",
      createdBy: "Rajesh Kumar",
    },
    {
      id: "2",
      ipAddress: "192.168.1.100",
      type: "allow",
      description: "Developer VPN",
      createdAt: "2024-08-15T00:00:00Z",
      createdBy: "Priya Sharma",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Configure authentication and access policies.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                All admins must enable 2FA to access the portal.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-require-2fa" />
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out after period of inactivity.
              </p>
            </div>
            <Select defaultValue="12h">
              <SelectTrigger className="w-36" data-testid="select-session-timeout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30m">30 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="4h">4 hours</SelectItem>
                <SelectItem value="12h">12 hours</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Password Policy</Label>
              <p className="text-sm text-muted-foreground">
                Minimum requirements for admin passwords.
              </p>
            </div>
            <Select defaultValue="strong">
              <SelectTrigger className="w-44" data-testid="select-password-policy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                <SelectItem value="medium">Medium (12+ mixed)</SelectItem>
                <SelectItem value="strong">Strong (16+ mixed)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Account Lockout</Label>
              <p className="text-sm text-muted-foreground">
                Lock account after failed login attempts.
              </p>
            </div>
            <Select defaultValue="5">
              <SelectTrigger className="w-36" data-testid="select-lockout-attempts">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 attempts</SelectItem>
                <SelectItem value="5">5 attempts</SelectItem>
                <SelectItem value="10">10 attempts</SelectItem>
                <SelectItem value="never">Never lock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Email alerts for new login activity.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-login-notifications" />
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Single Session Only</Label>
              <p className="text-sm text-muted-foreground">
                Allow only one active session per admin.
              </p>
            </div>
            <Switch data-testid="switch-single-session" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>IP Access Control</CardTitle>
                <CardDescription>Restrict admin access to specific IP addresses or ranges.</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsIpDialogOpen(true)} data-testid="button-add-ip-rule">
              <Globe className="h-4 w-4 mr-2" />
              Add IP Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mockIpRules.length > 0 ? (
            <div className="space-y-3">
              {mockIpRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                      rule.type === "allow" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {rule.type === "allow" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-sm">{rule.ipAddress}</div>
                      <div className="text-xs text-muted-foreground">{rule.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Added by {rule.createdBy}
                    </span>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No IP restrictions configured</p>
              <p className="text-xs mt-1">All IP addresses are currently allowed</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isIpDialogOpen} onOpenChange={setIsIpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Rule</DialogTitle>
            <DialogDescription>
              Add an IP address or CIDR range to the access control list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>IP Address or CIDR Range</Label>
              <Input
                placeholder="192.168.1.0/24 or 103.45.67.89"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="font-mono"
                data-testid="input-ip-address"
              />
            </div>
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select value={newIpType} onValueChange={(v) => setNewIpType(v as "allow" | "block")}>
                <SelectTrigger data-testid="select-ip-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow</SelectItem>
                  <SelectItem value="block">Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Office network, VPN, etc."
                value={newIpDescription}
                onChange={(e) => setNewIpDescription(e.target.value)}
                data-testid="input-ip-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIpDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({ title: "IP Rule Added", description: `${newIpType === "allow" ? "Allowed" : "Blocked"} ${newIp}` });
                setIsIpDialogOpen(false);
                setNewIp("");
                setNewIpDescription("");
              }}
              disabled={!newIp}
              data-testid="button-save-ip-rule"
            >
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoginActivitySection() {
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  const mockAttempts: LoginAttempt[] = [
    {
      id: 1,
      email: "rajesh@ourshiksha.ai",
      username: "Rajesh Kumar",
      success: true,
      ipAddress: "103.45.67.89",
      userAgent: "Chrome 120 on Windows",
      location: "Mumbai, Maharashtra",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      email: "priya@ourshiksha.ai",
      username: "Priya Sharma",
      success: true,
      ipAddress: "103.45.67.90",
      userAgent: "Safari on macOS",
      location: "Delhi, NCR",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      email: "unknown@hacker.com",
      success: false,
      ipAddress: "185.234.67.12",
      userAgent: "curl/7.68.0",
      location: "Unknown",
      reason: "Invalid credentials",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 4,
      email: "amit@ourshiksha.ai",
      username: "Amit Patel",
      success: false,
      ipAddress: "192.168.1.100",
      userAgent: "Firefox on Linux",
      location: "Bangalore, Karnataka",
      reason: "Wrong password",
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 5,
      email: "amit@ourshiksha.ai",
      username: "Amit Patel",
      success: true,
      ipAddress: "192.168.1.100",
      userAgent: "Firefox on Linux",
      location: "Bangalore, Karnataka",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 6,
      email: "sneha@ourshiksha.ai",
      username: "Sneha Reddy",
      success: true,
      ipAddress: "103.45.67.91",
      userAgent: "Chrome on Android",
      location: "Hyderabad, Telangana",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const filteredAttempts = mockAttempts.filter((attempt) => {
    if (filter === "all") return true;
    return filter === "success" ? attempt.success : !attempt.success;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const successCount = mockAttempts.filter(a => a.success).length;
  const failedCount = mockAttempts.filter(a => !a.success).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>Monitor all login attempts and security events.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              {successCount} successful
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-500/30">
              <XCircle className="h-3 w-3 mr-1" />
              {failedCount} failed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            data-testid="button-filter-all"
          >
            All
          </Button>
          <Button
            variant={filter === "success" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("success")}
            data-testid="button-filter-success"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Successful
          </Button>
          <Button
            variant={filter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("failed")}
            data-testid="button-filter-failed"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Failed
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className={`flex items-start gap-4 p-4 rounded-md border ${
                  attempt.success ? "bg-background" : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                  attempt.success ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  {attempt.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {attempt.username || attempt.email}
                    </span>
                    <Badge variant={attempt.success ? "outline" : "destructive"} className="text-xs">
                      {attempt.success ? "Login Successful" : "Login Failed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {attempt.email}
                  </p>
                  {attempt.reason && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Reason: {attempt.reason}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>{formatTime(attempt.createdAt)}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{attempt.ipAddress}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{attempt.location}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="truncate max-w-[200px]">{attempt.userAgent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ActiveSessionsSection() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const mockSessions: Session[] = [
    {
      id: "1",
      userId: "1",
      username: "Rajesh Kumar",
      device: "Desktop",
      browser: "Chrome 120 on Windows",
      location: "Mumbai, Maharashtra",
      ipAddress: "103.45.67.89",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastActive: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 39600000).toISOString(),
      isCurrent: true,
    },
    {
      id: "2",
      userId: "1",
      username: "Rajesh Kumar",
      device: "Mobile",
      browser: "Safari on iOS",
      location: "Mumbai, Maharashtra",
      ipAddress: "103.45.67.90",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 36000000).toISOString(),
      isCurrent: false,
    },
    {
      id: "3",
      userId: "2",
      username: "Priya Sharma",
      device: "Desktop",
      browser: "Firefox on macOS",
      location: "Delhi, NCR",
      ipAddress: "152.67.89.12",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      lastActive: new Date(Date.now() - 1800000).toISOString(),
      expiresAt: new Date(Date.now() + 36000000).toISOString(),
      isCurrent: false,
    },
    {
      id: "4",
      userId: "3",
      username: "Amit Patel",
      device: "Desktop",
      browser: "Chrome on Linux",
      location: "Bangalore, Karnataka",
      ipAddress: "192.168.1.100",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      lastActive: new Date(Date.now() - 7200000).toISOString(),
      expiresAt: new Date(Date.now() + 32400000).toISOString(),
      isCurrent: false,
    },
  ];

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("mobile")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const revokeSession = (sessionId: string) => {
    toast({ title: "Session Revoked", description: "The session has been terminated." });
  };

  const revokeAllOthers = () => {
    toast({ title: "Sessions Revoked", description: "All other sessions have been terminated." });
  };

  const revokeAllForUser = (username: string) => {
    toast({ title: "Sessions Revoked", description: `All sessions for ${username} have been terminated.` });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>View and manage all active admin sessions across the platform.</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={revokeAllOthers}
            data-testid="button-revoke-all-others"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Revoke All Others
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-start justify-between gap-4 p-4 rounded-md border ${
                session.isCurrent ? "bg-primary/5 border-primary/20" : "bg-background"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  {getDeviceIcon(session.device)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(session.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{session.username}</span>
                    {session.isCurrent && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session.browser}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>{session.location}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{session.ipAddress}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Last active</div>
                  <div className="text-sm font-medium">
                    {session.isCurrent ? "Now" : formatTimeAgo(session.lastActive)}
                  </div>
                </div>
                {!session.isCurrent && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-session-menu-${session.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => revokeSession(session.id)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Revoke Session
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => revokeAllForUser(session.username)}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Revoke All for {session.username}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogsSection() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const mockLogs: AuditLog[] = [
    {
      id: 1,
      userId: "1",
      username: "Rajesh Kumar",
      action: "course.publish",
      resourceType: "course",
      resourceId: "12",
      details: "Published 'Advanced React Patterns' course",
      ipAddress: "103.45.67.89",
      severity: "info",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      userId: "1",
      username: "Rajesh Kumar",
      action: "admin.login",
      resourceType: "auth",
      details: "Successful login from Mumbai, Maharashtra",
      ipAddress: "103.45.67.89",
      severity: "info",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      userId: "2",
      username: "Priya Sharma",
      action: "admin.invite",
      resourceType: "admin",
      resourceId: "5",
      details: "Invited vikram@ourshiksha.ai as Admin",
      ipAddress: "152.67.89.12",
      severity: "warning",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 4,
      userId: "3",
      username: "Amit Patel",
      action: "api_key.create",
      resourceType: "api_key",
      resourceId: "8",
      details: "Created API key 'Shishya Production v2'",
      ipAddress: "192.168.1.100",
      severity: "warning",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 5,
      userId: "1",
      username: "Rajesh Kumar",
      action: "admin.deactivate",
      resourceType: "admin",
      resourceId: "4",
      details: "Deactivated admin account: sneha@ourshiksha.ai",
      ipAddress: "103.45.67.89",
      severity: "critical",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 6,
      userId: "2",
      username: "Priya Sharma",
      action: "course.unpublish",
      resourceType: "course",
      resourceId: "8",
      details: "Unpublished 'Python Basics' for content review",
      ipAddress: "152.67.89.12",
      severity: "warning",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 7,
      userId: "1",
      username: "Rajesh Kumar",
      action: "settings.update",
      resourceType: "settings",
      details: "Updated password policy to Strong",
      ipAddress: "103.45.67.89",
      severity: "critical",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesSearch =
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="text-red-600 border-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-500/30">
            <Info className="h-3 w-3 mr-1" />
            Info
          </Badge>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Complete audit trail of all administrative actions.</CardDescription>
            </div>
          </div>
          <Button variant="outline" data-testid="button-export-audit-logs">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-logs"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40" data-testid="select-severity-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[450px]">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-4 p-4 rounded-md border ${
                  log.severity === "critical"
                    ? "bg-red-500/5 border-red-500/20"
                    : log.severity === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-background"
                }`}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(log.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.username}</span>
                    {getSeverityBadge(log.severity)}
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(log.createdAt)}</span>
                    {log.ipAddress && (
                      <>
                        <span className="text-muted-foreground/50">|</span>
                        <span>{log.ipAddress}</span>
                      </>
                    )}
                    {log.resourceId && (
                      <>
                        <span className="text-muted-foreground/50">|</span>
                        <span>Resource ID: {log.resourceId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function Security() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Security & Admins"
        description="Manage administrators, access control, and monitor security events."
      />

      <SecurityOverview />

      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0" data-testid="tabs-security">
          <TabsTrigger value="admins" className="data-[state=active]:bg-muted" data-testid="tab-admins">
            <Users className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-muted" data-testid="tab-policies">
            <Lock className="h-4 w-4 mr-2" />
            Security Policies
          </TabsTrigger>
          <TabsTrigger value="logins" className="data-[state=active]:bg-muted" data-testid="tab-logins">
            <Activity className="h-4 w-4 mr-2" />
            Login Activity
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-muted" data-testid="tab-sessions">
            <Fingerprint className="h-4 w-4 mr-2" />
            Active Sessions
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-muted" data-testid="tab-audit">
            <History className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="mt-4">
          <AdminUsersSection />
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <SecurityPoliciesSection />
        </TabsContent>

        <TabsContent value="logins" className="mt-4">
          <LoginActivitySection />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <ActiveSessionsSection />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
