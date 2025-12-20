import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Loader2, AlertCircle, Send } from "lucide-react";

type Status = "draft" | "published" | "generating" | "error" | "pending";

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
}

const statusConfig: Record<Status, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof CheckCircle;
  className?: string;
}> = {
  draft: {
    label: "Draft",
    variant: "secondary",
    icon: Clock,
  },
  published: {
    label: "Published",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-600 hover:bg-green-700",
  },
  generating: {
    label: "Generating",
    variant: "outline",
    icon: Loader2,
  },
  error: {
    label: "Error",
    variant: "destructive",
    icon: AlertCircle,
  },
  pending: {
    label: "Pending",
    variant: "outline",
    icon: Send,
  },
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && (
        <Icon className={`h-3 w-3 mr-1 ${status === "generating" ? "animate-spin" : ""}`} />
      )}
      {config.label}
    </Badge>
  );
}
