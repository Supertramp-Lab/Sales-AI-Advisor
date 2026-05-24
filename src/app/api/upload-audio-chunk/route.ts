import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const maxDuration = 120;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const formData = await req.formData();
  const chunk = formData.get("chunk") as File;
  const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
  const totalChunks = parseInt(formData.get("totalChunks") as string, 10);
  const mimeType = formData.get("mimeType") as string;
  const ext = formData.get("ext") as string;
  const sessionId = formData.get("sessionId") as string;

  const tmpPath = path.join(os.tmpdir(), `${sessionId}.${ext}`);
  const chunkBytes = Buffer.from(await chunk.arrayBuffer());

  // Write first chunk, append subsequent ones
  if (chunkIndex === 0) {
    fs.writeFileSync(tmpPath, chunkBytes);
  } else {
    if (!fs.existsSync(tmpPath)) {
      return NextResponse.json(
        { error: "セッションが見つかりません。再度アップロードしてください。" },
        { status: 409 }
      );
    }
    fs.appendFileSync(tmpPath, chunkBytes);
  }

  const isFinal = chunkIndex === totalChunks - 1;
  if (!isFinal) {
    return NextResponse.json({ ok: true, received: chunkIndex + 1 });
  }

  // All chunks assembled — upload to Gemini Files API via SDK
  try {
    const { GoogleAIFileManager } = await import("@google/generative-ai/server");
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadRes = await fileManager.uploadFile(tmpPath, {
      mimeType,
      displayName: `meeting_${sessionId}`,
    });
    return NextResponse.json({ fileUri: uploadRes.file.uri, mimeType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-audio-chunk] Gemini upload error:", err);
    return NextResponse.json({ error: `Gemini upload failed: ${msg}` }, { status: 502 });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup errors */ }
  }
}
