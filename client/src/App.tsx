import { Suspense, lazy } from "react";
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

const Login = lazy(() => import("@/pages/login"));
const Landing = lazy(() => import("@/pages/landing"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Courses = lazy(() => import("@/pages/courses"));
const CreateCourse = lazy(() => import("@/pages/create-course"));
const CourseDetail = lazy(() => import("@/pages/course-detail"));
const CourseModules = lazy(() => import("@/pages/course-modules"));
const ModuleDetail = lazy(() => import("@/pages/module-detail"));
const LessonEditor = lazy(() => import("@/pages/lesson-editor"));
const TestEditor = lazy(() => import("@/pages/test-editor"));
const ProjectEditor = lazy(() => import("@/pages/project-editor"));
const LabEditor = lazy(() => import("@/pages/lab-editor"));
const Skills = lazy(() => import("@/pages/skills"));
const Certificates = lazy(() => import("@/pages/certificates"));
const Settings = lazy(() => import("@/pages/settings"));
const Tests = lazy(() => import("@/pages/tests"));
const Labs = lazy(() => import("@/pages/labs"));
const Projects = lazy(() => import("@/pages/projects"));
const CertificatesList = lazy(() => import("@/pages/certificates-list"));
const Credits = lazy(() => import("@/pages/credits"));
const Payments = lazy(() => import("@/pages/payments"));
const Reports = lazy(() => import("@/pages/reports"));
const Subscriptions = lazy(() => import("@/pages/subscriptions"));
const Promotions = lazy(() => import("@/pages/promotions"));
const ShishyaOverview = lazy(() => import("@/pages/shishya-overview"));
const ShishyaUsers = lazy(() => import("@/pages/shishya-users"));
const ShishyaActivity = lazy(() => import("@/pages/shishya-activity"));
const ShishyaPayments = lazy(() => import("@/pages/shishya-payments"));
const ShishyaEngagement = lazy(() => import("@/pages/shishya-engagement"));
const Security = lazy(() => import("@/pages/security"));
const Governance = lazy(() => import("@/pages/governance"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Main */}
        <Route path="/" component={Dashboard} />
        <Route path="/reports" component={Reports} />

        {/* Academics */}
        <Route path="/courses" component={Courses} />
        <Route path="/courses/new" component={CreateCourse} />
        <Route path="/labs" component={Labs} />
        <Route path="/tests" component={Tests} />
        <Route path="/projects" component={Projects} />
        <Route path="/certificates" component={CertificatesList} />
        <Route path="/skills" component={Skills} />

        {/* Business */}
        <Route path="/credits" component={Credits} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/payments" component={Payments} />
        <Route path="/promotions" component={Promotions} />

        {/* Shishya Control */}
        <Route path="/shishya" component={ShishyaOverview} />
        <Route path="/shishya/users" component={ShishyaUsers} />
        <Route path="/shishya/activity" component={ShishyaActivity} />
        <Route path="/shishya/payments" component={ShishyaPayments} />
        <Route path="/shishya/engagement" component={ShishyaEngagement} />


        {/* System */}
        <Route path="/security" component={Security} />
        <Route path="/governance" component={Governance} />
        <Route path="/settings" component={Settings} />

        {/* Course-scoped routes */}
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/courses/:courseId/modules" component={CourseModules} />
        <Route path="/courses/:courseId/modules/:moduleId" component={ModuleDetail} />
        <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" component={LessonEditor} />
        <Route path="/courses/:courseId/tests/:testId" component={TestEditor} />
        <Route path="/courses/:courseId/projects/:projectId" component={ProjectEditor} />
        <Route path="/courses/:courseId/labs/:labId" component={LabEditor} />
        <Route path="/courses/:courseId/certificate" component={Certificates} />

        {/* Fallback - redirect to dashboard */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Suspense>
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
      return (
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <Landing />
      </Suspense>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm font-medium hidden sm:inline">
                {user?.username || 'Admin'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
