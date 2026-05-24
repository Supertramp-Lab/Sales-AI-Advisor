"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDealStore } from "@/store/dealStore";
import { C, STAGES, PRODUCTS, type Stage } from "@/lib/constants";
import { AppHeader, AppLogo } from "@/components/ui/AppHeader";

interface Props {
  dealId: number;
}

type UploadType = "commercial" | "weekly_review";
type UploadTab = "file" | "text";

export function UploadView({ dealId }: Props) {
  const router = useRouter();
  const { deals, submitStageChange, approvalSettings, addMeeting } = useDealStore();
  const deal = deals.find((d) => d.id === dealId);

  const [uploadType, setUploadType] = useState<UploadType>("commercial");
  const [uploadStage, setUploadStage] = useState<Stage>(deal?.stage ?? "案件化");
  const [uploadProducts, setUploadProducts] = useState<string[]>(deal?.products ?? ["AIQUA"]);
  const [uploadTab, setUploadTab] = useState<UploadTab>("file");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stageChangeReason, setStageChangeReason] = useState("");

  if (!deal) return null;

  const toggleProduct = (p: string) =>
    setUploadProducts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const currentIdx = STAGES.indexOf(deal.stage);
  const selectedIdx = STAGES.indexOf(uploadStage);
  const isRegression = uploadType === "commercial" && selectedIdx < currentIdx;

  const AUDIO_MIME: Record<string, string> = {
    mp3: "audio/mp3", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", webm: "audio/webm",
  };
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB — safely under Vercel's 4.5MB request limit
  const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB

  const uploadLargeAudio = async (file: File, mimeType: string): Promise<string> => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const ext = file.name.split(".").pop() ?? "mp3";
    const sessionId = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkForm = new FormData();
      chunkForm.append("chunk", new File([chunk], file.name, { type: mimeType }));
      chunkForm.append("chunkIndex", String(i));
      chunkForm.append("totalChunks", String(totalChunks));
      chunkForm.append("mimeType", mimeType);
      chunkForm.append("ext", ext);
      chunkForm.append("sessionId", sessionId);

      const res = await fetch("/api/upload-audio-chunk", { method: "POST", body: chunkForm });
      // Always read the body to get the actual error message
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `チャンク ${i + 1}/${totalChunks} のアップロードに失敗しました`);
      }
      if (data.fileUri) return data.fileUri as string;
      setUploadProgress(Math.round(((i + 1) / totalChunks) * 80));
    }
    throw new Error("Upload did not complete");
  };

  const handleAnalyze = async () => {
    if (isRegression) {
      submitStageChange(dealId, deal.stage, uploadStage, stageChangeReason || "ステージ後退");
    }
    setAnalyzing(true);
    setUploadProgress(0);
    setUploadError(null);

    const today = new Date().toISOString().slice(0, 10);
    const text = uploadText.trim() || `商談記録 ${today}`;

    try {
      const form = new FormData();
      form.append("text", text);
      form.append("stage", uploadStage);
      form.append("products", JSON.stringify(uploadProducts));

      if (uploadFile) {
        const ext = uploadFile.name.toLowerCase().split(".").pop() ?? "";
        const audioMime = AUDIO_MIME[ext];

        if (audioMime && uploadFile.size > LARGE_FILE_THRESHOLD) {
          // Large audio file: upload in chunks, then analyze via fileUri
          const fileUri = await uploadLargeAudio(uploadFile, audioMime);
          setUploadProgress(85); // waiting for ACTIVE state + generation
          form.append("fileUri", fileUri);
          form.append("fileMimeType", audioMime);
        } else {
          form.append("file", uploadFile);
        }
      }

      setUploadProgress(95);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      setUploadProgress(100);

      const newId = addMeeting(dealId, {
        date: today,
        stage: uploadStage,
        type: uploadType,
        products: uploadProducts as import("@/types").Product[],
        totalScore: data.totalScore ?? null,
        maxScore: data.maxScore ?? null,
        summary: data.summary ?? "",
        criteriaScores: data.criteriaScores ?? [],
        customerAnalysis: data.customerAnalysis ?? null,
        strengths: data.strengths ?? [],
        gaps: data.gaps ?? [],
        nextActions: data.nextActions ?? [],
      });

      router.push(`/deals/${dealId}/meetings/${newId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラーが発生しました";
      console.error("[handleAnalyze]", err);
      setUploadError(msg);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const S = {
    app: { minHeight: "100vh", background: C.bgMain },
    body: { padding: "20px", maxWidth: 700, margin: "0 auto" },
    card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: C.shadow },
    btn: { background: C.brand, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    back: { background: "transparent", color: C.brand, border: "none", padding: "0 0 16px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    sec: { fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 },
    pill: (on: boolean) => ({ background: on ? C.brand : C.bgCard, color: on ? "#fff" : C.textSub, border: `1px solid ${on ? C.brand : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: on ? 600 : 500, cursor: "pointer" }),
    inp: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.textMain, fontSize: 13, flex: 1, outline: "none", fontFamily: "inherit", width: "100%" },
  };

  return (
    <div style={S.app}>
      <AppHeader left={<AppLogo />} />
      <div style={S.body}>
        <button style={S.back} onClick={() => { router.push(`/deals/${dealId}`); setUploadFile(null); setUploadText(""); }}>
          ← 戻る
        </button>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.textMain, marginBottom: 3, letterSpacing: "-0.02em" }}>商談記録をアップロード</div>
        <div style={{ fontSize: 12, color: C.textSub, marginBottom: 20 }}>{deal.company}</div>

        {/* Type */}
        <div style={{ marginBottom: 16 }}>
          <div style={S.sec}>タイプ</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.pill(uploadType === "commercial")} onClick={() => setUploadType("commercial")}>💼 商談</button>
            <button style={S.pill(uploadType === "weekly_review")} onClick={() => setUploadType("weekly_review")}>📋 チームレビュー</button>
          </div>
        </div>

        {uploadType === "commercial" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={S.sec}>ソリューション（複数選択可）</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRODUCTS.map((p) => (
                  <button key={p} onClick={() => toggleProduct(p)} style={S.pill(uploadProducts.includes(p))}>
                    {uploadProducts.includes(p) ? "✓ " : ""}{p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={S.sec}>Stage</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STAGES.map((st) => (
                  <button key={st} style={S.pill(st === uploadStage)} onClick={() => setUploadStage(st)}>{st}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {uploadType === "weekly_review" && (
          <div style={{ ...S.card, marginBottom: 16, background: C.brandLight, borderColor: C.brandMid }}>
            <div style={{ fontSize: 12, color: C.brand, fontWeight: 600, marginBottom: 4 }}>📋 チームレビューとして処理</div>
            <div style={{ fontSize: 12, color: C.brand, lineHeight: 1.6, opacity: 0.8 }}>
              AIがレビュー内容から発見・Next Action・戦略変更を自動抽出し、Next Actionを更新します。
            </div>
          </div>
        )}

        {/* File / Text tab */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button style={S.pill(uploadTab === "file")} onClick={() => setUploadTab("file")}>📁 ファイル</button>
          <button style={S.pill(uploadTab === "text")} onClick={() => setUploadTab("text")}>📝 テキスト</button>
        </div>

        {uploadTab === "file" ? (
          <div
            style={{ border: `2px dashed ${C.border}`, borderRadius: 14, padding: 32, textAlign: "center", marginBottom: 18, cursor: "pointer", background: C.bgMain }}
            onClick={() => document.getElementById("fu")?.click()}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.brand)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>📎</div>
            <div style={{ color: C.textSub, fontSize: 13 }}>
              {uploadFile ? (
                <span style={{ color: C.brand, fontWeight: 600 }}>
                  ✓ {uploadFile.name}
                  <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>
                    ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </span>
              ) : "録音ファイルまたは議事録をアップロード"}
            </div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>.mp3 / .m4a / .wav / .txt 対応（サイズ制限なし）</div>
            <input id="fu" type="file" style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
          </div>
        ) : (
          <textarea
            style={{ ...S.inp, height: 150, resize: "vertical", marginBottom: 18 }}
            placeholder={uploadType === "weekly_review" ? "チームレビューの議事録を貼り付けてください..." : "議事録・文字起こしを貼り付けてください..."}
            value={uploadText}
            onChange={(e) => setUploadText(e.target.value)}
          />
        )}

        {/* Stage regression warning */}
        {isRegression && (
          <div style={{ ...S.card, background: C.warningLight, borderColor: C.warning, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 6 }}>⚠️ ステージ後退の申請が必要です</div>
            <div style={{ fontSize: 12, color: "#92400E", marginBottom: 10, lineHeight: 1.6 }}>
              現在「{deal.stage}」→「{uploadStage}」への後退を選択しています。<br />
              {approvalSettings.stageRegression ? "MG承認後にステージが更新されます。" : "承認不要で即時更新されます。"}
            </div>
            <input
              value={stageChangeReason}
              onChange={(e) => setStageChangeReason(e.target.value)}
              placeholder="後退理由を入力（例：顧客からの要件再確認要請があった）..."
              style={{ ...S.inp, fontSize: 12, padding: "8px 12px" }}
            />
          </div>
        )}

        {uploadError && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: "#B91C1C", lineHeight: 1.6 }}>
            ⚠️ エラー: {uploadError}
          </div>
        )}
        <button
          style={{ ...S.btn, width: "100%", padding: "12px", opacity: analyzing ? 0.7 : 1 }}
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing
            ? uploadProgress < 90
              ? `⏫　アップロード中... ${uploadProgress}%`
              : uploadProgress < 95
              ? "⏳　ファイル処理待機中..."
              : "🔍　AIが分析中..."
            : "🔍　AI分析を開始する"}
        </button>
        {analyzing && uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginTop: 10, background: C.bgMain, borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${uploadProgress}%`, height: "100%", background: C.brand, transition: "width 0.3s ease", borderRadius: 8 }} />
          </div>
        )}
      </div>
    </div>
  );
}
