import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Loader2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GenerationStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
};

const GENERATION_STEPS: Omit<GenerationStep, "status">[] = [
  { id: "init", label: "Initializing AI generation" },
  { id: "structure", label: "Creating course structure" },
  { id: "modules", label: "Generating modules" },
  { id: "lessons", label: "Adding lessons and content" },
  { id: "finalize", label: "Finalizing course" },
];

interface AIGenerationProgressProps {
  courseId: number | null;
  mode: "preview" | "publish";
  onComplete: () => void;
  onError: (error: string) => void;
  onRetry: () => void;
}

export function AIGenerationProgress({ 
  courseId, 
  mode, 
  onComplete, 
  onError,
  onRetry 
}: AIGenerationProgressProps) {
  const [steps, setSteps] = useState<GenerationStep[]>(
    GENERATION_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? "active" : "pending",
    }))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { data: course, refetch } = useQuery<{
    id: number;
    status: string;
    name: string;
    modules?: { id: number }[];
  }>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId && !hasCompleted && !hasError,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!courseId || hasCompleted || hasError) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [courseId, hasCompleted, hasError]);

  useEffect(() => {
    if (!course) return;

    if (course.status === "error") {
      setHasError(true);
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step
        )
      );
      onError("Generation was interrupted. Please try again.");
      return;
    }

    if (course.status === "draft" && course.name && !course.name.startsWith("Generating:")) {
      setSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })));
      setHasCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 500);
      return;
    }

    const progressSteps = Math.min(
      Math.floor(elapsedTime / 3) + 1,
      GENERATION_STEPS.length - 1
    );

    setSteps((prev) =>
      prev.map((step, index) => {
        if (index < progressSteps) return { ...step, status: "completed" };
        if (index === progressSteps) return { ...step, status: "active" };
        return { ...step, status: "pending" };
      })
    );
  }, [course, elapsedTime, onComplete, onError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const estimatedTime = mode === "preview" ? "10-30 seconds" : "1-3 minutes";
  const progressPercent = hasCompleted
    ? 100
    : hasError
    ? steps.filter((s) => s.status === "completed").length * 20
    : Math.min(95, (elapsedTime / (mode === "preview" ? 30 : 120)) * 100);

  return (
    <Card>
      <CardContent className="py-8 px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {hasError ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            ) : hasCompleted ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <>
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-1">
            {hasError
              ? "Generation Failed"
              : hasCompleted
              ? "Course Generated!"
              : `AI is generating your ${mode === "preview" ? "preview" : "course"}...`}
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            {hasError
              ? "The generation was interrupted. Please try again."
              : hasCompleted
              ? "Redirecting to course details..."
              : `Estimated time: ${estimatedTime}`}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-md transition-colors",
                step.status === "active" && "bg-primary/5",
                step.status === "error" && "bg-destructive/5"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : step.status === "active" ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : step.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  step.status === "completed" && "text-muted-foreground",
                  step.status === "active" && "font-medium",
                  step.status === "error" && "text-destructive",
                  step.status === "pending" && "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {hasError && (
          <div className="mt-6 flex justify-center">
            <Button onClick={onRetry} data-testid="button-retry-generation">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
