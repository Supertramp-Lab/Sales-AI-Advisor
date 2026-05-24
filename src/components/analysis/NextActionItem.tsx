"use client";

import { useState } from "react";
import { C } from "@/lib/constants";
import type { NextAction } from "@/types";

interface Props {
  action: NextAction;
  onEdit: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NextActionItem({ action, onEdit, onToggle, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(action.text);
  const isDone = action.status === "done";
  const isCancelled = action.status === "cancelled";

  return (
    <div style={{ borderBottom: `1px solid ${C.divider}`, padding: "10px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <button
        onClick={() => onToggle(action.id)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: isDone ? C.success : isCancelled ? C.textMuted : "transparent",
          border: `2px solid ${isDone ? C.success : isCancelled ? C.textMuted : C.border}`,
          cursor: "pointer",
          flexShrink: 0,
          marginTop: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDone && <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>✓</span>}
        {isCancelled && <span style={{ color: "#fff", fontSize: 9 }}>✕</span>}
      </button>

      <div style={{ flex: 1 }}>
        {editing ? (
          <div>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMain, fontSize: 13, padding: "5px 10px", width: "100%", outline: "none", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={() => { onEdit(action.id, val); setEditing(false); }}
                style={{ fontSize: 11, background: C.brand, color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}
              >保存</button>
              <button
                onClick={() => setEditing(false)}
                style={{ fontSize: 11, background: C.bgMain, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}
              >取消</button>
            </div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 13, color: isCancelled ? C.textMuted : isDone ? C.success : C.textMain, textDecoration: isCancelled ? "line-through" : "none", lineHeight: 1.5 }}>
              {action.text}
            </span>
            {action.isManual && (
              <span style={{ marginLeft: 6, fontSize: 10, background: C.brandLight, color: C.brand, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>手動追加</span>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(true)}
            style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textSub, fontSize: 10, padding: "2px 7px", cursor: "pointer" }}
          >編集</button>
          <button
            onClick={() => onDelete(action.id)}
            style={{ background: "transparent", border: `1px solid ${C.dangerLight}`, borderRadius: 4, color: C.danger, fontSize: 10, padding: "2px 7px", cursor: "pointer" }}
          >削除</button>
        </div>
      )}
    </div>
  );
}
