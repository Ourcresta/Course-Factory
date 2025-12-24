import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  TrendingUp,
  Coins,
  Activity,
  Calendar,
} from "lucide-react";

interface ShishyaOverviewData {
  totalUsers: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  newUsersToday: number;
  newUsersMonth: number;
  paidUsers: number;
  freeUsers: number;
  totalRevenue: number;
  revenueToday: number;
  revenueMonth: number;
  avgCoinsPerUser: number;
}

export default function ShishyaOverview() {
  const { data, isLoading } = useQuery<ShishyaOverviewData>({
    queryKey: ["/api/admin/shishya/overview"],
  });

  const mockData: ShishyaOverviewData = {
    totalUsers: 0,
    activeUsers7Days: 0,
    activeUsers30Days: 0,
    newUsersToday: 0,
    newUsersMonth: 0,
    paidUsers: 0,
    freeUsers: 0,
    totalRevenue: 0,
    revenueToday: 0,
    revenueMonth: 0,
    avgCoinsPerUser: 0,
  };

  const stats = data || mockData;

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Shishya Overview"
        description="Executive summary of student portal metrics and engagement."
      />

      <section>
        <h2 className="text-lg font-semibold mb-4">User Metrics</h2>
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
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                description={`${stats.paidUsers} Paid / ${stats.freeUsers} Free`}
              />
              <StatsCard
                title="Active (7 Days)"
                value={stats.activeUsers7Days}
                icon={UserCheck}
                description="Users active in last 7 days"
              />
              <StatsCard
                title="Active (30 Days)"
                value={stats.activeUsers30Days}
                icon={Activity}
                description="Monthly active users"
              />
              <StatsCard
                title="New Today"
                value={stats.newUsersToday}
                icon={UserPlus}
                description={`${stats.newUsersMonth} this month`}
              />
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Revenue Metrics</h2>
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
                title="Total Revenue"
                value={`Rs ${stats.totalRevenue.toLocaleString()}`}
                icon={CreditCard}
                description="Lifetime earnings"
              />
              <StatsCard
                title="Today's Revenue"
                value={`Rs ${stats.revenueToday.toLocaleString()}`}
                icon={TrendingUp}
                description="Collections today"
              />
              <StatsCard
                title="Monthly Revenue"
                value={`Rs ${stats.revenueMonth.toLocaleString()}`}
                icon={Calendar}
                description="This month's earnings"
              />
              <StatsCard
                title="Avg Coins/User"
                value={stats.avgCoinsPerUser}
                icon={Coins}
                description="Average coin balance"
              />
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by subscription type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-medium">Paid Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.paidUsers}</span>
                    <Badge variant="secondary">
                      {stats.totalUsers > 0 ? Math.round((stats.paidUsers / stats.totalUsers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Free Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.freeUsers}</span>
                    <Badge variant="secondary">
                      {stats.totalUsers > 0 ? Math.round((stats.freeUsers / stats.totalUsers) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm text-muted-foreground">User Retention (7d)</span>
                  <span className="font-semibold">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers7Days / stats.totalUsers) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-semibold">
                    {stats.totalUsers > 0 ? Math.round((stats.paidUsers / stats.totalUsers) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm text-muted-foreground">Avg Revenue Per User</span>
                  <span className="font-semibold">
                    Rs {stats.paidUsers > 0 ? Math.round(stats.totalRevenue / stats.paidUsers) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm text-muted-foreground">Daily Growth Rate</span>
                  <span className="font-semibold">
                    {stats.totalUsers > 0 ? ((stats.newUsersToday / stats.totalUsers) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
