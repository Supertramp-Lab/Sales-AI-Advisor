"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C, OWNERS, APPROVAL_KEYS } from "@/lib/constants";
import { latestScore, daysSinceLast, pendingCorrectionsCount } from "@/lib/dealUtils";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StagePill } from "@/components/ui/StagePill";

type MgTab = "review" | "quarter" | "settings" | "rules";

export function ManagerView() {
  const router = useRouter();
  const {
    deals, approvalSettings, pendingStageChange, updateState,
    setApprovalSettings, handleReview, approveStagePending, rejectStagePending,
    summaryRule, insightRule, setSummaryRule, setInsightRule,
  } = useDealStore();

  const [mgTab, setMgTab] = useState<MgTab>("review");
  const [mgrOwner, setMgrOwner] = useState("全員");
  const [mgrStatus, setMgrStatus] = useState("all");
  const [mgrComments, setMgrComments] = useState<Record<string, string>>({});
  const [editingRule, setEditingRule] = useState(false);
  const [ruleDraft, setRuleDraft] = useState("");
  const [editingInsightRule, setEditingInsightRule] = useState(false);
  const [insightRuleDraft, setInsightRuleDraft] = useState("");

  const allM = deals.flatMap((d) =>
    d.meetings.map((m) => ({
      ...m,
      dealId: d.id,
      dealName: d.company,
      contact: d.contact,
      owner: d.owner,
      products: d.products,
    }))
  );

  const filtered = allM
    .filter((m) => mgrOwner === "全員" || m.owner === mgrOwner)
    .filter((m) => {
      if (mgrStatus === "all") return true;
      if (mgrStatus === "pending") return m.corrections.some((c) => c.status === "pending");
      if (mgrStatus === "unreviewed") return !m.managerReview;
      return !!m.managerReview;
    });

  const pendingTotal = deals.reduce((a, d) => a + pendingCorrectionsCount(d.meetings), 0);
  const unreviewedTotal = deals.reduce((a, d) => a + d.meetings.filter((m) => !m.managerReview).length, 0);

  const S = {
    app: { minHeight: "100vh", background: C.bgMain },
    bar: { background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: "13px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 10, boxShadow: C.shadowSm },
    body: { padding: "20px", maxWidth: 700, margin: "0 auto" },
    card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: C.shadow },
    btn: { background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    btnGhost: { background: C.bgCard, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 13px", fontWeight: 500, fontSize: 12, cursor: "pointer" },
    sec: { fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 },
    pill: (on: boolean) => ({ background: on ? C.brand : C.bgCard, color: on ? "#fff" : C.textSub, border: `1px solid ${on ? C.brand : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: on ? 600 : 500, cursor: "pointer" }),
    tabBtn: (on: boolean) => ({ background: on ? C.brand : "transparent", color: on ? "#fff" : C.textSub, border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: on ? 600 : 500, cursor: "pointer" }),
    inp: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.textMain, fontSize: 13, flex: 1, outline: "none", fontFamily: "inherit" },
  };

  return (
    <div style={S.app}>
      <div style={S.bar}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textMain, letterSpacing: "-0.02em" }}>
            Appier <span style={{ color: C.brand }}>AI</span> Strategy Console
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1, letterSpacing: "0.04em" }}>REVENUE COMMAND CENTER</div>
        </div>
        <button style={S.btnGhost} onClick={() => router.push("/deals")}>← Deal Room</button>
      </div>

      <div style={S.body}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: C.bgMain, borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {[
            { v: "review", l: "📋 確認・審査" },
            { v: "quarter", l: "📈 季度レポート" },
            { v: "settings", l: "⚙️ 承認設定" },
            { v: "rules", l: "📝 ルール設定" },
          ].map((t) => (
            <button key={t.v} style={{ ...S.tabBtn(mgTab === t.v), flex: 1 }} onClick={() => setMgTab(t.v as MgTab)}>{t.l}</button>
          ))}
        </div>

        {/* SETTINGS TAB */}
        {mgTab === "settings" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain, marginBottom: 4 }}>承認設定</div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 18, lineHeight: 1.6 }}>
              各申請タイプについて、MG承認が必要かどうかを設定します。「承認不要」の場合、Sales申請が即時反映されます。
            </div>
            {APPROVAL_KEYS.map((ak) => (
              <div key={ak.key} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>{ak.label}</div>
                  <div style={{ fontSize: 11, color: approvalSettings[ak.key as keyof typeof approvalSettings] ? C.warning : C.success, marginTop: 3, fontWeight: 600 }}>
                    {approvalSettings[ak.key as keyof typeof approvalSettings] ? "🔒 MG承認が必要" : "✅ 承認不要（即時反映）"}
                  </div>
                </div>
                <button
                  onClick={() => setApprovalSettings(ak.key as keyof typeof approvalSettings, !approvalSettings[ak.key as keyof typeof approvalSettings])}
                  style={{ background: approvalSettings[ak.key as keyof typeof approvalSettings] ? C.warning : C.success, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer", flexShrink: 0 }}
                >
                  {approvalSettings[ak.key as keyof typeof approvalSettings] ? "承認不要に変更" : "承認必要に変更"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REVIEW TAB */}
        {mgTab === "review" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[
                { label: "承認待ち", value: pendingTotal, color: C.warning, bg: C.warningLight },
                { label: "未レビュー", value: unreviewedTotal, color: C.brand, bg: C.brandLight },
                { label: "確認済み", value: allM.filter((m) => m.managerReview).length, color: C.success, bg: C.successLight },
              ].map((stat) => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, fontWeight: 500 }}>担当者</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {OWNERS.map((o) => (
                  <button key={o} style={S.pill(mgrOwner === o)} onClick={() => setMgrOwner(o)}>{o}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {[
                { v: "all", l: "すべて" },
                { v: "pending", l: `承認待ち${pendingTotal > 0 ? ` (${pendingTotal})` : ""}` },
                { v: "unreviewed", l: "未レビュー" },
                { v: "reviewed", l: "確認済み" },
              ].map((f) => (
                <button key={f.v} style={S.pill(mgrStatus === f.v)} onClick={() => setMgrStatus(f.v)}>{f.l}</button>
              ))}
            </div>

            <div style={S.sec}>案件サマリー</div>

            {/* Stage regression approval */}
            {pendingStageChange && (
              <div style={{ ...S.card, background: C.warningLight, borderColor: C.warning, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 6 }}>⚠️ ステージ後退の承認申請</div>
                <div style={{ fontSize: 12, color: "#92400E", marginBottom: 4 }}>
                  {deals.find((d) => d.id === pendingStageChange.dealId)?.company}　「{pendingStageChange.fromStage}」→「{pendingStageChange.toStage}」
                </div>
                {pendingStageChange.reason && <div style={{ fontSize: 11, color: "#92400E", marginBottom: 10 }}>理由：{pendingStageChange.reason}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={approveStagePending} style={{ flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✅ 承認・ステージ更新</button>
                  <button onClick={rejectStagePending} style={{ flex: 1, background: C.bgCard, color: C.danger, border: `1px solid ${C.dangerLight}`, borderRadius: 8, padding: "8px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✗ 却下</button>
                </div>
              </div>
            )}

            {/* Deal summaries */}
            {deals.filter((d) => mgrOwner === "全員" || d.owner === mgrOwner).map((d) => {
              const sc = latestScore(d);
              return (
                <div
                  key={d.id}
                  style={{ ...S.card, cursor: "pointer" }}
                  onClick={() => router.push(`/deals/${d.id}?from=manager`)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(46,67,184,0.12)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{d.company}</div>
                      <div style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>担当 {d.owner}　{d.products.join(" / ")}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <StagePill stage={d.stage} />
                        <span style={{ fontSize: 11, color: daysSinceLast(d) >= 10 ? C.danger : C.textMuted, fontWeight: daysSinceLast(d) >= 10 ? 600 : 400 }}>最終商談 {daysSinceLast(d)}日前</span>
                        {d.status === "won" && <span style={{ fontSize: 10, background: C.successLight, color: C.success, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>Won</span>}
                        {d.status === "lost" && <span style={{ fontSize: 10, background: C.dangerLight, color: C.danger, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>Lost</span>}
                      </div>
                    </div>
                    {sc && <ScoreBar score={sc.score} max={sc.max} />}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{d.meetings[d.meetings.length - 1]?.summary.slice(0, 95)}...</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: C.brand, fontWeight: 600 }}>詳細を確認 →</div>
                </div>
              );
            })}

            <div style={{ ...S.sec, marginTop: 18 }}>承認待ち・レビュー一覧</div>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: C.textMuted, fontSize: 13 }}>該当する商談はありません</div>}
            {filtered.map((m) => {
              const pc = m.corrections.filter((c) => c.status === "pending");
              const key = `${m.dealId}-${m.id}`;
              const cmtVal = mgrComments[key] ?? "";
              const isWeekly = m.type === "weekly_review";
              return (
                <div key={key} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{m.dealName}</div>
                      <div style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>担当 {m.owner}　{m.date}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {isWeekly
                          ? <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "1px 8px", fontWeight: 700 }}>チームレビュー</span>
                          : <StagePill stage={m.stage} />
                        }
                        {pc.length > 0 && <span style={{ fontSize: 10, background: C.warningLight, color: C.warning, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>{pc.length}件承認待ち</span>}
                      </div>
                    </div>
                    {m.totalScore !== null && <ScoreBar score={m.totalScore} max={m.maxScore!} />}
                  </div>

                  {pc.length > 0 && (
                    <div style={{ background: C.warningLight, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, marginBottom: 10 }}>
                        申請内容の確認
                        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400, marginLeft: 8 }}>承認すると自動で反映されます</span>
                      </div>
                      {pc.map((c) => (
                        <div key={c.id} style={{ fontSize: 12, color: C.textMain, padding: "6px 0", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
                          <span style={{ background: C.bgCard, borderRadius: 4, padding: "1px 7px", fontSize: 10, color: C.textSub, marginRight: 8, border: `1px solid ${C.border}` }}>
                            {c.type === "moveToAchieved" ? "達成済みへ移動" : c.type === "moveToUnachieved" ? "未達へ移動" : c.type === "aiMistake" ? "AI判断間違い" : "手動追加"}
                          </span>
                          {c.reason || c.itemText}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, marginBottom: 12 }}>{m.summary.slice(0, 100)}...</div>

                  {m.managerReview ? (
                    <div style={{ background: m.managerReview.status === "approved" ? C.successLight : C.dangerLight, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: m.managerReview.status === "approved" ? C.success : C.danger, marginBottom: 4 }}>
                        {m.managerReview.status === "approved" ? "✅ 承認済み　自動反映完了" : "⚠️ 却下コメントあり"}
                      </div>
                      <div style={{ fontSize: 12, color: C.textMain }}>「{m.managerReview.comment}」</div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={cmtVal}
                        onChange={(e) => setMgrComments((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="コメント（任意）..."
                        style={{ ...S.inp, width: "100%", height: 54, resize: "none", fontSize: 12, marginBottom: 10 }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleReview(m.dealId, m.id, "approved", cmtVal)}
                          style={{ flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: 10, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                        >✅ 承認・自動反映</button>
                        <button
                          onClick={() => handleReview(m.dealId, m.id, "rejected", cmtVal)}
                          style={{ flex: 1, background: C.bgCard, color: C.danger, border: `1px solid ${C.dangerLight}`, borderRadius: 8, padding: 10, fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                        >⚠️ 却下</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* QUARTER TAB */}
        {mgTab === "quarter" && (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
              <select style={{ ...S.inp, flex: "none", width: "auto", padding: "7px 14px", fontSize: 12 }}>
                {["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"].map((q) => <option key={q}>{q}</option>)}
              </select>
              <span style={{ fontSize: 12, color: C.textMuted }}>2026年4月〜6月</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[
                { label: "進行中", value: deals.filter((d) => d.status === "active").length + "件", color: C.brand, bg: C.brandLight },
                { label: "Close Won", value: deals.filter((d) => d.status === "won").length + "件", color: C.success, bg: C.successLight },
                { label: "Close Lost", value: deals.filter((d) => d.status === "lost").length + "件", color: C.danger, bg: C.dangerLight },
                { label: "平均スコア", value: "68 pt", color: C.warning, bg: C.warningLight },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={S.sec}>Stage Lead Time</div>
            <div style={S.card}>
              {[
                { stage: "案件化 → 要件化", days: 12, target: 10, color: C.warning },
                { stage: "要件化 → 合意化", days: 8, target: 14, color: C.success },
                { stage: "合意化 → 締結化", days: null, target: 21, color: C.brand },
              ].map((row) => (
                <div key={row.stage} style={{ padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.textMain }}>{row.stage}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.days !== null ? `${row.days} 日` : "進行中"}</span>
                  </div>
                  {row.days !== null && (
                    <div style={{ height: 4, background: C.bgMain, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${Math.min((row.days / row.target) * 100, 100)}%`, background: row.color, borderRadius: 2 }} />
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>目標：{row.target} 日以内</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.sec, marginTop: 4 }}>Sales Performance</div>
            {[
              { name: "山田 太郎", deals: 1, uploads: 3, avgScore: "16/25", trend: "→", tcolor: C.warning },
              { name: "佐藤 花子", deals: 1, uploads: 1, avgScore: "20/25", trend: "↑", tcolor: C.success },
              { name: "田中 次郎", deals: 1, uploads: 1, avgScore: "9/25", trend: "↓", tcolor: C.danger },
            ].map((s) => (
              <div key={s.name} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 5, display: "flex", gap: 14 }}>
                      <span>案件 {s.deals}件</span>
                      <span>UP {s.uploads}回</span>
                      <span>スコア <strong style={{ color: C.textMain }}>{s.avgScore}</strong></span>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.tcolor }}>{s.trend}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* RULES TAB */}
        {mgTab === "rules" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain, marginBottom: 4 }}>① サマリールール</div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 14, lineHeight: 1.6 }}>
              案件First Viewに表示されるサマリーのルールをMarkdownで管理します。
            </div>
            {!editingRule ? (
              <div>
                <div style={{ ...S.card, background: C.bgMain }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>現在のルール（summary_rule.md）</div>
                  <pre style={{ fontSize: 12, color: C.textMain, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'Courier New',monospace" }}>{summaryRule}</pre>
                </div>
                <button onClick={() => { setRuleDraft(summaryRule); setEditingRule(true); }} style={{ ...S.btn, marginTop: 10, width: "100%", padding: "10px" }}>✏️　編集する</button>
              </div>
            ) : (
              <div>
                <textarea
                  value={ruleDraft}
                  onChange={(e) => setRuleDraft(e.target.value)}
                  style={{ ...S.inp, width: "100%", height: 260, resize: "vertical", fontSize: 12, fontFamily: "'Courier New',monospace", lineHeight: 1.8, marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setSummaryRule(ruleDraft); setEditingRule(false); }} style={{ flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✅ 保存・反映</button>
                  <button onClick={() => setEditingRule(false)} style={{ flex: 1, ...S.btnGhost, borderRadius: 8, padding: "10px", fontSize: 12 }}>キャンセル</button>
                </div>
                <div style={{ marginTop: 8, background: C.warningLight, borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#92400E" }}>⚠️ 保存すると全案件のサマリー生成ルールが即時更新されます。</div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain, marginTop: 24, marginBottom: 4 }}>② インサイット・戦術プロンプトルール</div>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 14, lineHeight: 1.6 }}>
              AIが顧客インサイット・推奨戦術を生成する際のルールをMarkdownで管理します。
            </div>
            {!editingInsightRule ? (
              <div>
                <div style={{ ...S.card, background: C.bgMain }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>現在のルール（insight_rule.md）</div>
                  <pre style={{ fontSize: 12, color: C.textMain, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'Courier New',monospace" }}>{insightRule}</pre>
                </div>
                <button onClick={() => { setInsightRuleDraft(insightRule); setEditingInsightRule(true); }} style={{ ...S.btn, marginTop: 10, width: "100%", padding: "10px" }}>✏️　編集する</button>
              </div>
            ) : (
              <div>
                <textarea
                  value={insightRuleDraft}
                  onChange={(e) => setInsightRuleDraft(e.target.value)}
                  style={{ ...S.inp, width: "100%", height: 300, resize: "vertical", fontSize: 12, fontFamily: "'Courier New',monospace", lineHeight: 1.8, marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setInsightRule(insightRuleDraft); setEditingInsightRule(false); }} style={{ flex: 1, background: C.success, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✅ 保存・反映</button>
                  <button onClick={() => setEditingInsightRule(false)} style={{ flex: 1, ...S.btnGhost, borderRadius: 8, padding: "10px", fontSize: 12 }}>キャンセル</button>
                </div>
                <div style={{ marginTop: 8, background: C.warningLight, borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#92400E" }}>⚠️ 保存すると次回のAI分析・AI対話から反映されます。</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
