
"use client";

import type React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = "" }) => {
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;

    // Award points for length
    if (pass.length >= 8) score++;
    if (pass.length >= 10) score++;


    // Award points for character variety
    if (/\d/.test(pass)) score++; // numbers
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++; // lower and upper case
    if (/[^A-Za-z0-9]/.test(pass)) score++; // special characters
    
    return Math.min(score, 4); // Max score is 4 for this simplified version
  };

  const strength = getStrength(password);
  const strengthLabel = ["Muy Débil", "Débil", "Aceptable", "Fuerte", "Muy Fuerte"];
  const strengthColor = [
    "bg-destructive", // Muy Débil (score 0)
    "bg-destructive", // Débil (score 1)
    "bg-yellow-500",  // Aceptable (score 2)
    "bg-lime-500",    // Fuerte (score 3)
    "bg-green-500"    // Muy Fuerte (score 4)
  ];
  
  if (!password) {
    return null; // No mostrar nada si no hay contraseña
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          Seguridad de la contraseña:
        </span>
        <span className={cn("text-xs font-semibold", 
          strength === 0 || strength === 1 ? "text-destructive" :
          strength === 2 ? "text-yellow-600" :
          strength === 3 ? "text-lime-600" : "text-green-600"
        )}>
          {strengthLabel[strength]}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-full w-1/4 transition-all duration-300 ease-in-out",
              strength > index ? strengthColor[strength] : "bg-muted" ,
              index > 0 && strength > index ? "border-l-2 border-background" : ""
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
