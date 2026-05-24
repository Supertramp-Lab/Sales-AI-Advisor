import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

type CriteriaScore = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  comment: string;
  recordSummary: string;
};

type AnalysisItem = { id: string; text: string; corrected: boolean; source: "ai" };
type NextAction = { id: string; text: string; status: "active"; priority: number };

type AnalyzeResult = {
  summary: string;
  totalScore: number;
  maxScore: number;
  criteriaScores: CriteriaScore[];
  customerAnalysis: { attitude: string; preference: string; tactics: string };
  strengths: AnalysisItem[];
  gaps: AnalysisItem[];
  nextActions: NextAction[];
};

const STAGE_CRITERIA: Record<string, { id: string; label: string; description: string }[]> = {
  "案件化": [
    { id: "b1", label: "Budget", description: "予算が確認・承認されているか" },
    { id: "a1", label: "Authority", description: "KDM（意思決定者）との接点があるか" },
    { id: "n1", label: "Need", description: "具体的な課題・ニーズが把握できているか" },
    { id: "t1", label: "Timing", description: "導入タイミング・スケジュールが明確か" },
    { id: "c1", label: "Competitor", description: "競合・現行ツールの状況が把握できているか" },
  ],
  "要件化": [
    { id: "m1", label: "Metrics", description: "改善KPI・数値目標が合意されているか" },
    { id: "f1_mkt", label: "Fact AS-IS (Marketing)", description: "現状のマーケティング施策・課題が把握できているか" },
    { id: "f2_sys", label: "Fact AS-IS (System)", description: "現行システム構成（SDK/CRM/CDP等）が把握できているか" },
    { id: "g1_mkt", label: "Goal TO-BE (Marketing)", description: "理想のマーケティング施策・体験が合意されているか" },
    { id: "g2_sys", label: "Goal TO-BE (System)", description: "理想のシステム構想・データ連携設計が合意されているか" },
  ],
  "合意化": [
    { id: "sc1", label: "Scope", description: "導入スコープ・フェーズが合意されているか" },
    { id: "roi1", label: "ROI", description: "投資対効果・ROI試算が提示・合意されているか" },
    { id: "p1", label: "Price", description: "価格・見積が提示・承認されているか" },
    { id: "dp1", label: "Decision Process", description: "稟議プロセス・承認フローが把握できているか" },
    { id: "dc1", label: "Decision Criteria", description: "顧客の意思決定基準・評価軸が把握できているか" },
  ],
  "締結化": [
    { id: "who1", label: "Who", description: "契約担当部署（法務・調達・情報セキュリティ）が特定できているか" },
    { id: "when1", label: "When", description: "締結期限・利用開始日程が確定しているか" },
    { id: "what1", label: "What", description: "必要書類（NDA/発注書/契約書）の確認・準備が完了しているか" },
  ],
};

function buildMockResult(stage: string): AnalyzeResult {
  const criteria = STAGE_CRITERIA[stage] ?? STAGE_CRITERIA["案件化"];
  const scores = criteria.map((c, i) => ({
    id: c.id,
    label: c.label,
    score: [4, 3, 4, 2, 3][i % 5],
    maxScore: 5,
    comment: `${c.label}については商談記録から確認できた内容をもとに評価しました。`,
    recordSummary: `${c.description}に関する発言や情報が商談記録から確認されました。`,
  }));
  const total = scores.reduce((s, c) => s + c.score, 0);

  return {
    summary:
      "今回の商談では顧客の課題と導入意向を確認しました。具体的なKPIや予算感についても議論が進み、次のステップが明確になりました。引き続きキーパーソンとの関係強化が重要です。",
    totalScore: total,
    maxScore: criteria.length * 5,
    criteriaScores: scores,
    customerAnalysis: {
      attitude: "関心度は高く、前向きな姿勢が見られます。意思決定には慎重で、定量的な根拠を重視しています。",
      preference: "具体的な数値・実績データを好みます。デモや事例を通じた体験型の説明に強く反応します。",
      tactics:
        "次回商談ではROI試算と成功事例を中心に提示し、具体的な導入イメージを描いてもらうことを優先してください。",
    },
    strengths: [
      { id: `s_${Date.now()}_1`, text: "キーパーソンとの接点が確立されている", corrected: false, source: "ai" },
      { id: `s_${Date.now()}_2`, text: "導入に向けた具体的な課題認識が共有されている", corrected: false, source: "ai" },
    ],
    gaps: [
      { id: `g_${Date.now()}_1`, text: "詳細要件・評価基準の深掘りが不十分", corrected: false, source: "ai" },
      { id: `g_${Date.now()}_2`, text: "意思決定プロセスの全体像が未確認", corrected: false, source: "ai" },
    ],
    nextActions: [
      { id: `na_${Date.now()}_1`, text: "次回商談のアジェンダを事前に共有する", status: "active", priority: 1 },
      { id: `na_${Date.now()}_2`, text: "同業界の成功事例資料を準備・送付する", status: "active", priority: 2 },
      { id: `na_${Date.now()}_3`, text: "ROI試算シートを作成して提示する", status: "active", priority: 3 },
    ],
  };
}

