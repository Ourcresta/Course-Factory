import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/lib/theme-provider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Moon, Sun, Monitor, Bell, Shield, Database, Plus, Trash2, 
  Check, RefreshCw, Building2, Landmark, CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branchName?: string;
  accountType: string;
  isActive: boolean;
  isPrimary: boolean;
}

function BankAccountSection() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    branchName: "",
    accountType: "savings",
  });

  const { data: bankAccounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Bank Account Added", description: "Your bank account has been saved." });
      setShowForm(false);
      setFormData({ bankName: "", accountNumber: "", accountHolderName: "", ifscCode: "", branchName: "", accountType: "savings" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save bank account", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Deleted", description: "Bank account removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bank account", variant: "destructive" });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/bank-accounts/${id}`, { isPrimary: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Updated", description: "Primary bank account updated." });
    },
  });

  return (
    <Card className="relative overflow-visible">
      <div 
        className="absolute inset-0 rounded-xl opacity-5"
        style={{
          backgroundImage: "linear-gradient(135deg, #1a365d 0%, #2a4365 50%, #2c5282 100%)",
        }}
      />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            <div>
              <CardTitle>Bank Account Settings</CardTitle>
              <CardDescription>Configure bank accounts for payment settlements.</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-bank-account">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {showForm && (
          <div className="p-4 border rounded-md bg-background space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  placeholder="e.g., State Bank of India"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  data-testid="input-bank-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  placeholder="Name as per bank records"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  data-testid="input-account-holder"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="Account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  data-testid="input-account-number"
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input
                  placeholder="e.g., SBIN0001234"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  data-testid="input-ifsc"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input
                  placeholder="Branch name (optional)"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  data-testid="input-branch"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formData.accountType} onValueChange={(v) => setFormData({ ...formData, accountType: v })}>
                  <SelectTrigger data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.bankName || !formData.accountNumber || !formData.accountHolderName || !formData.ifscCode || createMutation.isPending}
                data-testid="button-save-bank-account"
              >
                {createMutation.isPending ? "Saving..." : "Save Account"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading bank accounts...</div>
        ) : bankAccounts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-md">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No bank accounts configured</p>
            <p className="text-xs mt-1">Add a bank account to receive payment settlements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-md bg-background"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{account.bankName}</span>
                      {account.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {account.accountHolderName} | ****{account.accountNumber.slice(-4)} | {account.ifscCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(account.id)}
                      data-testid={`button-set-primary-${account.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(account.id)}
                    className="text-destructive"
                    data-testid={`button-delete-bank-${account.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your application preferences and configurations."
      />

      <BankAccountSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme.
              </p>
            </div>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                data-testid="button-theme-light"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                data-testid="button-theme-dark"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("system")}
                data-testid="button-theme-system"
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">AI Generation Complete</Label>
              <p className="text-sm text-muted-foreground">
                Notify when AI finishes generating course content.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-generation" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Publish Success</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a course is successfully published.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-publish" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Error Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify when there are errors in generation or publishing.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-errors" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage security and access settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-enable-2fa">
              Enable
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out after period of inactivity.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-session-timeout" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your data and backups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Export All Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your courses and content as JSON.
              </p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-export-data">
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data daily.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-auto-backup" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
