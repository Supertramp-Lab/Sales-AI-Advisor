import { DealDetailView } from "@/components/deals/DealDetailView";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealDetailView dealId={parseInt(id)} />;
}