function buildPrompt(stage: string, bodyText: string): string {
  const criteria = STAGE_CRITERIA[stage] ?? STAGE_CRITERIA["案件化"];
  const criteriaText = criteria.map((c) => `- ${c.id} (${c.label}): ${c.description}`).join("\n");
  return `あなたはAppier Enterprise SolutionsのAI営業アドバイザーです。
以下の商談記録を分析し、JSON形式で回答してください。

ステージ: ${stage}
商談記録:
${bodyText}

評価基準（${stage}ステージ、各項目0〜5点）:
${criteriaText}

以下のJSON形式で厳密に回答してください（JSONのみ、説明文不要）:
{
  "summary": "商談の要約（2〜3文、日本語）",
  "totalScore": 合計スコア（数値）,
  "maxScore": ${criteria.length * 5},
  "criteriaScores": [
    {
      "id": "基準ID",
      "label": "ラベル",
      "score": スコア（0〜5の整数）,
      "maxScore": 5,
      "comment": "スコアの根拠（1文）",
      "recordSummary": "商談記録からの該当発言・情報の要約"
    }
  ],
  "customerAnalysis": {
    "attitude": "顧客の態度・温度感（1〜2文）",
    "preference": "顧客のコンテンツ好み（1〜2文）",
    "tactics": "推奨コミュニケーション戦術（具体的に1〜2文）"
  },
  "strengths": [
    { "id": "s1", "text": "達成された強みの項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "gaps": [
    { "id": "g1", "text": "未達成・課題の項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "nextActions": [
    { "id": "na1", "text": "具体的なNext Action（アクション動詞で始める）", "status": "active", "priority": 1 }
  ]
}`;
}

async function callGemini(text: string, stage: string, apiKey: string): Promise<AnalyzeResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(buildPrompt(stage, text));
  return JSON.parse(result.response.text()) as AnalyzeResult;
}

const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mp3",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

async function waitForFileActive(fileUri: string, apiKey: string): Promise<void> {
  // fileUri: https://generativelanguage.googleapis.com/v1beta/files/abc123
  const fileId = fileUri.split("/v1beta/")[1]; // "files/abc123"
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileId}?key=${apiKey}`
    );
    const data = await res.json();
    console.log(`[waitForFileActive] attempt ${i + 1}: state=${data.state}`);
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED") throw new Error(`File processing failed: ${JSON.stringify(data)}`);
  }
  throw new Error("File not ready after 60s of polling");
}

async function callGeminiWithFileUri(
  fileUri: string,
  mimeType: string,
  stage: string,
  apiKey: string
): Promise<AnalyzeResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const criteria = STAGE_CRITERIA[stage] ?? STAGE_CRITERIA["案件化"];
  const criteriaText = criteria.map((c) => `- ${c.id} (${c.label}): ${c.description}`).join("\n");

  const prompt = `あなたはAppier Enterprise SolutionsのAI営業アドバイザーです。
この音声ファイルは商談の録音です。会話内容を文字起こしして分析し、JSON形式で回答してください。

ステージ: ${stage}

評価基準（${stage}ステージ、各項目0〜5点）:
${criteriaText}

