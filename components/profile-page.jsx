"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { getUserDashboardState } from "@/lib/dashboard-store";
import { buildProgressSummary, DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";

function getInitials(user, profile) {
  const value = profile.displayName || user?.displayName || user?.email || "Learner";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
}

function formatTrackLabel(trackId) {
  if (!trackId) {
    return "Workspace";
  }

  return trackId === "lwc" ? "LWC" : trackId === "apex" ? "Apex" : "Workspace";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
  const [dashboardState, setDashboardState] = useState({ tracks: {} });
  const [status, setStatus] = useState("");

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
      setDraftProfile(nextProfile);
      setDashboardState(nextDashboardState);
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
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
            title: item.topic?.title || "Untitled topic",
            focus: item.topic?.focus || "Continue learning through the module cards below.",
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

  const milestoneCards = useMemo(
    () => topicCards.filter((item) => item.completedCount || item.milestoneClaimed || item.certificateUnlocked),
    [topicCards]
  );

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace("/");
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftProfile((current) => ({
        ...current,
        photoDataUrl: String(reader.result || "")
      }));
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!user || !db) {
      return;
    }

    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...draftProfile,
      appearance: {
        ...DEFAULT_PROFILE.appearance,
        ...draftProfile.appearance,
        mode: theme
      }
    };

    await setDoc(
      getUserRootRef(db, user.uid),
      {
        email: user.email || "",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    await setDoc(
      getUserProfileRef(db, user.uid),
      {
        userId: user.uid,
        email: user.email || "",
        profile: nextProfile,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    if (user.displayName !== nextProfile.displayName || user.photoURL !== nextProfile.photoDataUrl) {
      await updateProfile(user, {
        displayName: nextProfile.displayName,
        photoURL: nextProfile.photoDataUrl || null
      });
    }

    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
    setStatus("Profile updated.");
    window.setTimeout(() => setStatus(""), 1800);
  }

  const avatarLabel = getInitials(user, draftProfile);

  return (
    <div className="dashboard-shell profile-page-shell">
      <StudyHeader
        onLoginClick={() => {
          window.location.href = "/";
        }}
        onLogout={handleLogout}
        onSignupClick={() => {
          window.location.href = "/";
        }}
        onThemeChange={setTheme}
        showDashboardLink
        theme={theme}
        user={user}
      />

      <main className="dashboard-main">
        <section className="profile-page-grid">
          <article className="glass-card profile-hero-card">
            <div className="profile-hero-top">
              <div className="profile-hero-identity">
                {draftProfile.photoDataUrl ? (
                  <img alt="Profile avatar" className="profile-avatar-large academy-avatar" src={draftProfile.photoDataUrl} />
                ) : (
                  <div className="profile-avatar-large profile-avatar-fallback academy-avatar">{avatarLabel}</div>
                )}
                <div>
                  <span className="eyebrow">Profile</span>
                  <h1>{draftProfile.displayName || user?.displayName || "Learner"}</h1>
                  <p>{draftProfile.headline || "Focused learning workspace"}</p>
                </div>
              </div>
              <div className="dashboard-badges profile-hero-badges">
                <span>{formatTrackLabel(progressSummary.recentTrack)}</span>
                <span>{progressSummary.topicsStarted} modules</span>
                <span>{progressSummary.certificates} certificates</span>
              </div>
            </div>

            <div className="academy-stat-grid">
              <article className="academy-stat-card">
                <span>Completion</span>
                <strong>{progressSummary.completionRate}%</strong>
              </article>
              <article className="academy-stat-card">
                <span>Subtopics cleared</span>
                <strong>{progressSummary.completedSubtopics}</strong>
              </article>
              <article className="academy-stat-card">
                <span>Active days</span>
                <strong>{progressSummary.activeDays}</strong>
              </article>
              <article className="academy-stat-card">
                <span>Current focus</span>
                <strong>{draftProfile.focus || "Learning"}</strong>
              </article>
            </div>
          </article>

          <aside className="glass-card profile-editor-card">
            <div className="section-heading compact-heading">
              <span className="eyebrow">Quick edit</span>
              <h2>Update your profile</h2>
            </div>
            <div className="profile-form compact-profile-form">
              <input
                className="dashboard-input"
                onChange={(event) => setDraftProfile((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Display name"
                value={draftProfile.displayName}
              />
              <input
                className="dashboard-input"
                onChange={(event) => setDraftProfile((current) => ({ ...current, headline: event.target.value }))}
                placeholder="Headline"
                value={draftProfile.headline}
              />
              <input
                className="dashboard-input"
                onChange={(event) => setDraftProfile((current) => ({ ...current, focus: event.target.value }))}
                placeholder="Current focus"
                value={draftProfile.focus}
              />
              <textarea
                className="dashboard-input dashboard-textarea"
                onChange={(event) => setDraftProfile((current) => ({ ...current, bio: event.target.value }))}
                placeholder="Short bio"
                value={draftProfile.bio}
              />
              <label className="button button-secondary upload-button">
                Upload photo
                <input accept="image/*" hidden onChange={handlePhotoUpload} type="file" />
              </label>
              <button className="button" onClick={saveProfile} type="button">
                Save profile
              </button>
              {status ? <p className="muted-line">{status}</p> : null}
            </div>
          </aside>
        </section>

        <section className="academy-section-grid">
          <article className="glass-card academy-section-card">
            <div className="topic-card-top">
              <div>
                <span className="eyebrow">Modules</span>
                <h2>Modules in progress</h2>
              </div>
              <span className="topic-kind">{topicCards.length} tracked</span>
            </div>
            <div className="academy-module-grid">
              {topicCards.length ? (
                topicCards.map((item) => (
                  <article className="academy-module-card" key={item.id}>
                    <span className="pill">In progress</span>
                    <h3>{item.title}</h3>
                    <p>{item.focus}</p>
                    <div className="academy-module-meta">
                      <span>{formatTrackLabel(item.trackId)}</span>
                      <span>{item.level}</span>
                    </div>
                    <div className="milestone-progress-bar" aria-hidden="true">
                      <span style={{ width: `${item.completionPercent}%` }} />
                    </div>
                    <div className="academy-module-footer">
                      <span>
                        {item.completedCount}/{item.subtopicTotal || 1} milestones
                      </span>
                      <strong>{item.completionPercent}%</strong>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted-line">Your generated and saved modules will appear here as you use the dashboard.</p>
              )}
            </div>
          </article>

          <article className="glass-card academy-section-card">
            <div className="topic-card-top">
              <div>
                <span className="eyebrow">Milestones</span>
                <h2>Milestone and certificate progress</h2>
              </div>
              <span className="topic-kind">{milestoneCards.length} active</span>
            </div>
            <div className="academy-milestone-list">
              {milestoneCards.length ? (
                milestoneCards.map((item) => (
                  <article className="academy-milestone-card" key={`${item.id}-milestone`}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.certificateUnlocked
                          ? "Certificate unlocked."
                          : item.milestoneClaimed
                            ? "Assessment cleared. Finish remaining subtopics to unlock the certificate."
                            : "Milestone progress has started."}
                      </p>
                    </div>
                    <div className="dashboard-badges">
                      <span>{item.completedCount} done</span>
                      <span>{item.milestoneClaimed ? "Assessment cleared" : "Assessment pending"}</span>
                      <span>{item.certificateUnlocked ? "Certificate ready" : "In progress"}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted-line">Finish a few subtopic cards or clear a topic assessment to start filling this area.</p>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
