import { Button } from "@/components/ui/button";
import { Moon, Sun, TrendingUp } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type Tab = "new-entry" | "operations" | "calendario" | "statistiche" | "settings";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "new-entry", label: "Nuova Operazione" },
  { id: "operations", label: "Operazioni" },
  { id: "calendario", label: "Calendario" },
  { id: "statistiche", label: "Statistiche" },
  { id: "settings", label: "Impostazioni" },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

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
    </header>
  );
}

export type { Tab };
