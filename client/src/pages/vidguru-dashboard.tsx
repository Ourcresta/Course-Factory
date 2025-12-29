import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Video, Languages, FileText, PlayCircle, Clock, CheckCircle, AlertCircle, Sparkles, Loader2, Film, Zap, Users, Send, RefreshCw, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VidGuruStats {
  totalCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalAvatarVideos: number;
  pendingVideos: number;
  generatedVideos: number;
  approvedVideos: number;
  publishedVideos: number;
  totalVideoMinutes: number;
  totalScripts: number;
  draftScripts: number;
  approvedScripts: number;
  totalAvatarConfigs: number;
  activeAvatarConfigs: number;
  aiGenerationsToday: number;
  pendingJobs: number;
  completedJobs: number;
  languageCoverage: Record<string, number>;
  languages: string[];
}

interface GenerationJob {
  id: number;
  command: string;
  status: string;
  progress: number;
  currentStep: string | null;
  generatedModules: number;
  generatedLessons: number;
  generatedScripts: number;
  generatedVideos: number;
  generatedLabs: number;
  generatedTests: number;
  createdAt: string;
}

interface CourseSuggestion {
  topic: string;
  title: string;
  description: string;
  level: string;
  estimatedDuration: string;
  targetAudience: string;
  keySkills: string[];
  trending: boolean;
}

