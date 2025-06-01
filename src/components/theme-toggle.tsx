
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ThemeToggle: FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialThemeIsDark: boolean;

    if (storedTheme !== null) {
      initialThemeIsDark = storedTheme === 'dark';
    } else {
      initialThemeIsDark = prefersDark;
      // Opcional: Si no hay tema guardado, se podría guardar la preferencia del sistema aquí.
      // localStorage.setItem('theme', initialThemeIsDark ? 'dark' : 'light');
    }
    
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

  if (isDarkMode === undefined) {
    // Renderiza un placeholder mientras se determina el tema para evitar FOUC o cambios incorrectos
    return (
      <div className="flex items-center space-x-2 mt-4 py-2">
        <div className="h-6 w-11 rounded-full bg-muted/50 animate-pulse"></div> {/* Placeholder para Switch */}
        <div className="h-6 w-32 rounded-md bg-muted/50 animate-pulse"></div> {/* Placeholder para Label */}
      </div>
    );
  }

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
