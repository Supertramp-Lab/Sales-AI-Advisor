import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const maxDuration = 120;

async function uploadToDrive(
  filePath: string,
  mimeType: string,
  fileName: string,
  accessToken: string
): Promise<{ fileId: string; fileUrl: string }> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileSize = fileBuffer.byteLength;

  // Initiate a resumable upload session
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileSize),
      },
      body: JSON.stringify({ name: fileName, mimeType }),
    }
  );
  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Drive init failed: ${err}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("Drive: no upload URL in response");

  // Upload file bytes
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: fileBuffer,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id as string;
  return { fileId, fileUrl: `https://drive.google.com/file/d/${fileId}/view` };
}

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
  const accessToken = (formData.get("accessToken") as string) || "";

  const tmpPath = path.join(os.tmpdir(), `${sessionId}.${ext}`);
  const chunkBytes = Buffer.from(await chunk.arrayBuffer());

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

  // All chunks assembled — upload to Gemini Files API and Google Drive in parallel
  const fileName = (formData.get("fileName") as string) || `recording.${ext}`;
  try {
    const { GoogleAIFileManager } = await import("@google/generative-ai/server");
    const fileManager = new GoogleAIFileManager(apiKey);

    const [geminiResult, driveResult] = await Promise.allSettled([
      fileManager.uploadFile(tmpPath, {
        mimeType,
        displayName: `meeting_${sessionId}`,
      }),
      accessToken
        ? uploadToDrive(tmpPath, mimeType, fileName, accessToken)
        : Promise.resolve(null),
    ]);

    if (geminiResult.status === "rejected") {
      throw geminiResult.reason;
    }

    const fileUri = geminiResult.value.file.uri;
    let driveFileId: string | undefined;
    let driveFileUrl: string | undefined;

    if (driveResult.status === "fulfilled" && driveResult.value) {
      driveFileId = driveResult.value.fileId;
      driveFileUrl = driveResult.value.fileUrl;
    } else if (driveResult.status === "rejected") {
      console.error("[upload-audio-chunk] Drive upload failed (non-fatal):", driveResult.reason);
    }

    return NextResponse.json({ fileUri, mimeType, driveFileId, driveFileUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-audio-chunk] error:", err);
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 502 });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}
