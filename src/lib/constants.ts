export const C = {
  bgMain: "#F7F8FA",
  bgCard: "#FFFFFF",
  border: "#E5E7EB",
  brand: "#2E43B8",
  brandLight: "#EEF1FB",
  brandMid: "#C7CFEF",
  success: "#00B87C",
  successLight: "#E6F9F3",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  textMain: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  divider: "#F3F4F6",
  shadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)",
} as const;

export const STAGES = ["案件化", "要件化", "合意化", "締結化"] as const;
export type Stage = typeof STAGES[number];

export const STAGE_COLORS: Record<Stage, string> = {
  "案件化": "#2E43B8",
  "要件化": "#0ea5e9",
  "合意化": "#F59E0B",
  "締結化": "#00B87C",
};

export const STAGE_LIGHT: Record<Stage, string> = {
  "案件化": "#EEF1FB",
  "要件化": "#E0F2FE",
  "合意化": "#FEF3C7",
  "締結化": "#E6F9F3",
};

export const PRODUCTS = ["AIQUA", "AIRIS", "AdCreative.ai", "BotBonnie"] as const;
export type Product = typeof PRODUCTS[number];

export const CLOSE_REASONS = [
  "予算不足",
  "競合に敗北",
  "プロジェクト凍結",
  "タイミング不一致",
  "要件不一致",
  "その他",
] as const;

export const OWNERS = ["全員", "山田 太郎", "佐藤 花子", "田中 次郎"] as const;

export const APPROVAL_KEYS = [
  { key: "moveToAchieved", label: "未達 → 達成済みへの移動申請" },
  { key: "aiMistake", label: "AI判断の間違い申請" },
  { key: "manualAdd", label: "営業手動追加項目" },
  { key: "nextAction", label: "Next Actionの変更" },
  { key: "stageRegression", label: "ステージの後退（前ステージへの戻し）" },
] as const;

export const STAGE_KEYWORDS: Record<string, Record<string, string[]>> = {
  "案件化": {
    b1: ["予算", "金額", "コスト", "費用", "投資", "万円", "budget", "承認", "確保"],
    a1: ["決裁", "KDM", "部長", "役員", "承認者", "意思決定", "決定権", "権限"],
    n1: ["課題", "ニーズ", "問題", "改善", "実現", "要望", "困っ", "解決"],
    t1: ["タイミング", "時期", "契約更新", "導入時期", "スケジュール", "月", "年度"],
    c1: ["競合", "比較", "他社", "現行", "利用中", "ベンダー", "ツール"],
  },
  "要件化": {
    m1: ["KPI", "CVR", "LTV", "改善率", "数値目標", "達成", "効果"],
    f1_mkt: ["施策", "チャネル", "メール", "LINE", "配信", "運用", "マーケティング", "現状"],
    f2_sys: ["システム", "SDK", "API", "CDP", "MA", "CRM", "データ", "連携", "構成"],
    g1_mkt: ["理想", "実現", "体験", "パーソナライズ", "シナリオ", "施策", "目指"],
    g2_sys: ["アーキテクチャ", "構想", "連携設計", "データ設計", "構成", "システム理想"],
  },
  "合意化": {
    sc1: ["スコープ", "範囲", "合意", "確認済", "フェーズ", "対象"],
    roi1: ["ROI", "投資対効果", "試算", "効果", "削減", "roi", "回収"],
    p1: ["価格", "金額", "見積", "提示", "予算承認", "確認"],
    dp1: ["稟議", "承認", "決裁", "プロセス", "フロー", "役員会", "手順"],
    dc1: ["重視", "優先", "基準", "判断", "選定", "評価軸"],
  },
  "締結化": {
    who1: ["担当", "部署", "legal", "法務", "procurement", "調達", "security", "セキュリティ"],
    when1: ["期限", "日程", "締結日", "スケジュール", "利用開始", "いつ"],
    what1: ["書類", "NDA", "発注書", "契約書", "レビュー", "稟議", "必要書類"],
  },
};
