import React, { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';

export const BackgroundEffects: React.FC = () => {
  const { state } = useGame();
  const theme = state.theme || 'default';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cv = canvas;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let rafId: number | null = null;
    let animationActive = true;

    // Check prefers-reduced-motion
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Resize handler
    const resizeCanvas = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (isReducedMotion) {
      window.removeEventListener('resize', resizeCanvas);
      return;
    }

    // --- ANIMATION TYPES & SETUP ---

    // 1. Default / Neon Party: Drifting neon bubbles/orbs
    interface Orb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }
    const orbs: Orb[] = [];
    const colors = [
      'rgba(139, 92, 246, 0.08)',
      'rgba(236, 72, 153, 0.08)',
      'rgba(16, 185, 129, 0.06)',
      'rgba(6, 182, 212, 0.06)'
    ];
    const initOrbs = () => {
      orbs.length = 0;
      const count = Math.min(15, Math.floor(cv.width / 70));
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * colors.length);
        orbs.push({
          x: Math.random() * cv.width,
          y: Math.random() * cv.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 40 + Math.random() * 70,
          color: colors[idx]
        });
      }
    };

    // 2. Matrix: Floating digital rain code segments
    interface MatrixLine {
      x: number;
      y: number;
      speed: number;
      chars: string[];
      opacity: number;
    }
    const matrixLines: MatrixLine[] = [];
    const MATRIX_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*+-=';
    const initMatrixLines = () => {
      matrixLines.length = 0;
      const cols = Math.floor(cv.width / 20); // More columns (more letters)
      for (let i = 0; i < cols; i++) {
        matrixLines.push({
          x: i * 20 + 6,
          y: Math.random() * -cv.height,
          speed: 0.35 + Math.random() * 0.65, // Slower speed
          chars: Array.from({ length: 5 + Math.floor(Math.random() * 8) }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
          opacity: 0.08 + Math.random() * 0.16
        });
      }
    };

    // 3. Vaporwave: Grid line animation & drifting polygons
    let gridOffset = 0;

    // 4. Westeros: Floating embers (Warm orange fire sparks)
    interface Ember {
      x: number;
      y: number;
      r: number;
      speedY: number;
      speedX: number;
      wobble: number;
      wobbleSpd: number;
      alpha: number;
      hue: number;
    }
    const embers: Ember[] = [];
    const initEmbers = () => {
      embers.length = 0;
      const count = Math.min(30, Math.floor(cv.width / 40));
      for (let i = 0; i < count; i++) {
        embers.push(makeEmber(true));
      }
    };
    function makeEmber(randomY = false): Ember {
      return {
        x: Math.random() * cv.width,
        y: randomY ? Math.random() * cv.height : cv.height + 10,
        r: 0.8 + Math.random() * 2.2,
        speedY: 0.1 + Math.random() * 0.2, // Significantly slower vertical speed
        speedX: (Math.random() - 0.5) * 0.1, // Slower horizontal speed
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.01 + Math.random() * 0.015, // Slower wobble
        alpha: 0.3 + Math.random() * 0.5,
        hue: 14 + Math.random() * 22
      };
    }

    // 5. Sakura: Falling cherry blossoms
    interface Petal {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpd: number;
      wobble: number;
      wobbleSpd: number;
      alpha: number;
    }
    const petals: Petal[] = [];
    const initPetals = () => {
      petals.length = 0;
      const count = Math.min(30, Math.floor(cv.width / 40));
      for (let i = 0; i < count; i++) {
        petals.push(makePetal(true));
      }
    };
    function makePetal(randomY = false): Petal {
      return {
        x: Math.random() * cv.width,
        y: randomY ? Math.random() * cv.height : -16,
        size: 5 + Math.random() * 8,
        speedY: 0.3 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.025,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.012 + Math.random() * 0.018,
        alpha: 0.3 + Math.random() * 0.45
      };
    }

    // Initialize state (Plain Dark has no initialized particles)
    if (theme === 'default') initOrbs();
    else if (theme === 'matrix') initMatrixLines();
    else if (theme === 'westeros') initEmbers();
    else if (theme === 'sakura') initPetals();

    // Loop
    const draw = () => {
      if (!animationActive) return;

      // Clear with correct overlay or clearing method
      if (theme === 'matrix') {
        ctx.fillStyle = 'rgba(0, 3, 0, 0.25)'; // Matrix style fading black background overlay
        ctx.fillRect(0, 0, cv.width, cv.height);
      } else {
        ctx.clearRect(0, 0, cv.width, cv.height);
      }

      switch (theme) {
        case 'default': {
          orbs.forEach(orb => {
            orb.x += orb.vx;
            orb.y += orb.vy;

            // Bounce
            if (orb.x - orb.r < 0 || orb.x + orb.r > cv.width) orb.vx *= -1;
            if (orb.y - orb.r < 0 || orb.y + orb.r > cv.height) orb.vy *= -1;

            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
          });
          break;
        }

        case 'matrix': {
          ctx.font = '11px monospace';
          matrixLines.forEach(line => {
            line.y += line.speed;
            if (line.y > cv.height) {
              line.y = -50 - Math.random() * 100;
              line.speed = 0.35 + Math.random() * 0.65;
            }

            line.chars.forEach((char, idx) => {
              const charY = line.y - idx * 16;
              if (charY > 0 && charY < cv.height) {
                // Green color theme (0, 255, 65)
                ctx.fillStyle = `rgba(0, 255, 65, ${line.opacity * (1 - idx / line.chars.length)})`;
                ctx.fillText(char, line.x, charY);
              }
            });
          });
          break;
        }

        case 'vaporwave': {
          ctx.strokeStyle = 'rgba(255, 113, 206, 0.1)';
          ctx.lineWidth = 1.2;
          gridOffset += 0.15; // Significantly slower speed (down from 0.6)
          if (gridOffset >= 40) gridOffset = 0;

          const horizon = cv.height * 0.65;
          const centerX = cv.width / 2;
          const lineCount = 16;
          for (let i = 0; i <= lineCount; i++) {
            const ratio = i / lineCount;
            const xVal = ratio * cv.width * 2 - cv.width / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, horizon);
            ctx.lineTo(xVal, cv.height);
            ctx.stroke();
          }

          let y = horizon;
          let spacing = 8;
          while (y < cv.height) {
            y += spacing;
            spacing *= 1.22;
            const scrolledY = y + gridOffset * (spacing / 40);
            if (scrolledY >= horizon && scrolledY <= cv.height) {
              ctx.beginPath();
              ctx.moveTo(0, scrolledY);
              ctx.lineTo(cv.width, scrolledY);
              ctx.stroke();
            }
          }
          break;
        }

        case 'westeros': {
          embers.forEach((e, idx) => {
            e.y -= e.speedY;
            e.wobble += e.wobbleSpd;
            e.x += e.speedX + Math.sin(e.wobble) * 0.3;
            e.alpha -= 0.0004; // Slower alpha decay to match slower speed

            if (e.y < -10 || e.alpha <= 0.02) {
              embers[idx] = makeEmber(false);
            } else {
              const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 35);
              grd.addColorStop(0, `hsla(${e.hue}, 95%, 60%, ${e.alpha * 0.08})`);
              grd.addColorStop(1, `hsla(${e.hue}, 95%, 60%, 0)`);
              ctx.beginPath();
              ctx.arc(e.x, e.y, e.r * 35, 0, Math.PI * 2);
              ctx.fillStyle = grd;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${e.hue}, 100%, 88%, ${Math.min(e.alpha * 1.3, 1)})`;
              ctx.fill();
            }
          });
          break;
        }

        case 'sakura': {
          for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            p.y += p.speedY;
            p.wobble += p.wobbleSpd;
            p.rotation += p.rotSpd;
            p.x += p.speedX + Math.sin(p.wobble) * 0.35;

            if (p.y > cv.height + 20) {
              petals[i] = makePetal(false);
            } else {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rotation);
              ctx.globalAlpha = p.alpha;
              ctx.beginPath();
              ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'hsl(338, 80%, 88%)';
              ctx.fill();
              ctx.restore();
            }
          }
          break;
        }

        default:
          break;
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      animationActive = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};
