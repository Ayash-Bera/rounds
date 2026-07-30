const ORBS = [
  { size: 132, top: "6%", left: "62%", color: "var(--status-full)", delay: "0s", duration: "14s" },
  { size: 72, top: "18%", left: "84%", color: "var(--status-partial)", delay: "-3s", duration: "11s" },
  { size: 96, top: "42%", left: "70%", color: "var(--brand-violet)", delay: "-7s", duration: "16s" },
  { size: 54, top: "60%", left: "88%", color: "var(--status-empty)", delay: "-2s", duration: "9s" },
  { size: 168, top: "58%", left: "48%", color: "var(--brand-violet)", delay: "-10s", duration: "19s" },
  { size: 44, top: "8%", left: "40%", color: "var(--status-full)", delay: "-5s", duration: "10s" },
  { size: 84, top: "78%", left: "66%", color: "var(--brand-mint)", delay: "-8s", duration: "13s" },
  { size: 60, top: "32%", left: "30%", color: "var(--status-partial)", delay: "-1s", duration: "12s" },
];

export function OrbField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,var(--brand-mist)_0%,transparent_60%)]" />
      {ORBS.map((orb, i) => (
        <span
          key={i}
          className="orb absolute rounded-full"
          style={
            {
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              "--orb-color": orb.color,
              animationDelay: orb.delay,
              animationDuration: orb.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
