import React from 'react';
import { Crown, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center bg-amber-600 rounded-xl shadow-lg shadow-amber-200 rotate-3 transition-transform hover:rotate-0 cursor-pointer overflow-hidden", sizes[size])}>
        <Hexagon className={cn("text-white fill-amber-400 opacity-20 absolute -right-2 -bottom-2 w-12 h-12")} />
        
        {/* Custom Bee SVG */}
        <svg viewBox="0 0 24 24" className={cn("text-white fill-white relative z-10 w-3/5 h-3/5")} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L10 5H14L12 2Z" fill="currentColor" />
            <path d="M7 10C7 7.23858 9.23858 5 12 5C14.7614 5 17 7.23858 17 10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M5 10C5 10 2 8 2 11C2 14 5 12 5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M19 10C19 10 22 8 22 11C22 14 19 12 19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="9" y="8" width="6" height="8" rx="3" fill="currentColor" />
            <path d="M10 10H14M10 12H14M10 14H14" stroke="black" strokeWidth="0.5" strokeOpacity="0.5" />
        </svg>

      </div>
      <div className="flex flex-col">
        <span className={cn("font-black tracking-tighter text-slate-800 leading-none", 
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl'
        )}>
          VIZVIZ<span className="text-amber-500">PRO</span>
        </span>
        <span className={cn("font-bold text-slate-400 uppercase tracking-[0.2em] -mt-0.5", 
          size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[8px]' : 'text-[10px]'
        )}>
          Modern Arıcılık
        </span>
      </div>
    </div>
  );
}
