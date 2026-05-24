"use client";

import { useState } from "react";
import { useDealStore } from "@/store/dealStore";
import { C, STAGES, PRODUCTS } from "@/lib/constants";
import type { Stage, Product } from "@/lib/constants";

interface Props {
  onClose: () => void;
}

export function NewDealDialog({ onClose }: Props) {
  const { addDeal } = useDealStore();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState<Stage>("案件化");
  const [products, setProducts] = useState<Product[]>([]);

  const toggleProduct = (p: Product) =>
    setProducts((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const handleSubmit = () => {
    if (!company.trim() || !contact.trim() || !owner.trim() || products.length === 0) return;
    addDeal(company.trim(), contact.trim(), products, stage, owner.trim());
    onClose();
  };

  const S = {
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#fff",
      borderRadius: 16,
      padding: 28,
      width: "100%",
      maxWidth: 440,
      boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
    },
    label: { fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 4, display: "block" },
    input: {
      width: "100%",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "9px 12px",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box" as const,
    },
    row: { marginBottom: 16 },
    chip: (on: boolean) => ({
      border: `1px solid ${on ? C.brand : C.border}`,
      borderRadius: 20,
      padding: "5px 14px",
      fontSize: 12,
      fontWeight: on ? 600 : 400,
      background: on ? C.brandLight : "#fff",
      color: on ? C.brand : C.textSub,
      cursor: "pointer",
      marginRight: 6,
      marginBottom: 6,
      display: "inline-block",
    }),
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: C.textMain }}>
          新規案件を登録
        </h2>

        <div style={S.row}>
          <label style={S.label}>会社名 *</label>
          <input style={S.input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="例：株式会社〇〇" />
        </div>

        <div style={S.row}>
          <label style={S.label}>担当者名 *</label>
          <input style={S.input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="例：田中 部長" />
        </div>

        <div style={S.row}>
          <label style={S.label}>自社担当 *</label>
          <input style={S.input} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="例：山田 太郎" />
        </div>

        <div style={S.row}>
          <label style={S.label}>商材 *（複数選択可）</label>
          <div style={{ marginTop: 6 }}>
            {PRODUCTS.map((p) => (
              <span key={p} style={S.chip(products.includes(p))} onClick={() => toggleProduct(p)}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div style={S.row}>
          <label style={S.label}>初期ステージ</label>
          <select
            style={{ ...S.input, background: "#fff" }}
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
          >
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer", background: "#fff", color: C.textSub }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!company.trim() || !contact.trim() || !owner.trim() || products.length === 0}
            style={{
              background: C.brand,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: (!company.trim() || !contact.trim() || !owner.trim() || products.length === 0) ? 0.5 : 1,
            }}
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}
