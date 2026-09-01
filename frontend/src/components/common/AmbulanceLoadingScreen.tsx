import { useEffect, useRef, useState } from 'react';

interface AmbulanceLoadingScreenProps {
  onComplete?: () => void;
  durationMs?: number;
  message?: string;
  fullScreen?: boolean;
}

const STATUS_STAGES = [
  'Initializing SeHAT Triage+ Lifeline...',
  'Connecting Low-Bandwidth Audio & AI Triage Station...',
  'Discovering Live OpenStreetMap Hospitals & Bed Capacity...',
  'Synchronizing Local ABDM Encrypted Records...',
  'Triage+ Emergency Healthcare Gateway Ready!'
];

export default function AmbulanceLoadingScreen({
  onComplete,
  durationMs = 3600
}: AmbulanceLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(STATUS_STAGES[0]);
  const [phaseB, setPhaseB] = useState(false);
  const [badgeLettersVisible, setBadgeLettersVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const introRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLSpanElement>(null);
  const ring2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      const stage = Math.min(
        STATUS_STAGES.length - 1,
        Math.floor((elapsed / durationMs) * STATUS_STAGES.length)
      );
      setStatusText(STATUS_STAGES[stage]);

      if (elapsed >= durationMs) {
        clearInterval(timer);
        setTimeout(() => {
          setPhaseB(true);
          setTimeout(() => {
            setBadgeLettersVisible(true);
            triggerRings();
            setTimeout(() => {
              setIsExiting(true);
              setTimeout(() => {
                if (onComplete) onComplete();
              }, 400);
            }, 1000);
          }, 450);
        }, 300);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [durationMs, onComplete]);

  const triggerRings = () => {
    if (ring1Ref.current && ring2Ref.current) {
      ring1Ref.current.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0.5 },
          { transform: 'translate(-50%,-50%) scale(2.8)', opacity: 0 }
        ],
        { duration: 1300, delay: 100, easing: 'ease-out', fill: 'forwards' }
      );
      ring2Ref.current.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0.5 },
          { transform: 'translate(-50%,-50%) scale(2.8)', opacity: 0 }
        ],
        { duration: 1300, delay: 420, easing: 'ease-out', fill: 'forwards' }
      );
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    if (onComplete) {
      setTimeout(onComplete, 100);
    }
  };

  // Smooth full-span horizontal movement across the screen
  const ambulanceLeftPct = -26 + (progress / 100) * 132;

  return (
    <div
      ref={introRef}
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] overflow-hidden cursor-pointer select-none transition-opacity duration-300 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: phaseB ? '#FAF7F2' : '#EFE7D8',
        transition: 'background 0.5s ease'
      }}
    >
      <style>{`
        /* Scenery Trees */
        .tree-track {
          position: absolute; left: 0; bottom: 0; width: 200%; height: 100%;
          background-image: 
            radial-gradient(circle at 40px 25px, #6B8E56 14px, transparent 15px),
            radial-gradient(circle at 45px 18px, #7A9E63 12px, transparent 13px),
            radial-gradient(circle at 140px 22px, #5C7C46 16px, transparent 17px),
            radial-gradient(circle at 240px 20px, #6B8E56 15px, transparent 16px),
            radial-gradient(circle at 350px 24px, #7A9E63 13px, transparent 14px),
            radial-gradient(circle at 440px 21px, #5C7C46 15px, transparent 16px),
            radial-gradient(circle at 550px 25px, #6B8E56 14px, transparent 15px);
          background-size: 600px 56px;
          animation: sceneryScroll 2.8s linear infinite;
          opacity: 0.9;
        }
        .tree-track::before {
          content: ''; position: absolute; inset: 0;
          background-image: 
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239),
            linear-gradient(#8C6239, #8C6239);
          background-size: 4px 20px, 4px 20px, 4px 20px, 4px 20px, 4px 20px, 4px 20px, 4px 20px;
          background-position: 42px 34px, 142px 34px, 242px 34px, 352px 34px, 442px 34px, 552px 34px, 642px 34px;
          background-repeat: repeat-x;
        }
        @keyframes sceneryScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Lane Dashes */
        .lane-dashes {
          position: absolute; top: 50%; left: 0; right: 0; height: 8px; transform: translateY(-50%);
          background-image: repeating-linear-gradient(90deg, #EFE7D8 0 54px, transparent 54px 100px);
          opacity: 0.65; animation: dashMove 0.65s linear infinite;
        }
        @keyframes dashMove { from { background-position-x: 0; } to { background-position-x: -154px; } }

        /* Ambulance Rig & Bounce */
        .amb-rig {
          position: absolute; inset: 0;
          animation: ambBounce 0.35s ease-in-out infinite alternate;
        }
        @keyframes ambBounce {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-3px) rotate(-0.35deg); }
        }

        /* Lightbar Beacons */
        .beacon-a { background: #EF4444; animation: beaconA 0.3s steps(1) infinite; }
        .beacon-b { background: #3B82F6; animation: beaconB 0.3s steps(1) infinite; }
        @keyframes beaconA { 0%,49% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 8px #EF4444); } 50%,100% { opacity: 0.3; filter: brightness(0.7); } }
        @keyframes beaconB { 0%,49% { opacity: 0.3; filter: brightness(0.7); } 50%,100% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 8px #3B82F6); } }

        /* Wheel Spin */
        @keyframes wheelspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-wheel { animation: wheelspin 0.3s linear infinite; }

        .bldg-hospital::after {
          content: '+'; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
          font-family: 'Lora', serif; font-weight: 700; color: #C86D51; font-size: 17px; opacity: 0.9;
        }
      `}</style>

      {/* Skyline in Background */}
      <div
        className={`absolute left-0 right-0 bottom-[220px] h-[130px] flex items-end gap-[28px] px-[6%] opacity-35 pointer-events-none transition-all duration-500 ${
          phaseB ? 'opacity-0 translate-y-2' : ''
        }`}
      >
        <div className="bg-[#4A2E1B] opacity-15 rounded-t w-[44px] h-[48px]" />
        <div className="bg-[#4A2E1B] opacity-15 rounded-t w-[36px] h-[76px]" />
        <div className="bg-[#4A2E1B] opacity-25 rounded-t w-[56px] h-[95px] bldg-hospital relative" />
        <div className="bg-[#4A2E1B] opacity-15 rounded-t w-[34px] h-[60px]" />
        <div className="bg-[#4A2E1B] opacity-15 rounded-t w-[42px] h-[42px]" />
        <div className="bg-[#4A2E1B] opacity-15 rounded-t w-[30px] h-[70px]" />
      </div>

      {/* Status Stages & Progress Bar */}
      <div
        className={`absolute top-[10%] left-0 right-0 text-center px-6 transition-all duration-500 ${
          phaseB ? 'opacity-0 translate-y-2' : 'opacity-100'
        }`}
      >
        <div className="text-base sm:text-lg font-serif font-bold text-[#382011] min-h-[1.4em] tracking-wide">
          {statusText}
        </div>
        <div className="mt-3.5 mx-auto w-[min(360px,75vw)]">
          <div className="h-1.5 rounded-full bg-[#4A2E1B]/15 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#C86D51] to-[#E28B70] rounded-full transition-all duration-75 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-xs text-[#7A7265] mt-2 tracking-wider font-mono font-bold">
            {progress}% Completed
          </div>
        </div>
      </div>

      {/* Wide Road & Big Realistic Ambulance Arena */}
      <div
        className={`absolute left-0 right-0 bottom-0 h-[220px] transition-all duration-500 ${
          phaseB ? 'opacity-0 translate-y-4' : 'opacity-100'
        }`}
      >
        {/* Roadside Trees */}
        <div className="absolute bottom-[218px] left-0 right-0 h-[56px] pointer-events-none overflow-hidden">
          <div className="tree-track" />
        </div>

        {/* Solid Road Surface */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#554E44] via-[#484237] to-[#38332A] shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
        <div className="lane-dashes" />

        {/* Big High-Resolution Realistic Ambulance SVG Container */}
        <div
          className="absolute bottom-[24px] w-[340px] sm:w-[410px] h-[135px] transition-all duration-75 ease-linear filter drop-shadow-[0_18px_25px_rgba(0,0,0,0.45)]"
          style={{ left: `${ambulanceLeftPct}%` }}
        >
          <div className="amb-rig relative w-full h-full">
            {/* Speed Air Trails */}
            <div className="absolute right-[92%] top-[65%] w-[120px] h-[6px] bg-gradient-to-r from-transparent to-[#2B2620]/30 rounded-full" />
            <div className="absolute right-[92%] top-[82%] w-[85px] h-[5px] bg-gradient-to-r from-transparent to-[#2B2620]/25 rounded-full" />

            {/* Ground Asphalt Shadow */}
            <div className="absolute left-6 right-6 bottom-1 h-4 bg-black/35 rounded-full blur-[4px]" />

            {/* High-Detailed Scalable Vector Ambulance */}
            <svg viewBox="0 0 380 135" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="body-white" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="65%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>

                <linearGradient id="cab-hood-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>

                <linearGradient id="glass-tint" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <linearGradient id="headlight-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Headlight Forward Beam */}
              <polygon points="340,94 380,82 380,118 340,105" fill="url(#headlight-beam)" />

              {/* Roof AC & Aerodynamic Siren Unit */}
              <rect x="150" y="16" width="90" height="7" rx="3" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2" />
              
              {/* Flashing Lightbar Assembly */}
              <g transform="translate(160, 10)">
                <rect x="0" y="0" width="70" height="14" rx="4" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                {/* Red Flasher (Left) */}
                <rect x="2" y="2" width="31" height="10" rx="2.5" fill="#EF4444" className="beacon-a" />
                {/* Center White Strobe */}
                <rect x="33" y="3" width="4" height="8" rx="1" fill="#FFFFFF" opacity="0.9" />
                {/* Blue Flasher (Right) */}
                <rect x="37" y="2" width="31" height="10" rx="2.5" fill="#3B82F6" className="beacon-b" />
              </g>

              {/* Main High-Roof Patient Box Cabin */}
              <path
                d="M20,24 H260 V106 H20 C13.5,106 8,100.5 8,94 V36 C8,29.5 13.5,24 20,24 Z"
                fill="url(#body-white)"
                stroke="#1E293B"
                strokeWidth="3"
              />

              {/* Front Driver Cabin & Slanted Aerodynamic Hood */}
              <path
                d="M260,40 H304 C311,40 317.5,44 321,50 L345,86 H358 C362,86 365,89 365,93 V102 C365,104.5 362.5,106 358,106 H260 V40 Z"
                fill="url(#cab-hood-grad)"
                stroke="#1E293B"
                strokeWidth="3"
              />

              {/* Aerodynamic Tinted Windshield */}
              <path
                d="M268,46 H300 C305,46 309.5,49 312.5,53.5 L331,80 H268 V46 Z"
                fill="url(#glass-tint)"
                stroke="#1E293B"
                strokeWidth="2"
              />
              {/* Windshield Gloss Highlight */}
              <path d="M272,76 L298,49 H307 L281,76 Z" fill="#FFFFFF" opacity="0.3" />

              {/* Driver Door Window & Side Mirror */}
              <rect x="238" y="46" width="22" height="34" rx="3" fill="url(#glass-tint)" stroke="#1E293B" strokeWidth="2" />
              <rect x="264" y="60" width="8" height="10" rx="2" fill="#1E293B" />

              {/* Dual Patient Compartment Windows */}
              <rect x="45" y="38" width="60" height="28" rx="4" fill="url(#glass-tint)" stroke="#1E293B" strokeWidth="2" />
              <rect x="125" y="38" width="60" height="28" rx="4" fill="url(#glass-tint)" stroke="#1E293B" strokeWidth="2" />
              {/* Window gloss highlights */}
              <path d="M50,62 L74,40 H82 L58,62 Z" fill="#FFFFFF" opacity="0.25" />
              <path d="M130,62 L154,40 H162 L138,62 Z" fill="#FFFFFF" opacity="0.25" />

              {/* Door Panel Seam Lines & Handles */}
              <line x1="115" y1="28" x2="115" y2="104" stroke="#CBD5E1" strokeWidth="2" />
              <line x1="195" y1="28" x2="195" y2="104" stroke="#CBD5E1" strokeWidth="2" />
              <rect x="105" y="74" width="10" height="4" rx="2" fill="#475569" />
              <rect x="185" y="74" width="10" height="4" rx="2" fill="#475569" />
              <rect x="275" y="86" width="10" height="4" rx="2" fill="#475569" />

              {/* Red & High-Visibility Yellow Livery Chevron Stripes */}
              <path d="M8,78 H365 V92 H8 Z" fill="#DC2626" />
              <path d="M8,92 H365 V96 H8 Z" fill="#FACC15" />

              {/* Official Red Medical Cross Badge */}
              <g transform="translate(60, 43)">
                <circle cx="15" cy="15" r="13" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                <rect x="11.5" y="6" width="7" height="18" fill="#DC2626" rx="1" />
                <rect x="6" y="11.5" width="18" height="7" fill="#DC2626" rx="1" />
              </g>

              {/* Bold Institutional Text */}
              <text x="120" y="89" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.2">
                108 SEHAT TRIAGE+
              </text>
              <text x="20" y="89" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">
                AMBULANCE
              </text>

              {/* Front Headlights Assembly & Indicator */}
              <rect x="358" y="89" width="7" height="10" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
              <rect x="358" y="100" width="6" height="4" rx="1" fill="#EA580C" />
              {/* Rear Tail Stop Lights */}
              <rect x="7" y="80" width="3" height="14" rx="1" fill="#EF4444" />

              {/* Front Heavy-Duty Bumper */}
              <path d="M340,106 H365 V110 C365,113 362,115 359,115 H340 V106 Z" fill="#1E293B" />

              {/* Wheel Arches / Cutouts */}
              <path d="M62,106 C62,84 104,84 104,106 Z" fill="#0A0807" />
              <path d="M280,106 C280,84 322,84 322,106 Z" fill="#0A0807" />

              {/* Realistic Heavy-Duty Rotating Wheels */}
              {/* Rear Wheel */}
              <g className="spin-wheel origin-[83px_106px]">
                {/* Outer Rubber Tire */}
                <circle cx="83" cy="106" r="21" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                {/* Silver Alloy Rim */}
                <circle cx="83" cy="106" r="13" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
                {/* Rim Spokes */}
                <line x1="83" y1="94" x2="83" y2="118" stroke="#334155" strokeWidth="3" />
                <line x1="71" y1="106" x2="95" y2="106" stroke="#334155" strokeWidth="3" />
                <line x1="74" y1="97" x2="92" y2="115" stroke="#334155" strokeWidth="2.5" />
                <line x1="74" y1="115" x2="92" y2="97" stroke="#334155" strokeWidth="2.5" />
                {/* Center Hub */}
                <circle cx="83" cy="106" r="5" fill="#0F172A" />
                <circle cx="83" cy="106" r="2.5" fill="#DC2626" />
              </g>

              {/* Front Wheel */}
              <g className="spin-wheel origin-[301px_106px]">
                {/* Outer Rubber Tire */}
                <circle cx="301" cy="106" r="21" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                {/* Silver Alloy Rim */}
                <circle cx="301" cy="106" r="13" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
                {/* Rim Spokes */}
                <line x1="301" y1="94" x2="301" y2="118" stroke="#334155" strokeWidth="3" />
                <line x1="289" y1="106" x2="313" y2="106" stroke="#334155" strokeWidth="3" />
                <line x1="292" y1="97" x2="310" y2="115" stroke="#334155" strokeWidth="2.5" />
                <line x1="292" y1="115" x2="310" y2="97" stroke="#334155" strokeWidth="2.5" />
                {/* Center Hub */}
                <circle cx="301" cy="106" r="5" fill="#0F172A" />
                <circle cx="301" cy="106" r="2.5" fill="#DC2626" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Hero Circular Badge (Morph Transition) */}
      <div
        className={`fixed left-1/2 top-[42%] w-[196px] h-[196px] rounded-full bg-white border-2 border-[#E8E2D8] shadow-2xl flex items-center justify-center z-[101] transition-all duration-500 ${
          phaseB
            ? 'scale-100 opacity-100 -translate-x-1/2 -translate-y-1/2'
            : 'scale-0 opacity-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full bg-[#C86D51] transition-all duration-300 ${
              badgeLettersVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
          <span className="font-serif font-bold text-2xl text-[#2B1810]">
            {['T', 'r', 'i', 'a', 'g', 'e', '+'].map((char, i) => (
              <span
                key={i}
                className="inline-block transition-all duration-300"
                style={{
                  opacity: badgeLettersVisible ? 1 : 0,
                  transform: badgeLettersVisible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: `${i * 60}ms`
                }}
              >
                {char}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Expanding Pulse Rings */}
      <span
        ref={ring1Ref}
        className="fixed left-1/2 top-[42%] rounded-full border-[1.5px] border-[#C86D51] -translate-x-1/2 -translate-y-1/2 scale-[0.3] opacity-0 w-[110px] h-[110px] pointer-events-none z-[100]"
      />
      <span
        ref={ring2Ref}
        className="fixed left-1/2 top-[42%] rounded-full border-[1.5px] border-[#C86D51] -translate-x-1/2 -translate-y-1/2 scale-[0.3] opacity-0 w-[110px] h-[110px] pointer-events-none z-[100]"
      />

      <div className="absolute bottom-4 left-0 right-0 text-center text-[0.68rem] text-[#7A7265] tracking-wider opacity-70">
        tap anywhere to skip
      </div>
    </div>
  );
}
