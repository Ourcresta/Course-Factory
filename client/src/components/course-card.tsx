import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Clock, MoreVertical, Eye, Pencil, Trash2, Send } from "lucide-react";
import type { Course } from "@shared/schema";

interface CourseCardProps {
  course: Course;
  moduleCount?: number;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  published: "default",
  generating: "outline",
  error: "destructive",
};

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function CourseCard({ course, moduleCount = 0, onDelete, onPublish }: CourseCardProps) {
  const formattedDate = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Card className="group flex flex-col overflow-visible hover-elevate" data-testid={`card-course-${course.id}`}>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[course.status] || "secondary"} className="capitalize">
              {course.status}
            </Badge>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${levelColors[course.level] || levelColors.beginner}`}>
              {course.level}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-course-menu-${course.id}`}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/courses/${course.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/courses/${course.id}/edit`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {course.status === "draft" && onPublish && (
                <DropdownMenuItem onClick={() => onPublish(course.id)} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(course.id)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/courses/${course.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-course-title-${course.id}`}>
            {course.name}
          </h3>
        </Link>

        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} modules</span>
          </div>
          {course.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t p-4 bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <span className="text-xs text-muted-foreground">
            Created {formattedDate}
          </span>
          <Link href={`/courses/${course.id}`}>
            <Button variant="outline" size="sm" data-testid={`button-view-course-${course.id}`}>
              View Course
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
