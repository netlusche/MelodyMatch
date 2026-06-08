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

    // Initial sizing
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;

    if (isReducedMotion) {
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

    // 6. LCARS: Pulsing status blocks
    interface LcarsBlock {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      pulseSpeed: number;
      pulseOffset: number;
    }
    const lcarsBlocks: LcarsBlock[] = [];
    const lcarsColors = ['#ff9900', '#ffcc00', '#99ccff', '#cc99cc'];
    const initLcars = () => {
      lcarsBlocks.length = 0;
      // Generate block configs that will align dynamically in the draw loop
      for (let i = 0; i < 30; i++) {
        lcarsBlocks.push({
          x: 15,
          y: 0,
          w: 20,
          h: 25,
          color: lcarsColors[Math.floor(Math.random() * lcarsColors.length)],
          pulseSpeed: 0.001 + Math.random() * 0.002, // 10x slower, super calm pulse
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    };

    // 7. Frutiger Aero: Bubbles
    interface Bubble {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      wobble: number;
      wobbleSpd: number;
      color: string;
    }
    const bubbles: Bubble[] = [];
    const initBubbles = () => {
      bubbles.length = 0;
      const count = Math.min(25, Math.floor(cv.width / 50));
      for (let i = 0; i < count; i++) {
        bubbles.push(makeBubble(true));
      }
    };
    function makeBubble(randomY = false): Bubble {
      const bubbleColors = [
        'rgba(255, 255, 255, ',   // White
        'rgba(2, 168, 243, ',    // Sky Blue
        'rgba(118, 184, 42, ',   // Grass Green
        'rgba(0, 240, 255, '     // Cyan
      ];
      return {
        x: Math.random() * cv.width,
        y: randomY ? Math.random() * cv.height : cv.height + 25,
        vx: (Math.random() - 0.5) * 0.12,
        vy: - (0.04 + Math.random() * 0.08), // Even slower vertical drift for absolute calm
        r: 8 + Math.random() * 16, // Slightly larger bubbles for clarity
        alpha: 0.35 + Math.random() * 0.25, // Higher visibility but still transparent/glassy
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.003 + Math.random() * 0.007, // Slower wobble
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)]
      };
    }

    // 8. Heavy Metal: Smoke particles & Lightning
    interface SmokeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      decay: number;
      color: string;
    }
    const smokeParticles: SmokeParticle[] = [];
    const initSmoke = () => {
      smokeParticles.length = 0;
      const count = Math.min(25, Math.floor(cv.width / 40));
      for (let i = 0; i < count; i++) {
        smokeParticles.push(makeSmoke(true));
      }
    };
    function makeSmoke(randomY = false): SmokeParticle {
      const colors = ['rgba(35,35,35,', 'rgba(50,15,15,', 'rgba(15,15,15,'];
      return {
        x: Math.random() * cv.width,
        y: randomY ? Math.random() * cv.height : cv.height + 50,
        vx: (Math.random() - 0.5) * 0.15,
        vy: - (0.1 + Math.random() * 0.2), // Slower smoke
        r: 30 + Math.random() * 50,
        alpha: 0.08 + Math.random() * 0.16,
        decay: 0.0003 + Math.random() * 0.0005,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }
    let lightningTimer = 0;
    let activeLightning: {
      segments: { x: number; y: number }[];
      alpha: number;
    } | null = null;

    const generateLightning = () => {
      const startX = Math.random() * cv.width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * cv.width * 0.4;
      const endY = cv.height * (0.6 + Math.random() * 0.4);
      
      const segs = [{ x: startX, y: startY }];
      const count = 12;
      let currX = startX;
      let currY = startY;
      const dx = (endX - startX) / count;
      const dy = (endY - startY) / count;
      
      for (let i = 1; i < count; i++) {
        currX += dx + (Math.random() - 0.5) * 30;
        currY += dy;
        segs.push({ x: currX, y: currY });
      }
      segs.push({ x: endX, y: endY });
      
      activeLightning = {
        segments: segs,
        alpha: 0.8
      };
    };

    // 9. Post Punk: Wave offset
    let punkOffset = 0;

    // 10. Rock Legends: Dust motes
    interface DustMote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
    }
    const dustMotes: DustMote[] = [];
    const initDustMotes = () => {
      dustMotes.length = 0;
      const count = Math.min(25, Math.floor(cv.width / 40));
      for (let i = 0; i < count; i++) {
        dustMotes.push(makeDustMote(true));
      }
    };
    function makeDustMote(randomY = false): DustMote {
      return {
        x: Math.random() * cv.width,
        y: randomY ? Math.random() * cv.height : cv.height + 10,
        vx: (Math.random() - 0.5) * 0.2,
        vy: - (0.1 + Math.random() * 0.35),
        r: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5
      };
    }
    let spotlightAngle1 = 0;
    let spotlightAngle2 = 0;

    // Resize handler that dynamically recalculates boundaries and regenerates particles
    const resizeCanvas = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;

      if (theme === 'default') initOrbs();
      else if (theme === 'matrix') initMatrixLines();
      else if (theme === 'westeros') initEmbers();
      else if (theme === 'sakura') initPetals();
      else if (theme === 'lcars') initLcars();
      else if (theme === 'frutiger_aero') initBubbles();
      else if (theme === 'heavy_metal') initSmoke();
      else if (theme === 'rock_legends') initDustMotes();
    };

    // Initialize state on mount & register resize handler
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
 
        case 'lcars': {
          // Draw rounded LCARS elbow borders
          // Top-left elbow (orange)
          ctx.fillStyle = '#ff9900';
          ctx.beginPath();
          ctx.moveTo(150, 15);
          ctx.lineTo(50, 15);
          ctx.arc(50, 50, 35, 1.5 * Math.PI, Math.PI, true);
          ctx.lineTo(15, 120);
          ctx.lineTo(35, 120);
          ctx.lineTo(35, 50);
          ctx.arc(50, 50, 15, Math.PI, 1.5 * Math.PI, false);
          ctx.lineTo(150, 35);
          ctx.closePath();
          ctx.fill();

          // Bottom-left elbow (blue)
          ctx.fillStyle = '#99ccff';
          ctx.beginPath();
          ctx.moveTo(15, cv.height - 120);
          ctx.lineTo(15, cv.height - 50);
          ctx.arc(50, cv.height - 50, 35, Math.PI, 0.5 * Math.PI, true);
          ctx.lineTo(150, cv.height - 15);
          ctx.lineTo(150, cv.height - 35);
          ctx.lineTo(50, cv.height - 35);
          ctx.arc(50, cv.height - 50, 15, 0.5 * Math.PI, Math.PI, false);
          ctx.lineTo(35, cv.height - 120);
          ctx.closePath();
          ctx.fill();

          // Draw top horizontal bar segments (with rounded end caps)
          ctx.fillStyle = '#ffcc00'; // Yellow segment
          ctx.fillRect(155, 15, 125, 20);
          
          ctx.fillStyle = '#cc99cc'; // Purple segment with rounded end cap
          const topBar2End = cv.width - 25;
          ctx.beginPath();
          ctx.moveTo(285, 15);
          ctx.lineTo(topBar2End, 15);
          ctx.arc(topBar2End, 25, 10, 1.5 * Math.PI, 0.5 * Math.PI, false);
          ctx.lineTo(285, 35);
          ctx.closePath();
          ctx.fill();

          // Draw bottom horizontal bar segments (with rounded end caps)
          ctx.fillStyle = '#ff9900'; // Orange segment
          ctx.fillRect(155, cv.height - 35, 125, 20);
          
          ctx.fillStyle = '#99ccff'; // Blue segment with rounded end cap
          const botBar2End = cv.width - 25;
          ctx.beginPath();
          ctx.moveTo(285, cv.height - 35);
          ctx.lineTo(botBar2End, cv.height - 35);
          ctx.arc(botBar2End, cv.height - 25, 10, 1.5 * Math.PI, 0.5 * Math.PI, false);
          ctx.lineTo(285, cv.height - 15);
          ctx.closePath();
          ctx.fill();

          // Draw pulsing vertical segments in the left column
          const startY = 125;
          const endY = cv.height - 125;
          const availableHeight = endY - startY;
          const blockHeight = 25;
          const gap = 5;
          const blockSize = blockHeight + gap;
          const numBlocks = Math.floor(availableHeight / blockSize);

          for (let i = 0; i < numBlocks; i++) {
            const b = lcarsBlocks[i % lcarsBlocks.length];
            const y = startY + i * blockSize;
            const alpha = 0.45 + Math.sin(Date.now() * b.pulseSpeed + b.pulseOffset) * 0.2; // Smooth and very calm pulsing
            ctx.fillStyle = b.color;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillRect(15, y, 20, blockHeight);
            ctx.restore();
          }
          break;
        }

        case 'frutiger_aero': {
          bubbles.forEach((b, idx) => {
            b.y += b.vy;
            b.wobble += b.wobbleSpd;
            b.x += b.vx + Math.sin(b.wobble) * 0.25;

            if (b.y < -b.r || b.x < -b.r || b.x > cv.width + b.r) {
              bubbles[idx] = makeBubble(false);
            } else {
              ctx.save();
              ctx.globalAlpha = b.alpha;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Brighter glassy outline
              ctx.lineWidth = 1;
              
              const baseColor = b.color; // e.g. 'rgba(2, 168, 243, '
              const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
              grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
              grad.addColorStop(0.6, baseColor + '0.35)');
              grad.addColorStop(1, baseColor + '0.15)');
              ctx.fillStyle = grad;
              
              // Soft background glow shadow for each bubble to stand out on light themes
              ctx.shadowColor = 'rgba(2, 168, 243, 0.12)';
              ctx.shadowBlur = 8;
              
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Gloss crescent highlight
              ctx.shadowBlur = 0; // Turn off shadow for crisp gloss highlight
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.beginPath();
              ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.restore();
            }
          });
          break;
        }

        case 'synthwave': {
          const horizon = cv.height * 0.65;
          const centerX = cv.width / 2;

          // Draw the glowing sun
          const sunRadius = Math.min(120, cv.width * 0.28);
          const sunY = horizon;
          const sunGrad = ctx.createLinearGradient(centerX, sunY - sunRadius, centerX, sunY);
          sunGrad.addColorStop(0, '#f9ea04'); // Yellow top
          sunGrad.addColorStop(0.5, '#ff007f'); // Hot pink middle
          sunGrad.addColorStop(1, '#670394'); // Deep purple base

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, sunY, sunRadius, Math.PI, 0, false);
          ctx.fillStyle = sunGrad;
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 40;
          ctx.fill();
          ctx.restore();

          // Cut horizontal lines into the sun
          ctx.fillStyle = '#0d0216'; // background color
          let cutY = sunY - sunRadius + 20;
          let cutH = 2;
          while (cutY < sunY) {
            ctx.fillRect(centerX - sunRadius - 10, cutY, sunRadius * 2 + 20, cutH);
            cutY += 12;
            cutH += 1.0;
          }

          // Draw grid lines
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          ctx.lineWidth = 1.5;
          gridOffset += 0.35;
          if (gridOffset >= 40) gridOffset = 0;

          const lineCount = 18;
          for (let i = 0; i <= lineCount; i++) {
            const ratio = i / lineCount;
            const xVal = ratio * cv.width * 2 - cv.width / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, horizon);
            ctx.lineTo(xVal, cv.height);
            ctx.stroke();
          }

          let gy = horizon;
          let spacing = 8;
          while (gy < cv.height) {
            gy += spacing;
            spacing *= 1.22;
            const scrolledY = gy + gridOffset * (spacing / 40);
            if (scrolledY >= horizon && scrolledY <= cv.height) {
              ctx.beginPath();
              ctx.moveTo(0, scrolledY);
              ctx.lineTo(cv.width, scrolledY);
              ctx.stroke();
            }
          }
          break;
        }

        case 'heavy_metal': {
          smokeParticles.forEach((p, idx) => {
            p.y += p.vy;
            p.x += p.vx;
            p.alpha -= p.decay;

            if (p.alpha <= 0.01 || p.y < -p.r) {
              smokeParticles[idx] = makeSmoke(false);
            } else {
              ctx.beginPath();
              const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
              grad.addColorStop(0, `${p.color}${p.alpha})`);
              grad.addColorStop(1, `${p.color}0)`);
              ctx.fillStyle = grad;
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          // Calm and atmospheric lightning strikes (no fullscreen flash)
          lightningTimer++;
          if (activeLightning) {
            ctx.save();
            ctx.strokeStyle = `rgba(180, 200, 255, ${activeLightning.alpha})`;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(100, 150, 255, 0.6)';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.moveTo(activeLightning.segments[0].x, activeLightning.segments[0].y);
            for (let i = 1; i < activeLightning.segments.length; i++) {
              ctx.lineTo(activeLightning.segments[i].x, activeLightning.segments[i].y);
            }
            ctx.stroke();
            
            // Add a secondary inner white core line for intensity
            ctx.strokeStyle = `rgba(255, 255, 255, ${activeLightning.alpha})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.restore();

            activeLightning.alpha -= 0.03; // Slower decay for a calm look
            if (activeLightning.alpha <= 0) {
              activeLightning = null;
            }
          } else if (lightningTimer > 350 && Math.random() < 0.0025) { // Triggers rarely and gently
            generateLightning();
            lightningTimer = 0;
          }
          break;
        }

        case 'post_punk': {
          punkOffset += 0.012;
          ctx.lineWidth = 1.5;

          const waveCount = 4;
          const waveColors = [
            'rgba(255, 255, 255, 0.12)',
            'rgba(114, 114, 120, 0.08)',
            'rgba(255, 255, 255, 0.06)',
            'rgba(127, 0, 0, 0.08)'
          ];

          for (let w = 0; w < waveCount; w++) {
            ctx.strokeStyle = waveColors[w];
            ctx.beginPath();
            
            const baseHeight = cv.height * (0.4 + w * 0.1);
            const amplitude = 15 + w * 12;
            const frequency = 0.003 + w * 0.002;
            const speed = punkOffset * (1 + w * 0.25);

            for (let x = 0; x < cv.width; x += 10) {
              const yVal = baseHeight + Math.sin(x * frequency + speed) * amplitude * Math.cos(x * 0.0005);
              if (x === 0) ctx.moveTo(x, yVal);
              else ctx.lineTo(x, yVal);
            }
            ctx.stroke();
          }
          break;
        }

        case 'rock_legends': {
          spotlightAngle1 += 0.0025;
          spotlightAngle2 += 0.002;

          const angle1 = Math.PI / 4 + Math.sin(spotlightAngle1) * (Math.PI / 10);
          const angle2 = Math.PI * 3/4 + Math.cos(spotlightAngle2) * (Math.PI / 10);

          ctx.save();
          const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, cv.height);
          grad1.addColorStop(0, 'rgba(255, 170, 0, 0.15)');
          grad1.addColorStop(0.4, 'rgba(255, 170, 0, 0.06)');
          grad1.addColorStop(1, 'rgba(255, 170, 0, 0)');
          ctx.fillStyle = grad1;
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, cv.height * 1.2, angle1 - 0.2, angle1 + 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.save();
          const grad2 = ctx.createRadialGradient(cv.width, 0, 0, cv.width, 0, cv.height);
          grad2.addColorStop(0, 'rgba(255, 85, 0, 0.12)');
          grad2.addColorStop(0.4, 'rgba(255, 85, 0, 0.04)');
          grad2.addColorStop(1, 'rgba(255, 85, 0, 0)');
          ctx.fillStyle = grad2;

          ctx.beginPath();
          ctx.moveTo(cv.width, 0);
          ctx.arc(cv.width, 0, cv.height * 1.2, angle2 - 0.2, angle2 + 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          dustMotes.forEach((m, idx) => {
            m.y += m.vy;
            m.x += m.vx;
            if (m.y < -10 || m.x < -10 || m.x > cv.width + 10) {
              dustMotes[idx] = makeDustMote(false);
            } else {
              ctx.beginPath();
              ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 200, 50, ${m.alpha})`;
              ctx.fill();
            }
          });
          break;
        }

        case 'kraftwerk': {
          ctx.strokeStyle = 'rgba(255, 0, 51, 0.035)'; // Red grid (no green)
          ctx.lineWidth = 0.5;
          const gridSize = 40;
          for (let x = 0; x < cv.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cv.height);
            ctx.stroke();
          }
          for (let y = 0; y < cv.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(cv.width, y);
            ctx.stroke();
          }

          const barWidth = 6;
          const barGap = 4;
          const totalBars = Math.floor(cv.width / (barWidth + barGap));
          ctx.save();
          
          for (let i = 0; i < totalBars; i++) {
            const time = Date.now() * 0.003;
            const wave1 = Math.sin(i * 0.05 + time) * 0.5 + 0.5;
            const wave2 = Math.cos(i * 0.12 - time * 0.8) * 0.5 + 0.5;
            const wave3 = Math.sin(i * 0.3 + time * 1.5) * 0.3 + 0.3;
            const rawHeight = (wave1 * 0.4 + wave2 * 0.4 + wave3 * 0.2) * (cv.height * 0.16);
            const height = Math.max(4, rawHeight);
            
            const x = i * (barWidth + barGap);
            const y = cv.height - height;

            // Pure red & white gradient inspired by the Man Machine album cover
            const grad = ctx.createLinearGradient(x, cv.height, x, y);
            grad.addColorStop(0, 'rgba(30, 0, 5, 0.15)');
            grad.addColorStop(0.5, 'rgba(255, 0, 51, 0.25)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.35)');

            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, height);
          }
          ctx.restore();
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
