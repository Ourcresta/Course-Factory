import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRevenue: number;
  revenueByPlan: Record<string, number>;
  upcomingRenewals: number;
  expiringSubscriptions: number;
}

interface RecentPayment {
  id: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function ShishyaPayments() {
  const { data: stats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/admin/shishya/payments/stats"],
  });

  const { data: recentPayments = [], isLoading: paymentsLoading } = useQuery<RecentPayment[]>({
    queryKey: ["/api/admin/shishya/payments/recent"],
  });

  const mockStats: PaymentStats = {
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    revenueByPlan: {},
    upcomingRenewals: 0,
    expiringSubscriptions: 0,
  };

  const displayStats = stats || mockStats;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Shishya Payments"
        description="Monitor payment transactions and subscription revenue."
      />

      <section>
        <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
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
                value={`Rs ${displayStats.totalRevenue.toLocaleString()}`}
                icon={Wallet}
                description="Lifetime earnings"
              />
              <StatsCard
                title="Successful"
                value={displayStats.successfulPayments}
                icon={CheckCircle}
                description="Completed payments"
              />
              <StatsCard
                title="Failed"
                value={displayStats.failedPayments}
                icon={XCircle}
                description="Failed transactions"
              />
              <StatsCard
                title="Pending"
                value={displayStats.pendingPayments}
                icon={Clock}
                description="Awaiting confirmation"
              />
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue by Plan
            </CardTitle>
            <CardDescription>Breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-48" />
            ) : Object.keys(displayStats.revenueByPlan).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No revenue data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(displayStats.revenueByPlan).map(([plan, revenue]) => (
                  <div key={plan} className="flex items-center justify-between p-3 rounded-md border">
                    <span className="font-medium capitalize">{plan}</span>
                    <span className="text-sm">Rs {revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Renewals
            </CardTitle>
            <CardDescription>Upcoming subscription renewals</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-muted text-center">
                  <p className="text-3xl font-bold">{displayStats.upcomingRenewals}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Renewals in next 7 days
                  </p>
                </div>
                <div className="p-3 rounded-md border flex items-center justify-between">
                  <span className="text-sm">Expected Revenue</span>
                  <span className="font-semibold">Rs {(displayStats.upcomingRenewals * 499).toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Expiring Soon
            </CardTitle>
            <CardDescription>Subscriptions expiring in 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-center">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {displayStats.expiringSubscriptions}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subscriptions at risk
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Consider sending renewal reminders
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No payment transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payment.userName}</p>
                          <p className="text-xs text-muted-foreground">{payment.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">Rs {payment.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{payment.paymentMethod || "N/A"}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
