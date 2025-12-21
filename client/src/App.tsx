import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CreateCourse from "@/pages/create-course";
import CourseDetail from "@/pages/course-detail";
import CourseModules from "@/pages/course-modules";
import ModuleDetail from "@/pages/module-detail";
import LessonEditor from "@/pages/lesson-editor";
import TestEditor from "@/pages/test-editor";
import ProjectEditor from "@/pages/project-editor";
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

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aisiksha-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
