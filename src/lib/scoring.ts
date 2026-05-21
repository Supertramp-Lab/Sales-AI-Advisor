import { STAGE_KEYWORDS } from "@/lib/constants";
import type { Meeting, CriteriaScore } from "@/types";

interface ReEvaluateResult {
  newScore: number;
  newSummary: string;
  updatedCriteria: CriteriaScore[];
}

export function reEvaluate(
  meeting: Meeting,
  corrType: "moveToAchieved" | "moveToUnachieved" | "aiMistake",
  reason: string,
  itemId: string
): ReEvaluateResult {
  const totalItems = meeting.criteriaScores.length;
  if (totalItems === 0) {
    return {
      newScore: meeting.totalScore ?? 0,
      newSummary: meeting.summary,
      updatedCriteria: meeting.criteriaScores,
    };
  }

  const stageKW = STAGE_KEYWORDS[meeting.stage] ?? {};
  const reasonLower = reason.toLowerCase();
  let updatedCriteria = [...meeting.criteriaScores];
  let totalDelta = 0;
  const today = new Date().toLocaleDateString("ja-JP");

  const evalItem = (cs: CriteriaScore, direction: "up" | "down"): CriteriaScore => {
    const kws = stageKW[cs.id] ?? [];
    const matched = kws.filter((kw) => reasonLower.includes(kw.toLowerCase()));
    const delta = matched.length >= 2 ? 2 : matched.length === 1 ? 1 : 0;
    const newScore =
      direction === "up"
        ? Math.min(cs.score + delta, 5)
        : Math.max(cs.score - delta, 0);
    const label = direction === "up" ? "達成済みと再評価" : "要確認と再評価";
    const evidence =
      matched.length > 0
        ? `修正内容に「${matched.join("・")}」の根拠を確認（+${delta}pt）。`
        : "修正内容にこの評価基準に対応する根拠が確認できなかったためスコア変動なし。";
    totalDelta += newScore - cs.score;
    return {
      ...cs,
      score: newScore,
      comment: `${cs.comment}　【再評価 ${today}】${label}。${evidence}`,
    };
  };

  if (corrType === "moveToAchieved") {
    updatedCriteria = updatedCriteria.map((cs) =>
      cs.id === itemId ? evalItem(cs, "up") : cs
    );
    if (totalDelta === 0) totalDelta = 1;
  }
  if (corrType === "moveToUnachieved") {
    updatedCriteria = updatedCriteria.map((cs) =>
      cs.id === itemId ? evalItem(cs, "down") : cs
    );
    if (totalDelta === 0) totalDelta = -1;
  }
  if (corrType === "aiMistake") {
    updatedCriteria = updatedCriteria.map((cs) =>
      cs.id === itemId ? evalItem(cs, "up") : cs
    );
    if (totalDelta === 0) totalDelta = 1;
  }

  const currentTotal = meeting.totalScore ?? 0;
  const maxTotal = meeting.maxScore ?? 25;
  const newScore = Math.max(0, Math.min(currentTotal + totalDelta, maxTotal));
  const reason35 = reason.slice(0, 35);
  const newSummary = `${meeting.summary}　【AI再評価 ${today}】営業修正「${reason35}...」をステージ基準と照合。スコア ${currentTotal}→${newScore}点に更新。`;

  return { newScore, newSummary, updatedCriteria };
}
