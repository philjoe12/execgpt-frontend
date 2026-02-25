'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Particle {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const nodes: Node[] = [];
    const particles: Particle[] = [];
    const CONNECTION_DISTANCE = 160;
    const NODE_COUNT = 50;
    const PARTICLE_COUNT = 20;

    function resize() {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initNodes() {
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
        });
      }
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          fromNode: Math.floor(Math.random() * NODE_COUNT),
          toNode: Math.floor(Math.random() * NODE_COUNT),
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.005,
        });
      }
    }

    function updateNodes() {
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      }
    }

    function updateParticles() {
      for (const p of particles) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.fromNode = p.toNode;
          p.toNode = Math.floor(Math.random() * NODE_COUNT);
          p.progress = 0;
        }
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i]!.x - nodes[j]!.x;
          const dy = nodes[i]!.y - nodes[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(nodes[i]!.x, nodes[i]!.y);
            ctx.lineTo(nodes[j]!.x, nodes[j]!.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw traveling particles
      for (const p of particles) {
        const from = nodes[p.fromNode];
        const to = nodes[p.toNode];
        if (!from || !to) continue;
        const x = from.x + (to.x - from.x) * p.progress;
        const y = from.y + (to.y - from.y) * p.progress;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        ctx.beginPath();
        ctx.fillStyle = 'rgba(96, 165, 250, 0.15)';
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      updateNodes();
      updateParticles();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    }

    resize();
    initNodes();
    initParticles();
    animate();

    const handleResize = () => {
      resize();
      initNodes();
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      {/* Floating pulse rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border border-blue-400/10 animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full border border-blue-300/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full border border-blue-500/5 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>
    </>
  );
}
