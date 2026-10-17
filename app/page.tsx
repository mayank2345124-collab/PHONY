'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  calculateBatteryEstimate,
  comparePhoneSpecs,
  PHONY_DEVICES,
  BatteryUsageFactors
} from '@/lib/phony-logic';

export default function PhonyLaunchPage() {
  // --- Loading Screen State ---
  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);

  // --- Scroll Progress State ---
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Custom Cursor State ---
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  // --- Hero 3D Tilt State ---
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0, isHovered: false });
  const [liveClock, setLiveClock] = useState('09:41');

  // --- Specs Strip Count-Up Trigger ---
  const [hasCountedSpecs, setHasCountedSpecs] = useState(false);
  const [specCounts, setSpecCounts] = useState({ nits: 0, ghz: '0.00', min: 0, sec: '0.00' });
  const specsStripRef = useRef<HTMLDivElement | null>(null);

  // --- Product Lineup State ---
  const [activeCurrency, setActiveCurrency] = useState<{ symbol: string; rate: number; name: string }>({
    symbol: '$',
    rate: 1,
    name: 'USD'
  });
  const [deviceColors, setDeviceColors] = useState<Record<string, { name: string; hex: string }>>({
    'x1-pro': { name: 'Cyber Cyan', hex: '#00e5ff' },
    'x1': { name: 'Neon Violet', hex: '#7c4dff' },
    'lite': { name: 'Titanium Frost', hex: '#e2e8f0' }
  });

  // --- Tech Tabs State ---
  const [activeTechTab, setActiveTechTab] = useState<'chip' | 'camera' | 'charge' | 'display'>('chip');
  const [camMode, setCamMode] = useState<'night' | 'zoom' | 'hdr'>('night');
  const [flashCharging, setFlashCharging] = useState(false);
  const [flashChargePct, setFlashChargePct] = useState(25);
  const [flashChargeTemp, setFlashChargeTemp] = useState(31.4);
  const [displayHz, setDisplayHz] = useState<60 | 120 | 144>(144);

  // --- Comparison Tool State ---
  const [compDevA, setCompDevA] = useState('x1-pro');
  const [compDevB, setCompDevB] = useState('x1');

  // --- Specs Table Accordion State ---
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    display: true,
    chip: false,
    camera: false,
    power: false
  });

  // --- Battery Calculator State ---
  const [calcFactors, setCalcFactors] = useState<BatteryUsageFactors>({
    gamingHours: 2.5,
    streamingHours: 4.0,
    brightnessPct: 70,
    network5G: false,
    refreshRate: 144,
    batteryCapacityMah: 5400
  });

  // --- Reviews Carousel State ---
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // --- Newsletter State ---
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // --- Audio Ambience Synth State ---
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneNodeRef = useRef<OscillatorNode | null>(null);

  // Canvas Refs
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Initial Loader & Clock
  useEffect(() => {
    // Check for autostart parameter for fast test verification
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setLoadPct(100);
      setLoading(false);
      return;
    }

    const interval = setInterval(() => {
      setLoadPct(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 350);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 40);

    const clockInterval = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setLiveClock(`${h}:${m}`);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  // 2. Scroll Progress & Nav Blur
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setScrollProgress((current / (totalScroll || 1)) * 100);
      setIsNavScrolled(current > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Custom Cursor Tracking
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId: number;
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;

    const loop = () => {
      rx += (cursorPos.x - rx) * 0.18;
      ry += (cursorPos.y - ry) * 0.18;
      setRingPos({ x: rx, y: ry });
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [cursorPos.x, cursorPos.y]);

  // 4. Background Particle Canvas
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const count = window.innerWidth < 768 ? 20 : 45;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.5 + 1,
      color: Math.random() > 0.4 ? 'rgba(0, 229, 255,' : 'rgba(124, 77, 255,'
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.7)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 5. Specs Count-Up Intersection Observer
  useEffect(() => {
    const el = specsStripRef.current;
    if (!el || hasCountedSpecs) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasCountedSpecs) {
        setHasCountedSpecs(true);
        const startTime = performance.now();
        const duration = 1600;

        const step = (now: number) => {
          const elapsed = now - startTime;
          const p = Math.min(elapsed / duration, 1);
          const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);

          setSpecCounts({
            nits: Math.round(3000 * ease),
            ghz: (3.85 * ease).toFixed(2),
            min: Math.round(14 * ease),
            sec: (0.08 * ease).toFixed(2)
          });

          if (p < 1) requestAnimationFrame(step);
          else {
            setSpecCounts({ nits: 3000, ghz: '3.85', min: 14, sec: '0.08' });
          }
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.25 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasCountedSpecs]);

  // 6. Display Waveform Canvas Animation
  useEffect(() => {
    if (activeTechTab !== 'display') return;
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#00e5ff';

      const cycles = displayHz / 20;
      for (let x = 0; x < canvas.width; x++) {
        const y = 120 + Math.sin((x / canvas.width) * Math.PI * cycles + offset) * 45;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset += (displayHz / 144) * 0.14;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [activeTechTab, displayHz]);

  // 7. Testimonials Auto-Timer
  const reviewsList = [
    {
      quote: "The PHONY X1 Pro doesn't just push the envelope; it vaporizes it. The 144Hz display and 3nm Quantum silicon feel like something from 2030.",
      author: "Alex Sterling",
      outlet: "WIRED GEAR",
      rating: 5
    },
    {
      quote: "150W charging is life-altering. Plugged it in with 5%, went to pour a cup of espresso, and came back to 78%. Game completely over for traditional flagships.",
      author: "Marcus Chen",
      outlet: "TECHRADAR PRO",
      rating: 5
    },
    {
      quote: "Zero shutter lag on a 200MP sensor should be physically impossible. The computational optics are sheer magic.",
      author: "Elena Rostova",
      outlet: "THE VERGE EDITORS",
      rating: 5
    },
    {
      quote: "Easily the most visceral, alive-feeling piece of industrial design since the original smartphone revolution.",
      author: "Darius Vance",
      outlet: "CYBERPUNK DAILY",
      rating: 5
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewIndex(prev => (prev + 1) % reviewsList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reviewsList.length]);

  // 8. Audio Synth Toggle
  const toggleAudioAmbience = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!audioPlaying) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      droneNodeRef.current = osc;
      setAudioPlaying(true);
    } else {
      if (droneNodeRef.current) {
        droneNodeRef.current.stop();
        droneNodeRef.current = null;
      }
      setAudioPlaying(false);
    }
  };

  // 9. Newsletter Submission
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail || !emailRegex.test(newsletterEmail)) {
      setNewsletterError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setNewsletterError(false);
    setNewsletterSuccess(true);
  };

  // 10. Flash Charge Trigger
  const handleFlashCharge = () => {
    if (flashCharging) return;
    setFlashCharging(true);
    let pct = 25;
    let temp = 31.4;

    const interval = setInterval(() => {
      pct += 2;
      temp += 0.12;
      if (pct >= 65) {
        pct = 65;
        temp = 34.0;
        clearInterval(interval);
        setFlashCharging(false);
      }
      setFlashChargePct(pct);
      setFlashChargeTemp(temp);
    }, 75);
  };

  // Battery calculations using pure logic
  const batteryCalcResult = calculateBatteryEstimate(calcFactors);
  const comparisonMap = comparePhoneSpecs(compDevA, compDevB);
  const deviceA = PHONY_DEVICES[compDevA] || PHONY_DEVICES['x1-pro'];
  const deviceB = PHONY_DEVICES[compDevB] || PHONY_DEVICES['x1'];

  return (
    <div
      className={`min-h-screen bg-[#07080c] text-[#f8fafc] font-sans antialiased relative selection:bg-[#00e5ff]/30 selection:text-white ${isHovering ? 'cursor-hover' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* ======================================================================
          SECTION 0: LOADING SCREEN (SVG STROKE DRAW + PROGRESS)
          ====================================================================== */}
      {loading && (
        <div
          id="loader-screen"
          className="fixed inset-0 bg-[#040508] z-[100000] flex flex-col items-center justify-center transition-all duration-700 ease-out"
          style={{ opacity: loadPct >= 100 ? 0 : 1, pointerEvents: loadPct >= 100 ? 'none' : 'auto' }}
        >
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-[-10px] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.3)_0%,transparent_70%)] blur-xl"></div>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="relative z-10">
              <polygon points="60,6 108,33 108,87 60,114 12,87 12,33" stroke="rgba(0,229,255,0.25)" strokeWidth="2" fill="none" />
              <path
                className="logo-stroke-draw"
                d="M38 90 V30 H64 C76 30, 84 37, 84 48 C84 59, 76 66, 64 66 H38 M64 66 L86 90"
                stroke="url(#reactLoaderGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="reactLoaderGrad" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00e5ff" />
                  <stop offset="1" stopColor="#7c4dff" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-4 font-heading tracking-[0.35em] text-xl font-extrabold text-white text-indent-[0.35em]">
            P H O N Y
          </div>
          <div className="font-mono-spec text-[11px] tracking-widest text-[#00e5ff] mt-1 uppercase">
            Initializing Neural Subsystems...
          </div>

          <div className="w-60 h-1 bg-white/10 rounded-full overflow-hidden relative mt-6">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] shadow-[0_0_12px_#00e5ff] transition-all duration-75"
              style={{ width: `${loadPct}%` }}
            ></div>
          </div>
          <div className="font-mono-spec text-xs text-[#94a3b8] mt-2.5">{loadPct}%</div>

          <button
            onClick={() => setLoading(false)}
            className="mt-6 bg-transparent border border-white/20 text-[#94a3b8] hover:text-white hover:border-[#00e5ff] font-mono-spec text-xs px-4 py-1.5 rounded-full transition-all cursor-pointer"
          >
            Skip Intro →
          </button>
        </div>
      )}

      {/* ======================================================================
          CUSTOM CURSOR & SCROLL PROGRESS BAR
          ====================================================================== */}
      <div
        className="custom-cursor-dot pointer-events-none hidden md:block"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
      <div
        className="custom-cursor-ring pointer-events-none hidden md:block"
        style={{ left: `${ringPos.x}px`, top: `${ringPos.y}px` }}
      />
      <div className="scroll-progress-line" style={{ width: `${scrollProgress}%` }} />

      {/* ======================================================================
          ANIMATED BACKGROUND: PERSPECTIVE 3D GRID & CANVAS PARTICLES
          ====================================================================== */}
      <div className="perspective-grid-container">
        <div className="perspective-grid"></div>
      </div>
      <canvas ref={particleCanvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Ambient Lighting Orbs */}
      <div className="ambient-glow-cyan left-[-150px] top-[-100px]" />
      <div className="ambient-glow-violet right-[-200px] top-[35%]" />

      {/* ======================================================================
          SECTION 1: STICKY NAVBAR (SHRINKS & BLURS ON SCROLL)
          ====================================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center justify-between px-6 md:px-10 ${
          isNavScrolled
            ? 'py-3.5 bg-[#07080c]/85 backdrop-blur-xl border-b border-[#00e5ff]/15'
            : 'py-6 bg-transparent'
        }`}
      >
        <a href="#" className="flex items-center gap-3 no-underline text-white group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5ff]/20 to-[#7c4dff]/20 border border-[#00e5ff]/40 flex items-center justify-center shadow-[0_0_16px_rgba(0,229,255,0.3)] group-hover:scale-105 transition-transform">
            <span className="font-heading font-black text-[#00e5ff] text-base">Ψ</span>
          </div>
          <div>
            <div className="font-heading font-black tracking-[0.28em] text-lg leading-none text-white">PHONY</div>
            <div className="font-mono-spec text-[8px] tracking-[0.2em] text-[#00e5ff] uppercase">Engineered to Feel Alive</div>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {['Overview', 'Lineup', 'Technology', 'Compare', 'Battery Lab', 'Specs'].map((item, idx) => {
            const href = `#${item.toLowerCase().replace(' ', '-')}`;
            return (
              <a
                key={idx}
                href={href}
                className="text-[#94a3b8] hover:text-white hover:text-shadow-[0_0_10px_#00e5ff] text-xs uppercase tracking-wider font-mono-spec transition-colors"
              >
                {item}
              </a>
            );
          })}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-3.5">
          {/* Ambient Sound Drone Synth */}
          <button
            onClick={toggleAudioAmbience}
            aria-label="Toggle Cyber Sound Atmosphere"
            title="Toggle Ambient Audio Synth"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              audioPlaying
                ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_12px_#00e5ff]'
                : 'bg-white/5 border-white/10 text-[#94a3b8] hover:text-white'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>

          {/* Standalone HTML Direct Download */}
          <a
            href="/phony-launch.html"
            download="phony-launch.html"
            title="Download Standalone Single-File HTML"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-[#00e5ff]/15 border border-white/10 hover:border-[#00e5ff] text-xs font-mono-spec text-[#94a3b8] hover:text-white transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            HTML
          </a>

          {/* Pre-order CTA */}
          <a
            href="#lineup"
            className="shimmer-btn px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] text-[#07080c] font-heading font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105 transition-all"
          >
            Pre-Order
          </a>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 text-white cursor-pointer z-50"
          >
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#07080c]/98 backdrop-blur-2xl z-40 flex flex-col items-center justify-center gap-8 lg:hidden animate-fade-in">
          {['Overview', 'Lineup', 'Technology', 'Compare', 'Battery Lab', 'Specs'].map((item, idx) => (
            <a
              key={idx}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-heading text-2xl font-bold tracking-wider text-white hover:text-[#00e5ff] transition-colors"
            >
              {item}
            </a>
          ))}
          <a
            href="/phony-launch.html"
            download="phony-launch.html"
            className="mt-4 px-6 py-3 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff] text-[#00e5ff] font-mono-spec text-sm"
          >
            Download Standalone Single-File HTML
          </a>
        </div>
      )}

      <main className="relative z-10">
        {/* ====================================================================
            SECTION 2: HERO SECTION WITH 3D PHONE, GLITCH TITLE & ORBITS
            ==================================================================== */}
        <section id="hero" className="min-h-screen pt-36 pb-20 px-6 flex items-center justify-center relative">
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            
            {/* Left Content */}
            <div className="reveal-visible space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] animate-ping" />
                <span className="font-mono-spec text-[11px] tracking-widest text-[#00e5ff] uppercase">
                  Worldwide Keynote Launch 2026
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                <span>ENGINEERED TO FEEL</span><br />
                <span
                  className="glitch-text font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00e5ff] to-[#7c4dff]"
                  data-text="ALIVE."
                >
                  ALIVE.
                </span>
              </h1>

              <p className="text-[#94a3b8] text-base sm:text-lg max-w-xl leading-relaxed">
                Forged with 3nm Quantum X9 neural silicon, a liquid-reactive 144Hz OLED, and a 200MP bio-optic sensor. The world’s first smartphone crafted not just to calculate, but to respond.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#lineup"
                  className="shimmer-btn px-8 py-4 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] text-[#07080c] font-heading font-extrabold text-sm tracking-wide uppercase shadow-[0_0_28px_rgba(0,229,255,0.45)] hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  Explore the X1 Series
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>

                <a
                  href="#tech"
                  className="px-6 py-4 rounded-xl bg-white/5 border border-white/15 text-white font-semibold text-sm hover:border-[#00e5ff] transition-all inline-flex items-center gap-2.5"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8" fill="#00e5ff"></polygon>
                  </svg>
                  Hardware Architecture
                </a>
              </div>

              {/* Quick specs strip */}
              <div className="flex items-center gap-7 pt-8 border-t border-white/10">
                <div>
                  <div className="font-heading text-2xl font-black text-white">3nm</div>
                  <div className="font-mono-spec text-[11px] text-[#00e5ff] uppercase">Quantum X9</div>
                </div>
                <div className="w-px h-10 bg-white/15" />
                <div>
                  <div className="font-heading text-2xl font-black text-white">200 MP</div>
                  <div className="font-mono-spec text-[11px] text-[#7c4dff] uppercase">Bio-Optics</div>
                </div>
                <div className="w-px h-10 bg-white/15" />
                <div>
                  <div className="font-heading text-2xl font-black text-white">150 W</div>
                  <div className="font-mono-spec text-[11px] text-[#ec4899] uppercase">HyperCharge</div>
                </div>
              </div>
            </div>

            {/* Right: 3D Phone Mockup Stage */}
            <div
              className="phone-viewport relative min-h-[580px] flex items-center justify-center"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                setHeroTilt({
                  x: -(y / (rect.height / 2)) * 18,
                  y: (x / (rect.width / 2)) * 18,
                  isHovered: true
                });
              }}
              onMouseLeave={() => setHeroTilt({ x: 0, y: 0, isHovered: false })}
            >
              {/* Rotating Conic Gradient Halo */}
              <div className="halo-conic" />

              {/* Orbiting Dashed Rings */}
              <div className="orbit-ring w-[460px] h-[460px]" />
              <div className="orbit-ring orbit-ring-reverse w-[540px] h-[540px]" />

              {/* Floating Spec Chips */}
              <div className="glass-card floating-chip absolute top-[12%] -left-4 px-4 py-2.5 rounded-2xl z-20 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
                <div>
                  <div className="font-mono-spec text-xs font-bold text-white">200MP Quad-Matrix</div>
                  <div className="text-[10px] text-[#94a3b8]">1/1.12" Sensor • OIS</div>
                </div>
              </div>

              <div className="glass-card floating-chip floating-chip-delay-1 absolute bottom-[18%] -right-4 px-4 py-2.5 rounded-2xl z-20 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ec4899] shadow-[0_0_8px_#ec4899]" />
                <div>
                  <div className="font-mono-spec text-xs font-bold text-white">150W Cryo-Pulse</div>
                  <div className="text-[10px] text-[#94a3b8]">0-100% in 14 Mins</div>
                </div>
              </div>

              <div className="glass-card floating-chip floating-chip-delay-2 absolute top-[22%] -right-6 px-4 py-2.5 rounded-2xl z-20 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7c4dff] shadow-[0_0_8px_#7c4dff]" />
                <div>
                  <div className="font-mono-spec text-xs font-bold text-white">144Hz LTPO 4.0</div>
                  <div className="text-[10px] text-[#94a3b8]">3,000 Nits Peak</div>
                </div>
              </div>

              {/* CSS 3D Phone Mockup */}
              <div
                className={`phone-mockup-3d ${heroTilt.isHovered ? '' : 'phone-floating-animation'}`}
                style={
                  heroTilt.isHovered
                    ? { transform: `rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg) scale(1.02)` }
                    : undefined
                }
              >
                {/* Dynamic Notch Pill */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 border border-white/10 flex items-center justify-between px-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#091220] border-[1.5px] border-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
                </div>

                {/* OLED Screen Surface */}
                <div className="screen-oled">
                  <div className="screen-wallpaper">
                    <div className="screen-wave" />

                    {/* Lockscreen Interface */}
                    <div className="relative z-10 p-5 pt-12 h-full flex flex-col justify-between">
                      {/* Top Clock */}
                      <div className="text-center">
                        <div className="font-mono-spec text-[10px] tracking-widest text-[#00e5ff] uppercase">
                          Quantum OS 4.0
                        </div>
                        <div className="font-heading text-4xl font-extrabold text-white leading-none mt-1">
                          {liveClock}
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-1">Saturday, October 17</div>
                      </div>

                      {/* Center Wave Graphic */}
                      <div className="text-center">
                        <svg width="180" height="60" viewBox="0 0 180 60" fill="none" className="mx-auto">
                          <path
                            d="M0 30 Q 30 5, 60 30 T 120 30 T 180 30"
                            stroke="url(#reactHeroWave)"
                            strokeWidth="3"
                            fill="none"
                          />
                          <defs>
                            <linearGradient id="reactHeroWave" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#00e5ff" />
                              <stop offset="0.5" stopColor="#7c4dff" />
                              <stop offset="1" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="font-mono-spec text-[9px] text-[#00e5ff] tracking-widest uppercase mt-1">
                          NEURAL PULSE ACTIVE
                        </div>
                      </div>

                      {/* Bottom Live Widget */}
                      <div className="bg-[#0e1424]/75 backdrop-blur-md border border-[#00e5ff]/25 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#00e5ff]/15 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94a3b8]">Battery</div>
                            <div className="font-mono-spec text-xs font-bold text-white">98% • 150W</div>
                          </div>
                        </div>
                        <span className="font-mono-spec text-[10px] text-[#00e5ff] bg-[#00e5ff]/15 px-2 py-0.5 rounded-full font-bold">
                          144Hz
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 3: LIVE SPECS STRIP (COUNT-UP METRICS + CIRCULAR SVG RINGS)
            ==================================================================== */}
        <section
          ref={specsStripRef}
          id="specs-strip"
          className="py-16 px-6 relative border-y border-[#00e5ff]/15 bg-[#0a0e18]/65 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Metric 1 */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#00e5ff"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="163"
                    strokeDashoffset={hasCountedSpecs ? 8 : 163}
                    className="transition-all duration-1000 ease-out -rotate-90 origin-center"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono-spec text-xs font-bold text-[#00e5ff]">
                  99%
                </div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-white">
                  <span>{specCounts.nits}</span> <span className="text-sm text-[#00e5ff]">NITS</span>
                </div>
                <div className="text-xs font-semibold text-white">Ultra-Retina Peak</div>
                <div className="text-[11px] text-[#94a3b8]">Sunlight HDR10+ Clarity</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#7c4dff"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="163"
                    strokeDashoffset={hasCountedSpecs ? 16 : 163}
                    className="transition-all duration-1000 ease-out -rotate-90 origin-center"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono-spec text-[11px] font-bold text-[#7c4dff]">
                  3nm
                </div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-white">
                  <span>{specCounts.ghz}</span> <span className="text-sm text-[#7c4dff]">GHz</span>
                </div>
                <div className="text-xs font-semibold text-white">Quantum X9 Prime Core</div>
                <div className="text-[11px] text-[#94a3b8]">Next-Gen GAA Architecture</div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#ec4899"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="163"
                    strokeDashoffset={hasCountedSpecs ? 12 : 163}
                    className="transition-all duration-1000 ease-out -rotate-90 origin-center"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono-spec text-[11px] font-bold text-[#ec4899]">
                  150W
                </div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-white">
                  <span>{specCounts.min}</span> <span className="text-sm text-[#ec4899]">MIN</span>
                </div>
                <div className="text-xs font-semibold text-white">Zero to 100% Charge</div>
                <div className="text-[11px] text-[#94a3b8]">Cryo-Regulated GaN Protocol</div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#00e5ff"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="163"
                    strokeDashoffset={hasCountedSpecs ? 20 : 163}
                    className="transition-all duration-1000 ease-out -rotate-90 origin-center"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono-spec text-[10px] font-bold text-[#00e5ff]">
                  200MP
                </div>
              </div>
              <div>
                <div className="font-heading text-2xl font-extrabold text-white">
                  <span>{specCounts.sec}</span> <span className="text-sm text-[#00e5ff]">SEC</span>
                </div>
                <div className="text-xs font-semibold text-white">Zero-Shutter Lag</div>
                <div className="text-[11px] text-[#94a3b8]">Neural Buffer Sensor Engine</div>
              </div>
            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 4: PRODUCT LINEUP (PHONY X1 PRO, X1, LITE)
            ==================================================================== */}
        <section id="lineup" className="py-28 px-6 relative">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-14">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">
                Engineered Without Compromise
              </div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#7c4dff]">Disruption</span>
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-xl mx-auto mt-3">
                Three distinct form factors engineered with titanium-aero chassis, sapphire crystal optics, and Quantum neural processing.
              </p>

              {/* Currency Selector */}
              <div className="inline-flex items-center gap-2 bg-white/5 p-1 rounded-full mt-6 border border-white/10">
                {[
                  { name: 'USD', symbol: '$', rate: 1 },
                  { name: 'EUR', symbol: '€', rate: 0.92 },
                  { name: 'GBP', symbol: '£', rate: 0.79 }
                ].map((cur) => (
                  <button
                    key={cur.name}
                    onClick={() => setActiveCurrency(cur)}
                    className={`font-mono-spec text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                      activeCurrency.name === cur.name
                        ? 'bg-[#00e5ff] text-[#07080c] shadow-[0_0_12px_#00e5ff]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {cur.name} ({cur.symbol})
                  </button>
                ))}
              </div>
            </div>

            {/* Lineup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* PHONY X1 Pro */}
              <div className="glass-card glass-card-hover rounded-3xl p-8 relative flex flex-col justify-between border-[#00e5ff]/35 shadow-[0_0_35px_rgba(0,229,255,0.15)]">
                <div className="absolute top-5 right-6 bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] text-[#07080c] font-mono-spec text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Flagship Elite
                </div>

                <div>
                  <div className="font-mono-spec text-xs text-[#00e5ff] tracking-wider uppercase">Top of the Line</div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-1">PHONY X1 Pro</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">The Ultimate Cyber-Neural Flagship</p>

                  {/* 3D Visual Preview */}
                  <div className="h-52 flex items-center justify-center my-6 relative">
                    <div
                      className="w-28 h-48 rounded-3xl bg-[#0b0e17] border-2 relative overflow-hidden transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                      style={{
                        borderColor: deviceColors['x1-pro'].hex,
                        boxShadow: `0 0 25px ${deviceColors['x1-pro'].hex}44`
                      }}
                    >
                      <div className="absolute inset-1 rounded-2xl bg-gradient-to-br from-[#090e1f] to-[#1b0a2a] overflow-hidden">
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-black rounded-full" />
                        <div
                          className="absolute inset-0 transition-all duration-500"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${deviceColors['x1-pro'].hex}66 0%, transparent 70%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="mb-6">
                    <div className="text-[11px] font-mono-spec text-[#94a3b8] uppercase mb-2">
                      Color: <span className="text-white font-semibold">{deviceColors['x1-pro'].name}</span>
                    </div>
                    <div className="flex gap-2.5">
                      {[
                        { name: 'Cyber Cyan', hex: '#00e5ff' },
                        { name: 'Neon Violet', hex: '#7c4dff' },
                        { name: 'Obsidian Black', hex: '#111520' },
                        { name: 'Titanium Frost', hex: '#e2e8f0' }
                      ].map(swatch => (
                        <button
                          key={swatch.name}
                          onClick={() => setDeviceColors(prev => ({ ...prev, 'x1-pro': swatch }))}
                          aria-label={`Select ${swatch.name}`}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                            deviceColors['x1-pro'].name === swatch.name
                              ? 'scale-125 border-2 border-white shadow-[0_0_8px_#fff]'
                              : 'border border-white/20'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <ul className="text-xs text-[#94a3b8] space-y-2.5 border-t border-white/10 pt-4">
                    <li className="flex justify-between"><span>Processor</span><strong className="text-white font-mono-spec">Quantum X9 (3nm)</strong></li>
                    <li className="flex justify-between"><span>Display</span><strong className="text-white font-mono-spec">6.82" 144Hz 3000-Nit</strong></li>
                    <li className="flex justify-between"><span>Optics</span><strong className="text-white font-mono-spec">200MP + 10x Periscope</strong></li>
                    <li className="flex justify-between"><span>Battery</span><strong className="text-white font-mono-spec">5400 mAh • 150W</strong></li>
                  </ul>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-[#94a3b8]">From</div>
                    <div className="font-heading text-2xl font-black text-white">
                      {activeCurrency.symbol}{Math.round(1199 * activeCurrency.rate).toLocaleString()}
                    </div>
                  </div>
                  <a
                    href="#newsletter"
                    className="shimmer-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] text-[#07080c] font-heading font-bold text-xs uppercase"
                  >
                    Order X1 Pro
                  </a>
                </div>
              </div>

              {/* PHONY X1 */}
              <div className="glass-card glass-card-hover rounded-3xl p-8 relative flex flex-col justify-between">
                <div>
                  <div className="font-mono-spec text-xs text-[#7c4dff] tracking-wider uppercase">Balanced Power</div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-1">PHONY X1</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">Pure Performance in Every Dimension</p>

                  <div className="h-52 flex items-center justify-center my-6 relative">
                    <div
                      className="w-26 h-44 rounded-3xl bg-[#0b0e17] border-2 relative overflow-hidden transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                      style={{
                        borderColor: deviceColors['x1'].hex,
                        boxShadow: `0 0 25px ${deviceColors['x1'].hex}44`
                      }}
                    >
                      <div className="absolute inset-1 rounded-2xl bg-gradient-to-br from-[#090e1f] to-[#071e28] overflow-hidden">
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-7 h-2 bg-black rounded-full" />
                        <div
                          className="absolute inset-0 transition-all duration-500"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${deviceColors['x1'].hex}66 0%, transparent 70%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-[11px] font-mono-spec text-[#94a3b8] uppercase mb-2">
                      Color: <span className="text-white font-semibold">{deviceColors['x1'].name}</span>
                    </div>
                    <div className="flex gap-2.5">
                      {[
                        { name: 'Neon Violet', hex: '#7c4dff' },
                        { name: 'Cyber Cyan', hex: '#00e5ff' },
                        { name: 'Obsidian Black', hex: '#111520' }
                      ].map(swatch => (
                        <button
                          key={swatch.name}
                          onClick={() => setDeviceColors(prev => ({ ...prev, 'x1': swatch }))}
                          aria-label={`Select ${swatch.name}`}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                            deviceColors['x1'].name === swatch.name
                              ? 'scale-125 border-2 border-white shadow-[0_0_8px_#fff]'
                              : 'border border-white/20'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <ul className="text-xs text-[#94a3b8] space-y-2.5 border-t border-white/10 pt-4">
                    <li className="flex justify-between"><span>Processor</span><strong className="text-white font-mono-spec">Quantum X9e (4nm)</strong></li>
                    <li className="flex justify-between"><span>Display</span><strong className="text-white font-mono-spec">6.55" 120Hz 2400-Nit</strong></li>
                    <li className="flex justify-between"><span>Optics</span><strong className="text-white font-mono-spec">108MP + 5x Periscope</strong></li>
                    <li className="flex justify-between"><span>Battery</span><strong className="text-white font-mono-spec">5000 mAh • 100W</strong></li>
                  </ul>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-[#94a3b8]">From</div>
                    <div className="font-heading text-2xl font-black text-white">
                      {activeCurrency.symbol}{Math.round(899 * activeCurrency.rate).toLocaleString()}
                    </div>
                  </div>
                  <a
                    href="#newsletter"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs uppercase transition-all"
                  >
                    Order X1
                  </a>
                </div>
              </div>

              {/* PHONY Lite */}
              <div className="glass-card glass-card-hover rounded-3xl p-8 relative flex flex-col justify-between">
                <div>
                  <div className="font-mono-spec text-xs text-[#ec4899] tracking-wider uppercase">Ultra-Streamlined</div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-1">PHONY Lite</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">Featherweight Form, Flagship DNA</p>

                  <div className="h-52 flex items-center justify-center my-6 relative">
                    <div
                      className="w-24 h-42 rounded-3xl bg-[#0b0e17] border-2 relative overflow-hidden transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                      style={{
                        borderColor: deviceColors['lite'].hex,
                        boxShadow: `0 0 25px ${deviceColors['lite'].hex}44`
                      }}
                    >
                      <div className="absolute inset-1 rounded-2xl bg-gradient-to-br from-[#180918] to-[#0a1120] overflow-hidden">
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-black rounded-full" />
                        <div
                          className="absolute inset-0 transition-all duration-500"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${deviceColors['lite'].hex}66 0%, transparent 70%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-[11px] font-mono-spec text-[#94a3b8] uppercase mb-2">
                      Color: <span className="text-white font-semibold">{deviceColors['lite'].name}</span>
                    </div>
                    <div className="flex gap-2.5">
                      {[
                        { name: 'Titanium Frost', hex: '#e2e8f0' },
                        { name: 'Cyber Cyan', hex: '#00e5ff' },
                        { name: 'Obsidian Black', hex: '#111520' }
                      ].map(swatch => (
                        <button
                          key={swatch.name}
                          onClick={() => setDeviceColors(prev => ({ ...prev, 'lite': swatch }))}
                          aria-label={`Select ${swatch.name}`}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                            deviceColors['lite'].name === swatch.name
                              ? 'scale-125 border-2 border-white shadow-[0_0_8px_#fff]'
                              : 'border border-white/20'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <ul className="text-xs text-[#94a3b8] space-y-2.5 border-t border-white/10 pt-4">
                    <li className="flex justify-between"><span>Processor</span><strong className="text-white font-mono-spec">Quantum S7 (4nm)</strong></li>
                    <li className="flex justify-between"><span>Display</span><strong className="text-white font-mono-spec">6.36" 120Hz 1800-Nit</strong></li>
                    <li className="flex justify-between"><span>Optics</span><strong className="text-white font-mono-spec">64MP + 3x Optical</strong></li>
                    <li className="flex justify-between"><span>Battery</span><strong className="text-white font-mono-spec">4600 mAh • 67W</strong></li>
                  </ul>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-[#94a3b8]">From</div>
                    <div className="font-heading text-2xl font-black text-white">
                      {activeCurrency.symbol}{Math.round(599 * activeCurrency.rate).toLocaleString()}
                    </div>
                  </div>
                  <a
                    href="#newsletter"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs uppercase transition-all"
                  >
                    Order Lite
                  </a>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 5: TECHNOLOGY DEEP-DIVE WITH TABS
            ==================================================================== */}
        <section id="technology" className="py-28 px-6 relative bg-[#080b13]/75">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-12">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Cybernetic Architecture</div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                Technology Under the Glass
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-xl mx-auto mt-3">
                Explore the breakthroughs powering our alive tactile feedback, real-time computational photography, and cryogenic power systems.
              </p>

              {/* Tab Selector */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {[
                  { id: 'chip', label: 'Quantum X9 Silicon' },
                  { id: 'camera', label: 'NeuralCam AI' },
                  { id: 'charge', label: '150W HyperCharge' },
                  { id: 'display', label: '144Hz AdaptiveDisplay' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTechTab(tab.id as typeof activeTechTab)}
                    className={`font-mono-spec text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      activeTechTab === tab.id
                        ? 'bg-[#00e5ff]/20 border border-[#00e5ff] text-white shadow-[0_0_14px_rgba(0,229,255,0.3)]'
                        : 'bg-white/5 border border-white/10 text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: CHIP */}
            {activeTechTab === 'chip' && (
              <div className="glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-fade-in">
                <div>
                  <div className="font-mono-spec text-xs text-[#00e5ff] uppercase tracking-wider">3-Nanometer GAA Technology</div>
                  <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mt-2">Quantum X9 Neural Engine</h3>
                  <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed mt-4">
                    19.2 billion transistors operating with superconducting trace layers. Delivering 45 TOPS of on-device neural processing for zero-latency generative photo editing, voice synthesis, and real-time ray-traced spatial audio.
                  </p>

                  <div className="space-y-4 mt-8">
                    <div>
                      <div className="flex justify-between text-xs font-mono-spec mb-1.5">
                        <span className="text-white font-bold">PHONY X1 Pro (Quantum X9)</span>
                        <span className="text-[#00e5ff] font-bold">2,480,000 pts (+34%)</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] rounded-full shadow-[0_0_10px_#00e5ff] w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono-spec mb-1.5">
                        <span className="text-[#94a3b8]">Leading Industry Flagship A</span>
                        <span className="text-[#94a3b8]">1,850,000 pts</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white/30 rounded-full w-[74%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono-spec mb-1.5">
                        <span className="text-[#94a3b8]">Leading Industry Flagship B</span>
                        <span className="text-[#94a3b8]">1,620,000 pts</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white/20 rounded-full w-[65%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline SVG Chip Diagram */}
                <div className="flex items-center justify-center">
                  <svg width="320" height="320" viewBox="0 0 320 320" fill="none" className="drop-shadow-[0_0_30px_rgba(0,229,255,0.25)]">
                    <path d="M20 70 H90 V130 H110" stroke="rgba(0,229,255,0.2)" strokeWidth="2" fill="none" />
                    <path d="M20 250 H90 V190 H110" stroke="rgba(0,229,255,0.2)" strokeWidth="2" fill="none" />
                    <path d="M300 70 H230 V130 H210" stroke="rgba(124,77,255,0.2)" strokeWidth="2" fill="none" />
                    <path d="M300 250 H230 V190 H210" stroke="rgba(124,77,255,0.2)" strokeWidth="2" fill="none" />

                    <path d="M20 70 H90 V130 H110" stroke="#00e5ff" strokeWidth="2" fill="none" className="circuit-dash" />
                    <path d="M20 250 H90 V190 H110" stroke="#00e5ff" strokeWidth="2" fill="none" className="circuit-dash" />
                    <path d="M300 70 H230 V130 H210" stroke="#7c4dff" strokeWidth="2" fill="none" className="circuit-dash" />
                    <path d="M300 250 H230 V190 H210" stroke="#7c4dff" strokeWidth="2" fill="none" className="circuit-dash" />

                    <rect x="100" y="100" width="120" height="120" rx="20" fill="#080c18" stroke="url(#reactChipGrad)" strokeWidth="3" />
                    <rect x="115" y="115" width="90" height="90" rx="12" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.3)" strokeWidth="1.5" />

                    <text x="160" y="155" fontFamily="Orbitron" fontWeight="900" fontSize="22" fill="#ffffff" textAnchor="middle">X9</text>
                    <text x="160" y="175" fontFamily="JetBrains Mono" fontSize="9" fill="#00e5ff" letterSpacing="2" textAnchor="middle">QUANTUM</text>
                    <text x="160" y="190" fontFamily="JetBrains Mono" fontSize="8" fill="#7c4dff" letterSpacing="1" textAnchor="middle">3NM GAA</text>

                    <circle cx="20" cy="70" r="4" fill="#00e5ff" />
                    <circle cx="20" cy="250" r="4" fill="#00e5ff" />
                    <circle cx="300" cy="70" r="4" fill="#7c4dff" />
                    <circle cx="300" cy="250" r="4" fill="#7c4dff" />

                    <defs>
                      <linearGradient id="reactChipGrad" x1="100" y1="100" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00e5ff" />
                        <stop offset="1" stopColor="#7c4dff" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}

            {/* TAB 2: CAMERA */}
            {activeTechTab === 'camera' && (
              <div className="glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-fade-in">
                <div>
                  <div className="font-mono-spec text-xs text-[#7c4dff] uppercase tracking-wider">Computational Optic Array</div>
                  <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mt-2">200MP Bio-Neural Sensor</h3>
                  <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed mt-4">
                    Equipped with custom 16-in-1 pixel binning creating giant 2.56μm super-pixels. The neural pipeline continuously buffers RAW sensory frames, removing motion blur before you even press the shutter.
                  </p>

                  <div className="flex flex-wrap gap-2.5 mt-6">
                    {[
                      { id: 'night', label: 'Night Vision 3.0' },
                      { id: 'zoom', label: '100x Space Zoom' },
                      { id: 'hdr', label: 'Cinematic 8K HDR' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setCamMode(mode.id as typeof camMode)}
                        className={`font-mono-spec text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer ${
                          camMode === mode.id
                            ? 'bg-[#7c4dff] text-white shadow-[0_0_12px_#7c4dff]'
                            : 'bg-white/10 text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 p-4 rounded-xl bg-[#7c4dff]/10 border border-[#7c4dff]/30 text-xs text-[#e2e8f0]">
                    {camMode === 'night' && 'Night Vision 3.0: Multi-frame ISO 204,800 neural exposure turns pitch black rooms into crisp, vivid daylight without digital noise.'}
                    {camMode === 'zoom' && '100x Space Zoom: Dual-prism periscope with AI de-noising recovers architectural details and celestial patterns with sub-pixel alignment.'}
                    {camMode === 'hdr' && 'Cinematic 8K HDR: 10-bit Log recording with hardware LUT grading and zero frame compression at a fluid 60fps.'}
                  </div>
                </div>

                {/* Simulated Viewfinder with Scanning Laser Line */}
                <div className="relative w-full max-w-sm h-64 mx-auto rounded-2xl overflow-hidden bg-[#040711] border border-[#00e5ff]/30 shadow-[0_0_30px_rgba(0,229,255,0.15)] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,229,255,0.15)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="w-24 h-24 border border-dashed border-[#00e5ff] rounded-full flex items-center justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-[#7c4dff] rounded-sm" />
                  </div>
                  {/* Scanning Laser Line */}
                  <div className="cam-scanner absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent shadow-[0_0_14px_#00e5ff]" />
                  
                  <div className="absolute top-3 left-4 font-mono-spec text-[10px] text-[#00e5ff]">
                    ISO 64 • 1/8000s • RAW16
                  </div>
                  <div className="absolute top-3 right-4 font-mono-spec text-[10px] text-[#ec4899] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] animate-pulse" />
                    AI TRACKING
                  </div>
                  <div className="absolute bottom-3 left-4 font-mono-spec text-[10px] text-[#94a3b8]">
                    200MP MATRIX • f/1.65 OIS
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HYPERCHARGE */}
            {activeTechTab === 'charge' && (
              <div className="glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-fade-in">
                <div>
                  <div className="font-mono-spec text-xs text-[#ec4899] uppercase tracking-wider">Next-Gen GaN Thermal Architecture</div>
                  <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mt-2">150W Cryo-Pulse HyperCharge</h3>
                  <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed mt-4">
                    Dual-cell silicon-carbon battery configuration with 10 integrated thermal sensors. Achieve 65% charge in just 5 minutes while maintaining an ultra-cool chassis temperature.
                  </p>

                  <div className="mt-8">
                    <button
                      onClick={handleFlashCharge}
                      disabled={flashCharging}
                      className="shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#7c4dff] text-white font-heading font-bold text-xs uppercase cursor-pointer"
                    >
                      {flashCharging ? '⚡ HyperCharging at 150W...' : '⚡ Simulate 5-Min Flash Charge'}
                    </button>
                    <div className="text-xs text-[#94a3b8] font-mono-spec mt-2">
                      Watch real-time electron surge & thermal regulation
                    </div>
                  </div>

                  <div className="flex gap-5 mt-6">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[11px] text-[#94a3b8]">Chassis Temp</div>
                      <div className="font-mono-spec text-base font-bold text-[#00e5ff]">{flashChargeTemp.toFixed(1)}°C</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[11px] text-[#94a3b8]">Voltage Transfer</div>
                      <div className="font-mono-spec text-base font-bold text-[#ec4899]">11.0V / 13.6A</div>
                    </div>
                  </div>
                </div>

                {/* Animated Battery Graphic */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-32 h-60 border-4 border-[#ec4899]/60 rounded-3xl p-1.5 shadow-[0_0_35px_rgba(236,72,153,0.3)] bg-[#060914]">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-10 h-2.5 bg-[#ec4899] rounded-t-md" />
                    <div className="absolute inset-2 rounded-2xl overflow-hidden flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#7c4dff] to-[#ec4899] transition-all duration-700 relative shadow-[0_0_20px_#ec4899]"
                        style={{ height: `${flashChargePct}%` }}
                      >
                        <div className="absolute -top-1.5 left-0 right-0 h-2 bg-white/60 blur-[1px]" />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                      <span className="font-heading text-4xl font-black text-white">{flashChargePct}%</span>
                      <span className="font-mono-spec text-[10px] text-[#00e5ff] tracking-wider mt-1">150W ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DISPLAY */}
            {activeTechTab === 'display' && (
              <div className="glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-fade-in">
                <div>
                  <div className="font-mono-spec text-xs text-[#00e5ff] uppercase tracking-wider">LTPO 4.0 Sub-Pixel Matrix</div>
                  <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mt-2">1Hz to 144Hz Dynamic Wave</h3>
                  <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed mt-4">
                    Instantaneous refresh modulation. Drops to 1Hz while reading static documents for infinite battery life, then surges to a hyper-fluid 144Hz the microsecond your thumb touches the screen.
                  </p>

                  <div className="mt-8">
                    <div className="text-xs font-mono-spec text-[#94a3b8] mb-2">
                      Active Refresh Rate: <strong className="text-[#00e5ff]">{displayHz} Hz ({displayHz === 144 ? 'Ultra Fluid' : displayHz === 120 ? 'Smooth' : 'Standard'})</strong>
                    </div>
                    <div className="flex gap-2.5">
                      {[60, 120, 144].map((hz) => (
                        <button
                          key={hz}
                          onClick={() => setDisplayHz(hz as typeof displayHz)}
                          className={`font-mono-spec text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                            displayHz === hz
                              ? 'bg-[#00e5ff] text-[#07080c] shadow-[0_0_12px_#00e5ff]'
                              : 'bg-white/5 border border-white/15 text-[#94a3b8] hover:text-white'
                          }`}
                        >
                          {hz} Hz
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <canvas ref={waveCanvasRef} width="360" height="240" className="w-full max-w-sm h-60 rounded-2xl bg-[#060912] border border-[#00e5ff]/25 shadow-[0_0_25px_rgba(0,229,255,0.15)] mx-auto" />
                  <div className="font-mono-spec text-[11px] text-[#94a3b8] mt-2.5">
                    Real-time 60fps frame sampling waveform
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ====================================================================
            SECTION 6: INTERACTIVE COMPARISON TOOL
            ==================================================================== */}
        <section id="compare" className="py-28 px-6 relative">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-12">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Head-to-Head Precision</div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                Compare Side-by-Side
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-lg mx-auto mt-2">
                Select any two models to analyze raw engineering specifications and architectural advantages.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 sm:p-8">
              {/* Dropdown Headers */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 items-center pb-6 border-b border-white/10">
                <div className="font-mono-spec text-xs text-[#94a3b8] uppercase">Spec / Parameter</div>
                <div>
                  <select
                    value={compDevA}
                    onChange={(e) => setCompDevA(e.target.value)}
                    className="w-full bg-[#0e1424] border border-[#00e5ff]/40 text-white p-2.5 sm:p-3 rounded-xl font-heading text-xs sm:text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="x1-pro">PHONY X1 Pro</option>
                    <option value="x1">PHONY X1</option>
                    <option value="lite">PHONY Lite</option>
                  </select>
                </div>
                <div>
                  <select
                    value={compDevB}
                    onChange={(e) => setCompDevB(e.target.value)}
                    className="w-full bg-[#0e1424] border border-[#7c4dff]/40 text-white p-2.5 sm:p-3 rounded-xl font-heading text-xs sm:text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="x1-pro">PHONY X1 Pro</option>
                    <option value="x1">PHONY X1</option>
                    <option value="lite">PHONY Lite</option>
                  </select>
                </div>
              </div>

              {/* Spec Rows */}
              <div className="divide-y divide-white/5">
                {[
                  { label: 'Starting Price', key: 'price', valA: `$${deviceA.price}`, valB: `$${deviceB.price}` },
                  { label: 'Screen & Panel', key: 'screenSize', valA: deviceA.screenSize, valB: deviceB.screenSize },
                  { label: 'Peak Brightness', key: 'displayNits', valA: `${deviceA.displayNits} Nits`, valB: `${deviceB.displayNits} Nits` },
                  { label: 'Max Refresh Rate', key: 'refreshRateMax', valA: `${deviceA.refreshRateMax} Hz`, valB: `${deviceB.refreshRateMax} Hz` },
                  { label: 'SoC Silicon Node', key: 'soc', valA: deviceA.soc, valB: deviceB.soc },
                  { label: 'CPU Clock Peak', key: 'cpuGhz', valA: `${deviceA.cpuGhz} GHz`, valB: `${deviceB.cpuGhz} GHz` },
                  { label: 'Main Optical Sensor', key: 'mainCamMp', valA: `${deviceA.mainCamMp} MP`, valB: `${deviceB.mainCamMp} MP` },
                  { label: 'Battery Capacity', key: 'batteryMah', valA: `${deviceA.batteryMah} mAh`, valB: `${deviceB.batteryMah} mAh` },
                  { label: 'HyperCharge Protocol', key: 'chargeWatts', valA: `${deviceA.chargeWatts} W`, valB: `${deviceB.chargeWatts} W` },
                  { label: 'Chassis Weight', key: 'weightGrams', valA: `${deviceA.weightGrams} g`, valB: `${deviceB.weightGrams} g` }
                ].map((row, idx) => {
                  const winner = comparisonMap[row.key];
                  return (
                    <div key={idx} className="grid grid-cols-3 gap-4 sm:gap-8 items-center py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="text-xs sm:text-sm text-[#94a3b8] font-medium">{row.label}</div>
                      <div className="font-mono-spec text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>{row.valA}</span>
                        {winner === 'A' && (
                          <span className="bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff] text-[9px] px-1.5 py-0.5 rounded font-bold">
                            LEADER
                          </span>
                        )}
                      </div>
                      <div className="font-mono-spec text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>{row.valB}</span>
                        {winner === 'B' && (
                          <span className="bg-[#7c4dff]/20 text-[#7c4dff] border border-[#7c4dff] text-[9px] px-1.5 py-0.5 rounded font-bold">
                            LEADER
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 7: FULL SPEC TABLE (ACCORDION GROUPS)
            ==================================================================== */}
        <section id="specs" className="py-24 px-6 relative bg-[#070a12]/85">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-12">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Complete Dossier</div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                Full Engineering Specs
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-md mx-auto mt-2">
                Examine the uncompromising technical components driving the PHONY ecosystem.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 'display',
                  title: 'Display & Visual Matrix',
                  subtitle: 'LTPO 4.0 OLED, 3,000 Nits, HDR10+, Dolby Vision IQ',
                  rows: [
                    ['Panel Technology', '6.82-inch Flexible LTPO 4.0 Ultra-OLED'],
                    ['Resolution & Density', '3168 x 1440 QHD+ at 510 ppi'],
                    ['Refresh Dynamics', 'Adaptive 1Hz – 144Hz instant micro-stepping'],
                    ['Touch Response', '2160Hz Instant Touch Response Rate'],
                    ['Glass Protection', 'Corning Gorilla Armor Pro (75% reflection reduction)']
                  ]
                },
                {
                  id: 'chip',
                  title: 'Silicon & Neural Architecture',
                  subtitle: 'Quantum X9 (3nm), 45 TOPS NPU, Immortalis G925 GPU',
                  rows: [
                    ['Process Node', 'TSMC 3nm Gen-2 Gate-All-Around (GAA)'],
                    ['CPU Configuration', '1x 3.85GHz Prime Cortex-X5 + 3x 3.2GHz Performance + 4x 2.4GHz Efficiency'],
                    ['Neural Unit (NPU)', 'Quantum Neural Core 4.0 (45 TOPS FP16/INT8)'],
                    ['Memory & Storage', '16GB / 24GB LPDDR5X (9600 Mbps) • 512GB / 1TB UFS 4.1']
                  ]
                },
                {
                  id: 'camera',
                  title: 'Optics & Bio-Neural Imaging',
                  subtitle: '200MP Main + 50MP Ultra-Wide + 50MP 10x Periscope',
                  rows: [
                    ['Primary Camera', '200MP 1/1.12" Sensor, f/1.65, 8P Aspherical Lens, Sensor-Shift 5-Axis OIS'],
                    ['Telephoto Periscope', '50MP 10x Optical True Periscope (up to 100x AI Space Clarity), OIS, f/2.8'],
                    ['Ultra-Wide & Macro', '50MP 128° Field of View, 2.5cm Super Macro autofocus'],
                    ['Video Capture', '8K at 60fps HDR10+, 4K at 120fps Dolby Vision, 10-bit Log ProRes']
                  ]
                },
                {
                  id: 'power',
                  title: 'Battery, Thermal & Charging',
                  subtitle: '5400 mAh Silicon-Carbon, 150W Wired, 50W Wireless',
                  rows: [
                    ['Battery Cell', '5400 mAh High-Density Silicon-Carbon Dual-Cell Matrix'],
                    ['Charging Protocol', '150W HyperCharge (14 mins full charge), 50W Cryo-Wireless'],
                    ['Thermal Architecture', 'Dual 10,000mm² 3D Ice-Loop Vapor Chamber with Graphene foil']
                  ]
                }
              ].map(group => {
                const isOpen = expandedAccordions[group.id];
                return (
                  <div key={group.id} className="glass-card rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedAccordions(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                      className="w-full flex items-center justify-between p-6 bg-transparent text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-heading text-lg font-bold text-white">{group.title}</div>
                        <div className="text-xs text-[#94a3b8] mt-0.5">{group.subtitle}</div>
                      </div>
                      <span className={`text-[#00e5ff] text-base transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 animate-fade-in">
                        <table className="w-full text-xs sm:text-sm border-collapse">
                          <tbody>
                            {group.rows.map(([label, val], idx) => (
                              <tr key={idx} className="border-t border-white/5">
                                <td className="py-3 text-[#94a3b8] w-1/3">{label}</td>
                                <td className="py-3 text-white font-mono-spec">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 8: BATTERY LIFE CALCULATOR
            ==================================================================== */}
        <section id="battery-lab" className="py-28 px-6 relative">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-14">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Real-World Endurance Estimator</div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                Interactive Battery Laboratory
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-xl mx-auto mt-2">
                Adjust your daily usage pattern to see our GaN-regulated silicon-carbon cell dynamically compute your runtime.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-white">3D Ray-Traced Gaming</label>
                    <span className="font-mono-spec text-xs font-bold text-[#00e5ff]">{calcFactors.gamingHours} Hours</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={calcFactors.gamingHours}
                    onChange={(e) => setCalcFactors(prev => ({ ...prev, gamingHours: parseFloat(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono-spec mt-1">
                    <span>0h</span><span>4h</span><span>8h Intense</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-white">5G 4K Video Streaming</label>
                    <span className="font-mono-spec text-xs font-bold text-[#7c4dff]">{calcFactors.streamingHours} Hours</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={calcFactors.streamingHours}
                    onChange={(e) => setCalcFactors(prev => ({ ...prev, streamingHours: parseFloat(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono-spec mt-1">
                    <span>0h</span><span>6h</span><span>12h Continuous</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-white">Screen Brightness Level</label>
                    <span className="font-mono-spec text-xs font-bold text-[#ec4899]">{calcFactors.brightnessPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={calcFactors.brightnessPct}
                    onChange={(e) => setCalcFactors(prev => ({ ...prev, brightnessPct: parseFloat(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono-spec mt-1">
                    <span>10% Indoor</span><span>50%</span><span>100% Sun</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 pt-4 border-t border-white/10">
                  <div>
                    <span className="block text-[11px] font-mono-spec text-[#94a3b8] mb-2">Network Mode</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCalcFactors(prev => ({ ...prev, network5G: false }))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          !calcFactors.network5G ? 'bg-[#00e5ff] text-[#07080c]' : 'bg-white/10 text-[#94a3b8]'
                        }`}
                      >
                        Wi-Fi 7
                      </button>
                      <button
                        onClick={() => setCalcFactors(prev => ({ ...prev, network5G: true }))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          calcFactors.network5G ? 'bg-[#00e5ff] text-[#07080c]' : 'bg-white/10 text-[#94a3b8]'
                        }`}
                      >
                        5G Ultra
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-mono-spec text-[#94a3b8] mb-2">Target Device</span>
                    <select
                      value={calcFactors.batteryCapacityMah}
                      onChange={(e) => setCalcFactors(prev => ({ ...prev, batteryCapacityMah: parseInt(e.target.value) }))}
                      className="bg-[#0e1424] border border-white/20 text-white text-xs p-2 rounded-lg outline-none"
                    >
                      <option value="5400">X1 Pro (5400 mAh)</option>
                      <option value="5000">X1 (5000 mAh)</option>
                      <option value="4600">Lite (4600 mAh)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Animated SVG Liquid Battery */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-black/40 border border-[#00e5ff]/20 text-center">
                <div className="relative w-28 h-48 border-4 border-[#00e5ff] rounded-3xl p-1 shadow-[0_0_25px_rgba(0,229,255,0.25)] bg-[#070912] mb-6">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-[#00e5ff] rounded-t-md" />
                  <div className="absolute inset-1.5 rounded-2xl overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#7c4dff] to-[#00e5ff] transition-all duration-300 shadow-[0_0_15px_#00e5ff]"
                      style={{ height: `${Math.min(100, Math.max(15, (batteryCalcResult.estimatedRunTimeHours / 30) * 100))}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                </div>

                <div className="text-[11px] font-mono-spec text-[#94a3b8] uppercase tracking-wider">
                  Calculated Full Endurance
                </div>
                <div className="font-heading text-4xl sm:text-5xl font-black text-white mt-1">
                  <span>{batteryCalcResult.estimatedRunTimeHours}</span> <span className="text-lg text-[#00e5ff]">HRS</span>
                </div>
                <div className="text-xs text-[#94a3b8] mt-1.5">
                  Screen-On Time: <strong className="text-white">{batteryCalcResult.activeScreenOnHours}h</strong>
                </div>

                <div className="mt-4 px-4 py-1.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 font-mono-spec text-xs text-[#00e5ff]">
                  Efficiency Score: {batteryCalcResult.efficiencyScore} / 100
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 9: REVIEWS & MEDIA CAROUSEL
            ==================================================================== */}
        <section id="reviews" className="py-24 px-6 relative bg-[#0a0e19]/70">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-12">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Global Industry Acclaim</div>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white mt-2">
                What the World is Saying
              </h2>
            </div>

            <div className="glass-card rounded-3xl p-8 sm:p-12 min-h-[260px] flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex gap-1 text-[#fbbf24] text-lg mb-4">
                  {'★★★★★'}
                </div>
                <blockquote className="text-lg sm:text-2xl font-medium text-white italic leading-relaxed">
                  "{reviewsList[currentReviewIndex].quote}"
                </blockquote>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <div>
                  <div className="font-heading font-extrabold text-base text-white">
                    {reviewsList[currentReviewIndex].author}
                  </div>
                  <div className="font-mono-spec text-xs text-[#00e5ff] tracking-wider uppercase">
                    {reviewsList[currentReviewIndex].outlet}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentReviewIndex((currentReviewIndex - 1 + reviewsList.length) % reviewsList.length)}
                    aria-label="Previous Review"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentReviewIndex((currentReviewIndex + 1) % reviewsList.length)}
                    aria-label="Next Review"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ====================================================================
            SECTION 10: VIP LAUNCH ACCESS / NEWSLETTER
            ==================================================================== */}
        <section id="newsletter" className="py-28 px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            
            <div className="glass-card rounded-3xl p-8 sm:p-14 relative overflow-hidden border-[#00e5ff]/30">
              <div className="font-mono-spec text-xs tracking-[0.25em] text-[#00e5ff] uppercase">Limited First Production Run</div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mt-2">
                Secure Priority Delivery
              </h2>
              <p className="text-[#94a3b8] text-sm sm:text-base max-w-md mx-auto mt-3 mb-8">
                Join the Founder’s Batch. Receive exclusive early dispatch, the 150W Cryo-Charger bundle, and direct engineering access to Quantum OS beta firmware.
              </p>

              {!newsletterSuccess ? (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className={`space-y-4 max-w-md mx-auto ${isShaking ? 'shake-anim' : ''}`}
                >
                  <div className="relative">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-5 py-4 rounded-xl bg-[#080d1a] border border-[#00e5ff]/30 text-white placeholder-[#94a3b8] text-sm outline-none focus:border-[#00e5ff] focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
                    />
                  </div>

                  {newsletterError && (
                    <div className="text-[#f43f5e] font-mono-spec text-xs text-left">
                      Please enter a valid email address.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="shimmer-btn w-full py-4 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] text-[#07080c] font-heading font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.4)] cursor-pointer"
                  >
                    Claim Priority Access Token
                  </button>
                </form>
              ) : (
                <div className="py-6 animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-[#00e5ff]/15 border-2 border-[#00e5ff] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_#00e5ff]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="3" className="draw-check">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-white">Priority Access Confirmed!</h3>
                  <p className="text-[#94a3b8] text-xs sm:text-sm mt-2">
                    Your founder queue token has been reserved. Check your inbox shortly for your serial credentials.
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* ======================================================================
          SECTION 11: FOOTER (FLOWING GRADIENT LINE, BOUNCING SOCIALS, ROCKET)
          ====================================================================== */}
      <footer className="relative border-t border-white/10 bg-[#04060a] pt-20 pb-10 px-6">
        <div className="flowing-gradient-border absolute top-0 left-0 right-0" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-10 mb-14">
            
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#7c4dff] flex items-center justify-center font-heading font-black text-[#07080c]">
                  Ψ
                </div>
                <span className="font-heading font-black text-xl tracking-[0.25em] text-white">PHONY</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-xs">
                Engineered to Feel Alive. Next-generation consumer hardware born from cryogenic thermal design and artificial cognitive intelligence.
              </p>
            </div>

            <div>
              <div className="font-mono-spec text-xs text-[#00e5ff] tracking-wider uppercase mb-4">Hardware Lineup</div>
              <ul className="text-xs text-[#94a3b8] space-y-2.5">
                <li><a href="#lineup" className="hover:text-white transition-colors">PHONY X1 Pro</a></li>
                <li><a href="#lineup" className="hover:text-white transition-colors">PHONY X1</a></li>
                <li><a href="#lineup" className="hover:text-white transition-colors">PHONY Lite</a></li>
                <li><a href="#battery-lab" className="hover:text-white transition-colors">150W Cryo Charger</a></li>
              </ul>
            </div>

            <div>
              <div className="font-mono-spec text-xs text-[#7c4dff] tracking-wider uppercase mb-4">Engineering</div>
              <ul className="text-xs text-[#94a3b8] space-y-2.5">
                <li><a href="#technology" className="hover:text-white transition-colors">Quantum OS 4.0</a></li>
                <li><a href="#technology" className="hover:text-white transition-colors">Bio-Neural Optics</a></li>
                <li><a href="#technology" className="hover:text-white transition-colors">Silicon-Carbon Cells</a></li>
                <li><a href="#technology" className="hover:text-white transition-colors">Cryo-Loop Thermals</a></li>
              </ul>
            </div>

            <div>
              <div className="font-mono-spec text-xs text-[#ec4899] tracking-wider uppercase mb-4">Direct Download</div>
              <p className="text-xs text-[#94a3b8] mb-3">
                Save this complete keynote experience as a self-contained offline HTML file.
              </p>
              <a
                href="/phony-launch.html"
                download="phony-launch.html"
                className="inline-flex items-center gap-2 font-mono-spec text-xs px-4 py-2 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff] text-white hover:bg-[#00e5ff]/25 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Standalone HTML
              </a>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-[#94a3b8]">
            <div>© 2026 PHONY Technologies Corp. Simulated flagship experience. All rights reserved.</div>
            
            {/* Rocket Back-to-Top Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white cursor-pointer hover:border-[#00e5ff] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
              </svg>
              <span className="font-mono-spec text-[11px]">LAUNCH TO TOP</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
