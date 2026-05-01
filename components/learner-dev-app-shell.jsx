"use client";

import dynamic from "next/dynamic";

const LearnerDevApp = dynamic(() => import("@/components/learner-dev-app"), {
  ssr: false
});

export default function LearnerDevAppShell(props) {
  return <LearnerDevApp {...props} />;
}
