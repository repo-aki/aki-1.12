
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ThemeToggle: FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Set initial theme based on localStorage or system preference
    const initialThemeIsDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    
    setIsDarkMode(initialThemeIsDark);
    if (initialThemeIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-4 py-2">
      <Switch
        id="theme-switch"
        checked={isDarkMode}
        onCheckedChange={toggleTheme}
        aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
      />
      <Label htmlFor="theme-switch" className="flex items-center text-lg font-medium cursor-pointer">
        {isDarkMode ? <Moon className="mr-2 h-5 w-5" /> : <Sun className="mr-2 h-5 w-5" />}
        <span>Modo {isDarkMode ? 'Oscuro' : 'Claro'}</span>
      </Label>
    </div>
  );
};

export default ThemeToggle;
