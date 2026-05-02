"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { THEME_PRESETS } from "@/lib/personalization";
import { getUserDashboardState } from "@/lib/dashboard-store";
import { buildProgressSummary, DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";
import { applyAppearance } from "@/lib/appearance";
import { isAdminEmail } from "@/lib/admin";

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

function ThemeIcon({ theme }) {
  if (theme === "light") {
    return (
      <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
        <path
          d="M14.5 3.5a8.5 8.5 0 1 0 6 14.5 9 9 0 1 1-6-14.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="theme-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="none" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function StudyHeader({
  user,
  theme,
  onThemeChange,
  onLoginClick,
  onSignupClick,
  onLogout,
  showDashboardLink = false
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeStudioOpen, setThemeStudioOpen] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
  const [status, setStatus] = useState("");
  const [progressSummary, setProgressSummary] = useState({
    topicsStarted: 0,
    completedSubtopics: 0,
    certificates: 0,
    recentTrack: "workspace",
    activeDays: 0,
    completionRate: 0
  });
  const menuRef = useRef(null);
  const preserveThemePreviewRef = useRef(false);
  const activeThemePreset = useMemo(
    () => THEME_PRESETS.find((item) => item.id === draftProfile.themePreset) || THEME_PRESETS[0],
    [draftProfile.themePreset]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user || !db) {
        setProfile(DEFAULT_PROFILE);
        setDraftProfile(DEFAULT_PROFILE);
        setProgressSummary({
          topicsStarted: 0,
          completedSubtopics: 0,
          certificates: 0,
          recentTrack: "workspace",
          activeDays: 0,
          completionRate: 0
        });
        document.body.dataset.themePreset = DEFAULT_PROFILE.themePreset;
        document.body.dataset.surfaceStyle = "soft";
        document.body.style.removeProperty("--user-accent");
        document.body.style.removeProperty("--accent");
        document.body.style.setProperty("--user-body-font", DEFAULT_PROFILE.appearance.bodyFont);
        document.body.style.setProperty("--user-terminal-font", DEFAULT_PROFILE.appearance.terminalFont);
        return;
      }

      const nextProfile = await ensureUserProfile(db, user);
      const dashboardState = await getUserDashboardState(db, user);
      const summary = buildProgressSummary(dashboardState);

      setProfile(nextProfile);
      setDraftProfile(nextProfile);
      setProgressSummary({
        topicsStarted: summary.topicsStarted,
        completedSubtopics: summary.completedSubtopics,
        certificates: summary.certificates,
        recentTrack: summary.recentTrack,
        activeDays: summary.activeDays,
        completionRate: summary.completionRate
      });
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
      applyAppearance(nextProfile.appearance);
      if (nextProfile.appearance?.mode && nextProfile.appearance.mode !== theme) {
        onThemeChange(nextProfile.appearance.mode);
      }
    }

    loadProfile();
  }, [onThemeChange, user]);

  useEffect(() => {
    if (!themeStudioOpen) {
      return undefined;
    }

    document.body.dataset.themePreset = draftProfile.themePreset || profile.themePreset || DEFAULT_PROFILE.themePreset;
    document.body.dataset.theme = theme || profile.appearance?.mode || DEFAULT_PROFILE.appearance.mode;
    applyAppearance({
      ...draftProfile.appearance,
      mode: theme || profile.appearance?.mode || DEFAULT_PROFILE.appearance.mode
    });

    return () => {
      if (preserveThemePreviewRef.current) {
        preserveThemePreviewRef.current = false;
        return;
      }

      document.body.dataset.themePreset = profile.themePreset || DEFAULT_PROFILE.themePreset;
      document.body.dataset.theme = theme || profile.appearance?.mode || DEFAULT_PROFILE.appearance.mode;
      applyAppearance({
        ...profile.appearance,
        mode: theme || profile.appearance?.mode || DEFAULT_PROFILE.appearance.mode
      });
    };
  }, [draftProfile.appearance, draftProfile.themePreset, profile, theme, themeStudioOpen]);

  const avatarLabel = useMemo(() => getInitials(user, profile), [profile, user]);

  async function handlePhotoUpload(event) {
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
      ...draftProfile
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
    setStatus("Profile updated.");
    setTimeout(() => setStatus(""), 1800);
  }

  async function saveThemeStudio() {
    if (!user || !db) {
      return;
    }

    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...draftProfile,
      themePreferenceSource: "manual",
      appearance: {
        ...DEFAULT_PROFILE.appearance,
        ...draftProfile.appearance,
        mode: theme || draftProfile.appearance?.mode || "light"
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

    preserveThemePreviewRef.current = true;
    applyAppearance(nextProfile.appearance);
    document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    setThemeStudioOpen(false);
    setStatus("Theme updated.");
    setTimeout(() => setStatus(""), 1800);
  }

  function openThemeStudio() {
    setDraftProfile(profile);
    setThemeStudioOpen(true);
    setMenuOpen(false);
  }

  function closeThemeStudio() {
    setDraftProfile(profile);
    setThemeStudioOpen(false);
  }

  async function handleThemeToggle() {
    const nextMode = theme === "light" ? "dark" : "light";
    onThemeChange(nextMode);

    if (!user || !db) {
      return;
    }

    const nextProfile = {
      ...profile,
      appearance: {
        ...DEFAULT_PROFILE.appearance,
        ...profile.appearance,
        mode: nextMode
      }
    };

    setProfile(nextProfile);
    setDraftProfile((current) => ({
      ...current,
      appearance: {
        ...DEFAULT_PROFILE.appearance,
        ...current.appearance,
        mode: nextMode
      }
    }));

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
  }

  return (
    <>
      <header className="site-header cartoon-header">
        <Link className="brand-lockup" href="/">
          <span aria-hidden="true" className="brand-mark brand-cube">
            <span className="brand-cube-core" />
            <span className="brand-cube-edge brand-cube-edge-top" />
            <span className="brand-cube-edge brand-cube-edge-left" />
            <span className="brand-cube-edge brand-cube-edge-right" />
          </span>
          <span>
            <strong>Learner AI</strong>
            <small>Focused learning workspace</small>
          </span>
        </Link>

        {!user ? (
          <div className="header-actions-compact">
            <button
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="button button-secondary theme-icon-button"
              onClick={handleThemeToggle}
              type="button"
            >
              <ThemeIcon theme={theme} />
            </button>
            <button className="button button-secondary" onClick={onLoginClick} type="button">
              Login
            </button>
            <button className="button" onClick={onSignupClick} type="button">
              Sign up
            </button>
          </div>
        ) : (
          <div className="header-actions-compact">
            <button
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="button button-secondary theme-icon-button"
              onClick={handleThemeToggle}
              type="button"
            >
              <ThemeIcon theme={theme} />
            </button>

            <div className="profile-menu-wrap" ref={menuRef}>
              {isAdminEmail(user?.email) ? (
                <Link className="button button-secondary admin-header-link" href="/admin">
                  Admin dashboard
                </Link>
              ) : null}

              <button className="profile-toggle" onClick={() => setMenuOpen((current) => !current)} type="button">
                {profile.photoDataUrl ? (
                  <img alt={profile.displayName || "User avatar"} className="profile-avatar-image" src={profile.photoDataUrl} />
                ) : (
                  <span className="profile-avatar-fallback">{avatarLabel}</span>
                )}
                <span className="profile-summary">
                  <strong>{profile.displayName || user.displayName || "Learner"}</strong>
                  <small>{profile.headline}</small>
                </span>
              </button>

              {menuOpen ? (
                <div className="profile-dropdown">
                  {isAdminEmail(user?.email) ? (
                    <Link className="dropdown-link" href="/admin">
                      Admin dashboard
                    </Link>
                  ) : null}
                  {showDashboardLink ? (
                    <Link className="dropdown-link" href="/dashboard">
                      Open dashboard
                    </Link>
                  ) : null}
                  <Link className="dropdown-link" href="/profile">
                    Open profile
                  </Link>
                  <button className="dropdown-link" onClick={() => setProfileOpen(true)} type="button">
                    Quick edit
                  </button>
                  <button className="dropdown-link" onClick={openThemeStudio} type="button">
                    Theme studio
                  </button>
                  <button className="dropdown-link danger-link" onClick={onLogout} type="button">
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {profileOpen ? (
        <div className="profile-modal-backdrop" onClick={() => setProfileOpen(false)} role="presentation">
          <section className="profile-modal glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading compact-heading">
              <span className="eyebrow">Profile studio</span>
              <h2>Make your study space yours</h2>
            </div>

            <div className="profile-editor-grid">
              <div className="profile-avatar-editor">
                {draftProfile.photoDataUrl ? (
                  <img alt="Profile preview" className="profile-avatar-large" src={draftProfile.photoDataUrl} />
                ) : (
                  <div className="profile-avatar-large profile-avatar-fallback">{avatarLabel}</div>
                )}
                <div className="profile-summary-card">
                  <div className="profile-summary-head">
                    <div>
                      <h3>{draftProfile.displayName || user.displayName || "Learner"}</h3>
                      <p>{draftProfile.headline || "AI study explorer"}</p>
                    </div>
                    <span className="topic-kind">{formatTrackLabel(progressSummary.recentTrack)}</span>
                  </div>
                  <div className="profile-summary-strip">
                    <span>{progressSummary.topicsStarted} topics</span>
                    <span>{progressSummary.certificates} certificates</span>
                    <span>{progressSummary.activeDays} active days</span>
                  </div>
                </div>
                <label className="button button-secondary upload-button">
                  Upload photo
                  <input accept="image/*" hidden onChange={handlePhotoUpload} type="file" />
                </label>
              </div>

              <div className="profile-form">
                <input
                  className="dashboard-input"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="Display name"
                  value={draftProfile.displayName}
                />
                <input
                  className="dashboard-input"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, headline: event.target.value }))}
                  placeholder="Short headline"
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

                <section className="profile-progress-panel">
                  <div className="topic-card-top">
                    <div>
                      <span className="eyebrow">Learning progress</span>
                      <h3>Your progress snapshot</h3>
                    </div>
                    <span className="topic-kind">{progressSummary.completionRate}% complete</span>
                  </div>
                  <div className="profile-progress-meter" aria-hidden="true">
                    <span style={{ width: `${progressSummary.completionRate}%` }} />
                  </div>
                  <div className="profile-progress-grid">
                    <article className="profile-progress-stat">
                      <span>Topics started</span>
                      <strong>{progressSummary.topicsStarted}</strong>
                    </article>
                    <article className="profile-progress-stat">
                      <span>Subtopics done</span>
                      <strong>{progressSummary.completedSubtopics}</strong>
                    </article>
                    <article className="profile-progress-stat">
                      <span>Certificates</span>
                      <strong>{progressSummary.certificates}</strong>
                    </article>
                    <article className="profile-progress-stat">
                      <span>Active days</span>
                      <strong>{progressSummary.activeDays}</strong>
                    </article>
                    <article className="profile-progress-stat">
                      <span>Current track</span>
                      <strong>{formatTrackLabel(progressSummary.recentTrack)}</strong>
                    </article>
                  </div>
                  <p className="muted-line">
                    Your profile keeps track of the path you are learning, the cards you finish, and the certificates you unlock as you move through each topic.
                  </p>
                </section>
              </div>
            </div>

            {status ? <p className="muted-line">{status}</p> : null}

            <div className="header-actions-compact">
              <button className="button" onClick={saveProfile} type="button">
                Save profile
              </button>
              <button className="button button-secondary" onClick={() => setProfileOpen(false)} type="button">
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {themeStudioOpen ? (
        <div className="profile-modal-backdrop" onClick={closeThemeStudio} role="presentation">
          <section className="profile-modal glass-card theme-studio-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading compact-heading">
              <span className="eyebrow">Theme studio</span>
              <h2>Pick a prebuilt theme</h2>
            </div>

            <div className="theme-studio-layout">
              <div className="theme-studio-grid">
                <div className="theme-studio-note">
                  <strong>Each style already includes both light and dark.</strong>
                  <p>Choose the visual direction here, then use the main header toggle whenever you want the same theme in light or dark mode.</p>
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
                      <p>A preview of how the main reading card, actions, and content spacing will feel in the dashboard.</p>
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
                        <p>Check the density, contrast, and professionalism of the profile and progress cards.</p>
                      </article>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="header-actions-compact">
              <button className="button" onClick={saveThemeStudio} type="button">
                Save theme
              </button>
              <button className="button button-secondary" onClick={closeThemeStudio} type="button">
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
