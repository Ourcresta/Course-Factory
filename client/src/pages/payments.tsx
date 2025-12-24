import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, CreditCard, Gift, Ticket, Smartphone, Settings, Check, X, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Voucher, GiftBox, PaymentGateway, UpiSetting } from "@shared/schema";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isGiftBoxOpen, setIsGiftBoxOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isUpiOpen, setIsUpiOpen] = useState(false);

  const [voucherForm, setVoucherForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "discount",
    discountType: "percentage",
    discountValue: 10,
    creditBonus: 0,
    maxUses: 100,
    minPurchase: 0,
    isActive: true,
  });

  const [giftBoxForm, setGiftBoxForm] = useState({
    name: "",
    description: "",
    credits: 100,
    priceInr: 499,
    priceUsd: 6,
    expiryDays: 365,
    isActive: true,
  });

  const [gatewayForm, setGatewayForm] = useState({
    name: "",
    type: "razorpay",
    isActive: false,
    isTestMode: true,
    priority: 0,
  });

  const [upiForm, setUpiForm] = useState({
    upiId: "",
    displayName: "",
    isActive: true,
  });

  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery<Voucher[]>({
    queryKey: ["/api/vouchers"],
  });

  const { data: giftBoxes = [], isLoading: loadingGiftBoxes } = useQuery<GiftBox[]>({
    queryKey: ["/api/gift-boxes"],
  });

  const { data: gateways = [], isLoading: loadingGateways } = useQuery<PaymentGateway[]>({
    queryKey: ["/api/payment-gateways"],
  });

  const { data: upiSettings = [], isLoading: loadingUpi } = useQuery<UpiSetting[]>({
    queryKey: ["/api/upi-settings"],
  });

  const createVoucherMutation = useMutation({
    mutationFn: async (data: typeof voucherForm) => {
      return apiRequest("POST", "/api/vouchers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setIsVoucherOpen(false);
      setVoucherForm({
        code: "",
        name: "",
        description: "",
        type: "discount",
        discountType: "percentage",
        discountValue: 10,
        creditBonus: 0,
        maxUses: 100,
        minPurchase: 0,
        isActive: true,
      });
      toast({ title: "Voucher created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create voucher", variant: "destructive" });
    },
  });

  const createGiftBoxMutation = useMutation({
    mutationFn: async (data: typeof giftBoxForm) => {
      return apiRequest("POST", "/api/gift-boxes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-boxes"] });
      setIsGiftBoxOpen(false);
      setGiftBoxForm({
        name: "",
        description: "",
        credits: 100,
        priceInr: 499,
        priceUsd: 6,
        expiryDays: 365,
        isActive: true,
      });
      toast({ title: "Gift box created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create gift box", variant: "destructive" });
    },
  });

  const createGatewayMutation = useMutation({
    mutationFn: async (data: typeof gatewayForm) => {
      return apiRequest("POST", "/api/payment-gateways", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
      setIsGatewayOpen(false);
      setGatewayForm({
        name: "",
        type: "razorpay",
        isActive: false,
        isTestMode: true,
        priority: 0,
      });
      toast({ title: "Payment gateway configured successfully" });
    },
    onError: () => {
      toast({ title: "Failed to configure gateway", variant: "destructive" });
    },
  });

  const createUpiMutation = useMutation({
    mutationFn: async (data: typeof upiForm) => {
      return apiRequest("POST", "/api/upi-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upi-settings"] });
      setIsUpiOpen(false);
      setUpiForm({
        upiId: "",
        displayName: "",
        isActive: true,
      });
      toast({ title: "UPI setting saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save UPI setting", variant: "destructive" });
    },
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      toast({ title: "Voucher deleted" });
    },
  });

  const deleteGiftBoxMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/gift-boxes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-boxes"] });
      toast({ title: "Gift box deleted" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const generateVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVoucherForm({ ...voucherForm, code });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Manage payment gateways, vouchers, and gift boxes for Shishya
          </p>
        </div>
      </div>

      <Tabs defaultValue="gateways" className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="gateways" className="gap-2" data-testid="tab-gateways">
              <CreditCard className="h-4 w-4" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger value="upi" className="gap-2" data-testid="tab-upi">
              <Smartphone className="h-4 w-4" />
              UPI
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-2" data-testid="tab-vouchers">
              <Ticket className="h-4 w-4" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="giftboxes" className="gap-2" data-testid="tab-giftboxes">
              <Gift className="h-4 w-4" />
              Gift Boxes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gateways" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">Payment Gateways</h2>
              <p className="text-sm text-muted-foreground">
                Configure payment providers for the Shishya platform
              </p>
            </div>
            <Dialog open={isGatewayOpen} onOpenChange={setIsGatewayOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-gateway">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gateway
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Payment Gateway</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gatewayName">Display Name</Label>
                    <Input
                      id="gatewayName"
                      value={gatewayForm.name}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, name: e.target.value })}
                      placeholder="e.g., Razorpay Production"
                      data-testid="input-gateway-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gatewayType">Gateway Type</Label>
                    <Select
                      value={gatewayForm.type}
                      onValueChange={(value) => setGatewayForm({ ...gatewayForm, type: value })}
                    >
                      <SelectTrigger data-testid="select-gateway-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="paytm">Paytm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label htmlFor="isTestMode">Test Mode</Label>
                      <p className="text-xs text-muted-foreground">Use sandbox/test credentials</p>
                    </div>
                    <Switch
                      id="isTestMode"
                      checked={gatewayForm.isTestMode}
                      onCheckedChange={(checked) => setGatewayForm({ ...gatewayForm, isTestMode: checked })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    API keys are configured via environment secrets (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsGatewayOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createGatewayMutation.mutate(gatewayForm)}
                      disabled={!gatewayForm.name || createGatewayMutation.isPending}
                    >
                      Save Gateway
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingGateways ? (
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          ) : gateways.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payment gateways configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add Razorpay or other payment providers
                </p>
                <Button onClick={() => setIsGatewayOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gateway
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {gateways.map((gateway) => (
                <Card key={gateway.id} data-testid={`card-gateway-${gateway.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{gateway.name}</CardTitle>
                        <CardDescription className="capitalize">{gateway.type}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gateway.isTestMode && (
                        <Badge variant="outline">Test Mode</Badge>
                      )}
                      <Badge variant={gateway.isActive ? "default" : "secondary"}>
                        {gateway.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upi" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">UPI Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure UPI IDs for direct payments
              </p>
            </div>
            <Dialog open={isUpiOpen} onOpenChange={setIsUpiOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-upi">
                  <Plus className="h-4 w-4 mr-2" />
                  Add UPI ID
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add UPI ID</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={upiForm.upiId}
                      onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                      placeholder="e.g., business@upi"
                      data-testid="input-upi-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={upiForm.displayName}
                      onChange={(e) => setUpiForm({ ...upiForm, displayName: e.target.value })}
                      placeholder="e.g., OurShiksha Payments"
                      data-testid="input-upi-name"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUpiOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createUpiMutation.mutate(upiForm)}
                      disabled={!upiForm.upiId || !upiForm.displayName || createUpiMutation.isPending}
                    >
                      Save UPI
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingUpi ? (
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          ) : upiSettings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No UPI IDs configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your business UPI ID for payments
                </p>
                <Button onClick={() => setIsUpiOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add UPI ID
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upiSettings.map((upi) => (
                    <TableRow key={upi.id}>
                      <TableCell className="font-mono">{upi.upiId}</TableCell>
                      <TableCell>{upi.displayName}</TableCell>
                      <TableCell>
                        <Badge variant={upi.isActive ? "default" : "secondary"}>
                          {upi.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vouchers" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">Vouchers & Coupons</h2>
              <p className="text-sm text-muted-foreground">
                Create discount codes for students
              </p>
            </div>
            <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-voucher">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Voucher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voucherCode">Voucher Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="voucherCode"
                        value={voucherForm.code}
                        onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., SAVE20"
                        className="font-mono"
                        data-testid="input-voucher-code"
                      />
                      <Button variant="outline" onClick={generateVoucherCode} type="button">
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="voucherName">Name</Label>
                    <Input
                      id="voucherName"
                      value={voucherForm.name}
                      onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })}
                      placeholder="e.g., New Year Sale"
                      data-testid="input-voucher-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select
                        value={voucherForm.discountType}
                        onValueChange={(value) => setVoucherForm({ ...voucherForm, discountType: value })}
                      >
                        <SelectTrigger data-testid="select-discount-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discountValue">
                        {voucherForm.discountType === "percentage" ? "Discount %" : "Discount Amount"}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min={0}
                        value={voucherForm.discountValue}
                        onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: parseInt(e.target.value) || 0 })}
                        data-testid="input-discount-value"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxUses">Max Uses</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        min={1}
                        value={voucherForm.maxUses}
                        onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minPurchase">Min Purchase (credits)</Label>
                      <Input
                        id="minPurchase"
                        type="number"
                        min={0}
                        value={voucherForm.minPurchase}
                        onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsVoucherOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createVoucherMutation.mutate(voucherForm)}
                      disabled={!voucherForm.code || !voucherForm.name || createVoucherMutation.isPending}
                    >
                      Create Voucher
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingVouchers ? (
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          ) : vouchers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No vouchers created</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create discount codes for your students
                </p>
                <Button onClick={() => setIsVoucherOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id} data-testid={`row-voucher-${voucher.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {voucher.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(voucher.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{voucher.name}</TableCell>
                      <TableCell>
                        {voucher.discountType === "percentage" ? (
                          <span>{voucher.discountValue}% off</span>
                        ) : (
                          <span>{voucher.discountValue} credits off</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {voucher.usedCount} / {voucher.maxUses || "Unlimited"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={voucher.isActive ? "default" : "secondary"}>
                          {voucher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteVoucherMutation.mutate(voucher.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="giftboxes" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">Gift Boxes</h2>
              <p className="text-sm text-muted-foreground">
                Create giftable credit packages
              </p>
            </div>
            <Dialog open={isGiftBoxOpen} onOpenChange={setIsGiftBoxOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-giftbox">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gift Box
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Gift Box</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="giftName">Name</Label>
                    <Input
                      id="giftName"
                      value={giftBoxForm.name}
                      onChange={(e) => setGiftBoxForm({ ...giftBoxForm, name: e.target.value })}
                      placeholder="e.g., Learning Gift Box"
                      data-testid="input-giftbox-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="giftDescription">Description</Label>
                    <Textarea
                      id="giftDescription"
                      value={giftBoxForm.description}
                      onChange={(e) => setGiftBoxForm({ ...giftBoxForm, description: e.target.value })}
                      placeholder="Perfect gift for learners..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="giftCredits">Credits</Label>
                      <Input
                        id="giftCredits"
                        type="number"
                        min={1}
                        value={giftBoxForm.credits}
                        onChange={(e) => setGiftBoxForm({ ...giftBoxForm, credits: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="giftPrice">Price (INR)</Label>
                      <Input
                        id="giftPrice"
                        type="number"
                        min={0}
                        value={giftBoxForm.priceInr}
                        onChange={(e) => setGiftBoxForm({ ...giftBoxForm, priceInr: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expiryDays">Expiry (days)</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      min={1}
                      value={giftBoxForm.expiryDays}
                      onChange={(e) => setGiftBoxForm({ ...giftBoxForm, expiryDays: parseInt(e.target.value) || 365 })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsGiftBoxOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createGiftBoxMutation.mutate(giftBoxForm)}
                      disabled={!giftBoxForm.name || createGiftBoxMutation.isPending}
                    >
                      Create Gift Box
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingGiftBoxes ? (
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          ) : giftBoxes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No gift boxes created</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create giftable credit packages for users
                </p>
                <Button onClick={() => setIsGiftBoxOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gift Box
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {giftBoxes.map((box) => (
                <Card key={box.id} data-testid={`card-giftbox-${box.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{box.name}</CardTitle>
                        <CardDescription>{box.credits} credits</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteGiftBoxMutation.mutate(box.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">
                      {box.priceInr} INR
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {box.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={box.isActive ? "default" : "secondary"}>
                        {box.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {box.expiryDays && (
                        <span className="text-xs text-muted-foreground">
                          Valid for {box.expiryDays} days
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
