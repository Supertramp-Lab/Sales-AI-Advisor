import { STAGES, STAGE_COLORS, STAGE_LIGHT, C, type Stage } from "@/lib/constants";

interface Props {
  currentStage: Stage;
}

export function StageProgress({ currentStage }: Props) {
  const idx = STAGES.indexOf(currentStage);
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
      {STAGES.map((s, i) => {
        const c = STAGE_COLORS[s];
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done ? C.success : active ? c : C.bgMain,
                  border: `2px solid ${done ? C.success : active ? c : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: done || active ? "#fff" : C.textMuted,
                  boxShadow: active ? `0 0 0 4px ${STAGE_LIGHT[s]}` : "none",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: active ? c : done ? C.success : C.textMuted,
                  marginTop: 4,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {s}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  height: 2,
                  flex: 1,
                  background: i < idx ? C.success : C.border,
                  marginBottom: 16,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
