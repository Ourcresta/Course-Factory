import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, AlertTriangle, Check, DollarSign, Gift } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PricingData {
  courseId: number;
  courseName: string;
  creditCost: number;
  isFree: boolean;
  originalCreditCost: number | null;
  pricingUpdatedAt: string | null;
  status: string;
}

interface PricingTabProps {
  courseId: number;
  courseName: string;
  isPublished: boolean;
}

const pricingFormSchema = z.object({
  creditCost: z.number().min(0).max(100000),
  isFree: z.boolean(),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

export function PricingTab({ courseId, courseName, isPublished }: PricingTabProps) {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValues, setPendingValues] = useState<PricingFormValues | null>(null);

  const { data: pricing, isLoading } = useQuery<PricingData>({
    queryKey: ["/api/courses", courseId, "pricing"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/pricing`);
      if (!res.ok) throw new Error("Failed to fetch pricing");
      return res.json();
    },
  });

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      creditCost: 0,
      isFree: true,
    },
  });

  useEffect(() => {
    if (pricing) {
      form.reset({
        creditCost: pricing.creditCost,
        isFree: pricing.isFree,
      });
    }
  }, [pricing, form]);

  const updatePricingMutation = useMutation({
    mutationFn: async (values: PricingFormValues) => {
      await apiRequest("PUT", `/api/courses/${courseId}/pricing`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Pricing updated",
        description: "Course pricing has been successfully updated.",
      });
      setShowConfirmDialog(false);
      setPendingValues(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pricing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: PricingFormValues) => {
    setPendingValues(values);
    setShowConfirmDialog(true);
  };

  const confirmUpdate = () => {
    if (pendingValues) {
      updatePricingMutation.mutate(pendingValues);
    }
  };

  const isFree = form.watch("isFree");

  const hasChanges = pricing && (
    form.watch("creditCost") !== pricing.creditCost ||
    form.watch("isFree") !== pricing.isFree
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pricing Status
          </CardTitle>
          <CardDescription>
            Configure how many Learning Credits students need to enroll in this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              {pricing?.isFree ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{courseName}</span>
                  <Badge variant={pricing?.isFree ? "secondary" : "default"}>
                    {pricing?.isFree ? "FREE" : "PAID"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pricing?.isFree
                    ? "Students can enroll without spending credits"
                    : `${pricing?.creditCost} Credits required for enrollment`}
                </p>
                {pricing?.pricingUpdatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {format(new Date(pricing.pricingUpdatedAt), "PPP 'at' p")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Pricing changes affect new enrollments only. Existing enrollments are not affected.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configure Pricing</CardTitle>
          <CardDescription>
            Set the credit cost for this course. 1 Credit is approximately equal to 1 Indian Rupee (internal mapping).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Make this course FREE
                      </FormLabel>
                      <FormDescription>
                        When enabled, students can enroll without spending any credits
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("creditCost", 0);
                          } else if (pricing?.originalCreditCost) {
                            form.setValue("creditCost", pricing.originalCreditCost);
                          }
                        }}
                        data-testid="switch-is-free"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Credit Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100000}
                        disabled={isFree}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-credit-cost"
                      />
                    </FormControl>
                    <FormDescription>
                      {isFree
                        ? "Credit cost is automatically set to 0 for free courses"
                        : "Enter the number of credits required (0 - 100,000)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {hasChanges ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      You have unsaved changes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      All changes saved
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!hasChanges || updatePricingMutation.isPending}
                  data-testid="button-save-pricing"
                >
                  {updatePricingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Pricing Update</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Are you sure you want to update the pricing for this course?</p>
              
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current:</span>
                  <Badge variant="outline">
                    {pricing?.isFree ? "FREE" : `${pricing?.creditCost} Credits`}
                  </Badge>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">to</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New:</span>
                  <Badge variant={pendingValues?.isFree ? "secondary" : "default"}>
                    {pendingValues?.isFree ? "FREE" : `${pendingValues?.creditCost} Credits`}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This change will only affect new enrollments. Existing students will retain their current access.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-pricing-update">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdate}
              disabled={updatePricingMutation.isPending}
              data-testid="button-confirm-pricing-update"
            >
              {updatePricingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Update"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
