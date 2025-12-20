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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { StatsCardSkeleton, CourseCardSkeleton } from "@/components/loading-skeleton";
import type { Course } from "@shared/schema";

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  generatingCourses: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentCourses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Limit to 6 most recent courses for display
  const displayedCourses = recentCourses?.slice(0, 6);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Welcome to AISiksha Course Factory. Create, manage, and publish courses with AI."
      >
        <Link href="/courses/new">
          <Button data-testid="button-create-course">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
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
              description="All courses created"
            />
            <StatsCard
              title="Published"
              value={stats?.publishedCourses ?? 0}
              icon={CheckCircle}
              description="Live on platforms"
            />
            <StatsCard
              title="Drafts"
              value={stats?.draftCourses ?? 0}
              icon={BookOpen}
              description="Awaiting review"
            />
            <StatsCard
              title="Generating"
              value={stats?.generatingCourses ?? 0}
              icon={Loader2}
              description="AI in progress"
            />
          </>
        )}
      </div>

      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/courses/new" className="block">
              <div className="group flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 hover-elevate">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    AI Course Generator
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a complete course from one command
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>

            <Link href="/courses" className="block">
              <div className="group flex items-center gap-4 p-4 rounded-lg border hover-elevate">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    View All Courses
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage your courses
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>

            <Link href="/skills" className="block">
              <div className="group flex items-center gap-4 p-4 rounded-lg border hover-elevate">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Manage Skills
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure skill tags and categories
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Recent Courses</h2>
          <Link href="/courses">
            <Button variant="ghost" size="sm" data-testid="link-view-all-courses">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : displayedCourses && displayedCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
