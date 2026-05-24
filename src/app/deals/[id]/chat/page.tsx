import { ChatView } from "@/components/chat/ChatView";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mid?: string }>;
}) {
  const { id } = await params;
  const { mid } = await searchParams;
  return <ChatView dealId={parseInt(id)} meetingId={mid ? parseInt(mid) : undefined} />;
}
