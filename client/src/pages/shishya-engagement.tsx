import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Target,
  Trophy,
  Star,
  Flame,
  Medal,
  TrendingUp,
  Users,
} from "lucide-react";

interface EngagementStats {
  avgCompletionRate: number;
  avgTimeOnPlatform: number;
  topCourses: { name: string; enrollments: number }[];
  leaderboardUsers: { name: string; points: number; rank: number }[];
  streakStats: {
    usersWithStreak: number;
    avgStreakDays: number;
    maxStreak: number;
  };
  achievements: {
    total: number;
    unlockedToday: number;
  };
}

export default function ShishyaEngagement() {
  const { data, isLoading } = useQuery<EngagementStats>({
    queryKey: ["/api/admin/shishya/engagement"],
  });

  const mockData: EngagementStats = {
    avgCompletionRate: 0,
    avgTimeOnPlatform: 0,
    topCourses: [],
    leaderboardUsers: [],
    streakStats: {
      usersWithStreak: 0,
      avgStreakDays: 0,
      maxStreak: 0,
    },
    achievements: {
      total: 0,
      unlockedToday: 0,
    },
  };

  const stats = data || mockData;

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Shishya Engagement"
        description="Gamification metrics, streaks, achievements, and user engagement insights."
      />

      <section>
        <h2 className="text-lg font-semibold mb-4">Engagement Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Completion Rate"
                value={`${stats.avgCompletionRate}%`}
                icon={Target}
                description="Average course completion"
              />
              <StatsCard
                title="Avg Time"
                value={`${stats.avgTimeOnPlatform}m`}
                icon={TrendingUp}
                description="Per session"
              />
              <StatsCard
                title="Active Streaks"
                value={stats.streakStats.usersWithStreak}
                icon={Flame}
                description={`Max: ${stats.streakStats.maxStreak} days`}
              />
              <StatsCard
                title="Achievements"
                value={stats.achievements.total}
                icon={Trophy}
                description={`${stats.achievements.unlockedToday} unlocked today`}
              />
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Courses
            </CardTitle>
            <CardDescription>Most popular courses by enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : stats.topCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No course data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topCourses.map((course, index) => (
                  <div key={course.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{course.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(course.enrollments / (stats.topCourses[0]?.enrollments || 1)) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{course.enrollments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performing students</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : stats.leaderboardUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Medal className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No leaderboard data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.leaderboardUsers.map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={user.rank <= 3 ? "default" : "secondary"}
                        className="w-8 justify-center"
                      >
                        {user.rank}
                      </Badge>
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{user.points.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-orange-500/10 text-center">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.streakStats.maxStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Longest streak (days)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-semibold">{stats.streakStats.usersWithStreak}</p>
                    <p className="text-xs text-muted-foreground">Active streaks</p>
                  </div>
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-semibold">{stats.streakStats.avgStreakDays}</p>
                    <p className="text-xs text-muted-foreground">Avg days</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Achievement Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-purple-500/10 text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.achievements.total}
                  </p>
                  <p className="text-sm text-muted-foreground">Total achievements unlocked</p>
                </div>
                <div className="p-3 rounded-md border flex items-center justify-between">
                  <span className="text-sm">Unlocked today</span>
                  <Badge variant="secondary">{stats.achievements.unlockedToday}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              User Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Day 1</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Day 7</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Day 30</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
