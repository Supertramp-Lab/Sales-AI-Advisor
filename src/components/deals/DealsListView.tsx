"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C, STAGES, CLOSE_REASONS, type Stage } from "@/lib/constants";
import { latestScore, daysSinceLast, currentStageDays, activeActionsCount, pendingCorrectionsCount } from "@/lib/dealUtils";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StagePill } from "@/components/ui/StagePill";
import { AppHeader, AppLogo } from "@/components/ui/AppHeader";
import { NewDealDialog } from "@/components/deals/NewDealDialog";
import { DealSyncer } from "@/components/providers/DealSyncer";

type StageFilter = "all" | Stage | "won" | "lost";
type SortKey = "lastUpdate" | "score" | "leadTime";

export function DealsListView() {
  const router = useRouter();
  const { deals, isLoaded, closeDeal } = useDealStore();
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sort, setSort] = useState<SortKey>("lastUpdate");
  const [closeModal, setCloseModal] = useState<number | null>(null);
  const [closeType, setCloseType] = useState<"won" | "lost">("won");
  const [closeReason, setCloseReason] = useState("");
  const [newDealOpen, setNewDealOpen] = useState(false);

  const pendingTotal = deals.reduce(
    (a, d) => a + pendingCorrectionsCount(d.meetings),
    0
  );
  const unreviewedTotal = deals.reduce(
    (a, d) => a + d.meetings.filter((m) => !m.managerReview).length,
    0
  );

  const filteredDeals = deals
    .filter((d) => {
      if (stageFilter === "won") return d.status === "won";
      if (stageFilter === "lost") return d.status === "lost";
      if (stageFilter !== "all") return d.stage === stageFilter && d.status === "active";
      return true;
    })
    .sort((a, b) => {
      if (sort === "score") return (latestScore(b)?.score ?? 0) - (latestScore(a)?.score ?? 0);
      if (sort === "leadTime") return daysSinceLast(b) - daysSinceLast(a);
      return 0;
    });

  const handleClose = () => {
    if (closeModal === null) return;
    closeDeal(closeModal, closeType, closeReason);
    setCloseModal(null);
    setCloseReason("");
  };

  const S = {
    app: { minHeight: "100vh", background: C.bgMain },
    body: { padding: "20px", maxWidth: 700, margin: "0 auto" },
    card: {
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      boxShadow: C.shadow,
    },
    btn: {
      background: C.brand,
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "10px 18px",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
    },
    btnGhost: {
      background: C.bgCard,
      color: C.textSub,
      border: `1px solid ${C.border}`,
      borderRadius: 7,
      padding: "6px 13px",
      fontWeight: 500,
      fontSize: 12,
      cursor: "pointer",
    },
    pill: (on: boolean) => ({
      background: on ? C.brand : C.bgCard,
      color: on ? "#fff" : C.textSub,
      border: `1px solid ${on ? C.brand : C.border}`,
      borderRadius: 20,
      padding: "5px 14px",
      fontSize: 11,
      fontWeight: on ? 600 : 500,
      cursor: "pointer",
    }),
  };

  return (
    <div style={S.app}>
      <DealSyncer />
      {newDealOpen && <NewDealDialog onClose={() => setNewDealOpen(false)} />}
      {!isLoaded && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FA", zIndex: 999 }}>
          <p style={{ color: "#6B7280", fontSize: 14 }}>読み込み中...</p>
        </div>
      )}
      <AppHeader
        left={<AppLogo subtitle="REVENUE INTELLIGENCE HUB" />}
        right={
          <>
            <button
              style={{ ...S.btnGhost, position: "relative" }}
              onClick={() => router.push("/manager")}
            >
              Strategy Console
              {pendingTotal + unreviewedTotal > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: C.danger,
                    color: "#fff",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingTotal + unreviewedTotal}
                </span>
              )}
            </button>
            <button style={S.btn} onClick={() => setNewDealOpen(true)}>＋ 新規案件</button>
          </>
        }
      />

      <div style={S.body}>
        {/* Pipeline Overview */}
        <div style={{ ...S.card, background: C.brand, border: "none", marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Pipeline Overview
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "進行中", value: deals.filter((d) => d.status === "active").length, unit: "件" },
              { label: "平均スコア", value: 68, unit: "pt" },
              { label: "Won", value: deals.filter((d) => d.status === "won").length, unit: "件" },
              {
                label: "Next Action",
                value: deals.reduce((sum, d) => sum + activeActionsCount(d.meetings), 0),
                unit: "件",
              },
            ].map((k, i) => (
              <div
                key={k.label}
                style={{
                  textAlign: "center",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  padding: "0 8px",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: "0.04em" }}>
                  {k.unit}　{k.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {[{ v: "all", l: "すべて" }, ...STAGES.map((s) => ({ v: s, l: s })), { v: "won", l: "Won" }, { v: "lost", l: "Lost" }].map(
            (f) => (
              <button
                key={f.v}
                style={S.pill(stageFilter === f.v)}
                onClick={() => setStageFilter(f.v as StageFilter)}
              >
                {f.l}
              </button>
            )
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>並び替え</span>
          {[{ v: "lastUpdate", l: "最終更新" }, { v: "score", l: "スコア" }, { v: "leadTime", l: "未対応日数" }].map((s) => (
            <button
              key={s.v}
              style={{ ...S.pill(sort === s.v), padding: "3px 11px" }}
              onClick={() => setSort(s.v as SortKey)}
            >
              {s.l}
            </button>
          ))}
        </div>

        {/* Deal Cards */}
        {filteredDeals.map((d) => {
          const sc = latestScore(d);
          const daysSince = daysSinceLast(d);
          const stageDays = currentStageDays(d);
          const isWon = d.status === "won";
          const isLost = d.status === "lost";
          const isStale = daysSince >= 10 && !isWon && !isLost;
          const activeCount = activeActionsCount(d.meetings);

          return (
            <div
              key={d.id}
              style={{
                ...S.card,
                cursor: "pointer",
                borderLeft: isStale
                  ? `3px solid ${C.danger}`
                  : isWon
                  ? `3px solid ${C.success}`
                  : isLost
                  ? `3px solid ${C.danger}`
                  : "3px solid transparent",
              }}
              onClick={() => router.push(`/deals/${d.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(46,67,184,0.12)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = C.shadow;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textMain }}>{d.company}</div>
                    {isWon && (
                      <span style={{ fontSize: 10, background: C.successLight, color: C.success, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>Won</span>
                    )}
                    {isLost && (
                      <span style={{ fontSize: 10, background: C.dangerLight, color: C.danger, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>Lost</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, marginBottom: 10 }}>
                    👤 {d.contact}　担当 {d.owner}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    {!isWon && !isLost && <StagePill stage={d.stage} />}
                    {d.products.map((p) => (
                      <span
                        key={p}
                        style={{ fontSize: 10, background: C.bgMain, color: C.textSub, borderRadius: 4, padding: "1px 8px", border: `1px solid ${C.border}` }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, alignItems: "center" }}>
                    <span style={{ color: isStale ? C.danger : C.textMuted }}>
                      最終商談{" "}
                      <strong style={{ color: isStale ? C.danger : C.textSub }}>{daysSince}日前</strong>
                    </span>
                    {!isWon && !isLost && (
                      <span style={{ color: C.textMuted }}>
                        現Stage <strong style={{ color: C.textSub }}>{stageDays}日</strong>
                      </span>
                    )}
                    {activeCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, background: C.brandLight, color: C.brand, borderRadius: 5, padding: "2px 8px", fontWeight: 600, fontSize: 10 }}>
                        🎯 Next Action {activeCount}件
                      </span>
                    )}
                  </div>
                </div>
                {sc && <ScoreBar score={sc.score} max={sc.max} />}
              </div>
              {!isWon && !isLost && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCloseModal(d.id);
                  }}
                  style={{
                    marginTop: 12,
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    color: C.textMuted,
                    fontSize: 11,
                    padding: "5px 14px",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  案件をクローズ
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Close Modal */}
      {closeModal !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 26,
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain, marginBottom: 18 }}>
              案件をクローズする
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button
                onClick={() => setCloseType("won")}
                style={{
                  flex: 1,
                  background: closeType === "won" ? C.success : C.bgMain,
                  color: closeType === "won" ? "#fff" : C.textSub,
                  border: `1px solid ${closeType === "won" ? C.success : C.border}`,
                  borderRadius: 9,
                  padding: 11,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                🏆 Close Won
              </button>
              <button
                onClick={() => setCloseType("lost")}
                style={{
                  flex: 1,
                  background: closeType === "lost" ? C.danger : C.bgMain,
                  color: closeType === "lost" ? "#fff" : C.textSub,
                  border: `1px solid ${closeType === "lost" ? C.danger : C.border}`,
                  borderRadius: 9,
                  padding: 11,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ❌ Close Lost
              </button>
            </div>
            {closeType === "lost" && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  失注理由
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {CLOSE_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setCloseReason(r)}
                      style={{ ...S.pill(closeReason === r), padding: "4px 11px" }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  background: closeType === "won" ? C.success : C.danger,
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  padding: 11,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                確定
              </button>
              <button
                onClick={() => setCloseModal(null)}
                style={{ flex: 1, ...S.btnGhost, borderRadius: 9, padding: 11 }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
