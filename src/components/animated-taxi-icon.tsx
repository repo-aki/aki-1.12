import { CarTaxiFront } from 'lucide-react';

const AnimatedTaxiIcon = () => {
  return (
    <div className="my-8" aria-label="Animated taxi icon">
      <CarTaxiFront
        className="w-24 h-24 md:w-32 md:h-32 text-primary animate-taxi-bounce"
        strokeWidth={1.5}
      />
    </div>
  );
};
export default AnimatedTaxiIcon;
