"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";
import { BODY_FONT_OPTIONS, TERMINAL_FONT_OPTIONS, SURFACE_STYLE_OPTIONS, applyAppearance } from "@/lib/appearance";
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
  const menuRef = useRef(null);

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
        document.body.dataset.surfaceStyle = "soft";
        document.body.style.removeProperty("--user-accent");
        document.body.style.removeProperty("--accent");
        document.body.style.setProperty("--user-body-font", DEFAULT_PROFILE.appearance.bodyFont);
        document.body.style.setProperty("--user-terminal-font", DEFAULT_PROFILE.appearance.terminalFont);
        return;
      }

      const nextProfile = await ensureUserProfile(db, user);
      setProfile(nextProfile);
      setDraftProfile(nextProfile);
      applyAppearance(nextProfile.appearance);
      if (nextProfile.appearance?.mode && nextProfile.appearance.mode !== theme) {
        onThemeChange(nextProfile.appearance.mode);
      }
    }

    loadProfile();
  }, [onThemeChange, theme, user]);

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
      appearance: {
        ...DEFAULT_PROFILE.appearance,
        ...draftProfile.appearance
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

    applyAppearance(nextProfile.appearance);
    onThemeChange(nextProfile.appearance.mode || "light");
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    setThemeStudioOpen(false);
    setStatus("Theme updated.");
    setTimeout(() => setStatus(""), 1800);
  }

  return (
    <>
      <header className="site-header cartoon-header">
        <Link className="brand-lockup" href="/">
          <span aria-hidden="true" className="brand-mark brand-mascot">
            <span className="brand-mascot-ears">
              <span />
              <span />
            </span>
            <span className="brand-mascot-face">
              <span className="brand-mascot-eyes">
                <span />
                <span />
              </span>
              <span className="brand-mascot-smile" />
              <span className="brand-mascot-label">LD</span>
            </span>
          </span>
          <span>
            <strong>Learner DEV</strong>
            <small>AI study website</small>
          </span>
        </Link>

        {!user ? (
          <div className="header-actions-compact">
            <button
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="button button-secondary theme-icon-button"
              onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
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
              onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
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
                  <button className="dropdown-link" onClick={() => setProfileOpen(true)} type="button">
                    Edit profile
                  </button>
                  <button className="dropdown-link" onClick={() => setThemeStudioOpen(true)} type="button">
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
        <div className="profile-modal-backdrop" onClick={() => setThemeStudioOpen(false)} role="presentation">
          <section className="profile-modal glass-card theme-studio-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading compact-heading">
              <span className="eyebrow">Theme studio</span>
              <h2>Control colors, fonts, and surface style</h2>
            </div>

            <div className="theme-studio-grid">
              <label className="theme-field">
                <span>Mode</span>
                <div className="theme-mode-row">
                  {["light", "dark"].map((value) => (
                    <button
                      className={`mode-button ${draftProfile.appearance?.mode === value ? "active" : ""}`}
                      key={value}
                      onClick={() =>
                        setDraftProfile((current) => ({
                          ...current,
                          appearance: { ...DEFAULT_PROFILE.appearance, ...current.appearance, mode: value }
                        }))
                      }
                      type="button"
                    >
                      {value === "light" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              </label>

              <label className="theme-field">
                <span>Accent color</span>
                <input
                  className="dashboard-input theme-color-input"
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      ...current,
                      appearance: { ...DEFAULT_PROFILE.appearance, ...current.appearance, accent: event.target.value }
                    }))
                  }
                  type="color"
                  value={draftProfile.appearance?.accent || "#6d7cff"}
                />
              </label>

              <label className="theme-field">
                <span>Text font</span>
                <select
                  className="dashboard-input"
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      ...current,
                      appearance: { ...DEFAULT_PROFILE.appearance, ...current.appearance, bodyFont: event.target.value }
                    }))
                  }
                  value={draftProfile.appearance?.bodyFont || DEFAULT_PROFILE.appearance.bodyFont}
                >
                  {BODY_FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="theme-field">
                <span>Terminal font</span>
                <select
                  className="dashboard-input"
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      ...current,
                      appearance: { ...DEFAULT_PROFILE.appearance, ...current.appearance, terminalFont: event.target.value }
                    }))
                  }
                  value={draftProfile.appearance?.terminalFont || DEFAULT_PROFILE.appearance.terminalFont}
                >
                  {TERMINAL_FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="theme-field">
                <span>Component style</span>
                <select
                  className="dashboard-input"
                  onChange={(event) =>
                    setDraftProfile((current) => ({
                      ...current,
                      appearance: { ...DEFAULT_PROFILE.appearance, ...current.appearance, surfaceStyle: event.target.value }
                    }))
                  }
                  value={draftProfile.appearance?.surfaceStyle || DEFAULT_PROFILE.appearance.surfaceStyle}
                >
                  {SURFACE_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="header-actions-compact">
              <button className="button" onClick={saveThemeStudio} type="button">
                Save theme
              </button>
              <button className="button button-secondary" onClick={() => setThemeStudioOpen(false)} type="button">
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
