import type { Stage, Product } from "@/lib/constants";

export type { Stage, Product };

export interface CriteriaScore {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  comment: string;
  recordSummary?: string;
}

export interface CustomerAnalysis {
  attitude: string;
  preference: string;
  tactics: string;
}

export interface AnalysisItem {
  id: string;
  text: string;
  corrected: boolean;
  source: "ai" | "manual";
  pendingApproval?: boolean;
}

export interface NextAction {
  id: string;
  text: string;
  status: "active" | "done" | "cancelled";
  priority: number;
  isManual?: boolean;
}

export type CorrectionType = "moveToAchieved" | "moveToUnachieved" | "aiMistake" | "manualAdd";
export type CorrectionStatus = "pending" | "resolved" | "rejected";

export interface Correction {
  id: string;
  itemId: string;
  type: CorrectionType;
  reason?: string;
  date: string;
  status: CorrectionStatus;
  autoResolved?: boolean;
  itemType?: "strength" | "gap";
  itemText?: string;
}

export interface ManagerReview {
  status: "approved" | "rejected";
  comment: string;
  reviewer: string;
  date: string;
}

export interface WeeklyReviewData {
  findings: string[];
  agreedActions: string[];
  strategyChanges: string[];
  previousReview: null | WeeklyReviewData;
  insightUpdate?: {
    attitude: string;
    change: string;
  };
}

export type MeetingType = "commercial" | "weekly_review";

export interface Meeting {
  id: number;
  date: string;
  stage: Stage;
  type: MeetingType;
  products: Product[];
  totalScore: number | null;
  maxScore: number | null;
  summary: string;
  criteriaScores: CriteriaScore[];
  customerAnalysis: CustomerAnalysis | null;
  strengths: AnalysisItem[];
  gaps: AnalysisItem[];
  nextActions: NextAction[];
  corrections: Correction[];
  managerReview: ManagerReview | null;
  weeklyReviewData?: WeeklyReviewData;
}

export interface InsightHistory {
  date: string;
  stage: Stage;
  change: string;
}

export interface CumulativeInsight {
  attitude: string;
  preference: string;
  tactics: string;
  history: InsightHistory[];
}

export interface StageHistory {
  stage: Stage;
  enteredAt: string;
  exitedAt: string | null;
  isRegression?: boolean;
}

export type DealStatus = "active" | "won" | "lost";

export interface Deal {
  id: number;
  company: string;
  contact: string;
  products: Product[];
  stage: Stage;
  lastUpdate: string;
  owner: string;
  status: DealStatus;
  cumulativeInsight: CumulativeInsight;
  stageHistory: StageHistory[];
  meetings: Meeting[];
  closedAt?: string;
  closeReason?: string | null;
}

export interface ApprovalSettings {
  moveToAchieved: boolean;
  aiMistake: boolean;
  manualAdd: boolean;
  nextAction: boolean;
  stageRegression: boolean;
}

export interface PendingStageChange {
  dealId: number;
  fromStage: Stage;
  toStage: Stage;
  reason: string;
  status: "pending";
  date: string;
}

export type UpdateState = null | "updating" | "done";
