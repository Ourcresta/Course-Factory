import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: IconOrElement,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  const isLucideIcon = typeof IconOrElement === "function";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
        {isLucideIcon ? (
          <IconOrElement className="h-8 w-8 text-muted-foreground" />
        ) : (
          <div className="text-muted-foreground">{IconOrElement}</div>
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6" data-testid="text-empty-description">
        {description}
      </p>
      {action ? (
        action
      ) : (
        actionLabel &&
        onAction && (
          <Button onClick={onAction} data-testid="button-empty-action">
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
