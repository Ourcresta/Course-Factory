import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  Settings,
  Sparkles,
  Tags,
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

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Create Course AI",
    url: "/courses/new",
    icon: Sparkles,
    highlight: true,
  },
];

const configItems = [
  {
    title: "Skills",
    url: "/skills",
    icon: Tags,
  },
  {
    title: "Certificates",
    url: "/certificates",
    icon: Award,
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
            <span className="text-lg font-semibold tracking-tight" data-testid="text-brand-name">AISiksha</span>
            <span className="text-xs text-muted-foreground">Course Factory</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
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
          <p className="text-xs text-muted-foreground">
            Admin Portal v1.0
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by AI
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
