import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CreateCourse from "@/pages/create-course";
import CourseDetail from "@/pages/course-detail";
import CourseModules from "@/pages/course-modules";
import ModuleDetail from "@/pages/module-detail";
import LessonEditor from "@/pages/lesson-editor";
import TestEditor from "@/pages/test-editor";
import ProjectEditor from "@/pages/project-editor";
import LabEditor from "@/pages/lab-editor";
import Skills from "@/pages/skills";
import Certificates from "@/pages/certificates";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      {/* Global routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/new" component={CreateCourse} />
      <Route path="/skills" component={Skills} />
      <Route path="/certificates" component={Certificates} />
      <Route path="/settings" component={Settings} />

      {/* Course-scoped routes */}
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/courses/:courseId/modules" component={CourseModules} />
      <Route path="/courses/:courseId/modules/:moduleId" component={ModuleDetail} />
      <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" component={LessonEditor} />
      <Route path="/courses/:courseId/tests/:testId" component={TestEditor} />
      <Route path="/courses/:courseId/projects/:projectId" component={ProjectEditor} />
      <Route path="/courses/:courseId/labs/:labId" component={LabEditor} />

      {/* Redirect invalid routes to courses */}
      <Route path="/modules">
        <Redirect to="/courses" />
      </Route>
      <Route path="/projects">
        <Redirect to="/courses" />
      </Route>
      <Route path="/tests">
        <Redirect to="/courses" />
      </Route>

      {/* Fallback - redirect to courses */}
      <Route>
        <Redirect to="/courses" />
      </Route>
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const path = window.location.pathname;
    if (path === '/login') {
      return <Login />;
    }
    return <Landing />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aisiksha-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
