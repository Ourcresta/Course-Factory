import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  CreditCard,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  CourseFactoryPanel,
  AcademicHealthPanel,
  PracticeQualityPanel,
  CertificateSkillPanel,
  CreditPanel,
  SecurityPanel,
  ShishyaControlPanel,
} from "@/components/dashboard-panels";

interface ReportData {
  academics: {
    totalCourses: number;
    coursesChange: number;
    publishedCourses: number;
    draftCourses: number;
  };
  shishya: {
    totalUsers: number;
    usersChange: number;
    activeUsers: number;
    newUsers: number;
  };
  revenue: {
    total: number;
    revenueChange: number;
    transactions: number;
    avgOrder: number;
  };
  credits: {
    totalSold: number;
    creditsChange: number;
    avgPerUser: number;
    unusedCredits: number;
  };
}

export default function Reports() {
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/admin/reports", { range: dateRange }],
  });

  const mockData: ReportData = {
    academics: { totalCourses: 0, coursesChange: 0, publishedCourses: 0, draftCourses: 0 },
    shishya: { totalUsers: 0, usersChange: 0, activeUsers: 0, newUsers: 0 },
    revenue: { total: 0, revenueChange: 0, transactions: 0, avgOrder: 0 },
    credits: { totalSold: 0, creditsChange: 0, avgPerUser: 0, unusedCredits: 0 },
  };

  const stats = data || mockData;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = (change: number) => {
    if (change > 0)
      return (
        <Badge variant="secondary" className="text-green-600 bg-green-500/10">
          +{change}%
        </Badge>
      );
    if (change < 0)
      return (
        <Badge variant="secondary" className="text-red-600 bg-red-500/10">
          {change}%
        </Badge>
      );
    return <Badge variant="secondary">0%</Badge>;
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Reports"
        description="Analytics and insights with date range filtering and export options."
      >
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40" data-testid="select-date-range">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="academics" data-testid="tab-academics">
            <BookOpen className="h-4 w-4 mr-2" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="shishya" data-testid="tab-shishya">
            <Users className="h-4 w-4 mr-2" />
            Shishya
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <CreditCard className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="credits" data-testid="tab-credits">
            <TrendingUp className="h-4 w-4 mr-2" />
            Credits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardDescription>Total Courses</CardDescription>
                    {getTrendIcon(stats.academics.coursesChange)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-3xl font-bold">{stats.academics.totalCourses}</span>
                      {getTrendBadge(stats.academics.coursesChange)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      vs. previous period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardDescription>Shishya Users</CardDescription>
                    {getTrendIcon(stats.shishya.usersChange)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-3xl font-bold">{stats.shishya.totalUsers}</span>
                      {getTrendBadge(stats.shishya.usersChange)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.shishya.newUsers} new this period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    {getTrendIcon(stats.revenue.revenueChange)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-3xl font-bold">Rs {stats.revenue.total.toLocaleString()}</span>
                      {getTrendBadge(stats.revenue.revenueChange)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.revenue.transactions} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardDescription>Credits Sold</CardDescription>
                    {getTrendIcon(stats.credits.creditsChange)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-3xl font-bold">{stats.credits.totalSold.toLocaleString()}</span>
                      {getTrendBadge(stats.credits.creditsChange)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg {stats.credits.avgPerUser}/user
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CourseFactoryPanel />
            <AcademicHealthPanel />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ShishyaControlPanel />
            <CreditPanel />
          </div>
        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CourseFactoryPanel />
            <AcademicHealthPanel />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PracticeQualityPanel />
            <CertificateSkillPanel />
          </div>
        </TabsContent>

        <TabsContent value="shishya" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shishya Analytics</CardTitle>
              <CardDescription>User engagement and growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.shishya.totalUsers}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.shishya.activeUsers}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.shishya.newUsers}</p>
                    <p className="text-sm text-muted-foreground">New Users</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">
                      {stats.shishya.totalUsers > 0
                        ? Math.round((stats.shishya.activeUsers / stats.shishya.totalUsers) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Retention Rate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <ShishyaControlPanel />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Payment and subscription metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">Rs {stats.revenue.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.revenue.transactions}</p>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">Rs {stats.revenue.avgOrder}</p>
                    <p className="text-sm text-muted-foreground">Avg Order</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.revenue.revenueChange}%</p>
                    <p className="text-sm text-muted-foreground">Growth</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <CreditPanel />
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Analytics</CardTitle>
              <CardDescription>Credit usage and distribution metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.credits.totalSold.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Credits Sold</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.credits.avgPerUser}</p>
                    <p className="text-sm text-muted-foreground">Avg Per User</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.credits.unusedCredits.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Unused Credits</p>
                  </div>
                  <div className="p-4 rounded-md border text-center">
                    <p className="text-3xl font-bold">{stats.credits.creditsChange}%</p>
                    <p className="text-sm text-muted-foreground">Growth</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <CreditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
