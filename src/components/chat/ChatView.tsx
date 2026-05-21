"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C } from "@/lib/constants";
import { StagePill } from "@/components/ui/StagePill";

const AI_CHAT = [
  "この案件の経緯を踏まえると、KU経由でIT部門と繋がる戦略は正しい選択です。次回商談では「IT担当者と一緒に現状確認の場を設けていただけますか？」とKUに直接依頼することをお勧めします。",
  "TreasureDataとの比較では「マーケターが自走できる」が最大の差別化ポイントです。TDはSQL必須でIT部門依存ですが、AIRISはノーコードでマーケターが直接セグメント抽出・施策実行まで完結できます。",
  "SMC利用中の顧客へは、コスト面と使いやすさの訴求が効果的です。SMCは機能モジュール毎に課金されるため高額になります。AIQUAは同等機能をリーズナブルな価格で提供できます。",
  "Decision Criteriaで「価格とAI性能を最重視」との回答があったことは重要です。DQBによる最大40%のハルシネーション削減という具体的な数値を役員会資料に盛り込むことを提案します。",
];

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface Props {
  dealId: number;
  meetingId?: number;
}

export function ChatView({ dealId, meetingId }: Props) {
  const router = useRouter();
  const { deals } = useDealStore();
  const deal = deals.find((d) => d.id === dealId);
  const meeting = meetingId ? deal?.meetings.find((m) => m.id === meetingId) : undefined;

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const aiIdx = useRef(0);

  if (!deal) return null;

  const sendChat = () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput("");
    setChat((p) => [...p, { role: "user", text: msg }]);
    setBusy(true);
    setTimeout(() => {
      setChat((p) => [...p, { role: "ai", text: AI_CHAT[aiIdx.current % AI_CHAT.length] }]);
      aiIdx.current++;
      setBusy(false);
      setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 1400);
  };

  const SUGGESTIONS = [
    "競合との差別化をどう説明すればいい？",
    "次回商談で何を優先すべき？",
    "顧客の反応をどう読むべき？",
    "KDMへのアプローチ方法は？",
  ];

  const S = {
    bar: { background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "13px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 10, boxShadow: `0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)` },
    back: { background: "transparent", color: C.brand, border: "none", padding: 0, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnGhost: { background: "#fff", color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 13px", fontWeight: 500, fontSize: 12, cursor: "pointer" },
    btn: { background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", flexShrink: 0 },
    inp: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.textMain, fontSize: 13, flex: 1, outline: "none", fontFamily: "inherit" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bgMain }}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => meetingId ? router.push(`/deals/${dealId}/meetings/${meetingId}`) : router.push(`/deals/${dealId}`)}>
          ← 分析に戻る
        </button>
        {meeting && <StagePill stage={meeting.stage} />}
      </div>

      <div style={{ padding: "11px 22px", borderBottom: `1px solid ${C.border}`, background: C.bgMain }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>{deal.company}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
          案件履歴・製品知識・競合情報・顧客インサイトを踏まえて回答します
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 0", background: C.bgMain, maxWidth: 700, margin: "0 auto", width: "100%" }}>
        {chat.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.brandLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22 }}>🤖</div>
            <div style={{ color: C.textSub, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>この案件について何でも相談してください</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {SUGGESTIONS.map((q) => (
                <button key={q} style={S.btnGhost} onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", marginBottom: 14, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "ai" && (
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>APPIER AI ADVISOR</div>
            )}
            <div style={{
              background: m.role === "ai" ? C.bgCard : C.brand,
              color: m.role === "ai" ? C.textMain : "#fff",
              borderRadius: m.role === "ai" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
              padding: "12px 16px",
              maxWidth: "84%",
              fontSize: 13,
              lineHeight: 1.7,
              boxShadow: m.role === "ai" ? C.shadowSm : "none",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ background: C.bgCard, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", boxShadow: C.shadowSm, display: "inline-flex", gap: 4, marginBottom: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.brand, opacity: 0.4 }} />
            ))}
          </div>
        )}
        <div ref={chatRef} />
      </div>

      <div style={{ padding: "12px 22px 18px", display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, background: C.bgCard, maxWidth: 700, margin: "0 auto", width: "100%" }}>
        <input
          style={S.inp}
          placeholder="質問を入力..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat()}
        />
        <button style={S.btn} onClick={sendChat}>送信</button>
      </div>
    </div>
  );
}
