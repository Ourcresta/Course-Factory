import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Loader2,
  Plus,
  Sparkles,
  ArrowRight,
  FlaskConical,
  ClipboardCheck,
  FolderKanban,
  Award,
  Tags,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { StatsCardSkeleton, CourseCardSkeleton } from "@/components/loading-skeleton";
import {
  CourseFactoryPanel,
  AcademicHealthPanel,
  PracticeQualityPanel,
  CertificateSkillPanel,
  CreditPanel,
  SecurityPanel,
  ShishyaControlPanel,
} from "@/components/dashboard-panels";
import type { Course } from "@shared/schema";

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  generatingCourses: number;
  totalModules: number;
  totalLessons: number;
  totalLabs: number;
  totalTests: number;
  totalProjects: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentCourses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const displayedCourses = recentCourses?.slice(0, 4);

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Dashboard"
        description="Welcome to Oushiksha Guru. Create, manage, and publish courses with AI."
      >
        <Link href="/courses/new">
          <Button data-testid="button-create-course">
            <Brain className="h-4 w-4 mr-2" />
            Generate Course (AI)
          </Button>
        </Link>
      </PageHeader>

      {/* Section 1: System Snapshot KPIs */}
      <section>
        <h2 className="text-lg font-semibold mb-4">System Snapshot</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {statsLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Courses"
                value={stats?.totalCourses ?? 0}
                icon={GraduationCap}
                description={`${stats?.draftCourses ?? 0} Draft / ${stats?.publishedCourses ?? 0} Published`}
              />
              <StatsCard
                title="Modules"
                value={stats?.totalModules ?? 0}
                icon={BookOpen}
                description="Course sections"
              />
              <StatsCard
                title="Lessons"
                value={stats?.totalLessons ?? 0}
                icon={CheckCircle}
                description="Learning units"
              />
              <StatsCard
                title="Practice Labs"
                value={stats?.totalLabs ?? 0}
                icon={FlaskConical}
                description="Hands-on exercises"
              />
              <StatsCard
                title="Tests"
                value={stats?.totalTests ?? 0}
                icon={ClipboardCheck}
                description="Assessments"
              />
              <StatsCard
                title="Projects"
                value={stats?.totalProjects ?? 0}
                icon={FolderKanban}
                description="Capstone assignments"
              />
            </>
          )}
        </div>
      </section>

      {/* Section 2: Action Command Center */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Action Command Center</h2>
        <Card className="overflow-visible">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Link href="/courses/new" className="block">
                <div className="group flex flex-col items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 hover-elevate text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Generate Course (AI)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Preview / Publish modes</p>
                  </div>
                </div>
              </Link>

              <Link href="/courses" className="block">
                <div className="group flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Create Course (Manual)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Step-by-step wizard</p>
                  </div>
                </div>
              </Link>

              <Link href="/labs" className="block">
                <div className="group flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Create Practice Lab</h3>
                    <p className="text-xs text-muted-foreground mt-1">Hands-on coding</p>
                  </div>
                </div>
              </Link>

              <Link href="/tests" className="block">
                <div className="group flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Create Test</h3>
                    <p className="text-xs text-muted-foreground mt-1">MCQ & Scenarios</p>
                  </div>
                </div>
              </Link>

              <Link href="/certificates" className="block">
                <div className="group flex flex-col items-center gap-3 p-4 rounded-lg border hover-elevate text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Configure Certificate</h3>
                    <p className="text-xs text-muted-foreground mt-1">Requirements & skills</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3 & 4: AI Factory + Academic Health */}
      <section className="grid gap-6 lg:grid-cols-2">
        <CourseFactoryPanel />
        <AcademicHealthPanel />
      </section>

      {/* Section 5 & 6: Practice Quality + Certificate/Skill */}
      <section className="grid gap-6 lg:grid-cols-2">
        <PracticeQualityPanel />
        <CertificateSkillPanel />
      </section>

      {/* Section 7 & 8: Credit + Security */}
      <section className="grid gap-6 lg:grid-cols-2">
        <CreditPanel />
        <SecurityPanel />
      </section>

      {/* Section 9: Shishya Integration Control */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ShishyaControlPanel />
      </section>

      {/* Recent Courses */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Recent Courses</h2>
          <Link href="/courses">
            <Button variant="ghost" size="sm" data-testid="link-view-all-courses">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : displayedCourses && displayedCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {displayedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={GraduationCap}
              title="No courses yet"
              description="Get started by creating your first AI-generated course. Just describe what you want to teach."
              actionLabel="Create Your First Course"
              onAction={() => window.location.href = "/courses/new"}
            />
          </Card>
        )}
      </section>
    </div>
  );
}
