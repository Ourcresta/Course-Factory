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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Gift, Percent, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import type { Promotion } from "@shared/schema";

export default function Promotions() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    type: "bonus_coins",
    bonusCoins: 0,
    discountPercent: 0,
    isGlobal: true,
    validFrom: "",
    validTo: "",
    maxRedemptions: 0,
    isActive: true,
  });

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/promotions", {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: new Date(data.validTo).toISOString(),
        maxRedemptions: data.maxRedemptions || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({ title: "Promotion Created", description: "Promotion has been created." });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create promotion", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/promotions/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({ title: "Status Updated", description: "Promotion status has been updated." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({ title: "Deleted", description: "Promotion has been removed." });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      code: "",
      type: "bonus_coins",
      bonusCoins: 0,
      discountPercent: 0,
      isGlobal: true,
      validFrom: "",
      validTo: "",
      maxRedemptions: 0,
      isActive: true,
    });
  };

  const getPromotionStatus = (promo: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promo.validFrom);
    const validTo = new Date(promo.validTo);

    if (!promo.isActive) return { label: "Inactive", variant: "secondary" as const };
    if (now < validFrom) return { label: "Scheduled", variant: "outline" as const };
    if (now > validTo) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <PageHeader
        title="Promotions"
        description="Create and manage promotional offers and bonus coins campaigns."
      >
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-promotion">
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Promotion</DialogTitle>
              <DialogDescription>
                Set up a new promotional offer for users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Promotion Title</Label>
                <Input
                  placeholder="e.g., New Year Bonus"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-promo-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Promo Code (optional)</Label>
                <Input
                  placeholder="e.g., NEWYEAR2025"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  data-testid="input-promo-code"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-promo-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus_coins">Bonus Coins</SelectItem>
                    <SelectItem value="discount">Discount Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "bonus_coins" ? (
                <div className="space-y-2">
                  <Label>Bonus Coins</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.bonusCoins}
                    onChange={(e) => setFormData({ ...formData, bonusCoins: parseInt(e.target.value) || 0 })}
                    data-testid="input-bonus-coins"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Discount Percent</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                    data-testid="input-discount-percent"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    data-testid="input-valid-from"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    data-testid="input-valid-to"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Redemptions (0 = unlimited)</Label>
                <Input
                  type="number"
                  value={formData.maxRedemptions}
                  onChange={(e) => setFormData({ ...formData, maxRedemptions: parseInt(e.target.value) || 0 })}
                  data-testid="input-max-redemptions"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isGlobal}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGlobal: checked })}
                  />
                  <Label>Global (all users)</Label>
                </div>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.title || !formData.validFrom || !formData.validTo || createMutation.isPending}
                  data-testid="button-save-promotion"
                >
                  {createMutation.isPending ? "Creating..." : "Create Promotion"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Promotions</CardDescription>
            <CardTitle className="text-3xl">
              {promotions.filter((p) => {
                const status = getPromotionStatus(p);
                return status.label === "Active";
              }).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Gift className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redemptions</CardDescription>
            <CardTitle className="text-3xl">
              {promotions.reduce((acc, p) => acc + p.currentRedemptions, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coins Given</CardDescription>
            <CardTitle className="text-3xl">
              {promotions.reduce((acc, p) => acc + (p.bonusCoins || 0) * p.currentRedemptions, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Gift className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
          <CardDescription>Manage your promotional campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No promotions created yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Promotion
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => {
                  const status = getPromotionStatus(promo);
                  return (
                    <TableRow key={promo.id} data-testid={`row-promo-${promo.id}`}>
                      <TableCell>
                        <span className="font-medium">{promo.title}</span>
                      </TableCell>
                      <TableCell>
                        {promo.code ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {promo.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {promo.type === "bonus_coins" ? (
                            <>
                              <Gift className="h-3 w-3 mr-1" />
                              Coins
                            </>
                          ) : (
                            <>
                              <Percent className="h-3 w-3 mr-1" />
                              Discount
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promo.type === "bonus_coins"
                          ? `+${promo.bonusCoins} coins`
                          : `${promo.discountPercent}% off`}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(promo.validFrom), "MMM d")} -{" "}
                            {format(new Date(promo.validTo), "MMM d, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{promo.currentRedemptions}</span>
                        {promo.maxRedemptions && (
                          <span className="text-muted-foreground">/{promo.maxRedemptions}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={promo.isActive}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: promo.id, isActive: checked })
                            }
                            data-testid={`switch-promo-active-${promo.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(promo.id)}
                            className="text-destructive"
                            data-testid={`button-delete-promo-${promo.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
