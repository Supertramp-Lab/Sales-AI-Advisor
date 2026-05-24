"use client";

import { C } from "@/lib/constants";

interface AppHeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function AppHeader({ left, right }: AppHeaderProps) {
  return (
    <header
      style={{
        background: C.bgCard,
        borderBottom: `1px solid ${C.border}`,
        padding: "13px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: C.shadowSm,
      }}
    >
      <div>{left ?? <AppLogo />}</div>
      {right !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
      )}
    </header>
  );
}

export function AppLogo({
  title,
  subtitle,
}: {
  title?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div>
      <div
        style={{ fontSize: 15, fontWeight: 800, color: C.textMain, letterSpacing: "-0.02em" }}
      >
        {title ?? (
          <>
            Appier <span style={{ color: C.brand }}>AI</span> Deal Room
          </>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1, letterSpacing: "0.04em" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
