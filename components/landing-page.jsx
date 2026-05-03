"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, db, ensureFirebaseReady, googleProvider } from "@/lib/firebase/client";
import { THEME_PRESETS } from "@/lib/personalization";
import StudyHeader from "@/components/study-header";
import { ensureUserProfile } from "@/lib/profile-store";

const LandingParticles = dynamic(() => import("@/components/landing-particles"), {
  ssr: false,
  loading: () => <div className="landing-particles landing-particles-fallback" aria-hidden="true" />
});

const PLATFORM_STEPS = [
  {
    title: "Start from one prompt",
    body:
      "Type any topic, skill, exam idea, or curiosity. The platform expands that single search into a full study direction instead of giving you one short answer."
  },
  {
    title: "Move through a deep learning page",
    body:
      "Each topic is designed as a long scroll with subtopics, explanations, examples, visual references, key terms, and connected ideas that help the learner stay in one flow."
  },
  {
    title: "Practice when the topic needs it",
    body:
      "Technical topics can unlock MCQs, mock tests, and a practice terminal. General topics stay focused on explanation, structure, and recall without forcing coding tools everywhere."
  }
];

const LANDING_STORIES = [
  {
    eyebrow: "Search to structure",
    title: "One search becomes a deep, readable study journey.",
    body:
      "Instead of opening ten tabs, the learner gets one organized study page that keeps the topic, subtopics, visuals, and follow-up practice in a single calm space.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    mediaType: "image"
  },
  {
    eyebrow: "Visual learning",
    title: "Media lives inside the learning flow, not outside it.",
    body:
      "Short videos, image references, and guided copy help explain the platform in the same way the dashboard will explain a real topic: smoothly, visually, and without breaking focus.",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    mediaType: "video"
  },
  {
    eyebrow: "Adaptive study",
    title: "The website changes with the learner, not the other way around.",
    body:
      "Before login, the landing page stays focused and calm. After login, onboarding selects interests and the dashboard responds with matching themes, suggestions, and study direction.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    mediaType: "image"
  }
];

const HERO_FACTS = [
  {
    label: "AI-first flow",
    value: "Topic to page",
    detail: "A single prompt expands into a structured study experience."
  },
  {
    label: "Deep learning",
    value: "Long-form",
    detail: "Built for scrollable content, not one-paragraph summaries."
  },
  {
    label: "Adaptive space",
    value: "Per learner",
    detail: "Themes, history, and suggestions change for each user."
  }
];

