import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { INIT_DEALS } from "@/lib/initialData";
import type { Deal } from "@/types";

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection("deals").orderBy("id").get();
    if (snapshot.empty) {
      const batch = db.batch();
      for (const deal of INIT_DEALS) {
        batch.set(db.collection("deals").doc(String(deal.id)), deal);
      }
      await batch.commit();
      return NextResponse.json(INIT_DEALS);
    }
    return NextResponse.json(snapshot.docs.map((d) => d.data() as Deal));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const deal = (await req.json()) as Deal;
    await db.collection("deals").doc(String(deal.id)).set(deal);
    return NextResponse.json(deal, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
