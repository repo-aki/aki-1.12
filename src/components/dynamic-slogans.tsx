"use client";
import { useState, useEffect } from 'react';

const slogansList = [
  "Conectando pasajeros y conductores al instante.",
  "Tu viaje ideal, a un toque de distancia.",
  "Movilidad inteligente para tu día a día.",
  "Descubre la ciudad con Akí.",
  "Seguridad y confianza en cada trayecto."
];

const DynamicSlogans = () => {
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const sloganTimer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % slogansList.length);
        setIsVisible(true);
      }, 500); // Duration of fade-out transition
    }, 4000); // Time each slogan is visible + fade transitions

    return () => clearInterval(sloganTimer);
  }, []);

  return (
    <p
      className={`text-xl md:text-2xl text-foreground/80 my-4 transition-opacity duration-500 ease-in-out h-16 flex items-center justify-center px-4 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {slogansList[currentSloganIndex]}
    </p>
  );
};
export default DynamicSlogans;
