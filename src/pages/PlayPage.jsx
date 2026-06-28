import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

const GAME_MODES = [
  { key: 'br', label: 'BR Match', icon: '🪂', pattern: 'parachute' },
  { key: 'clash_squad', label: 'Clash Squad', icon: '⚔️', pattern: 'clash' },
  { key: 'lone_wolf', label: 'Lone Wolf', icon: '🐺', pattern: 'wolf' },
  { key: 'cs_1v1_2v2', label: 'CS 1v1/2v2', icon: '🎯', pattern: 'duel' },
]

export default function PlayPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    async function loadCounts() {
      const { data } = await supabase
        .from('matches')
        .select('game_mode')
        .in('status', ['upcoming', 'live'])
      const tally = {}
      for (const row of data || []) {
        tally[row.game_mode] = (tally[row.game_mode] || 0) + 1
      }
      setCounts(tally)
    }
    loadCounts()
  }, [])

  return (
    <div>
      <TopBar title={profile?.username || 'Player'} subtitle="Welcome back" />

      <div className="px-5">
        <PromoBanner />

        <div className="flex items-center justify-between mb-3 mt-6">
          <h2 className="font-bold text-lg">Free Fire</h2>
          <span className="text-mist text-sm">Pick a mode</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => navigate(`/app/matches-list/${mode.key}`)}
              className="rounded-2xl text-left transition-transform active:scale-95 overflow-hidden relative h-44"
              style={{
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 10px 26px rgba(0,0,0,0.4)',
              }}
            >
              <ModeArt pattern={mode.pattern} />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.78) 100%)' }}
              />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                <span
                  className="text-base w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
                >
                  {mode.icon}
                </span>
                <div>
                  <p className="font-bold leading-tight text-[15px]" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>
                    {mode.label}
                  </p>
                  <p className="text-white/75 text-xs mt-0.5">{counts[mode.key] || 0} matches found</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <QuickLink icon="💰" label="Wallet" to="/app/wallet" navigate={navigate} />
          <QuickLink icon="🏆" label="Top Players" to="/app/top-players" navigate={navigate} />
          <QuickLink icon="📜" label="Rules" to="/app/rules" navigate={navigate} />
        </div>
      </div>
    </div>
  )
}

function PromoBanner() {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-gold/20 blur-xl" />
      <div className="relative z-10">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Featured</p>
        <p className="text-lg font-bold leading-snug">🔥 Win up to ৳10,000 today</p>
        <p className="text-sm text-white/80 mt-1">Join BR Matches and dominate the lobby.</p>
      </div>
    </div>
  )
}

