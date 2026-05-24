"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C } from "@/lib/constants";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreDots } from "@/components/ui/ScoreDots";
import { StagePill } from "@/components/ui/StagePill";
import { AppHeader } from "@/components/ui/AppHeader";
import { AnalysisItem } from "./AnalysisItem";
import { NextActionItem } from "./NextActionItem";

interface Props {
  dealId: number;
  meetingId: number;
}

export function AnalysisView({ dealId, meetingId }: Props) {
  const router = useRouter();
  const {
    deals, approvalSettings, updateState, setUpdateState,
    handleCorrect, addManualItem,
    updateNextAction, toggleNextAction, deleteNextAction, addNextAction,
  } = useDealStore();

  const deal = deals.find((d) => d.id === dealId);
  const meeting = deal?.meetings.find((m) => m.id === meetingId);

  const [addingAction, setAddingAction] = useState(false);
  const [addingStrength, setAddingStrength] = useState(false);
  const [addingGap, setAddingGap] = useState(false);
  const [newActionText, setNewActionText] = useState("");
  const [newStrengthText, setNewStrengthText] = useState("");
  const [newGapText, setNewGapText] = useState("");

  if (!deal || !meeting) return null;

  const isWeekly = meeting.type === "weekly_review";
  const wr = meeting.weeklyReviewData;

  const S = {
    app: { minHeight: "100vh", background: C.bgMain },
    body: { padding: "20px", maxWidth: 700, margin: "0 auto" },
    card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: C.shadow },
    btn: { background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    btnGhost: { background: C.bgCard, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 13px", fontWeight: 500, fontSize: 12, cursor: "pointer" },
    back: { background: "transparent", color: C.brand, border: "none", padding: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    sec: { fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 },
    inp: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.textMain, fontSize: 13, flex: 1, outline: "none", fontFamily: "inherit" },
  };

  return (
    <div style={S.app}>
      <AppHeader
        left={
          <button style={S.back} onClick={() => router.push(`/deals/${dealId}`)}>
            ← {deal.company}
          </button>
        }
        right={
          isWeekly
            ? <span style={{ fontSize: 11, background: C.brandLight, color: C.brand, borderRadius: 5, padding: "2px 10px", fontWeight: 700 }}>チームレビュー</span>
            : <StagePill stage={meeting.stage} />
        }
      />

      {/* Update banners */}
      {updateState === "updating" && (
        <div style={{ background: C.brandLight, borderBottom: `1px solid ${C.brandMid}`, padding: "8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.brand, opacity: 0.3 + i * 0.35 }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: C.brand, fontWeight: 600 }}>AIが再評価中です。スコア・評語・サマライズを更新しています</span>
        </div>
      )}
      {updateState === "done" && (
        <div style={{ background: C.successLight, borderBottom: "1px solid #BBF7D0", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>✅ 更新完了　スコア・評語・サマライズを更新しました</span>
          <button onClick={() => setUpdateState(null)} style={{ background: "transparent", border: "none", color: C.success, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>閉じる</button>
        </div>
      )}

      <div style={S.body}>
        {/* Summary */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, marginRight: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {isWeekly ? "チームレビューサマリー" : "AI商談サマリー"}　{meeting.date}
                </div>
                {updateState === "updating" && (
                  <span style={{ fontSize: 10, color: C.brand, fontWeight: 600 }}>⟳ 更新中...</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: updateState === "updating" ? C.textMuted : C.textMain, lineHeight: 1.7, transition: "color 0.3s" }}>
                {meeting.summary}
              </div>
            </div>
            {!isWeekly && meeting.totalScore !== null && (
              <ScoreBar score={meeting.totalScore} max={meeting.maxScore!} />
            )}
          </div>
          {meeting.managerReview && (
            <div style={{ marginTop: 12, background: meeting.managerReview.status === "approved" ? C.successLight : C.dangerLight, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: meeting.managerReview.status === "approved" ? C.success : C.danger, marginBottom: 4 }}>
                {meeting.managerReview.status === "approved" ? "✅ MG確認済　再採点・移動完了" : "⚠️ MGコメントあり"}
              </div>
              <div style={{ fontSize: 12, color: C.textMain }}>「{meeting.managerReview.comment}」</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>— {meeting.managerReview.reviewer}　{meeting.managerReview.date}</div>
            </div>
          )}
        </div>

        {/* Weekly review sections */}
        {isWeekly && wr && (
          <>
            <div style={S.card}>
              <div style={{ ...S.sec, color: C.brand }}>💡 AIが抽出した発見・気づき</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>会議内容からAIが重要な発見をピックアップしました</div>
              {wr.findings.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.divider}` }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.brandLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.brand }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 13, color: C.textMain, lineHeight: 1.6 }}>{f}</span>
                </div>
              ))}
            </div>

            {wr.strategyChanges && wr.strategyChanges.length > 0 && (
              <div style={{ ...S.card, background: C.warningLight, borderColor: C.warning }}>
                <div style={{ ...S.sec, color: "#92400E" }}>⚡ 戦略変更</div>
                {wr.strategyChanges.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13, color: "#78350F" }}>
                    <span style={{ flexShrink: 0, fontWeight: 700 }}>→</span>
                    <span style={{ lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {wr.insightUpdate && (
              <div style={{ ...S.card, background: "#F0F9FF", borderColor: "#BAE6FD" }}>
                <div style={{ ...S.sec, color: "#0369A1" }}>🧠 顧客インサイット更新</div>
                <div style={{ fontSize: 12, color: "#0C4A6E", marginBottom: 6, lineHeight: 1.6 }}>
                  <strong>最新の態度：</strong>{wr.insightUpdate.attitude}
                </div>
                <div style={{ fontSize: 11, color: "#0369A1", background: "#E0F2FE", borderRadius: 6, padding: "6px 10px" }}>
                  変化：{wr.insightUpdate.change}
                </div>
              </div>
            )}
          </>
        )}

        {/* Exit Criteria */}
        {!isWeekly && meeting.criteriaScores.length > 0 && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ ...S.sec, marginBottom: 0 }}>Exit Criteria 評価</div>
                {updateState === "updating" && <span style={{ fontSize: 10, color: C.brand, fontWeight: 600 }}>⟳ 再評価中...</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: meeting.totalScore! / meeting.maxScore! >= 0.75 ? C.success : meeting.totalScore! / meeting.maxScore! >= 0.5 ? C.warning : C.danger }}>
                {meeting.totalScore} / {meeting.maxScore} 点
              </div>
            </div>
            {meeting.criteriaScores.map((cs) => (
              <div key={cs.id} style={{ borderBottom: `1px solid ${C.divider}`, padding: "12px 0", opacity: updateState === "updating" ? 0.6 : 1, transition: "opacity 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, background: C.bgMain, color: C.textSub, borderRadius: 5, padding: "2px 9px", fontWeight: 600, border: `1px solid ${C.border}` }}>{cs.label}</span>
                  <ScoreDots score={cs.score} updating={updateState === "updating"} />
                </div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, background: C.bgMain, borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 4 }}>評価背景</span>
                  {cs.comment}
                </div>
                {cs.recordSummary && (
                  <div style={{ fontSize: 12, color: C.brand, lineHeight: 1.6, background: C.brandLight, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.brand, display: "block", marginBottom: 4 }}>📋 会議録からの関連内容</span>
                    {cs.recordSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Customer Analysis */}
        {!isWeekly && meeting.customerAnalysis && (
          <div style={S.card}>
            <div style={S.sec}>顧客インサイト & 戦術提案</div>
            {[
              { label: "顧客の態度", icon: "🧠", text: meeting.customerAnalysis.attitude, bg: "#EFF6FF", color: "#1D4ED8" },
              { label: "コンテンツ好み", icon: "👁", text: meeting.customerAnalysis.preference, bg: "#F5F3FF", color: "#6D28D9" },
              { label: "推奨コミュニケーション戦術", icon: "🎯", text: meeting.customerAnalysis.tactics, bg: C.warningLight, color: "#B45309" },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 10, background: item.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 5 }}>{item.icon}　{item.label}</div>
                <div style={{ fontSize: 13, color: C.textMain, lineHeight: 1.7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {!isWeekly && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ ...S.sec, color: C.success, marginBottom: 0 }}>達成済み Exit Criteria</div>
              <button onClick={() => setAddingStrength(!addingStrength)} style={{ ...S.btnGhost, fontSize: 11, padding: "3px 10px" }}>＋ 手動追加</button>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              「未達に移動」申請は{approvalSettings.moveToAchieved ? "MG承認後に移動されます" : "承認不要で即時移動されます"}。
            </div>
            {meeting.strengths.map((item) => (
              <AnalysisItem
                key={item.id}
                item={item}
                type="strength"
                approvalSettings={approvalSettings}
                onCorrect={(id, t, r) => handleCorrect(dealId, meetingId, id, t, r)}
              />
            ))}
            {addingStrength && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <input
                  value={newStrengthText}
                  onChange={(e) => setNewStrengthText(e.target.value)}
                  placeholder="達成済み項目を入力..."
                  style={{ ...S.inp, fontSize: 12, padding: "7px 12px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addManualItem(dealId, meetingId, "strength", newStrengthText);
                      setNewStrengthText("");
                      setAddingStrength(false);
                    }
                  }}
                />
                <button
                  onClick={() => { addManualItem(dealId, meetingId, "strength", newStrengthText); setNewStrengthText(""); setAddingStrength(false); }}
                  style={{ ...S.btn, padding: "7px 12px", fontSize: 12 }}
                >追加</button>
              </div>
            )}
            {approvalSettings.manualAdd && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>※手動追加はMG承認が必要です</div>}
          </div>
        )}

        {/* Gaps */}
        {!isWeekly && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ ...S.sec, color: C.danger, marginBottom: 0 }}>未達・要確認項目</div>
              <button onClick={() => setAddingGap(!addingGap)} style={{ ...S.btnGhost, fontSize: 11, padding: "3px 10px" }}>＋ 手動追加</button>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              「達成済みに移動」申請は{approvalSettings.moveToAchieved ? "MG承認後に移動されます" : "承認不要で即時移動されます"}。
            </div>
            {meeting.gaps.map((item) => (
              <AnalysisItem
                key={item.id}
                item={item}
                type="gap"
                approvalSettings={approvalSettings}
                onCorrect={(id, t, r) => handleCorrect(dealId, meetingId, id, t, r)}
              />
            ))}
            {addingGap && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <input
                  value={newGapText}
                  onChange={(e) => setNewGapText(e.target.value)}
                  placeholder="未達項目を入力..."
                  style={{ ...S.inp, fontSize: 12, padding: "7px 12px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addManualItem(dealId, meetingId, "gap", newGapText);
                      setNewGapText("");
                      setAddingGap(false);
                    }
                  }}
                />
                <button
                  onClick={() => { addManualItem(dealId, meetingId, "gap", newGapText); setNewGapText(""); setAddingGap(false); }}
                  style={{ ...S.btn, padding: "7px 12px", fontSize: 12 }}
                >追加</button>
              </div>
            )}
          </div>
        )}

        {/* Next Actions */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ ...S.sec, color: C.brand, marginBottom: 0 }}>Next Action</div>
            <button onClick={() => setAddingAction(!addingAction)} style={{ ...S.btnGhost, fontSize: 11, padding: "4px 12px" }}>＋ 追加</button>
          </div>
          {meeting.nextActions.map((a) => (
            <NextActionItem
              key={a.id}
              action={a}
              onEdit={(id, text) => updateNextAction(dealId, meetingId, id, text)}
              onToggle={(id) => toggleNextAction(dealId, meetingId, id)}
              onDelete={(id) => deleteNextAction(dealId, meetingId, id)}
            />
          ))}
          {addingAction && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="新しいアクションを入力..."
                style={{ ...S.inp, fontSize: 13, padding: "8px 12px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNextAction(dealId, meetingId, newActionText, isWeekly);
                    setNewActionText("");
                    setAddingAction(false);
                  }
                }}
              />
              <button
                onClick={() => { addNextAction(dealId, meetingId, newActionText, isWeekly); setNewActionText(""); setAddingAction(false); }}
                style={{ ...S.btn, padding: "8px 14px", fontSize: 12 }}
              >追加</button>
            </div>
          )}
        </div>

        {/* Corrections Log */}
        {meeting.corrections.length > 0 && (
          <div style={S.card}>
            <div style={S.sec}>申請・修正履歴</div>
            {meeting.corrections.map((c) => (
              <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ background: C.bgMain, borderRadius: 4, padding: "1px 7px", fontSize: 10, color: C.textSub, border: `1px solid ${C.border}` }}>
                    {c.type === "moveToAchieved" ? "達成済みへ移動" : c.type === "moveToUnachieved" ? "未達へ移動" : c.type === "aiMistake" ? "AI判断間違い" : "手動追加"}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{c.date}</span>
                  {c.autoResolved && <span style={{ fontSize: 10, background: C.successLight, color: C.success, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>承認不要・即時反映</span>}
                  {!c.autoResolved && (
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, background: c.status === "pending" ? C.warningLight : c.status === "resolved" ? C.successLight : C.dangerLight, color: c.status === "pending" ? C.warning : c.status === "resolved" ? C.success : C.danger, borderRadius: 4, padding: "1px 8px" }}>
                      {c.status === "pending" ? "⏳ MG承認待ち" : c.status === "resolved" ? "✓ 承認・反映済" : "✗ 却下"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{c.reason || c.itemText}</div>
              </div>
            ))}
          </div>
        )}

        <button
          style={{ ...S.btn, width: "100%", padding: "12px" }}
          onClick={() => router.push(`/deals/${dealId}/chat?mid=${meetingId}`)}
        >
          💬　AIに相談する
        </button>
      </div>
    </div>
  );
}
