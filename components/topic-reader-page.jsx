"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MediaShelf from "@/components/media-shelf";
import StudyHeader from "@/components/study-header";
import ThemeAmbientScene from "@/components/theme-ambient-scene";
import { auth, db } from "@/lib/firebase/client";
import { getUserDashboardState } from "@/lib/dashboard-store";
import { normalizeTopic } from "@/components/topic-dashboard";

function isPodcastMediaItem(item) {
  const type = String(item?.type || "").toLowerCase();
  const href = String(item?.href || "").toLowerCase();

  return type.includes("podcast") || type.includes("audio") || /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href);
}

function isVideoMediaItem(item) {
  const type = String(item?.type || "").toLowerCase();
  const href = String(item?.href || "").toLowerCase();

  return type.includes("video") || Boolean(item?.previewVideo) || href.includes("youtube.com") || href.includes("youtu.be") || href.includes("vimeo.com");
}

function isPhotoMediaItem(item) {
  const type = String(item?.type || "").toLowerCase();

  return Boolean(item?.image && !isVideoMediaItem(item) && !isPodcastMediaItem(item) && !type.includes("resource"));
}

export default function TopicReaderPage({ curriculum, activeTrack, topicId }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [customTopics, setCustomTopics] = useState([]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("learner-dev-theme") || "dark";
    setTheme(storedTheme);
    document.body.dataset.theme = storedTheme;
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("learner-dev-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      router.replace("/");
    }
  }, [authReady, router, user]);

  useEffect(() => {
    async function loadTopics() {
      if (!user || !db) {
        return;
      }

      const dashboardState = await getUserDashboardState(db, user);
      const trackState = dashboardState.tracks?.[activeTrack];
      setCustomTopics((trackState?.topics || []).map((topic) => normalizeTopic(topic, activeTrack)));
    }

    loadTopics();
  }, [activeTrack, user]);

  const topic = useMemo(() => {
    const allTopics = [...(curriculum[activeTrack] || []), ...customTopics].map((item) => normalizeTopic(item, activeTrack));
    return allTopics.find((item) => item?.id === topicId) || null;
  }, [activeTrack, curriculum, customTopics, topicId]);

  const mediaItems = topic?.media || [];
  const videoMediaItems = mediaItems.filter(isVideoMediaItem);
  const photoMediaItems = mediaItems.filter(isPhotoMediaItem);
  const podcastMediaItems = mediaItems.filter(isPodcastMediaItem);
  const searchableTerms = useMemo(
    () => [...new Set([...(topic?.branchTopics || []), ...(topic?.keyTerms || []), ...(topic?.subtopics || [])])].filter(Boolean).slice(0, 24),
    [topic]
  );
  const readerParagraphs = useMemo(() => [...new Set([...(topic?.deepDive || []), ...(topic?.longRead || [])])], [topic]);

  function openSearch(term) {
    const query = topic?.title ? `${topic.title} ${term}` : term;

    window.sessionStorage.setItem(
      "learner-pending-topic-search",
      JSON.stringify({
        track: activeTrack,
        query
      })
    );

    router.push(activeTrack === "workspace" ? "/dashboard" : `/dashboard/${activeTrack}`);
  }

  function renderSearchableText(text, keyPrefix) {
    if (!text || !searchableTerms.length) {
      return text;
    }

    const escapedTerms = searchableTerms.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const matcher = new RegExp(`(${escapedTerms.join("|")})`, "gi");

    return String(text)
      .split(matcher)
      .map((part, index) => {
        const matchedTerm = searchableTerms.find((item) => item.toLowerCase() === part.toLowerCase());

        if (!matchedTerm) {
          return <span key={`${keyPrefix}-${index}`}>{part}</span>;
        }

        return (
          <button className="inline-topic-link searchable-glow-link" key={`${keyPrefix}-${index}`} onClick={() => openSearch(matchedTerm)} type="button">
            {part}
          </button>
        );
      });
  }

  async function handleLogout() {
    if (auth) {
      await signOut(auth);
    }
  }

  return (
    <div className="dashboard-shell reader-shell">
      <ThemeAmbientScene />
      <StudyHeader
        onLoginClick={() => {
          window.location.href = "/";
        }}
        onLogout={handleLogout}
        onSignupClick={() => {
          window.location.href = "/";
        }}
        onThemeChange={setTheme}
        theme={theme}
        user={user}
      />

      <main className="reader-main">
        {topic ? (
          <>
            <section className="reader-hero glass-card">
              <button className="button button-secondary" onClick={() => router.back()} type="button">
                Back
              </button>
              <span className="eyebrow">Reader mode</span>
              <h1>{topic.title}</h1>
              <p>{topic.focus}</p>
              <div className="chip-row">
                {searchableTerms.slice(0, 8).map((term) => (
                  <button className="tag tag-button key-term-glow searchable-glow-link" key={term} onClick={() => openSearch(term)} type="button">
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <section className="reader-grid">
              <article className="glass-card study-card study-card-wide">
                <span className="eyebrow">Full explanation</span>
                <h2>Read deeper</h2>
                <div className="stacked-copy reader-copy">
                  {readerParagraphs.map((item, index) => (
                    <p key={`${item}-${index}`}>{renderSearchableText(item, `reader-copy-${index}`)}</p>
                  ))}
                </div>
              </article>

              {topic.subtopicCards?.length ? (
                <article className="glass-card study-card">
                  <span className="eyebrow">Explore next</span>
                  <h3>Clickable study paths</h3>
                  <div className="subtopic-card-grid">
                    {topic.subtopicCards.map((item) => (
                      <button className="subtopic-learning-card searchable-card searchable-glow-link" key={item.id} onClick={() => openSearch(item.title)} type="button">
                        <strong>{item.title}</strong>
                        <p>{item.summary}</p>
                        <small>{item.goal}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ) : null}

              {videoMediaItems.length ? (
                <article className="glass-card study-card study-card-wide media-section-card">
                  <span className="eyebrow">Videos</span>
                  <h3>Watch while studying</h3>
                  <MediaShelf items={videoMediaItems} mode="video" />
                </article>
              ) : null}

              {photoMediaItems.length ? (
                <article className="glass-card study-card study-card-wide media-section-card">
                  <span className="eyebrow">Photos</span>
                  <h3>Visual references</h3>
                  <MediaShelf items={photoMediaItems} mode="photo" />
                </article>
              ) : null}

              {podcastMediaItems.length ? (
                <article className="glass-card study-card study-card-wide media-section-card">
                  <span className="eyebrow">Podcasts</span>
                  <h3>Listen and keep going</h3>
                  <MediaShelf items={podcastMediaItems} />
                </article>
              ) : null}

              {!mediaItems.length ? (
                <article className="glass-card study-card study-card-wide">
                  <span className="eyebrow">Media</span>
                  <h3>No extra media yet</h3>
                  <p>Generate this topic again or search one of the highlighted terms to build a richer media set.</p>
                </article>
              ) : null}
            </section>
          </>
        ) : (
          <article className="glass-card study-card reader-empty-card">
            <span className="eyebrow">Loading</span>
            <h1>Looking for this topic</h1>
            <p>If it was just generated, the reader will open after your saved dashboard topics finish loading.</p>
          </article>
        )}
      </main>
    </div>
  );
}
