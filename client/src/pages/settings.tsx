import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/lib/theme-provider";
import { Moon, Sun, Monitor, Globe, Bell, Shield, Database } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your application preferences and configurations."
      />

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
