import { CarTaxiFront } from 'lucide-react';

const AnimatedTaxiIcon = () => {
  return (
    <div className="my-8 drop-shadow-[0_8px_8px_hsl(var(--primary)/0.3)]" aria-label="Animated taxi icon">
      <CarTaxiFront
        className="w-28 h-28 md:w-36 md:h-36 text-primary animate-taxi-bounce"
        strokeWidth={2}
      />
    </div>
  );
};
export default AnimatedTaxiIcon;
