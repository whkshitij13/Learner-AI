import { NextResponse } from "next/server";
import { EMPTY_CURRICULUM } from "@/lib/dashboard-seed";

export async function GET(_, { params }) {
  const curriculum = EMPTY_CURRICULUM;
  const { track, topicId } = params;

  if (!curriculum[track]) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const topic = curriculum[track].find((item) => item.id === topicId);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({
    track,
    topic
  });
}
