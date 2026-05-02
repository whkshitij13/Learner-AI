import { notFound } from "next/navigation";
import TopicDashboard from "@/components/topic-dashboard";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

const VALID_TRACKS = new Set(["workspace", "lwc", "apex"]);

export function generateStaticParams() {
  return [{ track: "workspace" }, { track: "lwc" }, { track: "apex" }];
}

export default async function TrackDashboardPage({ params }) {
  const { track } = await params;

  if (!VALID_TRACKS.has(track)) {
    notFound();
  }

  return <TopicDashboard curriculum={EMPTY_CURRICULUM} activeTrack={track} />;
}
