import { AnalysisView } from "@/components/analysis/AnalysisView";

export default async function MeetingAnalysisPage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  return <AnalysisView dealId={parseInt(id)} meetingId={parseInt(mid)} />;
}
