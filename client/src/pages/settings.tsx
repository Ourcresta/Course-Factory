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
  Moon, Sun, Monitor, Globe, Bell, Shield, Database, Key, Plus, Trash2, 
  Copy, Check, Eye, EyeOff, RefreshCw
} from "lucide-react";
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

interface ApiKey {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
  keyPreview: string;
  key?: string;
}

function ApiKeysSection() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest<ApiKey & { key: string; message: string }>("POST", "/api/api-keys", data);
    },
    onSuccess: (data) => {
      setNewlyCreatedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Created",
        description: "Your new API key has been created. Copy it now - it won't be shown again.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest<ApiKey>("PATCH", `/api/api-keys/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked and deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate({
      name: newKeyName,
      description: newKeyDescription || undefined,
    });
  };

  const handleCopyKey = async () => {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewKeyName("");
    setNewKeyDescription("");
    setNewlyCreatedKey(null);
    setCopiedKey(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for Shishya platform integration.
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-api-key">
                <Plus className="h-4 w-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {newlyCreatedKey ? "API Key Created" : "Create New API Key"}
                </DialogTitle>
                <DialogDescription>
                  {newlyCreatedKey 
                    ? "Copy your API key now. You won't be able to see it again."
                    : "Create an API key for Shishya to access published course data."}
                </DialogDescription>
              </DialogHeader>

              {newlyCreatedKey ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {newlyCreatedKey}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCopyKey}
                    data-testid="button-copy-api-key"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Shishya Production"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        data-testid="input-api-key-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key-description">Description (optional)</Label>
                      <Input
                        id="key-description"
                        placeholder="e.g., Used by OurShiksha Shishya student portal"
                        value={newKeyDescription}
                        onChange={(e) => setNewKeyDescription(e.target.value)}
                        data-testid="input-api-key-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || createKeyMutation.isPending}
                      data-testid="button-confirm-create-key"
                    >
                      {createKeyMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Key"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys created yet.</p>
            <p className="text-sm mt-1">Create a key to allow Shishya to fetch published courses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between gap-4 p-4 border rounded-md flex-wrap"
                data-testid={`api-key-row-${apiKey.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{apiKey.name}</span>
                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                      {apiKey.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {apiKey.description && (
                    <p className="text-sm text-muted-foreground mt-1">{apiKey.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono">{apiKey.keyPreview}</span>
                    <span>Created {formatDate(apiKey.createdAt)}</span>
                    {apiKey.lastUsedAt && (
                      <span>Last used {formatDate(apiKey.lastUsedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={apiKey.isActive}
                    onCheckedChange={(checked) => 
                      toggleKeyMutation.mutate({ id: apiKey.id, isActive: checked })
                    }
                    data-testid={`switch-api-key-${apiKey.id}`}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-api-key-${apiKey.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently revoke the API key "{apiKey.name}". 
                          Any applications using this key will lose access immediately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <Label className="text-base">API Documentation</Label>
          <div className="p-4 bg-muted rounded-md space-y-3">
            <p className="text-sm text-muted-foreground">
              Use these endpoints in Shishya to fetch published course data:
            </p>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses/:id
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses/:id/tests
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses/:id/projects
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses/:id/labs
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-green-600 dark:text-green-400">GET</span> /api/public/courses/:id/certificate
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Include the API key in the <code className="bg-background px-1 py-0.5 rounded">X-API-Key</code> header.
            </p>
          </div>
        </div>
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

      <ApiKeysSection />

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
            <Globe className="h-5 w-5" />
            Publishing
          </CardTitle>
          <CardDescription>
            Configure how courses are published to platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-sync on publish</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync to all platforms when a course is published.
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-auto-sync" />
          </div>
          <Separator />
          <div className="space-y-4">
            <Label className="text-base">Platform Endpoints</Label>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <Label className="w-32 text-sm">Learn Platform</Label>
                <Input
                  defaultValue="https://learn.aisiksha.in"
                  className="flex-1"
                  disabled
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-sm">Test Platform</Label>
                <Input
                  defaultValue="https://test.aisiksha.in"
                  className="flex-1"
                  disabled
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-sm">Profile Platform</Label>
                <Input
                  defaultValue="https://profile.aisiksha.in"
                  className="flex-1"
                  disabled
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-sm">Udyog Platform</Label>
                <Input
                  defaultValue="https://udyog.aisiksha.in"
                  className="flex-1"
                  disabled
                />
              </div>
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
