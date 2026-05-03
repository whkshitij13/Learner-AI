"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { clearUserSearchHistory, deleteSearchHistoryEntry, getAdminUserSnapshots, purgeUserData, updateAdminUserProfile } from "@/lib/admin-store";
import { isAdminEmail } from "@/lib/admin";
import { THEME_PRESETS } from "@/lib/personalization";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("learner-dev-theme") || "light";
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

    if (!user || !isAdminEmail(user.email)) {
      router.replace("/");
      return;
    }

    async function loadUsers() {
      if (!db) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const snapshots = await getAdminUserSnapshots(db);
        setUsers(snapshots);
      } catch (loadError) {
        setUsers([]);
        setError(
          loadError?.code === "permission-denied"
            ? "Firestore blocked this admin query. Publish the updated Firestore rules, then reload the dashboard."
            : "Could not load admin data from Firestore."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [authReady, router, user]);

  const visibleUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((entry) =>
      [entry.root?.email, entry.profile?.displayName, ...(entry.profile?.interests || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [search, users]);

  const adminStats = useMemo(() => {
    const totalSearches = users.reduce((sum, entry) => sum + entry.searches.length, 0);
    const totalTopics = users.reduce(
      (sum, entry) => sum + Object.values(entry.dashboard?.tracks || {}).reduce((trackSum, track) => trackSum + (track?.topics?.length || 0), 0),
      0
    );
    const onboarded = users.filter((entry) => entry.profile?.onboardingCompleted).length;

    return {
      totalSearches,
      totalTopics,
      onboarded
    };
  }, [users]);

  async function refreshUsers(message) {
    if (!db) {
      return;
    }

    try {
      const snapshots = await getAdminUserSnapshots(db);
      setUsers(snapshots);
      setError("");
      if (message) {
        setStatus(message);
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (loadError) {
      setError(
        loadError?.code === "permission-denied"
          ? "Firestore blocked this admin action. Publish the updated Firestore rules, then try again."
          : "Admin dashboard refresh failed."
      );
    }
  }

  async function handleDeleteSearch(userId, entry) {
    if (!db) {
      return;
    }

    await deleteSearchHistoryEntry(db, userId, entry);
    await refreshUsers("Search entry deleted.");
  }

  function requestDeleteSearch(userId, entry) {
    setConfirmAction({
      tone: "danger",
      title: "Delete this search entry?",
      body: `This removes "${entry.query}" from the user's stored search history.`,
      confirmLabel: "Delete search",
      onConfirm: () => handleDeleteSearch(userId, entry)
    });
  }

  async function handleClearHistory(userId) {
    if (!db) {
      return;
    }

    await clearUserSearchHistory(db, userId);
    await refreshUsers("User history cleared.");
  }

  function requestClearHistory(entry) {
    setConfirmAction({
      tone: "warning",
      title: "Clear all search history?",
      body: `This removes ${entry.searches.length} stored search item(s) for ${entry.root?.email || entry.id}.`,
      confirmLabel: "Clear history",
      onConfirm: () => handleClearHistory(entry.id)
    });
  }

  async function handleDeleteUser(userId) {
    if (!db) {
      return;
    }

    await purgeUserData(db, userId);
    await refreshUsers("User data deleted from Firestore.");
  }

  function requestDeleteUser(entry) {
    setConfirmAction({
      tone: "danger",
      title: "Delete this user's Firestore data?",
      body: `This permanently removes profile, dashboard, and search data for ${entry.root?.email || entry.id}.`,
      confirmLabel: "Delete user data",
      onConfirm: () => handleDeleteUser(entry.id)
    });
  }

  async function confirmPendingAction() {
    if (!confirmAction?.onConfirm) {
      return;
    }

    const action = confirmAction;
    setConfirmAction(null);
    await action.onConfirm();
  }

  async function handleSaveMeta(entry) {
    if (!db) {
      return;
    }

    await updateAdminUserProfile(db, entry.id, entry.profile);
    await refreshUsers("User profile updated.");
  }

  return (
    <div className="dashboard-shell">
      <StudyHeader
        onLoginClick={() => router.push("/")}
        onLogout={() => signOut(auth).then(() => router.replace("/"))}
        onSignupClick={() => router.push("/")}
        onThemeChange={setTheme}
        theme={theme}
        user={user}
      />

      <main className="dashboard-main admin-main">
        <section className="dashboard-hero admin-command-hero">
          <div>
            <span className="eyebrow">Admin dashboard</span>
            <h1>Command center for users, history, and preferences.</h1>
            <p>Review learner activity, tune profile metadata, and perform destructive actions only after confirmation.</p>
          </div>
          <div className="dashboard-badges dashboard-badges-glow">
            <span>{users.length} users</span>
            <span>{adminStats.totalSearches} searches</span>
            <span>{adminStats.totalTopics} topics</span>
          </div>
        </section>

        <section className="admin-insight-grid">
          <article className="glass-card admin-insight-card">
            <span className="eyebrow">Onboarded</span>
            <strong>{adminStats.onboarded}</strong>
            <p>Learners with saved interests and theme direction.</p>
          </article>
          <article className="glass-card admin-insight-card">
            <span className="eyebrow">Search volume</span>
            <strong>{adminStats.totalSearches}</strong>
            <p>Stored user search entries across all profiles.</p>
          </article>
          <article className="glass-card admin-insight-card">
            <span className="eyebrow">Generated topics</span>
            <strong>{adminStats.totalTopics}</strong>
            <p>Topics currently saved in dashboard tracks.</p>
          </article>
        </section>

        <section className="glass-card study-card admin-toolbar">
          <div className="topic-card-top">
            <div>
              <span className="eyebrow">Search users</span>
              <h2>Review activity and preferences</h2>
            </div>
            {status ? <span className="topic-kind">{status}</span> : null}
          </div>
          {error ? <p className="error-line">{error}</p> : null}
          <input
            className="dashboard-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email, display name, or hobby"
            type="search"
            value={search}
          />
        </section>

        {loading ? (
          <section className="study-grid">
            <article className="glass-card study-card">
              <p>Loading users...</p>
            </article>
          </section>
        ) : (
          <section className="study-grid admin-grid">
            {visibleUsers.map((entry) => (
              <article className="glass-card study-card admin-user-card" key={entry.id}>
                <div className="topic-card-top">
                  <div>
                    <span className="eyebrow">{entry.root?.role || "user"}</span>
                    <h3>{entry.profile?.displayName || entry.root?.email || entry.id}</h3>
                  </div>
                  <span className="topic-kind">{entry.root?.email || "No email"}</span>
                </div>

                <div className="admin-user-meta">
                  <label className="theme-field">
                    <span>Headline</span>
                    <input
                      className="dashboard-input"
                      onChange={(event) =>
                        setUsers((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, profile: { ...item.profile, headline: event.target.value } }
                              : item
                          )
                        )
                      }
                      value={entry.profile?.headline || ""}
                    />
                  </label>

                  <label className="theme-field">
                    <span>Interests</span>
                    <input
                      className="dashboard-input"
                      onChange={(event) =>
                        setUsers((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? {
                                  ...item,
                                  profile: {
                                    ...item.profile,
                                    interests: event.target.value.split(",").map((part) => part.trim()).filter(Boolean)
                                  }
                                }
                              : item
                          )
                        )
                      }
                      value={(entry.profile?.interests || []).join(", ")}
                    />
                  </label>

                  <label className="theme-field">
                    <span>Theme preset</span>
                    <select
                      className="dashboard-input"
                      onChange={(event) =>
                        setUsers((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, profile: { ...item.profile, themePreset: event.target.value } }
                              : item
                          )
                        )
                      }
                      value={entry.profile?.themePreset || THEME_PRESETS[0].id}
                    >
                      {THEME_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="dashboard-badges">
                  <span>{Object.values(entry.dashboard?.tracks || {}).reduce((sum, track) => sum + (track?.topics?.length || 0), 0)} topics</span>
                  <span>{entry.searches.length} history items</span>
                  <span>{entry.profile?.themePreset || "No preset"}</span>
                </div>

                <div className="header-actions-compact">
                  <button className="button" onClick={() => handleSaveMeta(entry)} type="button">
                    Save user meta
                  </button>
                  <button className="button button-secondary" onClick={() => requestClearHistory(entry)} type="button">
                    Clear history
                  </button>
                  <button className="button button-secondary danger-link" onClick={() => requestDeleteUser(entry)} type="button">
                    Delete user data
                  </button>
                </div>

                <div className="admin-search-list">
                  <div className="topic-card-top">
                    <div>
                      <span className="eyebrow">Search history</span>
                      <h3>Recent searches</h3>
                    </div>
                    <span className="topic-kind">{entry.searches.length}</span>
                  </div>
                  {entry.searches.length ? (
                    entry.searches.map((searchEntry) => (
                      <div className="mock-question admin-search-item" key={searchEntry.id}>
                        <p>
                          <strong>{searchEntry.query}</strong>
                        </p>
                        <p>{searchEntry.createdAt || "No timestamp"}</p>
                        <p>{searchEntry.track || "workspace"} · {searchEntry.source}</p>
                        <button className="ghost-btn danger-link" onClick={() => requestDeleteSearch(entry.id, searchEntry)} type="button">
                          Delete search
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="muted-line">No search history stored yet.</p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {confirmAction ? (
        <div className="profile-modal-backdrop" role="presentation">
          <section className={`profile-modal glass-card confirm-modal confirm-modal-${confirmAction.tone}`} role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
            <span className="eyebrow">Confirm action</span>
            <h2 id="admin-confirm-title">{confirmAction.title}</h2>
            <p>{confirmAction.body}</p>
            <div className="header-actions-compact">
              <button className="button button-secondary" onClick={() => setConfirmAction(null)} type="button">
                Cancel
              </button>
              <button className="button danger-button" onClick={confirmPendingAction} type="button">
                {confirmAction.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
