import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  FlaskConical,
  ClipboardCheck,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Activity,
} from "lucide-react";

interface ActivityStats {
  courseEnrollments: number;
  labsAttempted: number;
  testsTaken: number;
  certificatesIssued: number;
  dau: number;
  mau: number;
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  userName: string;
  createdAt: string;
}

export default function ShishyaActivity() {
  const { data: stats, isLoading: statsLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/admin/shishya/activity/stats"],
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/shishya/activity/recent"],
  });

  const mockStats: ActivityStats = {
    courseEnrollments: 0,
    labsAttempted: 0,
    testsTaken: 0,
    certificatesIssued: 0,
    dau: 0,
    mau: 0,
  };

  const displayStats = stats || mockStats;

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "course_enroll":
        return <BookOpen className="h-4 w-4" />;
      case "lab_attempt":
        return <FlaskConical className="h-4 w-4" />;
      case "test_complete":
        return <ClipboardCheck className="h-4 w-4" />;
      case "certificate_earned":
        return <Award className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (action: string) => {
    switch (action) {
      case "course_enroll":
        return "Enrolled in course";
      case "lab_attempt":
        return "Attempted lab";
      case "test_complete":
        return "Completed test";
      case "certificate_earned":
        return "Earned certificate";
      case "login":
        return "Logged in";
      default:
        return action.replace(/_/g, " ");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Shishya Activity"
        description="Track student engagement and learning activity across the platform."
      />

      <section>
        <h2 className="text-lg font-semibold mb-4">Engagement Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Daily Active"
                value={displayStats.dau}
                icon={Users}
                description="Active today"
              />
              <StatsCard
                title="Monthly Active"
                value={displayStats.mau}
                icon={Calendar}
                description="Active this month"
              />
              <StatsCard
                title="Enrollments"
                value={displayStats.courseEnrollments}
                icon={BookOpen}
                description="Course enrollments"
              />
              <StatsCard
                title="Labs Attempted"
                value={displayStats.labsAttempted}
                icon={FlaskConical}
                description="Practice labs"
              />
              <StatsCard
                title="Tests Taken"
                value={displayStats.testsTaken}
                icon={ClipboardCheck}
                description="Assessments completed"
              />
              <StatsCard
                title="Certificates"
                value={displayStats.certificatesIssued}
                icon={Award}
                description="Certificates issued"
              />
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Trends
            </CardTitle>
            <CardDescription>Daily and weekly engagement patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-muted text-center">
                  <p className="text-sm text-muted-foreground mb-2">DAU / MAU Ratio</p>
                  <p className="text-3xl font-bold">
                    {displayStats.mau > 0
                      ? ((displayStats.dau / displayStats.mau) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stickiness indicator
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-sm text-muted-foreground">Avg Sessions/User</p>
                    <p className="text-xl font-semibold">2.4</p>
                  </div>
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                    <p className="text-xl font-semibold">18m</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest user actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-md border"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getActivityLabel(activity.action)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