export default function VidGuruDashboard() {
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [options, setOptions] = useState({
    includeVideos: true,
    includeLabs: true,
    includeProjects: true,
    includeTests: true,
    languages: ["en"],
  });

  const { data: stats, isLoading } = useQuery<VidGuruStats>({
    queryKey: ["/api/vidguru/stats"],
    refetchInterval: 10000,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<GenerationJob[]>({
    queryKey: ["/api/vidguru/jobs"],
    refetchInterval: 3000,
  });

  const { data: recentLogs } = useQuery<any[]>({
    queryKey: ["/api/vidguru/ai-logs"],
  });

  const { data: suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery<CourseSuggestion[]>({
    queryKey: ["/api/vidguru/suggestions"],
    staleTime: 1000 * 60 * 5,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { command: string; options: typeof options }) => {
      const res = await apiRequest("POST", "/api/vidguru/generate-course", data) as Response;
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Course Generation Started",
        description: `Job #${data.jobId} is now processing your request.`,
      });
      setCommand("");
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!command.trim()) {
      toast({
        title: "Command Required",
        description: "Please enter a course topic or command.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ command, options });
  };

  const useSuggestion = (suggestion: CourseSuggestion) => {
    setCommand(suggestion.topic);
    toast({
      title: "Topic Selected",
      description: `"${suggestion.title}" added to command. Click Generate Course to start.`,
    });
  };

  const activeJobs = jobs?.filter((j) => j.status === "pending" || j.status === "generating") || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">VidGuru AI Course Factory</h1>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">VidGuru AI Course Factory</h1>
            <p className="text-muted-foreground">Generate complete avatar video courses with one command</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/vidguru/videos">
            <Button variant="outline" data-testid="button-manage-videos">
              <Film className="h-4 w-4 mr-2" />
              Avatar Videos
            </Button>
          </Link>
          <Link href="/vidguru/languages">
            <Button variant="outline" data-testid="button-languages">
              <Languages className="h-4 w-4 mr-2" />
              Languages
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Course Factory
          </CardTitle>
          <CardDescription>
            Enter a topic or command and VidGuru will generate a complete course with avatar teaching videos, scripts, labs, projects, and tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder='e.g., "Complete Python programming course for beginners with hands-on projects" or "Advanced React with TypeScript and testing"'
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="flex-1 min-h-[80px]"
              data-testid="input-ai-command"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="includeVideos"
                checked={options.includeVideos}
                onCheckedChange={(checked) => setOptions({ ...options, includeVideos: checked })}
              />
              <Label htmlFor="includeVideos" className="text-sm">Avatar Videos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="includeLabs"
                checked={options.includeLabs}
                onCheckedChange={(checked) => setOptions({ ...options, includeLabs: checked })}
              />
              <Label htmlFor="includeLabs" className="text-sm">Practice Labs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="includeProjects"
                checked={options.includeProjects}
                onCheckedChange={(checked) => setOptions({ ...options, includeProjects: checked })}
              />
              <Label htmlFor="includeProjects" className="text-sm">Projects</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="includeTests"
                checked={options.includeTests}
                onCheckedChange={(checked) => setOptions({ ...options, includeTests: checked })}
              />
              <Label htmlFor="includeTests" className="text-sm">Tests</Label>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !command.trim()}
            className="w-full sm:w-auto"
            data-testid="button-generate-course"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting Generation...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Course
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Auto Suggest Courses
            </CardTitle>
            <CardDescription className="mt-1">
              AI-recommended trending topics based on current industry demands
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSuggestions()}
            disabled={suggestionsLoading}
            data-testid="button-refresh-suggestions"
          >
            {suggestionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover-elevate cursor-pointer group"
                  onClick={() => useSuggestion(suggestion)}
                  data-testid={`suggestion-card-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm line-clamp-2">{suggestion.title}</h4>
                    {suggestion.trending && (
                      <Badge variant="outline" className="shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.level}
                      </Badge>
                      <span className="text-muted-foreground">{suggestion.estimatedDuration}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.keySkills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No suggestions available</p>
              <Button variant="ghost" onClick={() => refetchSuggestions()} className="mt-2">
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Active Generation Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium truncate max-w-md">{job.command}</div>
                  <Badge variant={job.status === "generating" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
                <Progress value={job.progress || 0} className="h-2" />
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground flex-wrap">
                  <span>{job.currentStep || "Waiting..."}</span>
                  <div className="flex gap-3">
                    <span>Modules: {job.generatedModules || 0}</span>
                    <span>Lessons: {job.generatedLessons || 0}</span>
                    <span>Scripts: {job.generatedScripts || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-courses">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.draftCourses || 0} drafts, {stats?.publishedCourses || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avatar Videos</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avatar-videos">{stats?.totalAvatarVideos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingVideos || 0} pending, {stats?.generatedVideos || 0} generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Scripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-scripts">{stats?.totalScripts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.draftScripts || 0} drafts, {stats?.approvedScripts || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-ai-today">{stats?.aiGenerationsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedJobs || 0} jobs completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language Coverage
            </CardTitle>
            <CardDescription>Scripts available per language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.languages.map((lang) => {
                const count = stats?.languageCoverage?.[lang] || 0;
                const langNames: Record<string, string> = {
                  en: "English",
                  hi: "Hindi",
                  ta: "Tamil",
                  te: "Telugu",
                  kn: "Kannada",
                  ml: "Malayalam",
                  bn: "Bengali",
                  mr: "Marathi",
                };
                return (
                  <div key={lang} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">{lang}</Badge>
                      <span className="text-sm">{langNames[lang] || lang}</span>
                    </div>
                    <span className="text-sm font-medium">{count} scripts</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent AI Activity
            </CardTitle>
            <CardDescription>Latest AI generation events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs?.slice(0, 5).map((log, i) => (
                <div key={log.id || i} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {log.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="truncate max-w-[200px]">{log.action}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <p className="text-sm text-muted-foreground">No recent AI activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/courses">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                View All Courses
              </Button>
            </Link>
            <Link href="/vidguru/videos">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Film className="h-4 w-4" />
                Manage Avatar Videos
              </Button>
            </Link>
            <Link href="/vidguru/languages">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Languages className="h-4 w-4" />
                Language Scripts
              </Button>
            </Link>
            <Link href="/labs">
              <Button variant="outline" className="w-full justify-start gap-2">
                <PlayCircle className="h-4 w-4" />
                Practice Labs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
