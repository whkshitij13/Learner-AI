import LandingPage from "@/components/landing-page";
import { DASHBOARD_TRACKS } from "@/lib/dashboard-seed";

export default function Page() {
  return <LandingPage tracks={DASHBOARD_TRACKS} />;
}
