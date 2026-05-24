"use client";

import { create } from "zustand";
import type {
  Deal,
  Meeting,
  ApprovalSettings,
  PendingStageChange,
  UpdateState,
  CorrectionType,
} from "@/types";
import { INIT_DEALS, INIT_APPROVAL } from "@/lib/initialData";
import { reEvaluate } from "@/lib/scoring";

const TODAY = "2026-05-21";

interface DealStore {
  deals: Deal[];
  approvalSettings: ApprovalSettings;
  pendingStageChange: PendingStageChange | null;
  updateState: UpdateState;
  summaryRule: string;
  insightRule: string;

  // Deal mutations
  closeDeal: (dealId: number, type: "won" | "lost", reason: string) => void;

  // Next action mutations
  updateNextAction: (dealId: number, meetingId: number, actionId: string, text: string) => void;
  toggleNextAction: (dealId: number, meetingId: number, actionId: string) => void;
  deleteNextAction: (dealId: number, meetingId: number, actionId: string) => void;
  addNextAction: (dealId: number, meetingId: number, text: string, isManual?: boolean) => void;

  // Analysis corrections
  handleCorrect: (
    dealId: number,
    meetingId: number,
    itemId: string,
    corrType: CorrectionType,
    reason: string
  ) => void;
  handleReview: (
    dealId: number,
    meetingId: number,
    status: "approved" | "rejected",
    comment: string
  ) => void;
  addManualItem: (
    dealId: number,
    meetingId: number,
    type: "strength" | "gap",
    text: string
  ) => void;

  // Add meeting from analysis result
  addMeeting: (
    dealId: number,
    data: Omit<Meeting, "id" | "corrections" | "managerReview">
  ) => number;

  // Stage regression
  submitStageChange: (
    dealId: number,
    fromStage: string,
    toStage: string,
    reason: string
  ) => void;
  applyStageChange: (dealId: number, fromStage: string, toStage: string) => void;
  approveStagePending: () => void;
  rejectStagePending: () => void;

  // Settings
  setApprovalSettings: (key: keyof ApprovalSettings, value: boolean) => void;
  setSummaryRule: (rule: string) => void;
  setInsightRule: (rule: string) => void;
  setUpdateState: (state: UpdateState) => void;
}

