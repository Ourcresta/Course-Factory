import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Plus, Search, ExternalLink, Trash2, Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LessonVideo, Course, Module, Lesson } from "@shared/schema";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VidGuruVideos() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  const { data: videos, isLoading } = useQuery<LessonVideo[]>({
    queryKey: ["/api/vidguru/videos"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: courseDetails } = useQuery<{ modules: Module[] }>({
    queryKey: ["/api/courses", selectedCourse],
    enabled: !!selectedCourse,
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: { lessonId: number; url: string; title: string }) => {
      return apiRequest("POST", "/api/vidguru/videos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/videos"] });
      setIsAddDialogOpen(false);
      setVideoUrl("");
      setVideoTitle("");
      setSelectedCourse("");
      setSelectedLesson("");
      toast({ title: "Video added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add video", variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("DELETE", `/api/vidguru/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/videos"] });
      toast({ title: "Video deleted" });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("POST", `/api/vidguru/videos/${videoId}/generate-summary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vidguru/videos"] });
      toast({ title: "AI summary generated" });
    },
    onError: () => {
      toast({ title: "Failed to generate summary", variant: "destructive" });
    },
  });

  const handleAddVideo = () => {
    if (!selectedLesson || !videoUrl) {
      toast({ title: "Please select a lesson and enter a video URL", variant: "destructive" });
      return;
    }
    addVideoMutation.mutate({
      lessonId: parseInt(selectedLesson),
      url: videoUrl,
      title: videoTitle || "Untitled Video",
    });
  };

  const filteredVideos = videos?.filter(
    (v) =>
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allLessons = courseDetails?.modules?.flatMap((m: any) => m.lessons || []) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Video className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Video Manager</h1>
            <p className="text-muted-foreground">Manage YouTube videos for lessons</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
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
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Video Manager</h1>
            <p className="text-muted-foreground">Add and manage YouTube videos for course lessons</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-video">
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add YouTube Video</DialogTitle>
              <DialogDescription>
                Link a YouTube video to a course lesson for embedded playback.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger data-testid="select-course">
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCourse && (
                <div className="space-y-2">
                  <Label>Select Lesson</Label>
                  <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                    <SelectTrigger data-testid="select-lesson">
                      <SelectValue placeholder="Choose a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLessons.map((lesson: Lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  data-testid="input-video-url"
                />
              </div>
              <div className="space-y-2">
                <Label>Video Title (optional)</Label>
                <Input
                  placeholder="Introduction to React"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  data-testid="input-video-title"
                />
              </div>
              {videoUrl && extractYouTubeId(videoUrl) && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(videoUrl)}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddVideo}
                disabled={addVideoMutation.isPending}
                data-testid="button-save-video"
              >
                {addVideoMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-videos"
          />
        </div>
        <Badge variant="secondary">{filteredVideos?.length || 0} videos</Badge>
      </div>

      {filteredVideos && filteredVideos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const youtubeId = extractYouTubeId(video.url);
            return (
              <Card key={video.id} data-testid={`card-video-${video.id}`}>
                <div className="relative aspect-video bg-muted">
                  {youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={video.title || "Video"}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title || "Untitled"}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">{video.url}</p>
                    </div>
                    <Badge variant={video.status === "published" ? "default" : "secondary"}>
                      {video.status}
                    </Badge>
                  </div>
                  {video.aiSummary && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{video.aiSummary}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateSummaryMutation.mutate(video.id)}
                      disabled={generateSummaryMutation.isPending}
                      data-testid={`button-generate-summary-${video.id}`}
                    >
                      {generateSummaryMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Bot className="h-3 w-3 mr-1" />
                      )}
                      AI Summary
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(video.url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Add YouTube videos to your course lessons for embedded playback and AI-powered summaries.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-video">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
