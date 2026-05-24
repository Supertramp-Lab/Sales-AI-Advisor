import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import type { Deal } from "@/types";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const deal = (await req.json()) as Deal;
    await db.collection("deals").doc(id).set(deal);
    return NextResponse.json(deal);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}
