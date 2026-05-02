"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import StudyHeader from "@/components/study-header";
import ThemeAmbientScene from "@/components/theme-ambient-scene";
import { auth, db } from "@/lib/firebase/client";
import { getUserDashboardState } from "@/lib/dashboard-store";
import { buildProgressSummary, DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { applyAppearance } from "@/lib/appearance";

function formatTrackLabel(trackId) {
  if (!trackId || trackId === "workspace") {
    return "Workspace";
  }

  return trackId === "lwc" ? "LWC" : trackId === "apex" ? "Apex" : "Workspace";
}

function getRankLabel(completionRate) {
  if (completionRate >= 80) {
    return "Expert";
  }

  if (completionRate >= 45) {
    return "Explorer";
  }

  return "Beginner";
}

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [dashboardState, setDashboardState] = useState({ tracks: {} });

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
      return;
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
    async function loadData() {
      if (!user || !db) {
        return;
      }

      const [nextProfile, nextDashboardState] = await Promise.all([
        ensureUserProfile(db, user),
        getUserDashboardState(db, user)
      ]);

      setProfile(nextProfile);
      setDashboardState(nextDashboardState);
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
      applyAppearance(nextProfile.appearance);
      if (nextProfile.appearance?.mode) {
        setTheme(nextProfile.appearance.mode);
      }
    }

    loadData();
  }, [user]);

  const progressSummary = useMemo(() => buildProgressSummary(dashboardState), [dashboardState]);

  const topicCards = useMemo(
    () =>
      progressSummary.topicEntries
        .map((item) => {
          const progress = dashboardState.tracks?.[item.trackId]?.progressByTopic?.[item.topicId] || {};
          const subtopicTotal = item.topic?.subtopicCards?.length || item.topic?.subtopics?.length || 0;
          const completedCount = progress.completedSubtopics?.length || 0;
          const completionPercent =
            progress.completionPercent ||
            (subtopicTotal ? Math.round((completedCount / subtopicTotal) * 100) : progress.milestoneClaimed ? 70 : 0);

          return {
            id: `${item.trackId}-${item.topicId}`,
            topicId: item.topicId,
            title: item.topic?.title || "Untitled topic",
            focus: item.topic?.focus || "Continue learning through your saved study cards.",
            level: item.topic?.level || "AI generated",
            trackId: item.trackId,
            subtopicTotal,
            completedCount,
            completionPercent,
            milestoneClaimed: Boolean(progress.milestoneClaimed),
            certificateUnlocked: Boolean(progress.certificateUnlocked)
          };
        })
        .sort((left, right) => right.completionPercent - left.completionPercent),
    [dashboardState, progressSummary.topicEntries]
  );

  const activeModule = topicCards[0];
  const displayName = profile.displayName || user?.displayName || "Learner";
  const learnerLevel = Math.max(1, Math.floor(progressSummary.completedSubtopics / 4) + 1);
  const rankLabel = getRankLabel(progressSummary.completionRate);
  const xpTotal = Math.max(120, progressSummary.topicsStarted * 70 + progressSummary.completedSubtopics * 18 + 137);
  const xpCurrent = Math.min(xpTotal, Math.max(0, Math.round((progressSummary.completionRate / 100) * xpTotal)));
  const weeklyTarget = 200;
  const weeklyXp = Math.min(weeklyTarget, progressSummary.activeDays * 25);
  const streakWeeks = Math.floor(progressSummary.activeDays / 7);
  const badgeItems = [
    { icon: "LV", label: `Level ${learnerLevel}` },
    { icon: "XP", label: `${xpCurrent} XP` },
    { icon: "MD", label: `${progressSummary.topicsStarted} modules` },
    { icon: "CT", label: `${progressSummary.certificates} certs` }
  ];

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace("/");
  }

  function openModule(module) {
    const track = module?.trackId || "workspace";
    router.push(track === "workspace" ? "/home" : `/dashboard/${track}`);
  }

  return (
    <div className="dashboard-shell dashboard-home-shell">
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

      <main className="dashboard-main dashboard-home-main">
        <section className="academy-home-layout">
          <article className="academy-home-main-column">
            <section className="dashboard-hero academy-home-hero">
              <div>
                <span className="eyebrow">Home</span>
                <h1>Welcome, {displayName}</h1>
                <p>Track module progress, badges, streaks, and certificates here. Your editable profile stays focused in My Profile.</p>
              </div>
              <div className="dashboard-badges">
                <span>{rankLabel}</span>
                <span>{progressSummary.completionRate}% complete</span>
                <span>{formatTrackLabel(progressSummary.recentTrack)}</span>
              </div>
            </section>

            <section className="study-card academy-home-feature-card">
              <div className="topic-card-top">
                <div>
                  <span className="eyebrow">Continue</span>
                  <h2>{activeModule?.title || "Start your first module"}</h2>
                </div>
                <span className="topic-kind">{formatTrackLabel(activeModule?.trackId || progressSummary.recentTrack)}</span>
              </div>
              <p>{activeModule?.focus || "Generate a topic from the workspace and your learning progress will start showing up here."}</p>
              <div className="milestone-progress-bar" aria-hidden="true">
                <span style={{ width: `${activeModule?.completionPercent || 0}%` }} />
              </div>
              <div className="academy-home-stat-row">
                <span>{activeModule ? `${activeModule.completedCount}/${activeModule.subtopicTotal || 1} milestones` : "No tracked milestones yet"}</span>
                <strong>{activeModule?.completionPercent || 0}%</strong>
              </div>
              <div className="header-actions-compact">
                <button className="button" onClick={() => openModule(activeModule)} type="button">
                  {activeModule ? "Continue learning" : "Open workspace"}
                </button>
                <button className="button button-secondary" onClick={() => router.push("/home")} type="button">
                  New topic
                </button>
              </div>
            </section>

            <section className="study-card academy-home-section">
              <div className="topic-card-top">
                <div>
                  <span className="eyebrow">Modules</span>
                  <h2>Module progress</h2>
                </div>
                <span className="topic-kind">{topicCards.length} tracked</span>
              </div>
              <div className="academy-home-module-grid">
                {topicCards.length ? (
                  topicCards.map((item) => (
                    <button className="academy-home-module-card" key={item.id} onClick={() => openModule(item)} type="button">
                      <div className="topic-card-top">
                        <strong>{item.title}</strong>
                        <span className="pill">{item.completionPercent}%</span>
                      </div>
                      <p>{item.focus}</p>
                      <div className="academy-home-meta">
                        <span>{formatTrackLabel(item.trackId)}</span>
                        <span>{item.level}</span>
                      </div>
                      <div className="milestone-progress-bar" aria-hidden="true">
                        <span style={{ width: `${item.completionPercent}%` }} />
                      </div>
                      <div className="academy-home-stat-row">
                        <span>
                          {item.completedCount}/{item.subtopicTotal || 1} milestones
                        </span>
                        <strong>{item.certificateUnlocked ? "Certified" : item.milestoneClaimed ? "Milestone" : "In progress"}</strong>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="muted-line">No module progress yet. Generate a topic from the workspace and we'll start tracking it here.</p>
                )}
              </div>
            </section>
          </article>

          <aside className="academy-home-side-column">
            <section className="study-card academy-home-badges-card">
              <div className="topic-card-top">
                <div>
                  <span className="eyebrow">Badges</span>
                  <h2>Your learning badges</h2>
                </div>
                <span className="topic-kind">Live</span>
              </div>
              <div className="academy-home-badge-grid">
                {badgeItems.map((item) => (
                  <article className="academy-home-badge" key={item.icon}>
                    <strong>{item.icon}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="study-card academy-home-progress-card">
              <div className="topic-card-top">
                <div>
                  <span className="eyebrow">Progress</span>
                  <h2>Rank and streak</h2>
                </div>
                <span className="topic-kind">{rankLabel}</span>
              </div>
              <div className="academy-home-progress-block">
                <span>Level XP</span>
                <strong>
                  {xpCurrent}/{xpTotal}
                </strong>
                <div className="milestone-progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.round((xpCurrent / xpTotal) * 100))}%` }} />
                </div>
              </div>
              <div className="academy-home-progress-block">
                <span>Weekly streak</span>
                <strong>{streakWeeks} weeks</strong>
                <div className="milestone-progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round((weeklyXp / weeklyTarget) * 100)}%` }} />
                </div>
                <p>{weeklyXp}/{weeklyTarget} weekly XP</p>
              </div>
              <div className="academy-home-kpi-grid">
                <article className="metric-card">
                  <span>Certificates</span>
                  <strong>{progressSummary.certificates}</strong>
                </article>
                <article className="metric-card">
                  <span>Active days</span>
                  <strong>{progressSummary.activeDays}</strong>
                </article>
                <article className="metric-card">
                  <span>Subtopics done</span>
                  <strong>{progressSummary.completedSubtopics}</strong>
                </article>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
