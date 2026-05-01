"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { deleteSearchHistoryEntry, getAdminUserSnapshots, purgeUserData, updateAdminUserProfile } from "@/lib/admin-store";
import { isAdminEmail } from "@/lib/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

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

      try {
        const snapshots = await getAdminUserSnapshots(db);
        setUsers(snapshots);
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

  async function refreshUsers(message) {
    if (!db) {
      return;
    }

    const snapshots = await getAdminUserSnapshots(db);
    setUsers(snapshots);
    if (message) {
      setStatus(message);
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function handleDeleteSearch(userId, entryId) {
    if (!db) {
      return;
    }

    await deleteSearchHistoryEntry(db, userId, entryId);
    await refreshUsers("Search entry deleted.");
  }

  async function handleDeleteUser(userId) {
    if (!db) {
      return;
    }

    await purgeUserData(db, userId);
    await refreshUsers("User data deleted from Firestore.");
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
        <section className="dashboard-hero glass-card">
          <div>
            <span className="eyebrow">Admin dashboard</span>
            <h1>Manage users, history, interests, and themes.</h1>
            <p>Only the admin account can see this space. You can review what users search, update preferences, and remove stored Firestore data.</p>
          </div>
          <div className="dashboard-badges">
            <span>{users.length} users</span>
            <span>{users.reduce((sum, entry) => sum + entry.searches.length, 0)} search entries</span>
            <span>Admin only</span>
          </div>
        </section>

        <section className="glass-card study-card">
          <div className="topic-card-top">
            <div>
              <span className="eyebrow">Search users</span>
              <h2>Review activity and preferences</h2>
            </div>
            {status ? <span className="topic-kind">{status}</span> : null}
          </div>
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
                    <input
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
                      value={entry.profile?.themePreset || ""}
                    />
                  </label>
                </div>

                <div className="header-actions-compact">
                  <button className="button" onClick={() => handleSaveMeta(entry)} type="button">
                    Save user meta
                  </button>
                  <button className="button button-secondary danger-link" onClick={() => handleDeleteUser(entry.id)} type="button">
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
                        <button className="ghost-btn" onClick={() => handleDeleteSearch(entry.id, searchEntry.id)} type="button">
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
    </div>
  );
}
