import { C } from "@/lib/constants";

interface Props {
  score: number;
  max: number;
}

export function ScoreBar({ score, max }: Props) {
  const pct = score / max;
  const color = pct >= 0.75 ? C.success : pct >= 0.5 ? C.warning : C.danger;
  const bg = pct >= 0.75 ? C.successLight : pct >= 0.5 ? C.warningLight : C.dangerLight;
  return (
    <div
      style={{
        background: bg,
        borderRadius: 10,
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>/ {max}pt</div>
      </div>
      <div
        style={{ width: 4, height: 32, background: C.border, borderRadius: 2 }}
      >
        <div
          style={{
            width: "100%",
            height: `${pct * 100}%`,
            background: color,
            borderRadius: 2,
            marginTop: `${(1 - pct) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