export default function LandingPage({ tracks }) {
  const router = useRouter();
  const firebaseReady = ensureFirebaseReady();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [theme, setTheme] = useState("light");
  const [themePreset, setThemePreset] = useState(THEME_PRESETS[0].id);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("learner-dev-theme") || "light";
    setTheme(storedTheme);
    document.body.dataset.theme = storedTheme;
    document.body.dataset.themePreset = THEME_PRESETS[0].id;
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("learner-dev-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.dataset.themePreset = themePreset;
  }, [themePreset]);

  useEffect(() => {
    document.body.dataset.guestPreview = user ? "false" : "true";

    return () => {
      delete document.body.dataset.guestPreview;
    };
  }, [user]);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      Promise.resolve()
        .then(async () => {
          setUser(nextUser);
          setAuthReady(true);
          setAuthError("");

          if (nextUser && db) {
            const profile = await ensureUserProfile(db, nextUser);
            setThemePreset(profile.themePreset || THEME_PRESETS[0].id);
          }

          if (nextUser) {
            router.replace("/home");
          }
        })
        .catch(() => {
          setUser(nextUser);
          setAuthReady(true);
        });
    });

    return () => unsubscribe();
  }, [firebaseReady, router]);

  async function submitAuth() {
    if (!firebaseReady || !auth) {
      setAuthError("Add Firebase keys in .env.local to enable login and signup.");
      return;
    }

    try {
      setAuthError("");

      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleGoogleLogin() {
    if (!firebaseReady || !auth) {
      setAuthError("Add Firebase keys in .env.local to enable Google login.");
      return;
    }

    try {
      setAuthError("");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
  }

  function handleGetStarted() {
    setMode("signup");
    document.getElementById("landing-auth-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="site-shell">
      <StudyHeader
        onLoginClick={() => setMode("login")}
        onLogout={handleLogout}
        onSignupClick={() => setMode("signup")}
        onThemeChange={setTheme}
        showDashboardLink
        theme={theme}
        user={user}
      />

      <main className="landing-main">
        <section className="hero-section landing-hero studio-landing-hero">
          <LandingParticles />
          <div className="hero-copy">
            <span className="eyebrow">Learner AI Studio</span>
            <h1>Build a learning workspace from one prompt.</h1>
            <p>
              Prompt for wildlife, JavaScript, architecture, history, Apex, or anything else. Learner Dev turns it into
              a structured study page with verified media, milestones, badges, and practice only when the topic needs it.
            </p>

            <div className="studio-prompt-console" aria-label="Example prompt builder">
              <div className="studio-prompt-topbar">
                <span />
                <span />
                <span />
                <strong>New topic prompt</strong>
              </div>
              <p>Generate a visual learning path for rainforest wildlife with working videos, photos, diagrams, and a reading-first completion badge.</p>
              <div className="studio-console-actions">
                <span>Verified media</span>
                <span>Adaptive tests</span>
                <span>Firestore progress</span>
              </div>
            </div>

            <div className="landing-hero-cta">
              <button className="button landing-get-started" onClick={handleGetStarted} type="button">
                Get Started
              </button>
            </div>

            <div className="hero-metrics">
              {HERO_FACTS.map((item) => (
                <article className="metric-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </div>

          <aside className="study-panel" id="landing-auth-panel">
            <div className="section-heading compact-heading">
              <span className="eyebrow">Start building</span>
              <h2>{user ? "Taking you home" : authReady ? "Login or create account" : "Checking auth"}</h2>
            </div>

            {user ? (
              <div className="account-card">
                <p>Signed in as {user.email || "Learner"}</p>
                <p className="muted-line">Your dashboard button is now available in the header.</p>
                <Link className="button" href="/dashboard">
                  Open dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="mode-switch" role="tablist" aria-label="Authentication mode">
                  <button
                    className={`mode-button ${mode === "login" ? "active" : ""}`}
                    onClick={() => setMode("login")}
                    type="button"
                  >
                    Login
                  </button>
                  <button
                    className={`mode-button ${mode === "signup" ? "active" : ""}`}
                    onClick={() => setMode("signup")}
                    type="button"
                  >
                    Sign up
                  </button>
                </div>

                <div className="auth-form-simple">
                  <input
                    className="dashboard-input"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    type="email"
                    value={email}
                  />
                  <input
                    className="dashboard-input"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                    value={password}
                  />
                  <button className="button" disabled={!authReady} onClick={submitAuth} type="button">
                    {mode === "login" ? "Login" : "Create account"}
                  </button>
                  <button className="button button-secondary" disabled={!authReady} onClick={handleGoogleLogin} type="button">
                    Continue with Google
                  </button>
                  <p className="muted-line">
                    {firebaseReady
                      ? "Email/password and Google authentication are ready."
                      : "Firebase is not configured yet. Add keys to .env.local first."}
                  </p>
                  {authError ? <p className="error-line">{authError}</p> : null}
                </div>
              </>
            )}
          </aside>
        </section>

        <section className="capability-section">
          <div className="section-heading">
            <span className="eyebrow">How the website works</span>
            <h2>Built to feel like an AI learning space, not a static course catalog.</h2>
          </div>

          <div className="capability-grid">
            {PLATFORM_STEPS.map((item) => (
              <article className="glass-card capability-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="media-story-section">
          <div className="section-heading">
            <span className="eyebrow">Inside the experience</span>
            <h2>The landing page should feel like the product itself: smooth, visual, and built for reading.</h2>
          </div>

          <div className="story-stack">
            {LANDING_STORIES.map((item, index) => (
              <article className={`glass-card story-card ${index % 2 ? "reverse" : ""}`} key={item.title}>
                <div className="story-copy">
                  <div>
                    <span className="eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <p>{item.body}</p>
                </div>

                <div className="story-visual">
                  {item.mediaType === "video" ? (
                    <div className="video-frame-wrap">
                      <video
                        autoPlay
                        className="landing-video-frame"
                        loop
                        muted
                        playsInline
                        poster={item.poster}
                        preload="metadata"
                        src={item.video}
                        title={item.title}
                      >
                        Your browser could not load the preview video.
                      </video>
                    </div>
                  ) : (
                    <div className="landing-image-wrap">
                      <img alt={item.title} className="landing-story-image" src={item.image} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="tracks-section">
          <div className="section-heading">
            <span className="eyebrow">What changes after login</span>
            <h2>The dashboard becomes personal, adaptive, and ready to grow with the learner.</h2>
          </div>

          <div className="track-grid">
            <article className="glass-card track-card">
              <div className="track-card-top">
                <div>
                  <span className="eyebrow">Personalization</span>
                  <h3>Interest-based themes</h3>
                </div>
                <span className="topic-kind">Adaptive</span>
              </div>
              <p>
                After onboarding, the website assigns a design direction based on the learner's interests, so the
                experience feels more personal and alive.
              </p>
            </article>

            <article className="glass-card track-card">
              <div className="track-card-top">
                <div>
                  <span className="eyebrow">History</span>
                  <h3>Saved searches and topics</h3>
                </div>
                <span className="topic-kind">Per user</span>
              </div>
              <p>
                Every learner keeps their own generated topics, search history, and dashboard state, so the platform
                improves around their interests over time.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="study-footer glass-card landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-copy">
            <span className="eyebrow">Learner AI</span>
            <h3>Search a topic, read deeply, and keep your learning history in one place.</h3>
            <p>
              The platform is built to turn curiosity into a structured study flow with long-form content, media,
              practice layers, and user-specific history.
            </p>
          </div>

          <div className="landing-footer-links">
            <span className="eyebrow">Explore</span>
            <Link href="/">Overview</Link>
            <Link href="/dashboard">Dashboard</Link>
            <button className="footer-link-button" onClick={() => setMode("login")} type="button">
              Login
            </button>
            <button className="footer-link-button" onClick={() => setMode("signup")} type="button">
              Sign up
            </button>
          </div>

          <div className="landing-footer-links">
            <span className="eyebrow">Experience</span>
            <p>AI-generated topic pages</p>
            <p>Theme-based onboarding</p>
            <p>Per-user topic history</p>
            <p>Practice and mock test flow</p>
          </div>
        </div>

        <div className="landing-footer-meta">
          <span>Built for deep study, not shallow browsing.</span>
          <span>© 2026 Learner AI</span>
        </div>
      </footer>
    </div>
  );
}
