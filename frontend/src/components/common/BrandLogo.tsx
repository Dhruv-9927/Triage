import { Plus } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const badgeSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center font-serif font-bold tracking-tight select-none ${className}`}>
      <span className={`text-[#2B1810] font-serif ${textSizes[size]}`}>Triage</span>
      <span className="relative flex items-center justify-center ml-1">
        <span className={`bg-[#DC2626] text-white rounded-md flex items-center justify-center shadow-sm ${badgeSizes[size]}`}>
          <Plus className="w-full h-full p-0.5 stroke-[3.5]" />
        </span>
      </span>
    </div>
  );
}