// Rich original illustrated scenes — fully custom art (not based on any
// existing game's screenshots/characters), but built to feel like dramatic
// action-game key-art: layered sky, atmosphere, light, and silhouettes.
function ModeArt({ pattern }) {
  switch (pattern) {
    case 'parachute':
      return (
        <svg viewBox="0 0 300 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skyBR" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#FFCB6B" />
              <stop offset="35%" stopColor="#FF8C5A" />
              <stop offset="65%" stopColor="#E85D75" />
              <stop offset="100%" stopColor="#3D5A9C" />
            </linearGradient>
            <linearGradient id="seaBR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f6f8b" />
              <stop offset="100%" stopColor="#0b3a4a" />
            </linearGradient>
            <linearGradient id="islandBR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d5a3f" />
              <stop offset="100%" stopColor="#10241a" />
            </linearGradient>
            <radialGradient id="sunGlowBR" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE9B0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FFE9B0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="260" fill="url(#skyBR)" />
          <circle cx="235" cy="60" r="70" fill="url(#sunGlowBR)" />
          <circle cx="235" cy="60" r="26" fill="#FFE9B0" />
          {/* clouds */}
          <ellipse cx="55" cy="45" rx="50" ry="13" fill="#fff" opacity="0.3" />
          <ellipse cx="95" cy="35" rx="32" ry="9" fill="#fff" opacity="0.22" />
          <ellipse cx="180" cy="95" rx="40" ry="10" fill="#fff" opacity="0.18" />
          {/* sea */}
          <rect y="178" width="300" height="82" fill="url(#seaBR)" />
          <path d="M0 178 Q40 172 80 178 T160 178 T240 178 T300 176 V184 H0 Z" fill="#3a8aa0" opacity="0.5" />
          {/* island */}
          <path d="M-10 185 Q50 150 110 172 Q150 188 210 165 Q255 150 310 178 V260 H-10 Z" fill="url(#islandBR)" />
          <path d="M40 172 L48 150 L56 172 Z" fill="#14301f" />
          <path d="M150 168 L160 142 L172 168 Z" fill="#14301f" />
          {/* cargo plane silhouette */}
          <g transform="translate(28,78) rotate(-6)">
            <rect x="0" y="6" width="58" height="11" rx="5" fill="#16202b" />
            <rect x="18" y="-7" width="11" height="28" rx="3" fill="#16202b" />
            <rect x="44" y="2" width="16" height="5" rx="2" fill="#16202b" />
          </g>
          {/* parachute canopy with stripes */}
          <path d="M165 50 C135 50, 110 76, 110 92 L220 92 C220 76, 195 50, 165 50 Z" fill="#F2F2F2" />
          <path d="M132 92 C132 92, 140 64, 165 58" fill="none" stroke="#d33b4e" strokeWidth="7" opacity="0.85" />
          <path d="M198 92 C198 92, 190 64, 165 58" fill="none" stroke="#2e6bd6" strokeWidth="7" opacity="0.85" />
          <path d="M110 92 L220 92" stroke="#999" strokeWidth="1.3" />
          {[128, 144, 165, 186, 202].map((x, i) => (
            <line key={i} x1={x} y1="92" x2="165" y2="134" stroke="#ddd" strokeWidth="1.1" opacity="0.85" />
          ))}
          {/* jumper */}
          <g transform="translate(154,132)">
            <circle cx="11" cy="0" r="5.5" fill="#15202b" />
            <rect x="5" y="6" width="12" height="17" rx="4" fill="#23344a" />
            <line x1="3" y1="10" x2="-7" y2="2" stroke="#23344a" strokeWidth="4" strokeLinecap="round" />
            <line x1="19" y1="10" x2="29" y2="2" stroke="#23344a" strokeWidth="4" strokeLinecap="round" />
            <line x1="7" y1="22" x2="2" y2="38" stroke="#23344a" strokeWidth="4" strokeLinecap="round" />
            <line x1="15" y1="22" x2="20" y2="38" stroke="#23344a" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      )
    case 'clash':
      return (
        <svg viewBox="0 0 300 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skyCS" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2a0a18" />
              <stop offset="50%" stopColor="#7a1742" />
              <stop offset="100%" stopColor="#d6356a" />
            </linearGradient>
            <radialGradient id="flashCS" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD56B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFD56B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="floorCS" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a1024" />
              <stop offset="100%" stopColor="#150711" />
            </linearGradient>
          </defs>
          <rect width="300" height="260" fill="url(#skyCS)" />
          {/* distant building silhouettes */}
          <rect x="0" y="120" width="40" height="80" fill="#280f1d" opacity="0.7" />
          <rect x="50" y="100" width="30" height="100" fill="#280f1d" opacity="0.6" />
          <rect x="250" y="95" width="36" height="105" fill="#280f1d" opacity="0.6" />
          <rect x="210" y="115" width="28" height="85" fill="#280f1d" opacity="0.7" />
          {/* arena floor */}
          <rect y="200" width="300" height="60" fill="url(#floorCS)" />
          <line x1="0" y1="200" x2="300" y2="200" stroke="#ff8fb3" strokeWidth="1.3" opacity="0.45" />
          <line x1="0" y1="214" x2="300" y2="214" stroke="#ff8fb3" strokeWidth="0.7" opacity="0.18" />
          {/* crate cover center */}
          <rect x="210" y="150" width="52" height="50" rx="3" fill="#5a3a1f" />
          <rect x="210" y="150" width="52" height="50" rx="3" fill="none" stroke="#8a5a30" strokeWidth="2" />
          <line x1="210" y1="175" x2="262" y2="175" stroke="#8a5a30" strokeWidth="2" />
          {/* muzzle flash */}
          <circle cx="140" cy="160" r="26" fill="url(#flashCS)" />
          <circle cx="140" cy="160" r="6" fill="#FFE9B0" />
          {/* two opposing fighters */}
          <g transform="translate(48,140)">
            <circle cx="11" cy="0" r="8" fill="#1c1c24" />
            <rect x="2" y="9" width="18" height="27" rx="5" fill="#1a3a5c" />
            <line x1="20" y1="17" x2="40" y2="6" stroke="#1a3a5c" strokeWidth="5.5" strokeLinecap="round" />
            <rect x="34" y="-2" width="26" height="5" rx="2.5" fill="#cfd8e3" transform="rotate(-16 34 -2)" />
            <line x1="6" y1="36" x2="1" y2="62" stroke="#1a3a5c" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="16" y1="36" x2="21" y2="62" stroke="#1a3a5c" strokeWidth="5.5" strokeLinecap="round" />
          </g>
          <g transform="translate(228,140) scale(-1,1)">
            <circle cx="11" cy="0" r="8" fill="#1c1c24" />
            <rect x="2" y="9" width="18" height="27" rx="5" fill="#8a2030" />
            <line x1="20" y1="17" x2="40" y2="6" stroke="#8a2030" strokeWidth="5.5" strokeLinecap="round" />
            <rect x="34" y="-2" width="26" height="5" rx="2.5" fill="#f0b3b3" transform="rotate(-16 34 -2)" />
            <line x1="6" y1="36" x2="1" y2="62" stroke="#8a2030" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="16" y1="36" x2="21" y2="62" stroke="#8a2030" strokeWidth="5.5" strokeLinecap="round" />
          </g>
          {/* sparks */}
          <circle cx="155" cy="150" r="2" fill="#FFE9B0" />
          <circle cx="165" cy="158" r="1.4" fill="#FFE9B0" opacity="0.8" />
          <circle cx="148" cy="170" r="1.6" fill="#FFE9B0" opacity="0.7" />
        </svg>
      )
    case 'wolf':
      return (
        <svg viewBox="0 0 300 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skyLW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e0a22" />
              <stop offset="45%" stopColor="#2a1846" />
              <stop offset="80%" stopColor="#4a2456" />
              <stop offset="100%" stopColor="#1a0d28" />
            </linearGradient>
            <radialGradient id="moonGlowLW" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF6D9" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FFF6D9" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ridgeFarLW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a2754" />
              <stop offset="100%" stopColor="#241a38" />
            </linearGradient>
          </defs>
          <rect width="300" height="260" fill="url(#skyLW)" />
          <circle cx="225" cy="55" r="60" fill="url(#moonGlowLW)" />
          <circle cx="225" cy="55" r="26" fill="#FFF6D9" />
          <circle cx="217" cy="48" r="3" fill="#E8D9A8" opacity="0.5" />
          <circle cx="232" cy="62" r="2" fill="#E8D9A8" opacity="0.4" />
          {/* stars */}
          {[[40, 30], [70, 55], [110, 20], [150, 40], [30, 80], [180, 30], [260, 90]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.5} fill="#fff" opacity={0.4 + (i % 3) * 0.15} />
          ))}
          {/* far ridge */}
          <path d="M0 165 L50 130 L90 150 L140 110 L190 145 L240 120 L300 155 V260 H0 Z" fill="url(#ridgeFarLW)" opacity="0.7" />
          {/* near ridge */}
          <path d="M0 195 L45 150 L80 178 L130 130 L175 170 L220 140 L260 175 L300 155 V260 H0 Z" fill="#160d22" />
          {/* sparse pine silhouettes */}
          <path d="M55 150 L60 130 L65 150 Z M58 158 L62 142 L66 158 Z" fill="#0a0610" />
          <path d="M250 150 L256 128 L262 150 Z M253 160 L259 138 L265 160 Z" fill="#0a0610" />
          {/* lone wolf howling */}
          <g transform="translate(132,108) scale(1.15)">
            <path d="M0 46 L3 28 L2 16 L8 4 L16 -6 L24 -2 L26 8 L36 6 L44 14 L42 24 L32 26 L30 36 L20 46 Z" fill="#0a0610" />
            <path d="M2 46 L0 58 M9 46 L7 58 M34 30 L37 44 M27 32 L28 46" stroke="#0a0610" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 -6 L21 -16" stroke="#0a0610" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        </svg>
      )
    case 'duel':
      return (
        <svg viewBox="0 0 300 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skyDuel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#02261f" />
              <stop offset="55%" stopColor="#063b34" />
              <stop offset="100%" stopColor="#08110f" />
            </linearGradient>
            <radialGradient id="glowDuel" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#21e6a1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#21e6a1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="260" fill="url(#skyDuel)" />
          <circle cx="150" cy="110" r="110" fill="url(#glowDuel)" />
          {/* target rings */}
          <circle cx="150" cy="110" r="78" fill="none" stroke="#21e6a1" strokeWidth="1.4" opacity="0.22" />
          <circle cx="150" cy="110" r="55" fill="none" stroke="#21e6a1" strokeWidth="1.8" opacity="0.38" />
          <circle cx="150" cy="110" r="32" fill="none" stroke="#21e6a1" strokeWidth="2.2" opacity="0.55" />
          <circle cx="150" cy="110" r="7" fill="#21e6a1" opacity="0.85" />
          <line x1="150" y1="20" x2="150" y2="200" stroke="#21e6a1" strokeWidth="0.7" opacity="0.18" />
          <line x1="60" y1="110" x2="240" y2="110" stroke="#21e6a1" strokeWidth="0.7" opacity="0.18" />
          {/* corner HUD brackets */}
          {[[28, 28, 1, 1], [272, 28, -1, 1], [28, 232, 1, -1], [272, 232, -1, -1]].map(([x, y, sx, sy], i) => (
            <g key={i} transform={`translate(${x},${y}) scale(${sx},${sy})`}>
              <path d="M0 0 L18 0 M0 0 L0 18" stroke="#21e6a1" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            </g>
          ))}
          {/* low ground platform */}
          <path d="M0 200 L300 200 L300 260 L0 260 Z" fill="#04140f" opacity="0.85" />
          <line x1="0" y1="200" x2="300" y2="200" stroke="#21e6a1" strokeWidth="1" opacity="0.3" />
          {/* two facing fighters at range */}
          <g transform="translate(70,150)">
            <circle cx="9" cy="0" r="6.5" fill="#0d1f1a" />
            <rect x="2" y="7" width="14" height="22" rx="4" fill="#123528" />
            <line x1="16" y1="13" x2="32" y2="6" stroke="#123528" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="5" y1="28" x2="1" y2="48" stroke="#123528" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="13" y1="28" x2="17" y2="48" stroke="#123528" strokeWidth="4.5" strokeLinecap="round" />
          </g>
          <g transform="translate(212,150) scale(-1,1)">
            <circle cx="9" cy="0" r="6.5" fill="#0d1f1a" />
            <rect x="2" y="7" width="14" height="22" rx="4" fill="#1e5c3f" />
            <line x1="16" y1="13" x2="32" y2="6" stroke="#1e5c3f" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="5" y1="28" x2="1" y2="48" stroke="#1e5c3f" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="13" y1="28" x2="17" y2="48" stroke="#1e5c3f" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        </svg>
      )
    default:
      return null
  }
}

function QuickLink({ icon, label, to, navigate }) {
  return (
    <button onClick={() => navigate(to)} className="glass rounded-2xl py-4 flex flex-col items-center gap-1.5">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-mist">{label}</span>
    </button>
  )
}
