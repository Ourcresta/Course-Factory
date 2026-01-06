import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Coins,
  Trophy,
  Sparkles,
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  Zap,
  Target,
  Award,
  Star,
  Crown,
  Gem,
  Gift,
  Rocket,
  Flag,
  TrendingUp,
  BookOpen,
  CheckCircle,
  Loader2,
  Wand2,
} from "lucide-react";
import type { CourseReward, AchievementCard, MotivationalCard, Module } from "@shared/schema";

const COIN_ICONS = [
  { value: "coins", label: "Coins", icon: Coins },
  { value: "star", label: "Star", icon: Star },
  { value: "gem", label: "Gem", icon: Gem },
  { value: "award", label: "Award", icon: Award },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "zap", label: "Zap", icon: Zap },
];

const ACHIEVEMENT_ICONS = [
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "award", label: "Award", icon: Award },
  { value: "star", label: "Star", icon: Star },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "gem", label: "Gem", icon: Gem },
  { value: "target", label: "Target", icon: Target },
  { value: "rocket", label: "Rocket", icon: Rocket },
  { value: "flag", label: "Flag", icon: Flag },
  { value: "graduation-cap", label: "Graduation", icon: GraduationCap },
  { value: "check-circle", label: "Check", icon: CheckCircle },
];

const MOTIVATIONAL_ICONS = [
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
  { value: "rocket", label: "Rocket", icon: Rocket },
  { value: "trending-up", label: "Trending Up", icon: TrendingUp },
  { value: "target", label: "Target", icon: Target },
  { value: "flag", label: "Flag", icon: Flag },
  { value: "award", label: "Award", icon: Award },
  { value: "star", label: "Star", icon: Star },
  { value: "zap", label: "Zap", icon: Zap },
];

const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600",
  rare: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600",
  epic: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600",
  legendary: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600",
};

const RARITY_BG: Record<string, string> = {
  common: "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700",
  rare: "from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50",
  epic: "from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50",
  legendary: "from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50",
};

interface RewardsTabProps {
  courseId: number;
  courseName: string;
  isPublished: boolean;
  modules?: Module[];
}

interface RewardsData {
  reward: CourseReward | null;
  achievementCards: AchievementCard[];
  motivationalCards: MotivationalCard[];
}

const getIcon = (iconName: string, className: string = "h-5 w-5") => {
  const iconMap: Record<string, any> = {
    coins: Coins,
    star: Star,
    gem: Gem,
    award: Award,
    trophy: Trophy,
    zap: Zap,
    sparkles: Sparkles,
    rocket: Rocket,
    "trending-up": TrendingUp,
    target: Target,
    flag: Flag,
    crown: Crown,
    "graduation-cap": GraduationCap,
    "check-circle": CheckCircle,
    "book-open": BookOpen,
  };
  const IconComponent = iconMap[iconName] || Coins;
  return <IconComponent className={className} />;
};

