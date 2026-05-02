import TopicDashboard from "@/components/topic-dashboard";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

export default function HomePage() {
  return <TopicDashboard curriculum={EMPTY_CURRICULUM} activeTrack="workspace" />;
}
