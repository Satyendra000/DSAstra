import React, { useEffect, useState, useMemo, useCallback } from 'react';

/* ─── Premium Color Tokens (Cobalt / Violet / Zinc) ─────────────── */
const HEX_COLOR = `#3b82f6`;
const BG_COLOR = `#050505`; // Absolute deep black/zinc for maximum OLED contrast

/* ─── Hexagonal Hive Grid Generator ────────────────────────── */
// Fewer rings, but much larger, more detailed hexes for a premium feel
const HEX_SIZE = 48; 

function generateHive() {
  const gapX = HEX_SIZE * 2.1;
  const gapY = HEX_SIZE * 1.82;
  const rings = 2; // Reduced to 2 rings for a cleaner, focused layout
  const cells = [];

  const axialToPixel = (q, r) => ({
    x: gapX * (q + r * 0.5),
    y: gapY * r * 0.75,
  });

  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const s = -q - r;
      if (Math.abs(s) > rings) continue;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      const pos = axialToPixel(q, r);
      cells.push({ q, r, ring, x: pos.x, y: pos.y });
    }
  }

  // Sort so center is rendered last (on top)
  return cells.sort((a, b) => b.ring - a.ring);
}

const BOOT_DURATION = 2000; // Slightly longer for the cinematic draw effect
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_OUT_SINE = 'cubic-bezier(0.445, 0.05, 0.55, 0.95)';

export default function BootLoader({ onComplete }) {
  const hexCells = useMemo(() => generateHive(), []);
  const [alive, setAlive] = useState(false);
  const [exiting, setExiting] = useState(false);

  const skip = useCallback(() => {
    if (!exiting) {
      setExiting(true);
      setTimeout(() => { if (onComplete) onComplete(); }, 600);
    }
  }, [exiting, onComplete]);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAlive(true);
      });
    });

    const exitTimer = setTimeout(() => setExiting(true), BOOT_DURATION);
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, BOOT_DURATION + 600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const cellSize = HEX_SIZE * 2;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: BG_COLOR, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw', height: '100vh',
        background: `radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 50%)`,
        opacity: alive ? 1 : 0,
        transition: `opacity 1.5s ${EASE_OUT_EXPO}`,
        pointerEvents: 'none',
      }} />

      {/* SVG Definitions for Gradients */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="hexGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="hexGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hive container */}
      <div style={{ position: 'relative', width: 400, height: 400 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          {hexCells.map((cell, i) => {
            const isCenter = cell.ring === 0;
            // Delay based on ring + random jitter for an organic ripple effect
            const drawDelay = (cell.ring * 0.15) + (Math.random() * 0.1); 

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: cell.x, top: cell.y,
                  width: cellSize, height: cellSize,
                  opacity: alive ? 1 : 0,
                  transform: alive 
                    ? `translate(-50%, -50%) scale(1) rotate(0deg)` 
                    : `translate(-50%, -50%) scale(0.9) rotate(-5deg)`,
                  transition: `opacity 0.8s ${EASE_OUT_EXPO} ${drawDelay}s, transform 1.2s ${EASE_OUT_EXPO} ${drawDelay}s`,
                }}
              >
                <svg viewBox="0 0 44 44" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <polygon
                    points="22,2 40,12 40,32 22,42 4,32 4,12"
                    pathLength="100"
                    style={{
                      fill: isCenter ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      stroke: isCenter ? 'url(#hexGradPrimary)' : 'url(#hexGradSecondary)',
                      strokeWidth: isCenter ? 1.5 : 0.75,
                      strokeLinejoin: 'round',
                      strokeDasharray: '100',
                      strokeDashoffset: '100',
                      animation: alive
                        ? `drawHex 2.5s ${EASE_IN_OUT_SINE} ${drawDelay}s forwards`
                        : 'none',
                      filter: isCenter ? 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.6))' : 'none',
                    }}
                  />
                  {/* Inner glow polygon for center */}
                  {isCenter && (
                    <polygon
                      points="22,6 36,14 36,30 22,38 8,30 8,14"
                      style={{
                        fill: 'rgba(59, 130, 246, 0.15)',
                        opacity: alive ? 1 : 0,
                        transition: `opacity 1.5s ${EASE_OUT_EXPO} 0.8s`,
                        filter: 'blur(4px)',
                      }}
                    />
                  )}
                </svg>
              </div>
            );
          })}
        </div>

        {/* Center "D" */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 42, fontWeight: 300, // Thinner, larger font looks highly premium
            color: '#ffffff',
            textShadow: `0 0 24px rgba(59, 130, 246, 1)`,
            display: 'block',
            lineHeight: 1, 
            marginTop: '-4px', 
            marginLeft: '2px', 
            opacity: alive ? 1 : 0,
            transform: alive ? 'scale(1)' : 'scale(0.8)',
            filter: alive ? 'blur(0)' : 'blur(10px)',
            transition: `opacity 1s ${EASE_OUT_EXPO} 0.6s, transform 1s ${EASE_OUT_EXPO} 0.6s, filter 1s ${EASE_OUT_EXPO} 0.6s`,
          }}>
            D
          </span>
        </div>
      </div>

      {/* Brand name & Loading Bar */}
      <div style={{
        marginTop: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        opacity: alive ? 1 : 0,
        transform: alive ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 1.2s ${EASE_OUT_EXPO} 0.8s, transform 1.2s ${EASE_OUT_EXPO} 0.8s`,
      }}>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 22, fontWeight: 500,
          letterSpacing: '0.2em', // Super wide tracking for premium feel
          color: '#f4f4f5', margin: 0,
          textTransform: 'uppercase',
        }}>
          DSAstra
        </h1>
        
        {/* Animated Loading Bar */}
        <div style={{ width: 140, height: 1, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: '100%', background: 'url(#hexGradPrimary)',
            backgroundColor: HEX_COLOR,
            boxShadow: `0 0 10px ${HEX_COLOR}`,
            transform: alive ? 'translateX(0%)' : 'translateX(-100%)',
            transition: `transform ${BOOT_DURATION}ms linear`,
          }} />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes drawHex {
          0% { stroke-dashoffset: 100; fill: transparent; }
          40% { fill: transparent; }
          100% { stroke-dashoffset: 0; fill: rgba(59, 130, 246, 0.03); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01s !important; animation-duration: 0.01s !important; }
        }
      `}</style>
    </div>
  );
}
