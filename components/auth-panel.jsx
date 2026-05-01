"use client";

import { useState } from "react";

export default function AuthPanel({
  authReady,
  user,
  firebaseReady,
  authError,
  onEmailLogin,
  onEmailSignup,
  onLogout,
  onOpenProfile
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  if (user) {
    return (
      <section className="auth-card modern-panel">
        <div className="panel-kicker">Workspace Identity</div>
        <h3>{user.displayName || user.email || "Signed in"}</h3>
        <p className="muted-copy">Your study history, notes, and theme now follow your account.</p>
        <div className="auth-actions">
          <button className="primary-btn" onClick={onOpenProfile} type="button">
            Edit profile
          </button>
          <button className="secondary-btn" onClick={onLogout} type="button">
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card modern-panel">
      <div className="panel-kicker">Workspace Identity</div>
      <h3>{authReady ? (mode === "login" ? "Sign in to sync your lab" : "Create your cloud profile") : "Checking auth..."}</h3>
      <p className="muted-copy">
        {firebaseReady
          ? "Use email and password auth. Every learner gets separate saved progress and notes."
          : "Add your Firebase keys in `.env.local` to enable authentication and Firestore sync."}
      </p>

      <div className="segmented-tabs" role="tablist" aria-label="Authentication mode">
        <button
          className={`segment ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={`segment ${mode === "signup" ? "active" : ""}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <div className="auth-form">
        <input
          className="field"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          type="email"
          value={email}
        />
        <input
          className="field"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        <button
          className="primary-btn"
          disabled={!firebaseReady || !authReady}
          onClick={() => (mode === "login" ? onEmailLogin(email, password) : onEmailSignup(email, password))}
          type="button"
        >
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </div>

      {authError ? <p className="status-error">{authError}</p> : null}
    </section>
  );
}
