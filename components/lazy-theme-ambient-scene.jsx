"use client";

import dynamic from "next/dynamic";

const ThemeAmbientScene = dynamic(() => import("@/components/theme-ambient-scene"), {
  ssr: false,
  loading: () => <div className="theme-ambient-scene" aria-hidden="true" />
});

export default function LazyThemeAmbientScene() {
  return <ThemeAmbientScene />;
}
