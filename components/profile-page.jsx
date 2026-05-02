"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";
import { applyAppearance } from "@/lib/appearance";

function getInitials(user, profile) {
  const value = profile.displayName || user?.displayName || user?.email || "Learner";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
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

      const nextProfile = await ensureUserProfile(db, user);
      setDraftProfile(nextProfile);
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
      applyAppearance(nextProfile.appearance);
      if (nextProfile.appearance?.mode) {
        setTheme(nextProfile.appearance.mode);
      }
    }

    loadData();
  }, [user]);

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

    setDraftProfile(nextProfile);
    document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
    applyAppearance(nextProfile.appearance);
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

      <main className="dashboard-main profile-page-main">
        <section className="dashboard-hero profile-settings-hero">
          <div>
            <span className="eyebrow">My profile</span>
            <h1>Edit your profile</h1>
            <p>Update your name, photo, focus, and bio. Learning progress and badges now live on your dashboard home.</p>
          </div>
          <div className="dashboard-badges">
            <span>Theme-aware</span>
            <span>Profile only</span>
          </div>
        </section>

        <section className="glass-card profile-settings-card">
          <div className="profile-settings-layout">
            <div className="profile-avatar-editor">
              {draftProfile.photoDataUrl ? (
                <img alt="Profile preview" className="profile-avatar-large" src={draftProfile.photoDataUrl} />
              ) : (
                <div className="profile-avatar-large profile-avatar-fallback">{avatarLabel}</div>
              )}
              <div className="profile-summary-card">
                <div className="profile-summary-head">
                  <h3>{draftProfile.displayName || user?.displayName || "Learner"}</h3>
                  <p>{draftProfile.headline || "AI study explorer"}</p>
                </div>
                <div className="profile-summary-strip">
                  <span>{draftProfile.focus || "Choose your current focus"}</span>
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

              {status ? <p className="muted-line">{status}</p> : null}

              <div className="header-actions-compact">
                <button className="button" onClick={saveProfile} type="button">
                  Save profile
                </button>
                <button className="button button-secondary" onClick={() => router.push("/dashboard")} type="button">
                  Go to dashboard
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
