export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'w-10 h-10', text: 'text-sm', radius: 'rounded-xl' },
    md: { box: 'w-16 h-16', text: 'text-xl', radius: 'rounded-2xl' },
    lg: { box: 'w-20 h-20', text: 'text-2xl', radius: 'rounded-3xl' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div
      className={`${s.box} ${s.radius} flex items-center justify-center relative overflow-hidden select-none`}
      style={{
        background: 'linear-gradient(135deg, #6C5CE7 0%, #2E7BFF 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.45) inset, 0 10px 24px -8px rgba(46,123,255,0.55)',
        border: '1px solid rgba(255,255,255,0.35)',
      }}
    >
      <span
        className={`font-black ${s.text} tracking-tight relative z-10`}
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
      >
        KCK
      </span>
      {/* glass sheen */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%)' }}
      />
    </div>
  )
}
