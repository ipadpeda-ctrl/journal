import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, TrendingUp, LogOut, Shield, User as UserIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

type Tab = "new-entry" | "operations" | "calendario" | "statistiche" | "diary" | "goals" | "settings" | "admin";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: "new-entry", label: "Nuova Operazione" },
    { id: "operations", label: "Operazioni" },
    { id: "calendario", label: "Calendario" },
    { id: "statistiche", label: "Statistiche" },
    { id: "diary", label: "Diario" },
    { id: "goals", label: "Obiettivi" },
    { id: "settings", label: "Impostazioni" },
    ...(isAdmin ? [{ id: "admin" as Tab, label: "Admin", adminOnly: true }] : []),
  ];

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b h-16 flex items-center px-4 gap-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-chart-1" />
        <span className="font-semibold text-lg">Trading Journal</span>
      </div>
      
      <nav className="flex-1 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover-elevate"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.adminOnly && <Shield className="w-3 h-3 inline mr-1" />}
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-chart-1" />
            )}
          </button>
        ))}
      </nav>

      <Button
        size="icon"
        variant="ghost"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user.firstName && (
                  <p className="font-medium" data-testid="text-user-name">{user.firstName} {user.lastName}</p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                )}
                {user.role && user.role !== "user" && (
                  <p className="text-xs text-chart-1" data-testid="text-user-role">
                    <Shield className="w-3 h-3 inline mr-1" />
                    {user.role === "super_admin" ? "Super Admin" : "Admin"}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}

export type { Tab };
