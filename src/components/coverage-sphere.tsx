const RING_COUNT = 7;
const RING_RADIUS = 30;
const ORBIT_RADIUS = 13;

const rings = Array.from({ length: RING_COUNT }, (_, i) => {
  const angle = (i / RING_COUNT) * Math.PI * 2;
  return {
    cx: 50 + ORBIT_RADIUS * Math.cos(angle),
    cy: 50 + ORBIT_RADIUS * Math.sin(angle),
  };
});

export function CoverageSphere() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="absolute h-56 w-56 rounded-full bg-white/[0.05] blur-3xl md:h-72 md:w-72" />

      <svg viewBox="0 0 100 100" className="sphere-rings relative h-56 w-56 md:h-72 md:w-72">
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx={ring.cx}
            cy={ring.cy}
            r={RING_RADIUS}
            fill="none"
            stroke="white"
            strokeOpacity={0.14}
            strokeWidth="0.5"
          />
        ))}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="var(--status-full)"
          strokeWidth="0.6"
          strokeDasharray="8 6"
          className="sphere-sweep"
          style={{ filter: "drop-shadow(0 0 4px var(--status-full))" }}
        />
      </svg>

      <div className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_18px_6px_rgba(255,255,255,0.45)]" />
    </div>
  );
}
