import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Crown,
  Sparkles,
  Zap,
  Star,
  Coins,
} from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";

export default function Subscriptions() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    priceMonthly: 0,
    priceYearly: 0,
    coinsPerMonth: 0,
    signupBonusCoins: 0,
    features: {
      aiMithra: false,
      labs: false,
      tests: false,
      projects: false,
      certificates: false,
      prioritySupport: false,
      maxCoursesAccess: 0,
    },
    isActive: true,
    isFeatured: false,
  });

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/subscription-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Plan Created", description: "Subscription plan has been created." });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create plan", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/subscription-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Plan Updated", description: "Subscription plan has been updated." });
      setEditingPlan(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update plan", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/subscription-plans/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Status Updated", description: "Plan status has been updated." });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      priceMonthly: 0,
      priceYearly: 0,
      coinsPerMonth: 0,
      signupBonusCoins: 0,
      features: {
        aiMithra: false,
        labs: false,
        tests: false,
        projects: false,
        certificates: false,
        prioritySupport: false,
        maxCoursesAccess: 0,
      },
      isActive: true,
      isFeatured: false,
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      coinsPerMonth: plan.coinsPerMonth,
      signupBonusCoins: plan.signupBonusCoins,
      features: plan.features || {
        aiMithra: false,
        labs: false,
        tests: false,
        projects: false,
        certificates: false,
        prioritySupport: false,
        maxCoursesAccess: 0,
      },
      isActive: plan.isActive,
      isFeatured: plan.isFeatured,
    });
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "free":
        return <Star className="h-5 w-5" />;
      case "basic":
        return <Zap className="h-5 w-5" />;
      case "pro":
        return <Sparkles className="h-5 w-5" />;
      case "elite":
        return <Crown className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Plans & Subscriptions"
        description="Manage subscription tiers, pricing, and feature access."
      >
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Define a new subscription tier with pricing and features.
              </DialogDescription>
            </DialogHeader>
            <PlanForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createMutation.mutate(formData)}
              isLoading={createMutation.isPending}
              submitLabel="Create Plan"
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No Plans Created</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first subscription plan to start monetizing.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.isFeatured ? "border-primary" : ""}`}
            >
              {plan.isFeatured && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                  Popular
                </Badge>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: plan.id, isActive: checked })
                    }
                    data-testid={`switch-plan-active-${plan.id}`}
                  />
                </div>
                <Badge variant={plan.isActive ? "default" : "secondary"} className="w-fit text-xs">
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    Rs {plan.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rs {plan.priceYearly}/year
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{plan.coinsPerMonth} coins/month</span>
                </div>

                {plan.signupBonusCoins > 0 && (
                  <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20 text-center">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +{plan.signupBonusCoins} signup bonus
                    </span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  {plan.features && (
                    <>
                      <FeatureRow label="AI Mithra" enabled={plan.features.aiMithra} />
                      <FeatureRow label="Labs" enabled={plan.features.labs} />
                      <FeatureRow label="Tests" enabled={plan.features.tests} />
                      <FeatureRow label="Projects" enabled={plan.features.projects} />
                      <FeatureRow label="Certificates" enabled={plan.features.certificates} />
                      <FeatureRow label="Priority Support" enabled={plan.features.prioritySupport} />
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(plan)}
                    data-testid={`button-edit-plan-${plan.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the plan details and features.
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => editingPlan && updateMutation.mutate({ id: editingPlan.id, data: formData })}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={enabled ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function PlanForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan Name</Label>
          <Input
            placeholder="e.g., Pro"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
              });
            }}
            data-testid="input-plan-name"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            placeholder="e.g., pro"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            data-testid="input-plan-slug"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Monthly Price (Rs)</Label>
          <Input
            type="number"
            value={formData.priceMonthly}
            onChange={(e) => setFormData({ ...formData, priceMonthly: parseInt(e.target.value) || 0 })}
            data-testid="input-price-monthly"
          />
        </div>
        <div className="space-y-2">
          <Label>Yearly Price (Rs)</Label>
          <Input
            type="number"
            value={formData.priceYearly}
            onChange={(e) => setFormData({ ...formData, priceYearly: parseInt(e.target.value) || 0 })}
            data-testid="input-price-yearly"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Coins Per Month</Label>
          <Input
            type="number"
            value={formData.coinsPerMonth}
            onChange={(e) => setFormData({ ...formData, coinsPerMonth: parseInt(e.target.value) || 0 })}
            data-testid="input-coins-monthly"
          />
        </div>
        <div className="space-y-2">
          <Label>Signup Bonus Coins</Label>
          <Input
            type="number"
            value={formData.signupBonusCoins}
            onChange={(e) => setFormData({ ...formData, signupBonusCoins: parseInt(e.target.value) || 0 })}
            data-testid="input-signup-bonus"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Features</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "aiMithra", label: "AI Mithra Access" },
            { key: "labs", label: "Practice Labs" },
            { key: "tests", label: "Tests" },
            { key: "projects", label: "Projects" },
            { key: "certificates", label: "Certificates" },
            { key: "prioritySupport", label: "Priority Support" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-md border">
              <span className="text-sm">{label}</span>
              <Switch
                checked={formData.features[key as keyof typeof formData.features] as boolean}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    features: { ...formData.features, [key]: checked },
                  })
                }
                data-testid={`switch-feature-${key}`}
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Max Courses Access (0 = unlimited)</Label>
          <Input
            type="number"
            value={formData.features.maxCoursesAccess}
            onChange={(e) =>
              setFormData({
                ...formData,
                features: { ...formData.features, maxCoursesAccess: parseInt(e.target.value) || 0 },
              })
            }
            data-testid="input-max-courses"
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
            <Label>Featured</Label>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={isLoading || !formData.name || !formData.slug}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
