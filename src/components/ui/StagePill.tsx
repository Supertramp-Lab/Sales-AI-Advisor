import { STAGE_COLORS, STAGE_LIGHT, type Stage } from "@/lib/constants";

interface Props {
  stage: Stage;
  size?: "sm" | "md";
}

export function StagePill({ stage, size = "sm" }: Props) {
  const color = STAGE_COLORS[stage];
  const bg = STAGE_LIGHT[stage];
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 6,
        padding: size === "sm" ? "2px 9px" : "3px 12px",
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
      }}
    >
      {stage}
    </span>
  );
}
