import { useQuery } from "@tanstack/react-query";
import { Bot, Video, Languages, FileText, PlayCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface VidGuruStats {
  totalCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalVideos: number;
  totalScripts: number;
  aiGenerationsToday: number;
  languages: string[];
}

export default function VidGuruDashboard() {
  const { data: stats, isLoading } = useQuery<VidGuruStats>({
    queryKey: ["/api/vidguru/stats"],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/vidguru/ai-logs", { limit: 5 }],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">VidGuru Dashboard</h1>
            <p className="text-muted-foreground">AI-powered video course intelligence</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Courses",
      value: stats?.totalCourses || 0,
      icon: FileText,
      description: "All generated courses",
    },
    {
      title: "Drafts",
      value: stats?.draftCourses || 0,
      icon: Clock,
      description: "Pending review",
      variant: "warning" as const,
    },
    {
      title: "Published",
      value: stats?.publishedCourses || 0,
      icon: CheckCircle,
      description: "Live on Shishya",
      variant: "success" as const,
    },
    {
      title: "Videos Added",
      value: stats?.totalVideos || 0,
      icon: Video,
      description: "YouTube embeds",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">VidGuru Dashboard</h1>
            <p className="text-muted-foreground">AI-powered video course intelligence engine</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/courses/new">
            <Button data-testid="button-create-course">
              <Bot className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </Link>
          <Link href="/vidguru/videos">
            <Button variant="outline" data-testid="button-manage-videos">
              <Video className="h-4 w-4 mr-2" />
              Manage Videos
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common VidGuru operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/courses/new" className="block">
              <Button variant="outline" className="w-full justify-start" data-testid="button-action-generate">
                <Bot className="h-4 w-4 mr-3" />
                Generate New Course with AI
                <Badge variant="secondary" className="ml-auto">AI</Badge>
              </Button>
            </Link>
            <Link href="/vidguru/videos" className="block">
              <Button variant="outline" className="w-full justify-start" data-testid="button-action-videos">
                <Video className="h-4 w-4 mr-3" />
                Add YouTube Videos to Lessons
              </Button>
            </Link>
            <Link href="/vidguru/languages" className="block">
              <Button variant="outline" className="w-full justify-start" data-testid="button-action-languages">
                <Languages className="h-4 w-4 mr-3" />
                Manage Multilingual Scripts
              </Button>
            </Link>
            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full justify-start" data-testid="button-action-drafts">
                <Clock className="h-4 w-4 mr-3" />
                Review Draft Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent AI Activity
            </CardTitle>
            <CardDescription>Latest AI generation logs</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.entityType} - {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {log.tokensUsed && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {log.tokensUsed} tokens
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent AI activity</p>
                <p className="text-xs">Generate a course to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Supported Languages
          </CardTitle>
          <CardDescription>Languages available for multilingual content generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi"].map((lang) => (
              <Badge key={lang} variant="secondary" data-testid={`badge-lang-${lang.toLowerCase()}`}>
                {lang}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
