import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "firebase/firestore";
import { getUserDashboardRef, getUserProfileRef, getUserRootRef, getUserSearchHistoryCollection, getUserSearchHistorySummaryRef } from "@/lib/user-store";

function normalizeSearchEntries(searchDocs, dashboardData, historySummary) {
  const fromCollection = searchDocs.map((item) => ({
    id: `search-${item.id}`,
    entryId: item.id,
    query: item.query || "",
    createdAt: item.createdAt || "",
    track: item.track || "workspace",
    source: "searchHistory"
  }));

  const fromRecentQueries = Object.entries(dashboardData?.tracks || {}).flatMap(([trackId, trackState]) =>
    (trackState?.recentQueries || []).map((item) => ({
      id: `recent-${trackId}-${item.id || item.createdAt || item.text}`,
      entryId: item.id || "",
      query: item.text || "",
      createdAt: item.createdAt || "",
      track: trackId,
      source: "recentQuery"
    }))
  );

  const fallbackSummary =
    historySummary?.lastQuery && !fromCollection.some((item) => item.query === historySummary.lastQuery)
      ? [
          {
            id: `summary-${historySummary.lastTrack || "workspace"}-${historySummary.updatedAt || historySummary.lastQuery}`,
            entryId: "",
            query: historySummary.lastQuery,
            createdAt: historySummary.updatedAt || "",
            track: historySummary.lastTrack || "workspace",
            source: "summary"
          }
        ]
      : [];

  return [...fromCollection, ...fromRecentQueries, ...fallbackSummary].sort((left, right) =>
    String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
  );
}

function removeRecentQueryFromTracks(tracks, entry) {
  return Object.fromEntries(
    Object.entries(tracks || {}).map(([trackId, trackState]) => [
      trackId,
      {
        ...trackState,
        recentQueries: (trackState?.recentQueries || []).filter(
          (item) =>
            !(
              (entry.entryId && item.id === entry.entryId) ||
              (String(item.text || "").trim().toLowerCase() === String(entry.query || "").trim().toLowerCase() &&
                String(item.createdAt || "") === String(entry.createdAt || ""))
            )
        )
      }
    ])
  );
}

export async function getAdminUserSnapshots(db) {
  const [usersSnapshot, legacyProfilesSnapshot, legacyDashboardSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "profiles")),
    getDocs(collection(db, "dashboard_state"))
  ]);

  const rootByUserId = new Map(usersSnapshot.docs.map((docItem) => [docItem.id, docItem.data()]));
  const legacyProfileByUserId = new Map(legacyProfilesSnapshot.docs.map((docItem) => [docItem.id, docItem.data()]));
  const legacyDashboardByUserId = new Map(legacyDashboardSnapshot.docs.map((docItem) => [docItem.id, docItem.data()]));
  const userIds = [...new Set([...rootByUserId.keys(), ...legacyProfileByUserId.keys(), ...legacyDashboardByUserId.keys()])];

  const users = await Promise.all(
    userIds.map(async (userId) => {
      const root = rootByUserId.get(userId) || {
        email: legacyProfileByUserId.get(userId)?.email || legacyDashboardByUserId.get(userId)?.email || "",
        role: "user"
      };
      const [profileSnapshot, dashboardSnapshot, historySnapshot, searchSnapshot] = await Promise.all([
        getDoc(getUserProfileRef(db, userId)),
        getDoc(getUserDashboardRef(db, userId)),
        getDoc(getUserSearchHistorySummaryRef(db, userId)),
        getDocs(getUserSearchHistoryCollection(db, userId))
      ]);

      return {
        id: userId,
        root,
        profile: profileSnapshot.exists()
          ? profileSnapshot.data()?.profile || null
          : legacyProfileByUserId.get(userId)?.profile || null,
        dashboard: dashboardSnapshot.exists() ? dashboardSnapshot.data() || null : legacyDashboardByUserId.get(userId) || null,
        historySummary: historySnapshot.exists() ? historySnapshot.data() || null : null,
        searches: normalizeSearchEntries(
          searchSnapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          })),
          dashboardSnapshot.exists() ? dashboardSnapshot.data() || null : legacyDashboardByUserId.get(userId) || null,
          historySnapshot.exists() ? historySnapshot.data() || null : null
        )
      };
    })
  );

  return users.sort(
    (left, right) => String(right.root?.updatedAt || right.root?.createdAt || "").localeCompare(String(left.root?.updatedAt || left.root?.createdAt || ""))
  );
}

