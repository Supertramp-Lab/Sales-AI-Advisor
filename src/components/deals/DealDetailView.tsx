"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C } from "@/lib/constants";
import { latestScore, daysSinceLast, daysBetween } from "@/lib/dealUtils";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StagePill } from "@/components/ui/StagePill";
import { StageProgress } from "@/components/ui/StageProgress";
import { AppHeader, AppLogo } from "@/components/ui/AppHeader";

interface Props {
  dealId: number;
  fromManager?: boolean;
}

export function DealDetailView({ dealId, fromManager }: Props) {
  const router = useRouter();
  const { deals, pendingStageChange } = useDealStore();
  const [expandedActions, setExpandedActions] = useState(false);

  const deal = deals.find((d) => d.id === dealId);
  if (!deal) return null;

  const sc = latestScore(deal);
  const daysSince = daysSinceLast(deal);

  const commercialMeetings = deal.meetings.filter((m) => m.type === "commercial");
  const reviewMeetings = deal.meetings.filter((m) => m.type === "weekly_review");
  const latestCommercial = commercialMeetings[commercialMeetings.length - 1];
  const latestReview = reviewMeetings[reviewMeetings.length - 1];
  const activeActions = deal.meetings.flatMap((m) => m.nextActions).filter((a) => a.status === "active");
  const lastTwo = [...deal.meetings].slice(-2);
  const overviewParts = lastTwo.map((m) =>
    m.type === "weekly_review"
      ? `【チームレビュー ${m.date}】${m.summary}`
      : `【商談 ${m.date} / ${m.stage}】${m.summary}`
  );
  const overview = overviewParts.join("　");
  const shownActions = expandedActions ? activeActions : activeActions.slice(0, 4);

  const S = {
    app: { minHeight: "100vh", background: C.bgMain },
    body: { padding: "20px", maxWidth: 700, margin: "0 auto" },
    card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: C.shadow },
    btn: { background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    btnGhost: { background: C.bgCard, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 13px", fontWeight: 500, fontSize: 12, cursor: "pointer" },
    back: { background: "transparent", color: C.brand, border: "none", padding: "0 0 16px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    sec: { fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 },
  };

  return (
    <div style={S.app}>
      <AppHeader
        left={<AppLogo />}
        right={
          <>
            {fromManager && (
              <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>
                MG閲覧中
              </span>
            )}
            <button style={S.btnGhost} onClick={() => router.push(fromManager ? "/manager" : "/deals")}>
              {fromManager ? "← Strategy Console" : "Strategy Console"}
            </button>
          </>
        }
      />

      <div style={S.body}>
        <button style={S.back} onClick={() => router.push(fromManager ? "/manager" : "/deals")}>
          ← {fromManager ? "Strategy Console" : "Pipeline"}
        </button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: C.textMain, letterSpacing: "-0.02em" }}>{deal.company}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>👤 {deal.contact}　担当 {deal.owner}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {deal.products.map((p) => (
                <span key={p} style={{ fontSize: 11, background: C.brandLight, color: C.brand, borderRadius: 5, padding: "2px 9px", fontWeight: 500 }}>{p}</span>
              ))}
            </div>
          </div>
          {sc && <ScoreBar score={sc.score} max={sc.max} />}
        </div>

        {/* Stage Lead Time */}
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={S.sec}>Stage Lead Time</div>
          <div style={{ display: "flex", gap: 6 }}>
            {deal.stageHistory.map((sh, i) => {
              const days = daysBetween(sh.enteredAt, sh.exitedAt);
              const c = C.brand;
              const isCurrent = sh.exitedAt === null;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 6px", background: isCurrent ? C.brandLight : C.bgMain, borderRadius: 10, border: `1px solid ${isCurrent ? c + "40" : C.border}` }}>
                  <div style={{ fontSize: 9, color: isCurrent ? c : C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>
                    {sh.isRegression && <span style={{ color: C.warning }}>↩ </span>}
                    {sh.stage}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: isCurrent ? c : C.textSub, marginTop: 4, lineHeight: 1 }}>{days}</div>
                  <div style={{ fontSize: 9, color: isCurrent ? c : C.textMuted, marginTop: 2 }}>{isCurrent ? "日　現在" : "日"}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 12 }}>
            最終商談から{" "}
            <strong style={{ color: daysSince >= 10 ? C.danger : C.textSub }}>{daysSince} 日</strong>
          </div>
          {pendingStageChange && pendingStageChange.dealId === dealId && (
            <div style={{ marginTop: 10, background: C.warningLight, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.warning}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, marginBottom: 3 }}>⏳ ステージ後退申請中</div>
              <div style={{ fontSize: 12, color: "#92400E" }}>「{pendingStageChange.fromStage}」→「{pendingStageChange.toStage}」への変更がMG承認待ちです。</div>
            </div>
          )}
        </div>

        <StageProgress currentStage={deal.stage} />

        <button
          style={{ ...S.btn, width: "100%", marginBottom: 16, padding: "12px" }}
          onClick={() => router.push(`/deals/${dealId}/upload`)}
        >
          📎　商談録音・議事録をアップロード
        </button>

        {/* 案件サマリー */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)", border: `1px solid ${C.brandMid}`, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.brand, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>案件サマリー</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>現在のStage</span>
              <StagePill stage={deal.stage} />
            </div>
            {latestCommercial && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>最新商談日</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMain }}>{latestCommercial.date}</span>
              </div>
            )}
            {latestReview && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>最新チームレビュー</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.brand }}>{latestReview.date}</span>
              </div>
            )}
          </div>
          <div style={{ background: C.bgCard, borderRadius: 8, padding: "10px 14px", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>最新総括</div>
            <div style={{ fontSize: 12, color: C.textMain, lineHeight: 1.8 }}>{overview}</div>
          </div>
          {activeActions.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.brand, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                アクティブなNext Action　{activeActions.length}件
              </div>
              {shownActions.map((a, i) => (
                <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", borderBottom: i < shownActions.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                  <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 3, padding: "1px 5px", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: C.textMain, lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
              {activeActions.length > 4 && (
                <button
                  onClick={() => setExpandedActions(!expandedActions)}
                  style={{ marginTop: 8, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.brand, fontSize: 11, fontWeight: 600, padding: "4px 12px", cursor: "pointer", width: "100%" }}
                >
                  {expandedActions ? `▲ 折りたたむ` : `▼ 残り ${activeActions.length - 4} 件を表示`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 累積顧客インサイト */}
        {deal.cumulativeInsight && (
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>顧客インサイト（累積）</div>
            {[
              { label: "顧客の態度", icon: "🧠", text: deal.cumulativeInsight.attitude, bg: "#EFF6FF", color: "#1D4ED8" },
              { label: "コンテンツ好み", icon: "👁", text: deal.cumulativeInsight.preference, bg: "#F5F3FF", color: "#6D28D9" },
              { label: "推奨戦術", icon: "🎯", text: deal.cumulativeInsight.tactics, bg: C.warningLight, color: "#B45309" },
            ].map((item) => (
              <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.icon}　{item.label}</div>
                <div style={{ fontSize: 12, color: C.textMain, lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.06em" }}>インサイト変化履歴</div>
              {deal.cumulativeInsight.history.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.divider}`, fontSize: 12 }}>
                  <span style={{ color: C.textMuted, flexShrink: 0, minWidth: 70 }}>{h.date}</span>
                  <StagePill stage={h.stage} />
                  <span style={{ color: C.textSub, flex: 1 }}>{h.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 商談履歴 */}
        <div style={S.sec}>商談履歴</div>
        {[...deal.meetings].reverse().map((m) => {
          const pc = m.corrections.filter((c) => c.status === "pending").length;
          const isWeekly = m.type === "weekly_review";
          const mActiveCount = m.nextActions.filter((a) => a.status === "active").length;
          return (
            <div
              key={m.id}
              style={{ ...S.card, cursor: "pointer" }}
              onClick={() => router.push(`/deals/${dealId}/meetings/${m.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(46,67,184,0.1)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {isWeekly
                    ? <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "1px 8px", fontWeight: 700 }}>チームレビュー</span>
                    : <StagePill stage={m.stage} />
                  }
                  <span style={{ fontSize: 11, color: C.textMuted }}>{m.date}</span>
                  {pc > 0 && <span style={{ fontSize: 10, background: C.warningLight, color: C.warning, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{pc}件承認待ち</span>}
                  {m.managerReview?.status === "approved" && <span style={{ fontSize: 10, background: C.successLight, color: C.success, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>✓ MG確認済</span>}
                  {mActiveCount > 0 && <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>🎯 {mActiveCount}件</span>}
                </div>
                {m.totalScore !== null
                  ? <span style={{ fontSize: 16, fontWeight: 800, color: m.totalScore / m.maxScore! >= 0.75 ? C.success : m.totalScore / m.maxScore! >= 0.5 ? C.warning : C.danger }}>{m.totalScore}<span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>/{m.maxScore}</span></span>
                  : <span style={{ fontSize: 11, color: C.textMuted }}>―</span>
                }
              </div>
              <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{m.summary.slice(0, 95)}...</div>
              <div style={{ marginTop: 10, fontSize: 11, color: C.brand, fontWeight: 600 }}>詳細を確認 →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
