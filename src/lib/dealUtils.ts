import type { Deal, Meeting } from "@/types";

const TODAY = "2026-05-21";

export function daysBetween(d1: string, d2: string | null): number {
  return Math.floor(
    (new Date(d2 ?? TODAY).getTime() - new Date(d1).getTime()) / 86400000
  );
}

export function latestScore(deal: Deal): { score: number; max: number } | null {
  const lm = [...deal.meetings].reverse().find((m) => m.totalScore !== null);
  return lm ? { score: lm.totalScore!, max: lm.maxScore! } : null;
}

export function daysSinceLast(deal: Deal): number {
  const lm = deal.meetings.filter((m) => m.type === "commercial").slice(-1)[0];
  return lm ? daysBetween(lm.date, null) : 99;
}

export function currentStageDays(deal: Deal): number {
  const sh = deal.stageHistory.find((s) => s.stage === deal.stage);
  return sh ? daysBetween(sh.enteredAt, sh.exitedAt) : 0;
}

export function hasActiveActions(deal: Deal): boolean {
  return deal.meetings.flatMap((m) => m.nextActions).some((a) => a.status === "active");
}

export function pendingCorrectionsCount(meetings: Meeting[]): number {
  return meetings.reduce(
    (b, m) => b + m.corrections.filter((c) => c.status === "pending").length,
    0
  );
}

export function activeActionsCount(meetings: Meeting[]): number {
  return meetings.flatMap((m) => m.nextActions).filter((a) => a.status === "active").length;
}
