import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  backLink,
  backLabel,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {backLink && (
        <Link href={backLink}>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            {backLabel || "Back"}
          </Button>
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1" data-testid="text-page-description">
              {description}
            </p>
          )}
        </div>
        {(actions || children) && (
          <div className="flex flex-wrap items-center gap-2">{actions || children}</div>
        )}
      </div>
    </div>
  );
}
