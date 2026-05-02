import { notFound } from "next/navigation";
import TopicReaderPage from "@/components/topic-reader-page";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

const VALID_TRACKS = new Set(["lwc", "apex"]);

export default async function TrackTopicReader({ params }) {
  const { track, topicId } = await params;

  if (!VALID_TRACKS.has(track)) {
    notFound();
  }

  return <TopicReaderPage activeTrack={track} curriculum={EMPTY_CURRICULUM} topicId={decodeURIComponent(topicId)} />;
}
