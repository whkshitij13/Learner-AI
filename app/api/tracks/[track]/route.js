import { NextResponse } from "next/server";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

export async function GET(_, { params }) {
  const curriculum = EMPTY_CURRICULUM;
  const track = params.track;

  if (track === "final") {
    return NextResponse.json({
      track,
      data: curriculum.finalTest
    });
  }

  if (!curriculum[track]) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  return NextResponse.json({
    track,
    count: curriculum[track].length,
    topics: curriculum[track].map((topic) => ({
      id: topic.id,
      title: topic.title,
      level: topic.level,
      focus: topic.focus,
      subtopicCount: (topic.subtopics || []).length
    }))
  });
}
