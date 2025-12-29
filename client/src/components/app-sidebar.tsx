import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  Settings,
  Sparkles,
  Tags,
  FlaskConical,
  ClipboardCheck,
  FolderKanban,
  CreditCard,
  Shield,
  BarChart3,
  Users,
  Activity,
  Wallet,
  LineChart,
  FileText,
  Gift,
  Percent,
  Video,
  Languages,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
];

const academicsItems = [
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "AI Course Factory",
    url: "/courses/new",
    icon: Sparkles,
    highlight: true,
  },
  {
    title: "Practice Labs",
    url: "/labs",
    icon: FlaskConical,
  },
  {
    title: "Tests",
    url: "/tests",
    icon: ClipboardCheck,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Certificates",
    url: "/certificates",
    icon: Award,
  },
  {
    title: "Skills Library",
    url: "/skills",
    icon: Tags,
  },
];

const businessItems = [
  {
    title: "Credits & Pricing",
    url: "/credits",
    icon: CreditCard,
  },
  {
    title: "Plans & Subscriptions",
    url: "/subscriptions",
    icon: FileText,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: Wallet,
  },
  {
    title: "Promotions",
    url: "/promotions",
    icon: Percent,
  },
];

const shishyaItems = [
  {
    title: "Shishya Overview",
    url: "/shishya",
    icon: LineChart,
  },
  {
    title: "Users",
    url: "/shishya/users",
    icon: Users,
  },
  {
    title: "Activity",
    url: "/shishya/activity",
    icon: Activity,
  },
  {
    title: "Payments",
    url: "/shishya/payments",
    icon: Wallet,
  },
  {
    title: "Engagement",
    url: "/shishya/engagement",
    icon: Gift,
  },
];

const vidguruItems = [
  {
    title: "VidGuru Dashboard",
    url: "/vidguru",
    icon: Bot,
    highlight: true,
  },
  {
    title: "Video Manager",
    url: "/vidguru/videos",
    icon: Video,
  },
  {
    title: "Language Manager",
    url: "/vidguru/languages",
    icon: Languages,
  },
];

const systemItems = [
  {
    title: "Security & Admins",
    url: "/security",
    icon: Shield,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/") {
      return location === "/";
    }
    if (url === "/courses") {
      return location === "/courses";
    }
    if (url === "/courses/new") {
      return location === "/courses/new";
    }
    if (url === "/shishya") {
      return location === "/shishya";
    }
    if (url === "/vidguru") {
      return location === "/vidguru";
    }
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight" data-testid="text-brand-name">Oushiksha</span>
            <span className="text-xs text-muted-foreground">Guru Admin</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Academics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academicsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.highlight && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          AI
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Business</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Shishya Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shishyaItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>VidGuru</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vidguruItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.highlight && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          AI
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">System Online</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
