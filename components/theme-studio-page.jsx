"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import LazyThemeAmbientScene from "@/components/lazy-theme-ambient-scene";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { applyAppearance } from "@/lib/appearance";
import { THEME_PRESETS } from "@/lib/personalization";
import { DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";

export default function ThemeStudioPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
  const [status, setStatus] = useState("");

  const activeThemePreset = useMemo(
    () => THEME_PRESETS.find((item) => item.id === draftProfile.themePreset) || THEME_PRESETS[0],
    [draftProfile.themePreset]
  );

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
    if (authReady && !user) {
      router.replace("/");
    }
  }, [authReady, router, user]);

  useEffect(() => {
    async function loadProfile() {
      if (!user || !db) {
        return;
      }

      const nextProfile = await ensureUserProfile(db, user);
      setProfile(nextProfile);
      setDraftProfile(nextProfile);
      setTheme(nextProfile.appearance?.mode || window.localStorage.getItem("learner-dev-theme") || "dark");
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
      applyAppearance(nextProfile.appearance);
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    document.body.dataset.themePreset = draftProfile.themePreset || DEFAULT_PROFILE.themePreset;
    applyAppearance({
      ...draftProfile.appearance,
      mode: theme
    });
  }, [draftProfile.appearance, draftProfile.themePreset, theme]);

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace("/");
  }

  async function saveTheme() {
    if (!user || !db) {
      return;
    }

    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...profile,
      ...draftProfile,
      themePreferenceSource: "manual",
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

    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
    applyAppearance(nextProfile.appearance);
    setStatus("Theme saved.");
    window.setTimeout(() => setStatus(""), 1800);
  }

  return (
    <div className="dashboard-shell theme-studio-page-shell">
      <LazyThemeAmbientScene />
      <StudyHeader
        onLoginClick={() => router.push("/")}
        onLogout={handleLogout}
        onSignupClick={() => router.push("/")}
        onThemeChange={setTheme}
        showDashboardLink
        theme={theme}
        user={user}
      />

      <main className="dashboard-main theme-studio-page-main">
        <section className="glass-card theme-studio-page-card">
          <div className="theme-studio-page-head">
            <div className="section-heading compact-heading">
              <span className="eyebrow">Theme studio</span>
              <h1>Pick a prebuilt theme</h1>
            </div>
            <div className="header-actions-compact">
              <Link className="button button-secondary" href="/dashboard">
                Back to dashboard
              </Link>
              <button className="button" onClick={saveTheme} type="button">
                Save theme
              </button>
            </div>
          </div>

          <div className="theme-studio-layout">
            <div className="theme-studio-grid">
              <div className="theme-studio-note">
                <strong>Each style includes both light and dark mode.</strong>
                <p>Choose the visual direction here, then use the header toggle for day or night mode.</p>
              </div>

              <div className="theme-preset-picker">
                {THEME_PRESETS.map((preset) => (
                  <button
                    className={`theme-preset-card ${draftProfile.themePreset === preset.id ? "active" : ""}`}
                    key={preset.id}
                    onClick={() =>
                      setDraftProfile((current) => ({
                        ...current,
                        themePreset: preset.id
                      }))
                    }
                    type="button"
                  >
                    <span className="theme-preset-chip">{preset.style}</span>
                    {preset.id === activeThemePreset.id ? <span className="theme-preset-reco">Now previewing</span> : null}
                    <div className="theme-preview-mini" data-preview-theme={preset.id}>
                      <div className="theme-preview-topbar">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="theme-preview-hero">
                        <div className="theme-preview-copy">
                          <strong />
                          <small />
                        </div>
                        <div className="theme-preview-badge" />
                      </div>
                      <div className="theme-preview-row">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <strong>{preset.label}</strong>
                    <p>{preset.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <aside className="theme-live-preview">
              <div className="theme-live-preview-head">
                <div>
                  <span className="eyebrow">Current preview</span>
                  <h3>{activeThemePreset.label}</h3>
                </div>
                <span className="topic-kind">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
              </div>

              <div className="theme-live-preview-shell">
                <section className="theme-showcase-hero dashboard-hero">
                  <div>
                    <span className="eyebrow">Preview</span>
                    <h3>{activeThemePreset.label} workspace</h3>
                  </div>
                  <div className="dashboard-badges">
                    <span>{theme === "dark" ? "Night view" : "Day view"}</span>
                    <span>{activeThemePreset.style}</span>
                    <span>Live</span>
                  </div>
                </section>

                <div className="theme-live-preview-stage refined-preview-stage">
                  <article className="study-card theme-preview-feature-card">
                    <div className="topic-card-top">
                      <div>
                        <span className="eyebrow">Lesson card</span>
                        <h4>Focused learning surface</h4>
                      </div>
                    </div>
                    <p>A preview of the main reading card, actions, and dashboard spacing.</p>
                    <div className="header-actions-compact theme-preview-actions">
                      <button className="button" type="button">Continue</button>
                      <button className="button button-secondary" type="button">Overview</button>
                    </div>
                  </article>

                  <div className="theme-live-preview-content refined-preview-content">
                    <article className="topic-overview-card theme-preview-mini-card">
                      <span className="eyebrow">Navigation</span>
                      <h4>Topic rail</h4>
                      <div className="theme-preview-list">
                        <span>Loops</span>
                        <span>Functions</span>
                        <span>Arrays</span>
                      </div>
                    </article>

                    <article className="study-card theme-preview-mini-card">
                      <span className="eyebrow">Profile</span>
                      <h4>Progress panel</h4>
                      <p>Check density, contrast, and card styling before saving.</p>
                    </article>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {status ? <p className="muted-line">{status}</p> : null}
        </section>
      </main>
    </div>
  );
}
