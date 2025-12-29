import { useQuery, useMutation } from "@tanstack/react-query";
import { Film, Play, Clock, CheckCircle, AlertCircle, Eye, Trash2, MoreVertical, FileText, Bot, Filter, Search, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AvatarVideo {
  id: number;
  lessonId: number;
  scriptId: number | null;
  avatarConfigId: number | null;
  language: string;
  title: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  durationSeconds: number | null;
  generationStatus: string;
  generationProgress: number | null;
  status: string;
  orderIndex: number;
  createdAt: string;
}

interface LessonScript {
  id: number;
  lessonId: number;
  language: string;
  title: string | null;
  script: string;
  hookSection: string | null;
  explanationSection: string | null;
  examplesSection: string | null;
  summarySection: string | null;
  estimatedSeconds: number | null;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "secondary",
  pending: "secondary",
  generating: "default",
  completed: "default",
  approved: "outline",
  published: "default",
  failed: "destructive",
};

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

export default function VidGuruVideos() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [selectedScript, setSelectedScript] = useState<LessonScript | null>(null);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);

  const { data: videos, isLoading } = useQuery<AvatarVideo[]>({
    queryKey: ["/api/vidguru/avatar-videos"],
    refetchInterval: 5000,
  });

  const { data: scripts } = useQuery<LessonScript[]>({
    queryKey: ["/api/vidguru/scripts"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/vidguru/avatar-videos/${id}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Video approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/avatar-videos"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/vidguru/avatar-videos/${id}/publish`);
    },
    onSuccess: () => {
      toast({ title: "Video published" });
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/avatar-videos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vidguru/avatar-videos/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Video deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/avatar-videos"] });
    },
  });

  const filteredVideos = videos?.filter((video) => {
    const matchesSearch = !searchQuery || 
      video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || video.status === statusFilter || video.generationStatus === statusFilter;
    const matchesLanguage = languageFilter === "all" || video.language === languageFilter;
    return matchesSearch && matchesStatus && matchesLanguage;
  }) || [];

  const viewScript = (video: AvatarVideo) => {
    const script = scripts?.find((s) => s.id === video.scriptId);
    if (script) {
      setSelectedScript(script);
      setScriptDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Film className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Avatar Videos</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = videos?.filter((v) => v.generationStatus === "pending").length || 0;
  const generatingCount = videos?.filter((v) => v.generationStatus === "generating").length || 0;
  const completedCount = videos?.filter((v) => v.generationStatus === "completed").length || 0;
  const approvedCount = videos?.filter((v) => v.status === "approved").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Film className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Avatar Videos</h1>
            <p className="text-muted-foreground">AI-generated teaching videos for each lesson</p>
          </div>
        </div>
        <Link href="/vidguru">
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Badge variant="secondary">{pendingCount}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Generating</span>
              <Badge>{generatingCount}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Completed</span>
              <Badge variant="outline">{completedCount}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Approved</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">{approvedCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Video Library</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48"
                  data-testid="input-search-videos"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-32" data-testid="select-language-filter">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {Object.entries(langNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No avatar videos found</p>
              <p className="text-sm mt-1">Generate a course to create avatar videos</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted flex items-center justify-center">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title || "Video"} className="object-cover w-full h-full" />
                    ) : (
                      <Film className="h-12 w-12 text-muted-foreground/50" />
                    )}
                    {video.generationStatus === "generating" && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-sm mt-2">{video.generationProgress || 0}%</p>
                        </div>
                      </div>
                    )}
                    {video.generationStatus === "completed" && video.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    )}
                    <Badge 
                      variant={statusColors[video.generationStatus] as any || "secondary"} 
                      className="absolute top-2 left-2"
                    >
                      {video.generationStatus}
                    </Badge>
                    <Badge variant="outline" className="absolute top-2 right-2 uppercase">
                      {video.language}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{video.title || `Video #${video.id}`}</h3>
                        <p className="text-sm text-muted-foreground">
                          {video.duration || "Duration pending"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {video.scriptId && (
                            <DropdownMenuItem onClick={() => viewScript(video)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Script
                            </DropdownMenuItem>
                          )}
                          {video.generationStatus === "completed" && video.status === "draft" && (
                            <DropdownMenuItem onClick={() => approveMutation.mutate(video.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {video.status === "approved" && (
                            <DropdownMenuItem onClick={() => publishMutation.mutate(video.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(video.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {video.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedScript?.title || "Script"}</DialogTitle>
            <DialogDescription>
              Teaching script for avatar video
            </DialogDescription>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              {selectedScript.hookSection && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-1">Hook</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{selectedScript.hookSection}</p>
                </div>
              )}
              {selectedScript.explanationSection && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-1">Explanation</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{selectedScript.explanationSection}</p>
                </div>
              )}
              {selectedScript.examplesSection && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-1">Examples</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{selectedScript.examplesSection}</p>
                </div>
              )}
              {selectedScript.summarySection && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-1">Summary</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{selectedScript.summarySection}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