export const useDealStore = create<DealStore>((set, get) => ({
  deals: INIT_DEALS,
  approvalSettings: INIT_APPROVAL,
  pendingStageChange: null,
  updateState: null,
  summaryRule: `# 案件サマリールール（管理者設定）

## 表示項目
- 最新 Sales Stage
- 最新商談日
- 最新総括（商談履歴・チームレビュー履歴からAIがまとめ）
- アクティブな Next Action（完了・キャンセル除く）

## 表示順
Stage → 最新商談日 → 最新総括 → Next Action

## 総括ルール
- 商談記録・チームレビュー記録を累積参照
- 直近2回分の内容を優先的に反映
- 顧客の現在の状態・合意事項・懸念点を含める`,
  insightRule: `# 顧客インサイト・戦術プロンプトルール（マネージャー設定）

## 顧客の態度
会議全体を通じた顧客の姿勢・温度感・意思決定スタイルを分析する。
過去の会議からの変化も含めて記述する。

## コンテンツ好み
顧客がどんな情報・提示方法に最も反応するかを分析する。
例：定量データ重視 / デモ体験重視 / 事例重視 / 役員向け資料重視

## 推奨コミュニケーション戦術
上記2点を踏まえた具体的な次回以降の対応戦術を提示する。
製品知識・競合分析・ユースケース情報を組み合わせて提案すること。
抽象的な表現を避け、具体的なアクションとして記述する。`,

  closeDeal: (dealId, type, reason) =>
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              status: type === "won" ? "won" : "lost",
              closedAt: TODAY,
              closeReason: type === "lost" ? reason : null,
            }
      ),
    })),

  updateNextAction: (dealId, meetingId, actionId, text) =>
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              meetings: d.meetings.map((m) =>
                m.id !== meetingId
                  ? m
                  : {
                      ...m,
                      nextActions: m.nextActions.map((a) =>
                        a.id === actionId ? { ...a, text } : a
                      ),
                    }
              ),
            }
      ),
    })),

  toggleNextAction: (dealId, meetingId, actionId) =>
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              meetings: d.meetings.map((m) =>
                m.id !== meetingId
                  ? m
                  : {
                      ...m,
                      nextActions: m.nextActions.map((a) =>
                        a.id === actionId
                          ? {
                              ...a,
                              status:
                                a.status === "active"
                                  ? "done"
                                  : a.status === "done"
                                  ? "cancelled"
                                  : "active",
                            }
                          : a
                      ),
                    }
              ),
            }
      ),
    })),

  deleteNextAction: (dealId, meetingId, actionId) =>
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              meetings: d.meetings.map((m) =>
                m.id !== meetingId
                  ? m
                  : { ...m, nextActions: m.nextActions.filter((a) => a.id !== actionId) }
              ),
            }
      ),
    })),

  addNextAction: (dealId, meetingId, text, isManual = false) => {
    if (!text.trim()) return;
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id !== dealId
          ? d
          : {
              ...d,
              meetings: d.meetings.map((m) =>
                m.id !== meetingId
                  ? m
                  : {
                      ...m,
                      nextActions: [
                        ...m.nextActions,
                        {
                          id: `na${Date.now()}`,
                          text,
                          status: "active" as const,
                          priority: m.nextActions.length + 1,
                          isManual,
                        },
                      ],
                    }
              ),
            }
      ),
    }));
  },

  handleCorrect: (dealId, meetingId, itemId, corrType, reason) => {
    const { approvalSettings } = get();
    const approvalKey =
      corrType === "moveToAchieved"
        ? "moveToAchieved"
        : corrType === "moveToUnachieved"
        ? "moveToAchieved"
        : corrType === "aiMistake"
        ? "aiMistake"
        : "manualAdd";
    const needsApproval = approvalSettings[approvalKey as keyof ApprovalSettings];

    set((state) => ({
      deals: state.deals.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          meetings: d.meetings.map((m) => {
            if (m.id !== meetingId) return m;

            if (!needsApproval && corrType === "moveToAchieved") {
              const item = m.gaps.find((g) => g.id === itemId);
              if (!item) return m;
              setTimeout(() => {
                get().setUpdateState("updating");
                setTimeout(() => get().setUpdateState("done"), 1800);
              }, 0);
              const { newScore, newSummary, updatedCriteria } = reEvaluate(
                m, corrType, reason, itemId
              );
              return {
                ...m,
                totalScore: newScore,
                summary: newSummary,
                criteriaScores: updatedCriteria,
                strengths: [...m.strengths, { ...item, source: "ai" as const, corrected: false }],
                gaps: m.gaps.filter((g) => g.id !== itemId),
                corrections: [
                  ...m.corrections,
                  {
                    id: `c${Date.now()}`,
                    itemId,
                    type: corrType,
                    reason,
                    date: TODAY,
                    status: "resolved" as const,
                    autoResolved: true,
                  },
                ],
              };
            }

            if (!needsApproval && corrType === "moveToUnachieved") {
              const item = m.strengths.find((s) => s.id === itemId);
              if (!item) return m;
              const { newScore, newSummary, updatedCriteria } = reEvaluate(
                m, corrType, reason, itemId
              );
              return {
                ...m,
                totalScore: newScore,
                summary: newSummary,
                criteriaScores: updatedCriteria,
                gaps: [...m.gaps, { ...item, source: "ai" as const, corrected: false }],
                strengths: m.strengths.filter((s) => s.id !== itemId),
                corrections: [
                  ...m.corrections,
                  {
                    id: `c${Date.now()}`,
                    itemId,
                    type: corrType,
                    reason,
                    date: TODAY,
                    status: "resolved" as const,
                    autoResolved: true,
                  },
                ],
              };
            }

            if (!needsApproval && corrType === "aiMistake") {
              const { newScore, newSummary, updatedCriteria } = reEvaluate(
                m, corrType, reason, itemId
              );
              return {
                ...m,
                totalScore: newScore,
                summary: newSummary,
                criteriaScores: updatedCriteria,
                corrections: [
                  ...m.corrections,
                  {
                    id: `c${Date.now()}`,
                    itemId,
                    type: corrType,
                    reason,
                    date: TODAY,
                    status: "resolved" as const,
                    autoResolved: true,
                  },
                ],
              };
            }

            return {
              ...m,
              strengths: m.strengths.map((s) =>
                s.id === itemId ? { ...s, corrected: true } : s
              ),
              gaps: m.gaps.map((g) =>
                g.id === itemId ? { ...g, corrected: true } : g
              ),
              corrections: [
                ...m.corrections,
                {
                  id: `c${Date.now()}`,
                  itemId,
                  type: corrType,
                  reason,
                  date: TODAY,
                  status: "pending" as const,
                },
              ],
            };
          }),
        };
      }),
    }));
  },

  handleReview: (dealId, meetingId, status, comment) => {
    if (status === "approved") {
      get().setUpdateState("updating");
      setTimeout(() => get().setUpdateState("done"), 2000);
    }
    set((state) => ({
      deals: state.deals.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          meetings: d.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            let newStrengths = [...m.strengths];
            let newGaps = [...m.gaps];
            let newScore = m.totalScore ?? 0;
            let newSummary = m.summary;
            let updatedCriteria = [...m.criteriaScores];

            const newCorrections = m.corrections.map((c) => {
              if (c.status !== "pending") return c;
              if (status === "approved") {
                if (c.type === "moveToAchieved") {
                  const item = newGaps.find((g) => g.id === c.itemId);
                  if (item) {
                    newStrengths = [...newStrengths, { ...item, corrected: false, source: "ai" as const }];
                    newGaps = newGaps.filter((g) => g.id !== c.itemId);
                    const ev = reEvaluate(
                      { ...m, strengths: newStrengths, gaps: newGaps, totalScore: newScore, summary: newSummary, criteriaScores: updatedCriteria },
                      c.type, c.reason ?? "", c.itemId
                    );
                    newScore = ev.newScore;
                    newSummary = ev.newSummary;
                    updatedCriteria = ev.updatedCriteria;
                  }
                }
                if (c.type === "moveToUnachieved") {
                  const item = newStrengths.find((s) => s.id === c.itemId);
                  if (item) {
                    newGaps = [...newGaps, { ...item, corrected: false, source: "ai" as const }];
                    newStrengths = newStrengths.filter((s) => s.id !== c.itemId);
                    const ev = reEvaluate(
                      { ...m, strengths: newStrengths, gaps: newGaps, totalScore: newScore, summary: newSummary, criteriaScores: updatedCriteria },
                      c.type, c.reason ?? "", c.itemId
                    );
                    newScore = ev.newScore;
                    newSummary = ev.newSummary;
                    updatedCriteria = ev.updatedCriteria;
                  }
                }
                if (c.type === "aiMistake") {
                  const ev = reEvaluate(
                    { ...m, totalScore: newScore, summary: newSummary, criteriaScores: updatedCriteria },
                    c.type, c.reason ?? "", c.itemId
                  );
                  newScore = ev.newScore;
                  newSummary = ev.newSummary;
                  updatedCriteria = ev.updatedCriteria;
                }
              }
              const newStatus = status === "approved" ? "resolved" as const : "rejected" as const;
              return { ...c, status: newStatus };
            });

            return {
              ...m,
              totalScore: newScore,
              summary: newSummary,
              criteriaScores: updatedCriteria,
              strengths: newStrengths,
              gaps: newGaps,
              corrections: newCorrections,
              managerReview: {
                status,
                comment: comment || (status === "approved" ? "確認・再採点しました。" : "要確認。"),
                reviewer: "鈴木 MG",
                date: TODAY,
              },
            };
          }),
        };
      }),
    }));
  },

  addManualItem: (dealId, meetingId, type, text) => {
    if (!text.trim()) return;
    const { approvalSettings } = get();
    const needsApproval = approvalSettings.manualAdd;
    const newItem = {
      id: `manual_${Date.now()}`,
      text,
      corrected: false,
      source: "manual" as const,
      pendingApproval: needsApproval,
    };
    set((state) => ({
      deals: state.deals.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          meetings: d.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            if (needsApproval) {
              return {
                ...m,
                corrections: [
                  ...m.corrections,
                  {
                    id: `c${Date.now()}`,
                    itemId: newItem.id,
                    type: "manualAdd" as const,
                    reason: text,
                    date: TODAY,
                    status: "pending" as const,
                    itemType: type,
                    itemText: text,
                  },
                ],
              };
            }
            return {
              ...m,
              [type === "strength" ? "strengths" : "gaps"]: [
                ...(type === "strength" ? m.strengths : m.gaps),
                newItem,
              ],
            };
          }),
        };
      }),
    }));
  },

  addMeeting: (dealId, data) => {
    const newId = Date.now();
    set((state) => ({
      deals: state.deals.map((d) => {
        if (d.id !== dealId) return d;
        const stageChanged = data.type === "commercial" && data.stage !== d.stage;
        return {
          ...d,
          stage: data.type === "commercial" ? data.stage : d.stage,
          lastUpdate: "今日",
          stageHistory: stageChanged
            ? [
                ...d.stageHistory.map((sh) =>
                  sh.stage === d.stage && !sh.exitedAt
                    ? { ...sh, exitedAt: TODAY }
                    : sh
                ),
                { stage: data.stage, enteredAt: TODAY, exitedAt: null },
              ]
            : d.stageHistory,
          meetings: [
            ...d.meetings,
            { ...data, id: newId, corrections: [], managerReview: null },
          ],
        };
      }),
    }));
    return newId;
  },

  submitStageChange: (dealId, fromStage, toStage, reason) => {
    const { approvalSettings } = get();
    if (!approvalSettings.stageRegression) {
      get().applyStageChange(dealId, fromStage, toStage);
    } else {
      set({
        pendingStageChange: {
          dealId,
          fromStage: fromStage as Deal["stage"],
          toStage: toStage as Deal["stage"],
          reason,
          status: "pending",
          date: TODAY,
        },
      });
    }
  },

  applyStageChange: (dealId, fromStage, toStage) => {
    set((state) => ({
      deals: state.deals.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          stage: toStage as Deal["stage"],
          stageHistory: [
            ...d.stageHistory.map((sh) =>
              sh.stage === fromStage && !sh.exitedAt
                ? { ...sh, exitedAt: TODAY }
                : sh
            ),
            {
              stage: toStage as Deal["stage"],
              enteredAt: TODAY,
              exitedAt: null,
              isRegression: true,
            },
          ],
        };
      }),
      pendingStageChange: null,
    }));
  },

  approveStagePending: () => {
    const { pendingStageChange } = get();
    if (pendingStageChange) {
      get().applyStageChange(
        pendingStageChange.dealId,
        pendingStageChange.fromStage,
        pendingStageChange.toStage
      );
    }
  },

  rejectStagePending: () => set({ pendingStageChange: null }),

  setApprovalSettings: (key, value) =>
    set((state) => ({
      approvalSettings: { ...state.approvalSettings, [key]: value },
    })),

  setSummaryRule: (rule) => set({ summaryRule: rule }),
  setInsightRule: (rule) => set({ insightRule: rule }),
  setUpdateState: (updateState) => set({ updateState }),
}));
