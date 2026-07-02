import React, { useEffect, useState, useMemo } from 'react';

const QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. – Will Durant",
  "Success is the product of daily habits—not once-in-a-lifetime transformations. – James Clear",
  "It’s not what we do once in a while that shapes our lives. It’s what we do consistently. – Tony Robbins",
  "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time. – John C. Maxwell",
  "A river cuts through rock, not because of its power, but because of its persistence. – Jim Watkins"
];

export default function BootLoader({ onComplete }) {
  const quote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);

  useEffect(() => {
    // 5 seconds for a perfectly paced, relaxing entry
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);

    return () => clearTimeout(completeTimer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-bg-deep text-text-primary overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* 1. Extremely Soft Ambient Glow (Native Colors Only, No Orange/Rose) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] bg-accent/20 rounded-full blur-[160px] animate-ambient-breathe mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[20%] w-[50vw] h-[50vw] bg-accent-secondary/20 rounded-full blur-[160px] animate-ambient-breathe animation-delay-2000 mix-blend-screen" />
      </div>
      
      {/* 2. Top Edge Light (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-text-primary/20 to-transparent opacity-40" />

      {/* 3. Noise Texture for Tactile Polish */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* 4. Main Content Area */}
      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center justify-center">
        
        {/* Elegant Logo (No Lasers, No Holograms) */}
        <div className="animate-fade-up opacity-0 mb-12 flex flex-col items-center">
          <div className="relative size-14 rounded-[1.25rem] bg-bg-elevated/40 border border-white/5 flex items-center justify-center shadow-lg backdrop-blur-md overflow-hidden mb-4">
             <span className="material-symbols-outlined text-text-secondary text-[24px]">
               code
             </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            DSAstra
          </h1>
        </div>

        {/* The Quote (Maximum Readability & Calm) */}
        <div className="animate-fade-up animation-delay-400 opacity-0 w-full text-center mb-16">
          <p className="text-[17px] md:text-[21px] text-text-primary/90 leading-[1.75] font-light text-balance font-serif">
            "{quote.split(' – ')[0]}"
          </p>
          <div className="mt-8 flex items-center justify-center">
            <span className="text-[11px] md:text-[13px] text-text-tertiary uppercase tracking-[0.2em] font-medium font-sans">
              — {quote.split(' – ')[1]}
            </span>
          </div>
        </div>

        {/* Custom Soothing Loader (Breathing Dots) */}
        <div className="animate-fade-up animation-delay-800 opacity-0 flex items-center justify-center gap-2.5 mt-4">
          <div className="size-[5px] rounded-full bg-accent/60 animate-breathe-dot" />
          <div className="size-[5px] rounded-full bg-accent/60 animate-breathe-dot animation-delay-200" />
          <div className="size-[5px] rounded-full bg-accent/60 animate-breathe-dot animation-delay-400" />
        </div>

      </div>

      <style>{`
        /* Smooth Soothing Entrance */
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(12px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-up {
          animation: fade-up 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-800 { animation-delay: 800ms; }
        .animation-delay-2000 { animation-delay: 2000ms; }

        /* Gentle Ambient Breathing */
        @keyframes ambient-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-ambient-breathe {
          animation: ambient-breathe 8s ease-in-out infinite;
        }

        /* Calm Breathing Dots */
        @keyframes breathe-dot {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 10px var(--color-accent); }
        }
        .animate-breathe-dot {
          animation: breathe-dot 2s ease-in-out infinite;
        }
        .animation-delay-200 { animation-delay: 200ms; }
      `}</style>
    </div>
  );
}