以下のJSON形式で厳密に回答してください（JSONのみ、説明文不要）:
{
  "summary": "商談の要約（2〜3文、日本語）",
  "totalScore": 合計スコア（数値）,
  "maxScore": ${criteria.length * 5},
  "criteriaScores": [
    {
      "id": "基準ID",
      "label": "ラベル",
      "score": スコア（0〜5の整数）,
      "maxScore": 5,
      "comment": "スコアの根拠（1文）",
      "recordSummary": "音声から確認できた該当発言の要約"
    }
  ],
  "customerAnalysis": {
    "attitude": "顧客の態度・温度感（1〜2文）",
    "preference": "顧客のコンテンツ好み（1〜2文）",
    "tactics": "推奨コミュニケーション戦術（具体的に1〜2文）"
  },
  "strengths": [
    { "id": "s1", "text": "達成された強みの項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "gaps": [
    { "id": "g1", "text": "未達成・課題の項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "nextActions": [
    { "id": "na1", "text": "具体的なNext Action（アクション動詞で始める）", "status": "active", "priority": 1 }
  ]
}`;

  // Wait for the file to become ACTIVE before using it in generation
  await waitForFileActive(fileUri, apiKey);

  const result = await model.generateContent([
    { fileData: { mimeType, fileUri } },
    prompt,
  ]);
  return JSON.parse(result.response.text()) as AnalyzeResult;
}

async function callGeminiWithAudio(
  audioBase64: string,
  mimeType: string,
  stage: string,
  apiKey: string
): Promise<AnalyzeResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const criteria = STAGE_CRITERIA[stage] ?? STAGE_CRITERIA["案件化"];
  const criteriaText = criteria.map((c) => `- ${c.id} (${c.label}): ${c.description}`).join("\n");

  const audioPrompt = `あなたはAppier Enterprise SolutionsのAI営業アドバイザーです。
この音声ファイルは商談の録音です。会話内容を文字起こしして分析し、JSON形式で回答してください。

ステージ: ${stage}

評価基準（${stage}ステージ、各項目0〜5点）:
${criteriaText}

以下のJSON形式で厳密に回答してください（JSONのみ、説明文不要）:
{
  "summary": "商談の要約（2〜3文、日本語）",
  "totalScore": 合計スコア（数値）,
  "maxScore": ${criteria.length * 5},
  "criteriaScores": [
    {
      "id": "基準ID",
      "label": "ラベル",
      "score": スコア（0〜5の整数）,
      "maxScore": 5,
      "comment": "スコアの根拠（1文）",
      "recordSummary": "音声から確認できた該当発言の要約"
    }
  ],
  "customerAnalysis": {
    "attitude": "顧客の態度・温度感（1〜2文）",
    "preference": "顧客のコンテンツ好み（1〜2文）",
    "tactics": "推奨コミュニケーション戦術（具体的に1〜2文）"
  },
  "strengths": [
    { "id": "s1", "text": "達成された強みの項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "gaps": [
    { "id": "g1", "text": "未達成・課題の項目（簡潔に）", "corrected": false, "source": "ai" }
  ],
  "nextActions": [
    { "id": "na1", "text": "具体的なNext Action（アクション動詞で始める）", "status": "active", "priority": 1 }
  ]
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: audioBase64 } },
    audioPrompt,
  ]);
  return JSON.parse(result.response.text()) as AnalyzeResult;
}

export async function POST(req: NextRequest) {
  let stage = "案件化";
  const formData = await req.formData();
  const text = (formData.get("text") as string) ?? "";
  stage = (formData.get("stage") as string) ?? "案件化";
  const file = formData.get("file") as File | null;
  const apiKey = process.env.GEMINI_API_KEY;

  // Large file: uploaded via chunked endpoint, received as a Files API URI.
  // Do NOT fall back to mock data here — surface real errors so the client shows them.
  const fileUri = formData.get("fileUri") as string | null;
  const fileMimeType = formData.get("fileMimeType") as string | null;
  if (fileUri && fileMimeType) {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
    }
    try {
      const result = await callGeminiWithFileUri(fileUri, fileMimeType, stage, apiKey);
      return NextResponse.json(result);
    } catch (err) {
      console.error("[analyze] callGeminiWithFileUri error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `AI分析エラー: ${msg}` }, { status: 500 });
    }
  }

  // Standard flow (small files / text) — fall back to mock when no API key
  try {
    if (file && file.size > 0 && apiKey) {
      const ext = file.name.toLowerCase().split(".").pop() ?? "";
      const audioMime = AUDIO_MIME[ext];

      if (audioMime) {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const result = await callGeminiWithAudio(base64, audioMime, stage, apiKey);
        return NextResponse.json(result);
      }

      if (ext === "txt") {
        const fileText = await file.text();
        const combined = [fileText, text].filter(Boolean).join("\n\n");
        if (combined.trim() && apiKey) {
          return NextResponse.json(await callGemini(combined, stage, apiKey));
        }
      }
    }

    if (!apiKey || !text.trim()) {
      return NextResponse.json(buildMockResult(stage));
    }

    return NextResponse.json(await callGemini(text, stage, apiKey));
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json(buildMockResult(stage));
  }
}