export async function updateAdminUserProfile(db, userId, partialProfile) {
  await setDoc(
    getUserProfileRef(db, userId),
    {
      updatedAt: new Date().toISOString(),
      profile: partialProfile
    },
    { merge: true }
  );
}

export async function deleteSearchHistoryEntry(db, userId, entry) {
  if (entry?.source === "searchHistory" && entry.entryId) {
    await deleteDoc(doc(db, "users", userId, "searchHistory", entry.entryId));
  }

  const [dashboardSnapshot, legacyDashboardSnapshot] = await Promise.all([
    getDoc(getUserDashboardRef(db, userId)),
    getDoc(doc(db, "dashboard_state", userId))
  ]);

  if (dashboardSnapshot.exists()) {
    const dashboardData = dashboardSnapshot.data();
    await setDoc(
      getUserDashboardRef(db, userId),
      {
        tracks: removeRecentQueryFromTracks(dashboardData?.tracks, entry),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  if (legacyDashboardSnapshot.exists()) {
    const legacyData = legacyDashboardSnapshot.data();
    await setDoc(
      doc(db, "dashboard_state", userId),
      {
        tracks: removeRecentQueryFromTracks(legacyData?.tracks, entry),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  const historySummarySnapshot = await getDoc(getUserSearchHistorySummaryRef(db, userId));

  if (
    historySummarySnapshot.exists() &&
    String(historySummarySnapshot.data()?.lastQuery || "").trim().toLowerCase() === String(entry?.query || "").trim().toLowerCase()
  ) {
    await setDoc(
      getUserSearchHistorySummaryRef(db, userId),
      {
        lastQuery: "",
        lastTrack: "",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }
}

export async function clearUserSearchHistory(db, userId) {
  const [searchHistorySnapshot, dashboardSnapshot, legacyDashboardSnapshot] = await Promise.all([
    getDocs(getUserSearchHistoryCollection(db, userId)),
    getDoc(getUserDashboardRef(db, userId)),
    getDoc(doc(db, "dashboard_state", userId))
  ]);

  await Promise.all(searchHistorySnapshot.docs.map((item) => deleteDoc(item.ref)));

  if (dashboardSnapshot.exists()) {
    const dashboardData = dashboardSnapshot.data();
    await setDoc(
      getUserDashboardRef(db, userId),
      {
        tracks: Object.fromEntries(
          Object.entries(dashboardData?.tracks || {}).map(([trackId, trackState]) => [
            trackId,
            {
              ...trackState,
              recentQueries: []
            }
          ])
        ),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  if (legacyDashboardSnapshot.exists()) {
    const legacyData = legacyDashboardSnapshot.data();
    await setDoc(
      doc(db, "dashboard_state", userId),
      {
        tracks: Object.fromEntries(
          Object.entries(legacyData?.tracks || {}).map(([trackId, trackState]) => [
            trackId,
            {
              ...trackState,
              recentQueries: []
            }
          ])
        ),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  await setDoc(
    getUserSearchHistorySummaryRef(db, userId),
    {
      lastQuery: "",
      lastTrack: "",
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

export async function purgeUserData(db, userId) {
  const searchHistorySnapshot = await getDocs(getUserSearchHistoryCollection(db, userId));

  await Promise.all(searchHistorySnapshot.docs.map((item) => deleteDoc(item.ref)));
  await Promise.all([
    deleteDoc(getUserProfileRef(db, userId)),
    deleteDoc(getUserDashboardRef(db, userId)),
    deleteDoc(getUserSearchHistorySummaryRef(db, userId)),
    deleteDoc(getUserRootRef(db, userId)),
    deleteDoc(doc(db, "profiles", userId)),
    deleteDoc(doc(db, "dashboard_state", userId))
  ]);
}
