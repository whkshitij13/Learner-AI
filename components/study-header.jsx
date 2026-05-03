"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_PROFILE, ensureUserProfile } from "@/lib/profile-store";
import { getUserProfileRef } from "@/lib/user-store";
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
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
    const routes = ["/home", "/dashboard", "/profile", "/theme-studio"];

    if (isAdminEmail(user?.email)) {
      routes.push("/admin");
    }

    const prefetchRoutes = () => {
      routes.forEach((route) => router.prefetch(route));
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 3500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [router, user?.email]);

  useEffect(() => {
    async function loadProfile() {
      if (!user || !db) {
        setProfile(DEFAULT_PROFILE);
        document.body.dataset.themePreset = DEFAULT_PROFILE.themePreset;
        document.body.dataset.surfaceStyle = "soft";
        document.body.style.removeProperty("--user-accent");
        document.body.style.removeProperty("--accent");
        document.body.style.setProperty("--user-body-font", DEFAULT_PROFILE.appearance.bodyFont);
        document.body.style.setProperty("--user-terminal-font", DEFAULT_PROFILE.appearance.terminalFont);
        return;
      }

      const nextProfile = await ensureUserProfile(db, user);
      setProfile(nextProfile);
      document.body.dataset.themePreset = nextProfile.themePreset || DEFAULT_PROFILE.themePreset;
      applyAppearance(nextProfile.appearance);
      if (nextProfile.appearance?.mode && nextProfile.appearance.mode !== theme) {
        onThemeChange(nextProfile.appearance.mode);
      }
    }

    loadProfile();
  }, [onThemeChange, user]);

  const avatarLabel = useMemo(() => getInitials(user, profile), [profile, user]);
  const homeHref = user ? "/home" : "/";

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
        <Link className="brand-lockup" href={homeHref}>
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
                  <Link className="dropdown-link" href="/home">
                    Home
                  </Link>
                  <Link className="dropdown-link" href="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="dropdown-link" href="/profile">
                    My profile
                  </Link>
                  <Link className="dropdown-link" href="/theme-studio" prefetch>
                    Theme studio
                  </Link>
                  <button className="dropdown-link danger-link" onClick={onLogout} type="button">
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
