"use client";

import { useState } from "react";
import { C } from "@/lib/constants";
import type { AnalysisItem as Item, ApprovalSettings, CorrectionType } from "@/types";

interface Props {
  item: Item;
  type: "strength" | "gap";
  onCorrect: (id: string, corrType: CorrectionType, reason: string) => void;
  approvalSettings: ApprovalSettings;
}

export function AnalysisItem({ item, type, onCorrect, approvalSettings }: Props) {
  const [open, setOpen] = useState(false);
  const isStrength = type === "strength";
  const color = isStrength ? C.success : C.danger;
  const isManual = item.source === "manual";

  const [corrType, setCorrType] = useState<CorrectionType>(
    isStrength ? "moveToUnachieved" : "moveToAchieved"
  );
  const [reason, setReason] = useState("");

  const corrOptions = isStrength
    ? [
        { v: "moveToUnachieved" as CorrectionType, l: "未達に移動" },
        { v: "aiMistake" as CorrectionType, l: "AI判断の間違い" },
      ]
    : [
        { v: "moveToAchieved" as CorrectionType, l: "達成済みに移動" },
        { v: "aiMistake" as CorrectionType, l: "AI判断の間違い" },
      ];

  const approvalKey =
    corrType === "moveToAchieved" || corrType === "moveToUnachieved"
      ? "moveToAchieved"
      : "aiMistake";
  const needsApproval = approvalSettings[approvalKey as keyof ApprovalSettings];

  const hintText =
    corrType === "moveToAchieved"
      ? needsApproval ? "MG承認後に達成済みへ移動します" : "承認不要・即時移動されます"
      : corrType === "moveToUnachieved"
      ? needsApproval ? "MG承認後に未達へ移動します" : "承認不要・即時移動されます"
      : needsApproval ? "MG承認後にAIが再採点します" : "承認不要・即時再採点されます";

  const submit = () => {
    if (!reason.trim()) return;
    onCorrect(item.id, corrType, reason);
    setReason("");
    setOpen(false);
  };

  return (
    <div style={{ borderBottom: `1px solid ${C.divider}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: isStrength ? C.successLight : C.dangerLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <span style={{ color, fontSize: 10, fontWeight: 800 }}>{isStrength ? "✓" : "✗"}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: item.corrected ? C.warning : C.textMain, lineHeight: 1.5 }}>{item.text}</span>
            {isManual && <span style={{ fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>手動追加</span>}
            {item.corrected && <span style={{ fontSize: 10, background: C.warningLight, color: C.warning, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>申請中</span>}
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textSub, fontSize: 11, padding: "2px 9px", cursor: "pointer", flexShrink: 0 }}
        >
          {open ? "閉じる" : "修正"}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, background: C.bgMain, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>申請タイプ</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {corrOptions.map((o) => (
              <button
                key={o.v}
                onClick={() => setCorrType(o.v)}
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: `1px solid ${corrType === o.v ? C.brand : C.border}`,
                  background: corrType === o.v ? C.brandLight : C.bgCard,
                  color: corrType === o.v ? C.brand : C.textSub,
                  cursor: "pointer",
                  fontWeight: corrType === o.v ? 600 : 400,
                }}
              >
                {o.l}
                {!needsApproval && corrType === o.v && <span style={{ fontSize: 9, color: C.success, marginLeft: 4 }}>承認不要</span>}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>理由　　{hintText}</div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isStrength ? "例：実際はまだ確認が不十分だった..." : "例：商談後のメールで確認済みとの連絡があった..."}
            style={{ width: "100%", boxSizing: "border-box", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMain, fontSize: 12, padding: "10px", resize: "vertical", height: 72, outline: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={submit}
            style={{ marginTop: 10, background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}
          >
            申請を送信
          </button>
        </div>
      )}
    </div>
  );
}
