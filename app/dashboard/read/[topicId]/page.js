import TopicReaderPage from "@/components/topic-reader-page";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

export default async function WorkspaceTopicReader({ params }) {
  const { topicId } = await params;

  return <TopicReaderPage activeTrack="workspace" curriculum={EMPTY_CURRICULUM} topicId={decodeURIComponent(topicId)} />;
}
