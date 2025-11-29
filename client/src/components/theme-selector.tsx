"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { name: "Forest Serenity", value: "forest", color: "#7AB899" },
  { name: "Ocean Breeze", value: "ocean", color: "#38bdf8" },
  { name: "Sunset Calm", value: "sunset", color: "#fb923c" },
  { name: "Lavender Dream", value: "lavender", color: "#c084fc" },
];

export function ThemeSelector() {
  const { theme: darkModeTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState("forest");

  useEffect(() => {
    // Get the current theme from localStorage or default
    const savedTheme = localStorage.getItem("serenity-theme") || "forest";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Update the data-mode attribute based on dark mode
    document.documentElement.setAttribute(
      "data-mode",
      darkModeTheme || "light",
    );
  }, [darkModeTheme]);

  const changeTheme = (themeValue: string) => {
    setCurrentTheme(themeValue);
    localStorage.setItem("serenity-theme", themeValue);
    document.documentElement.setAttribute("data-theme", themeValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="p-2 text-sm font-medium text-muted-foreground">
          Color Palettes
        </div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => changeTheme(theme.value)}
            className={`flex items-center gap-2 ${currentTheme === theme.value ? "bg-accent" : ""}`}
          >
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: theme.color }}
            />
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}