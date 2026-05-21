import { C } from "@/lib/constants";

interface Props {
  score: number;
  updating?: boolean;
}

export function ScoreDots({ score, updating }: Props) {
  const color = score >= 4 ? C.success : score >= 3 ? C.warning : C.danger;
  if (updating) {
    return <span style={{ fontSize: 11, color: C.brand, fontWeight: 600 }}>⟳</span>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: n <= score ? color : C.border,
          }}
        />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: C.textMain, marginLeft: 4 }}>
        {score}/5
      </span>
    </div>
  );
}
