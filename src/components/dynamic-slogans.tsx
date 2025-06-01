"use client";
import { useState, useEffect } from 'react';

const slogansList = [
  "Tu viaje, a tu manera.",
  "Llega con Akí, llega con estilo.",
  "Rápido, confiable, Akí.",
  "El viaje importa, la llegada también.",
  "Toca. Viaja. Llega. Akí."
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
      className={`text-lg md:text-xl text-foreground/80 my-4 transition-opacity duration-500 ease-in-out h-12 flex items-center justify-center ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {slogansList[currentSloganIndex]}
    </p>
  );
};
export default DynamicSlogans;