export function RewardsTab({ courseId, courseName, isPublished, modules = [] }: RewardsTabProps) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("coins");
  const [showPreview, setShowPreview] = useState(false);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [showMotivationalDialog, setShowMotivationalDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementCard | null>(null);
  const [editingMotivational, setEditingMotivational] = useState<MotivationalCard | null>(null);

  const { data, isLoading } = useQuery<RewardsData>({
    queryKey: ["/api/courses", courseId, "rewards"],
  });

  const updateRewardsMutation = useMutation({
    mutationFn: async (rewardData: Partial<CourseReward>) => {
      return await apiRequest("POST", `/api/courses/${courseId}/rewards`, rewardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Rewards settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save rewards settings", variant: "destructive" });
    },
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return await apiRequest("POST", `/api/courses/${courseId}/achievement-cards`, cardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Achievement card created" });
      setShowAchievementDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create achievement card", variant: "destructive" });
    },
  });

  const updateAchievementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/achievement-cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Achievement card updated" });
      setEditingAchievement(null);
    },
    onError: () => {
      toast({ title: "Failed to update achievement card", variant: "destructive" });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/achievement-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Achievement card deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete achievement card", variant: "destructive" });
    },
  });

  const createMotivationalMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return await apiRequest("POST", `/api/courses/${courseId}/motivational-cards`, cardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Motivational card created" });
      setShowMotivationalDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create motivational card", variant: "destructive" });
    },
  });

  const updateMotivationalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/motivational-cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Motivational card updated" });
      setEditingMotivational(null);
    },
    onError: () => {
      toast({ title: "Failed to update motivational card", variant: "destructive" });
    },
  });

  const deleteMotivationalMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/motivational-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Motivational card deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete motivational card", variant: "destructive" });
    },
  });

  const generateMotivationalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/courses/${courseId}/generate-motivational-cards`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "rewards"] });
      toast({ title: "Default motivational cards generated" });
    },
    onError: () => {
      toast({ title: "Failed to generate motivational cards", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const reward = data?.reward;
  const achievementCards = data?.achievementCards || [];
  const motivationalCards = data?.motivationalCards || [];

  const defaultRules = {
    courseCompletion: 100,
    moduleCompletion: 20,
    lessonCompletion: 5,
    testPass: 15,
    projectSubmission: 25,
    labCompletion: 10,
  };

  const defaultBonus = {
    earlyCompletionEnabled: false,
    earlyCompletionDays: 7,
    earlyCompletionBonus: 50,
    perfectScoreEnabled: false,
    perfectScoreBonus: 25,
  };

  const rules = reward?.rulesJson || defaultRules;
  const bonus = reward?.bonusJson || defaultBonus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Rewards & Gamification
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure reward coins, achievement cards, and motivational messages for this course
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          data-testid="button-preview-rewards"
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? "Hide Preview" : "Student Preview"}
        </Button>
      </div>

      {isPublished && (
        <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-600 rounded-md p-4 text-sm text-amber-700 dark:text-amber-400">
          This course is published. Unpublish to make changes to reward settings.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={showPreview ? "lg:col-span-2" : "lg:col-span-3"}>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="coins" data-testid="subtab-coins" className="gap-2">
                <Coins className="h-4 w-4" />
                Coins
              </TabsTrigger>
              <TabsTrigger value="achievements" data-testid="subtab-achievements" className="gap-2">
                <Trophy className="h-4 w-4" />
                Achievement Cards
              </TabsTrigger>
              <TabsTrigger value="motivational" data-testid="subtab-motivational" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Motivational
              </TabsTrigger>
              <TabsTrigger value="scholarships" data-testid="subtab-scholarships" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Scholarships
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coins" className="mt-6 space-y-6">
              <CoinsSection
                reward={reward}
                rules={rules}
                bonus={bonus}
                isPublished={isPublished}
                onUpdate={(data) => updateRewardsMutation.mutate(data)}
                isSaving={updateRewardsMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6 space-y-6">
              <AchievementsSection
                cards={achievementCards}
                modules={modules}
                isPublished={isPublished}
                onCreateCard={() => setShowAchievementDialog(true)}
                onEditCard={(card) => setEditingAchievement(card)}
                onDeleteCard={(id) => deleteAchievementMutation.mutate(id)}
                isDeleting={deleteAchievementMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="motivational" className="mt-6 space-y-6">
              <MotivationalSection
                cards={motivationalCards}
                isPublished={isPublished}
                onCreateCard={() => setShowMotivationalDialog(true)}
                onEditCard={(card) => setEditingMotivational(card)}
                onDeleteCard={(id) => deleteMotivationalMutation.mutate(id)}
                onGenerateDefaults={() => generateMotivationalMutation.mutate()}
                isGenerating={generateMotivationalMutation.isPending}
                isDeleting={deleteMotivationalMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="scholarships" className="mt-6 space-y-6">
              <ScholarshipsSection
                reward={reward}
                isPublished={isPublished}
                onUpdate={(data) => updateRewardsMutation.mutate(data)}
                isSaving={updateRewardsMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </div>

        {showPreview && (
          <div className="lg:col-span-1">
            <PreviewPanel
              courseName={courseName}
              reward={reward}
              achievementCards={achievementCards}
              motivationalCards={motivationalCards}
              rules={rules}
            />
          </div>
        )}
      </div>

      <AchievementCardDialog
        open={showAchievementDialog || !!editingAchievement}
        onOpenChange={(open) => {
          if (!open) {
            setShowAchievementDialog(false);
            setEditingAchievement(null);
          }
        }}
        card={editingAchievement}
        modules={modules}
        onSubmit={(data) => {
          if (editingAchievement) {
            updateAchievementMutation.mutate({ id: editingAchievement.id, data });
          } else {
            createAchievementMutation.mutate(data);
          }
        }}
        isSaving={createAchievementMutation.isPending || updateAchievementMutation.isPending}
      />

      <MotivationalCardDialog
        open={showMotivationalDialog || !!editingMotivational}
        onOpenChange={(open) => {
          if (!open) {
            setShowMotivationalDialog(false);
            setEditingMotivational(null);
          }
        }}
        card={editingMotivational}
        onSubmit={(data) => {
          if (editingMotivational) {
            updateMotivationalMutation.mutate({ id: editingMotivational.id, data });
          } else {
            createMotivationalMutation.mutate(data);
          }
        }}
        isSaving={createMotivationalMutation.isPending || updateMotivationalMutation.isPending}
      />
    </div>
  );
}

interface CoinsSectionProps {
  reward: CourseReward | null | undefined;
  rules: any;
  bonus: any;
  isPublished: boolean;
  onUpdate: (data: any) => void;
  isSaving: boolean;
}

function CoinsSection({ reward, rules, bonus, isPublished, onUpdate, isSaving }: CoinsSectionProps) {
  const [coinsEnabled, setCoinsEnabled] = useState(reward?.coinsEnabled ?? false);
  const [coinName, setCoinName] = useState(reward?.coinName || "Skill Coins");
  const [coinIcon, setCoinIcon] = useState(reward?.coinIcon || "coins");
  const [localRules, setLocalRules] = useState(rules);
  const [localBonus, setLocalBonus] = useState(bonus);

  const handleSave = () => {
    onUpdate({
      coinsEnabled,
      coinName,
      coinIcon,
      rulesJson: localRules,
      bonusJson: localBonus,
    });
  };

  const updateRule = (key: string, value: number) => {
    setLocalRules((prev: any) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const updateBonus = (key: string, value: any) => {
    setLocalBonus((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Reward Coins</CardTitle>
              <CardDescription>Enable and configure coin rewards for student achievements</CardDescription>
            </div>
            <Switch
              checked={coinsEnabled}
              onCheckedChange={setCoinsEnabled}
              disabled={isPublished}
              data-testid="switch-coins-enabled"
            />
          </div>
        </CardHeader>
        {coinsEnabled && (
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coinName">Coin Name</Label>
                <Input
                  id="coinName"
                  value={coinName}
                  onChange={(e) => setCoinName(e.target.value)}
                  placeholder="Skill Coins"
                  disabled={isPublished}
                  data-testid="input-coin-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Coin Icon</Label>
                <Select value={coinIcon} onValueChange={setCoinIcon} disabled={isPublished}>
                  <SelectTrigger data-testid="select-coin-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COIN_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <icon.icon className="h-4 w-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Earning Rules</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Course Completion</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.courseCompletion}
                    onChange={(e) => updateRule("courseCompletion", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-course"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Module Completion</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.moduleCompletion}
                    onChange={(e) => updateRule("moduleCompletion", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-module"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lesson Completion</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.lessonCompletion}
                    onChange={(e) => updateRule("lessonCompletion", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-lesson"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test Pass</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.testPass}
                    onChange={(e) => updateRule("testPass", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-test"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Submission</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.projectSubmission}
                    onChange={(e) => updateRule("projectSubmission", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-project"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lab Completion</Label>
                  <Input
                    type="number"
                    min="0"
                    value={localRules.labCompletion}
                    onChange={(e) => updateRule("labCompletion", parseInt(e.target.value) || 0)}
                    disabled={isPublished}
                    data-testid="input-coins-lab"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Bonus Coins</h4>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Early Completion Bonus</CardTitle>
                      <Switch
                        checked={localBonus.earlyCompletionEnabled}
                        onCheckedChange={(v) => updateBonus("earlyCompletionEnabled", v)}
                        disabled={isPublished}
                        data-testid="switch-early-bonus"
                      />
                    </div>
                  </CardHeader>
                  {localBonus.earlyCompletionEnabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Complete within (days)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={localBonus.earlyCompletionDays}
                          onChange={(e) => updateBonus("earlyCompletionDays", parseInt(e.target.value) || 7)}
                          disabled={isPublished}
                          data-testid="input-early-days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bonus Coins</Label>
                        <Input
                          type="number"
                          min="0"
                          value={localBonus.earlyCompletionBonus}
                          onChange={(e) => updateBonus("earlyCompletionBonus", parseInt(e.target.value) || 0)}
                          disabled={isPublished}
                          data-testid="input-early-bonus"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Perfect Score Bonus</CardTitle>
                      <Switch
                        checked={localBonus.perfectScoreEnabled}
                        onCheckedChange={(v) => updateBonus("perfectScoreEnabled", v)}
                        disabled={isPublished}
                        data-testid="switch-perfect-bonus"
                      />
                    </div>
                  </CardHeader>
                  {localBonus.perfectScoreEnabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Bonus Coins</Label>
                        <Input
                          type="number"
                          min="0"
                          value={localBonus.perfectScoreBonus}
                          onChange={(e) => updateBonus("perfectScoreBonus", parseInt(e.target.value) || 0)}
                          disabled={isPublished}
                          data-testid="input-perfect-bonus"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Awarded when student passes all tests with 100% score
                      </p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </CardContent>
        )}
        <CardFooter className="border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isPublished || isSaving}
            data-testid="button-save-coins"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Coin Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface AchievementsSectionProps {
  cards: AchievementCard[];
  modules: Module[];
  isPublished: boolean;
  onCreateCard: () => void;
  onEditCard: (card: AchievementCard) => void;
  onDeleteCard: (id: number) => void;
  isDeleting: boolean;
}

function AchievementsSection({
  cards,
  modules,
  isPublished,
  onCreateCard,
  onEditCard,
  onDeleteCard,
  isDeleting,
}: AchievementsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-medium">Achievement Cards</h3>
          <p className="text-sm text-muted-foreground">
            Create collectible cards students can unlock by completing milestones
          </p>
        </div>
        <Button
          onClick={onCreateCard}
          disabled={isPublished}
          data-testid="button-add-achievement"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Achievement Cards</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create achievement cards to motivate students with collectible rewards
            </p>
            <Button onClick={onCreateCard} disabled={isPublished} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <AchievementCardPreview
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
              isPublished={isPublished}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AchievementCardPreviewProps {
  card: AchievementCard;
  onEdit: () => void;
  onDelete: () => void;
  isPublished: boolean;
  isDeleting: boolean;
}

function AchievementCardPreview({ card, onEdit, onDelete, isPublished, isDeleting }: AchievementCardPreviewProps) {
  const conditionLabel = getConditionLabel(card.conditionJson);

  return (
    <Card className={`overflow-visible bg-gradient-to-br ${RARITY_BG[card.rarity]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background/80">
              {getIcon(card.icon || "trophy", "h-6 w-6")}
            </div>
            <div>
              <CardTitle className="text-base">{card.title}</CardTitle>
              <Badge className={RARITY_COLORS[card.rarity]}>
                {card.rarity}
              </Badge>
            </div>
          </div>
          {!card.isActive && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {card.description && (
          <p className="text-sm text-muted-foreground mb-3">{card.description}</p>
        )}
        <div className="text-xs text-muted-foreground bg-background/50 rounded px-2 py-1">
          {conditionLabel}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          disabled={isPublished}
          data-testid={`button-edit-achievement-${card.id}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={isPublished || isDeleting}
              data-testid={`button-delete-achievement-${card.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Achievement Card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{card.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function getConditionLabel(condition: any): string {
  if (!condition) return "Unknown condition";
  switch (condition.type) {
    case "percentage_complete":
      return `Complete ${condition.value || 0}% of course`;
    case "module_complete":
      return `Complete module #${condition.moduleId || "?"}`;
    case "all_tests_passed":
      return "Pass all tests";
    case "project_approved":
      return "Get project approved";
    case "all_labs_complete":
      return "Complete all labs";
    case "custom":
      return condition.customCondition || "Custom condition";
    default:
      return "Unknown condition";
  }
}

interface MotivationalSectionProps {
  cards: MotivationalCard[];
  isPublished: boolean;
  onCreateCard: () => void;
  onEditCard: (card: MotivationalCard) => void;
  onDeleteCard: (id: number) => void;
  onGenerateDefaults: () => void;
  isGenerating: boolean;
  isDeleting: boolean;
}

function MotivationalSection({
  cards,
  isPublished,
  onCreateCard,
  onEditCard,
  onDeleteCard,
  onGenerateDefaults,
  isGenerating,
  isDeleting,
}: MotivationalSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-medium">Motivational Cards</h3>
          <p className="text-sm text-muted-foreground">
            Auto-show encouraging messages when students hit milestones
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cards.length === 0 && (
            <Button
              variant="outline"
              onClick={onGenerateDefaults}
              disabled={isPublished || isGenerating}
              data-testid="button-generate-motivational"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate Defaults
            </Button>
          )}
          <Button
            onClick={onCreateCard}
            disabled={isPublished}
            data-testid="button-add-motivational"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Motivational Cards</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add encouraging messages to keep students motivated throughout the course
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button onClick={onGenerateDefaults} variant="outline" disabled={isPublished || isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Generate Defaults
              </Button>
              <Button onClick={onCreateCard} disabled={isPublished}>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <Card key={card.id} className="border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getIcon(card.icon || "sparkles", "h-5 w-5")}
                    </div>
                    <div>
                      <p className="font-medium">{card.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTriggerLabel(card.triggerType, card.triggerValue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!card.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEditCard(card)}
                      disabled={isPublished}
                      data-testid={`button-edit-motivational-${card.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={isPublished || isDeleting}
                          data-testid={`button-delete-motivational-${card.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Motivational Card</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this message?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteCard(card.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getTriggerLabel(type: string, value?: number | null): string {
  switch (type) {
    case "percentage":
      return `At ${value || 0}% progress`;
    case "module_complete":
      return `After completing module ${value || ""}`;
    case "lesson_complete":
      return `After completing ${value || 0} lessons`;
    case "test_pass":
      return "After passing a test";
    case "project_submit":
      return "After submitting a project";
    case "custom":
      return "Custom trigger";
    default:
      return "Unknown trigger";
  }
}

interface ScholarshipsSectionProps {
  reward: CourseReward | null | undefined;
  isPublished: boolean;
  onUpdate: (data: any) => void;
  isSaving: boolean;
}

function ScholarshipsSection({ reward, isPublished, onUpdate, isSaving }: ScholarshipsSectionProps) {
  const [enabled, setEnabled] = useState(reward?.scholarshipEnabled ?? false);
  const [scholarshipData, setScholarshipData] = useState(
    reward?.scholarshipJson || {
      coinsToDiscount: 100,
      discountType: "percentage" as const,
      discountValue: 10,
      validityDays: 30,
      eligiblePlans: ["basic", "premium"],
    }
  );

  const handleSave = () => {
    onUpdate({
      scholarshipEnabled: enabled,
      scholarshipJson: enabled ? scholarshipData : null,
    });
  };

  const updateField = (key: string, value: any) => {
    setScholarshipData((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Scholarship Rewards</CardTitle>
              <CardDescription>
                Allow students to convert earned coins into discounts on other courses
              </CardDescription>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isPublished}
              data-testid="switch-scholarship-enabled"
            />
          </div>
        </CardHeader>
        {enabled && (
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Coins Required</Label>
                <Input
                  type="number"
                  min="1"
                  value={scholarshipData.coinsToDiscount}
                  onChange={(e) => updateField("coinsToDiscount", parseInt(e.target.value) || 100)}
                  disabled={isPublished}
                  data-testid="input-coins-required"
                />
                <p className="text-xs text-muted-foreground">
                  Number of coins needed to unlock discount
                </p>
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={scholarshipData.discountType}
                  onValueChange={(v) => updateField("discountType", v)}
                  disabled={isPublished}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="flat">Flat Amount Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Discount Value {scholarshipData.discountType === "percentage" ? "(%)" : "(Credits)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={scholarshipData.discountType === "percentage" ? 100 : undefined}
                  value={scholarshipData.discountValue}
                  onChange={(e) => updateField("discountValue", parseInt(e.target.value) || 0)}
                  disabled={isPublished}
                  data-testid="input-discount-value"
                />
              </div>
              <div className="space-y-2">
                <Label>Validity (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={scholarshipData.validityDays}
                  onChange={(e) => updateField("validityDays", parseInt(e.target.value) || 30)}
                  disabled={isPublished}
                  data-testid="input-validity-days"
                />
              </div>
            </div>
          </CardContent>
        )}
        <CardFooter className="border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isPublished || isSaving}
            data-testid="button-save-scholarship"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Scholarship Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface PreviewPanelProps {
  courseName: string;
  reward: CourseReward | null | undefined;
  achievementCards: AchievementCard[];
  motivationalCards: MotivationalCard[];
  rules: any;
}

function PreviewPanel({ courseName, reward, achievementCards, motivationalCards, rules }: PreviewPanelProps) {
  const coinName = reward?.coinName || "Skill Coins";
  const coinIcon = reward?.coinIcon || "coins";
  const coinsEnabled = reward?.coinsEnabled ?? false;

  const totalEarnable = coinsEnabled
    ? rules.courseCompletion +
      rules.moduleCompletion * 5 +
      rules.lessonCompletion * 20 +
      rules.testPass * 3 +
      rules.projectSubmission * 2 +
      rules.labCompletion * 4
    : 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Student Preview
        </CardTitle>
        <CardDescription>How students will see rewards in Shishya</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Your {coinName}</p>
              <div className="flex items-center gap-2 mt-1">
                {getIcon(coinIcon, "h-6 w-6 text-primary")}
                <span className="text-2xl font-bold">0</span>
              </div>
            </div>
            {coinsEnabled && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Earnable</p>
                <p className="font-semibold">{totalEarnable}</p>
              </div>
            )}
          </div>
        </div>

        {achievementCards.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Unlockable Cards ({achievementCards.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {achievementCards.slice(0, 4).map((card) => (
                <div
                  key={card.id}
                  className={`p-2 rounded-md bg-gradient-to-br ${RARITY_BG[card.rarity]} opacity-50`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-background/60">
                      {getIcon(card.icon || "trophy", "h-3 w-3")}
                    </div>
                    <span className="text-xs truncate">{card.title}</span>
                  </div>
                </div>
              ))}
            </div>
            {achievementCards.length > 4 && (
              <p className="text-xs text-center text-muted-foreground">
                +{achievementCards.length - 4} more cards
              </p>
            )}
          </div>
        )}

        {motivationalCards.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Motivational Messages
            </h4>
            <p className="text-xs text-muted-foreground">
              {motivationalCards.length} messages will encourage students during their journey
            </p>
          </div>
        )}

        {!coinsEnabled && achievementCards.length === 0 && motivationalCards.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rewards configured yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AchievementCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: AchievementCard | null;
  modules: Module[];
  onSubmit: (data: any) => void;
  isSaving: boolean;
}

function AchievementCardDialog({
  open,
  onOpenChange,
  card,
  modules,
  onSubmit,
  isSaving,
}: AchievementCardDialogProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [icon, setIcon] = useState(card?.icon || "trophy");
  const [rarity, setRarity] = useState(card?.rarity || "common");
  const [conditionType, setConditionType] = useState(
    (card?.conditionJson as any)?.type || "percentage_complete"
  );
  const [conditionValue, setConditionValue] = useState(
    (card?.conditionJson as any)?.value || 100
  );
  const [conditionModuleId, setConditionModuleId] = useState(
    (card?.conditionJson as any)?.moduleId || ""
  );
  const [isActive, setIsActive] = useState(card?.isActive ?? true);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    const conditionJson: any = { type: conditionType };
    if (conditionType === "percentage_complete") {
      conditionJson.value = conditionValue;
    } else if (conditionType === "module_complete") {
      conditionJson.moduleId = parseInt(conditionModuleId);
    }

    onSubmit({
      title,
      description,
      icon,
      rarity,
      conditionJson,
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{card ? "Edit Achievement Card" : "Create Achievement Card"}</DialogTitle>
          <DialogDescription>
            Design a collectible card students can unlock by completing milestones
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course Master"
              data-testid="input-achievement-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Awarded for completing the entire course"
              data-testid="input-achievement-description"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger data-testid="select-achievement-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_ICONS.map((ic) => (
                    <SelectItem key={ic.value} value={ic.value}>
                      <div className="flex items-center gap-2">
                        <ic.icon className="h-4 w-4" />
                        {ic.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger data-testid="select-achievement-rarity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Unlock Condition</Label>
            <Select value={conditionType} onValueChange={setConditionType}>
              <SelectTrigger data-testid="select-condition-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage_complete">% Course Completed</SelectItem>
                <SelectItem value="module_complete">Specific Module Completed</SelectItem>
                <SelectItem value="all_tests_passed">All Tests Passed</SelectItem>
                <SelectItem value="project_approved">Project Approved</SelectItem>
                <SelectItem value="all_labs_complete">All Labs Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {conditionType === "percentage_complete" && (
            <div className="space-y-2">
              <Label>Completion Percentage</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={conditionValue}
                onChange={(e) => setConditionValue(parseInt(e.target.value) || 100)}
                data-testid="input-condition-value"
              />
            </div>
          )}
          {conditionType === "module_complete" && modules.length > 0 && (
            <div className="space-y-2">
              <Label>Select Module</Label>
              <Select value={String(conditionModuleId)} onValueChange={setConditionModuleId}>
                <SelectTrigger data-testid="select-condition-module">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-achievement-active"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSaving} data-testid="button-submit-achievement">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {card ? "Update Card" : "Create Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MotivationalCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: MotivationalCard | null;
  onSubmit: (data: any) => void;
  isSaving: boolean;
}

function MotivationalCardDialog({
  open,
  onOpenChange,
  card,
  onSubmit,
  isSaving,
}: MotivationalCardDialogProps) {
  const [message, setMessage] = useState(card?.message || "");
  const [triggerType, setTriggerType] = useState(card?.triggerType || "percentage");
  const [triggerValue, setTriggerValue] = useState(card?.triggerValue || 50);
  const [icon, setIcon] = useState(card?.icon || "sparkles");
  const [isActive, setIsActive] = useState(card?.isActive ?? true);

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit({
      message,
      triggerType,
      triggerValue: triggerType === "percentage" || triggerType === "lesson_complete" ? triggerValue : null,
      icon,
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{card ? "Edit Motivational Card" : "Create Motivational Card"}</DialogTitle>
          <DialogDescription>
            Create an encouraging message to show students at key moments
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Great job! You're making amazing progress!"
              data-testid="input-motivational-message"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger data-testid="select-motivational-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVATIONAL_ICONS.map((ic) => (
                    <SelectItem key={ic.value} value={ic.value}>
                      <div className="flex items-center gap-2">
                        <ic.icon className="h-4 w-4" />
                        {ic.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">At % Progress</SelectItem>
                  <SelectItem value="lesson_complete">After N Lessons</SelectItem>
                  <SelectItem value="test_pass">After Test Pass</SelectItem>
                  <SelectItem value="project_submit">After Project Submit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(triggerType === "percentage" || triggerType === "lesson_complete") && (
            <div className="space-y-2">
              <Label>{triggerType === "percentage" ? "Progress %" : "Lesson Count"}</Label>
              <Input
                type="number"
                min="1"
                max={triggerType === "percentage" ? 100 : undefined}
                value={triggerValue}
                onChange={(e) => setTriggerValue(parseInt(e.target.value) || 50)}
                data-testid="input-trigger-value"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-motivational-active"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!message.trim() || isSaving} data-testid="button-submit-motivational">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {card ? "Update Card" : "Create Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
