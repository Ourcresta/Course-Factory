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
import { Plus, MoreVertical, Edit, Trash2, CreditCard, Coins, Tag, Star, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CreditPackage, Course } from "@shared/schema";

export default function CreditsPage() {
  const { toast } = useToast();
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isCoursePricingOpen, setIsCoursePricingOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [packageForm, setPackageForm] = useState({
    name: "",
    description: "",
    credits: 100,
    priceInr: 99,
    priceUsd: 1,
    discount: 0,
    validityDays: 365,
    isActive: true,
    isFeatured: false,
  });

  const [coursePricing, setCoursePricing] = useState({
    creditCost: 0,
    isFree: true,
  });

  const { data: packages = [], isLoading: loadingPackages } = useQuery<CreditPackage[]>({
    queryKey: ["/api/credit-packages"],
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: typeof packageForm) => {
      return apiRequest("POST", "/api/credit-packages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-packages"] });
      setIsCreatePackageOpen(false);
      setPackageForm({
        name: "",
        description: "",
        credits: 100,
        priceInr: 99,
        priceUsd: 1,
        discount: 0,
        validityDays: 365,
        isActive: true,
        isFeatured: false,
      });
      toast({ title: "Credit package created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create package", variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/credit-packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-packages"] });
      toast({ title: "Package deleted successfully" });
    },
  });

  const updateCoursePricingMutation = useMutation({
    mutationFn: async ({ courseId, data }: { courseId: number; data: typeof coursePricing }) => {
      return apiRequest("PATCH", `/api/courses/${courseId}/pricing`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCoursePricingOpen(false);
      setSelectedCourse(null);
      toast({ title: "Course pricing updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update pricing", variant: "destructive" });
    },
  });

  const openCoursePricing = (course: Course) => {
    setSelectedCourse(course);
    setCoursePricing({
      creditCost: course.creditCost || 0,
      isFree: course.isFree ?? true,
    });
    setIsCoursePricingOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Credits & Pricing</h1>
          <p className="text-sm text-muted-foreground">
            Manage credit packages and course pricing for Shishya platform
          </p>
        </div>
      </div>

      <Tabs defaultValue="packages" className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="packages" className="gap-2" data-testid="tab-packages">
              <Coins className="h-4 w-4" />
              Credit Packages
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-course-pricing">
              <Tag className="h-4 w-4" />
              Course Pricing
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="packages" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">Credit Packages</h2>
              <p className="text-sm text-muted-foreground">
                Create packages that students can purchase on Shishya
              </p>
            </div>
            <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-package">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Credit Package</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      placeholder="e.g., Starter Pack"
                      data-testid="input-package-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      placeholder="What's included in this package..."
                      data-testid="input-package-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min={1}
                        value={packageForm.credits}
                        onChange={(e) => setPackageForm({ ...packageForm, credits: parseInt(e.target.value) || 0 })}
                        data-testid="input-package-credits"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priceInr">Price (INR)</Label>
                      <Input
                        id="priceInr"
                        type="number"
                        min={0}
                        value={packageForm.priceInr}
                        onChange={(e) => setPackageForm({ ...packageForm, priceInr: parseInt(e.target.value) || 0 })}
                        data-testid="input-package-price"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min={0}
                        max={100}
                        value={packageForm.discount}
                        onChange={(e) => setPackageForm({ ...packageForm, discount: parseInt(e.target.value) || 0 })}
                        data-testid="input-package-discount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validityDays">Validity (days)</Label>
                      <Input
                        id="validityDays"
                        type="number"
                        min={1}
                        value={packageForm.validityDays}
                        onChange={(e) => setPackageForm({ ...packageForm, validityDays: parseInt(e.target.value) || 365 })}
                        data-testid="input-package-validity"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label htmlFor="isFeatured">Featured Package</Label>
                      <p className="text-xs text-muted-foreground">Highlight this package</p>
                    </div>
                    <Switch
                      id="isFeatured"
                      checked={packageForm.isFeatured}
                      onCheckedChange={(checked) => setPackageForm({ ...packageForm, isFeatured: checked })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatePackageOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createPackageMutation.mutate(packageForm)}
                      disabled={!packageForm.name || createPackageMutation.isPending}
                      data-testid="button-submit-package"
                    >
                      {createPackageMutation.isPending ? "Creating..." : "Create Package"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingPackages ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">Loading packages...</div>
            </div>
          ) : packages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No credit packages</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first credit package for students to purchase
                </p>
                <Button onClick={() => setIsCreatePackageOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={pkg.isFeatured ? "border-primary" : ""} data-testid={`card-package-${pkg.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pkg.name}
                        {pkg.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </CardTitle>
                      <CardDescription className="mt-1">{pkg.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deletePackageMutation.mutate(pkg.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2 mb-4">
                      <div className="flex items-center text-2xl font-bold">
                        <IndianRupee className="h-5 w-5" />
                        {pkg.priceInr}
                      </div>
                      {pkg.discount && pkg.discount > 0 && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          {pkg.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      {pkg.credits} Credits
                    </div>
                    {pkg.validityDays && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Valid for {pkg.validityDays} days
                      </p>
                    )}
                    <Badge
                      variant={pkg.isActive ? "default" : "secondary"}
                      className="mt-3"
                    >
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="flex-1 overflow-auto p-6 m-0">
          <div className="mb-6">
            <h2 className="text-lg font-medium">Course Pricing</h2>
            <p className="text-sm text-muted-foreground">
              Set credit costs for each course on the Shishya platform
            </p>
          </div>

          {loadingCourses ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">Loading courses...</div>
            </div>
          ) : courses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create courses first to set their pricing
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Credit Cost</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id} data-testid={`row-course-pricing-${course.id}`}>
                      <TableCell>
                        <div className="font-medium">{course.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{course.level}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {course.isFree ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Free</Badge>
                        ) : (
                          <Badge variant="outline">Paid</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.isFree ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                            {course.creditCost}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCoursePricing(course)}
                          data-testid={`button-edit-pricing-${course.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isCoursePricingOpen} onOpenChange={setIsCoursePricingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course Pricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set pricing for "{selectedCourse?.name}"
            </p>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label htmlFor="isFree">Free Course</Label>
                <p className="text-xs text-muted-foreground">Students can access without credits</p>
              </div>
              <Switch
                id="isFree"
                checked={coursePricing.isFree}
                onCheckedChange={(checked) => setCoursePricing({ ...coursePricing, isFree: checked })}
              />
            </div>
            {!coursePricing.isFree && (
              <div>
                <Label htmlFor="creditCost">Credit Cost</Label>
                <Input
                  id="creditCost"
                  type="number"
                  min={0}
                  value={coursePricing.creditCost}
                  onChange={(e) => setCoursePricing({ ...coursePricing, creditCost: parseInt(e.target.value) || 0 })}
                  data-testid="input-course-credits"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of credits required to unlock this course
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCoursePricingOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedCourse) {
                    updateCoursePricingMutation.mutate({
                      courseId: selectedCourse.id,
                      data: coursePricing,
                    });
                  }
                }}
                disabled={updateCoursePricingMutation.isPending}
                data-testid="button-save-pricing"
              >
                {updateCoursePricingMutation.isPending ? "Saving..." : "Save Pricing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
