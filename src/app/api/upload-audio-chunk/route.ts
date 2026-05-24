import { NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta/files";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const formData = await req.formData();
  const chunk = formData.get("chunk") as File;
  const chunkStart = parseInt(formData.get("chunkStart") as string, 10);
  const totalSize = parseInt(formData.get("totalSize") as string, 10);
  const mimeType = formData.get("mimeType") as string;
  const fileName = formData.get("fileName") as string;
  const isFinal = formData.get("isFinal") === "true";
  let uploadUrl = (formData.get("uploadUrl") as string) || "";

  const chunkBytes = await chunk.arrayBuffer();

  // First chunk: initiate a Gemini resumable upload session
  if (!uploadUrl) {
    const initRes = await fetch(`${GEMINI_UPLOAD_BASE}?uploadType=resumable&key=${apiKey}`, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "X-Goog-Upload-Header-Content-Length": String(totalSize),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: fileName } }),
    });
    uploadUrl = initRes.headers.get("X-Goog-Upload-URL") ?? "";
    if (!uploadUrl) {
      return NextResponse.json({ error: "Failed to initiate upload session" }, { status: 502 });
    }
  }

  // Upload this chunk (finalize on last chunk)
  const command = isFinal ? "upload, finalize" : "upload";
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(chunkBytes.byteLength),
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": command,
      "X-Goog-Upload-Offset": String(chunkStart),
    },
    body: chunkBytes,
  });

  if (!isFinal) {
    return NextResponse.json({ uploadUrl });
  }

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: 502 });
  }

  const fileData = await uploadRes.json();
  const fileUri = fileData.file?.uri as string | undefined;
  if (!fileUri) {
    return NextResponse.json({ error: "No file URI in response" }, { status: 502 });
  }

  return NextResponse.json({ fileUri, mimeType });
}
