import { addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getUserDashboardRef,
  getUserRootRef,
  getUserSearchHistoryCollection,
  getUserSearchHistorySummaryRef
} from "@/lib/user-store";
import { isAdminEmail } from "@/lib/admin";

const DEFAULT_TRACK_STATE = {
  schemaVersion: 2,
  topics: [],
  recentQueries: [],
  mockAnswers: {},
  progressByTopic: {},
  terminalSessions: {},
  badgeLedger: {},
  milestoneEvents: []
};

function buildDefaultState() {
  return {
    tracks: {
      workspace: { ...DEFAULT_TRACK_STATE },
      lwc: { ...DEFAULT_TRACK_STATE },
      apex: { ...DEFAULT_TRACK_STATE }
    }
  };
}

function normalizeTrackState(value) {
  return {
    schemaVersion: 2,
    topics: Array.isArray(value?.topics) ? value.topics : [],
    recentQueries: Array.isArray(value?.recentQueries) ? value.recentQueries : [],
    mockAnswers: value?.mockAnswers && typeof value.mockAnswers === "object" ? value.mockAnswers : {},
    progressByTopic: value?.progressByTopic && typeof value.progressByTopic === "object" ? value.progressByTopic : {},
    terminalSessions: value?.terminalSessions && typeof value.terminalSessions === "object" ? value.terminalSessions : {},
    badgeLedger: value?.badgeLedger && typeof value.badgeLedger === "object" ? value.badgeLedger : {},
    milestoneEvents: Array.isArray(value?.milestoneEvents) ? value.milestoneEvents : []
  };
}

export async function getUserDashboardState(db, user) {
  if (!db || !user) {
    return buildDefaultState();
  }

  const dashboardRef = getUserDashboardRef(db, user.uid);
  const snapshot = await getDoc(dashboardRef);

  if (!snapshot.exists()) {
    const legacySnapshot = await getDoc(doc(db, "dashboard_state", user.uid));

    if (legacySnapshot.exists()) {
      const legacyData = legacySnapshot.data();
      const migratedState = {
        tracks: {
          workspace: normalizeTrackState(legacyData?.tracks?.workspace),
          lwc: normalizeTrackState(legacyData?.tracks?.lwc),
          apex: normalizeTrackState(legacyData?.tracks?.apex)
        }
      };

      await setDoc(
        getUserRootRef(db, user.uid),
        {
          role: isAdminEmail(user.email) ? "admin" : "user",
          email: user.email || "",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      await setDoc(
        dashboardRef,
        {
          userId: user.uid,
          email: user.email || "",
          ...migratedState,
          createdAt: legacyData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return migratedState;
    }

    const nextState = buildDefaultState();

    await setDoc(
      getUserRootRef(db, user.uid),
      {
        role: isAdminEmail(user.email) ? "admin" : "user",
        email: user.email || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    await setDoc(
      dashboardRef,
      {
        userId: user.uid,
        email: user.email || "",
        ...nextState,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return nextState;
  }

  const data = snapshot.data();

  return {
    tracks: {
      workspace: normalizeTrackState(data?.tracks?.workspace),
      lwc: normalizeTrackState(data?.tracks?.lwc),
      apex: normalizeTrackState(data?.tracks?.apex)
    }
  };
}

export async function saveUserTrackState(db, user, track, partialState) {
  if (!db || !user) {
    return normalizeTrackState(partialState);
  }

  const dashboardRef = getUserDashboardRef(db, user.uid);
  const current = await getUserDashboardState(db, user);
  const nextTrackState = {
    ...normalizeTrackState(current.tracks?.[track]),
    ...partialState
  };

  await setDoc(
    getUserRootRef(db, user.uid),
    {
      role: isAdminEmail(user.email) ? "admin" : "user",
      email: user.email || "",
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  await setDoc(
    dashboardRef,
    {
      userId: user.uid,
      email: user.email || "",
      tracks: {
        ...current.tracks,
        [track]: nextTrackState
      },
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return nextTrackState;
}

export async function logUserQuery(db, user, track, query) {
  if (!db || !user || !query.trim()) {
    return [];
  }

  const createdAt = new Date().toISOString();
  const current = await getUserDashboardState(db, user);
  const existingQueries = normalizeTrackState(current.tracks?.[track]).recentQueries;
  const nextQueries = [
    {
      id: `${track}-${Date.now()}`,
      text: query.trim(),
      createdAt
    },
    ...existingQueries.filter((item) => item.text?.toLowerCase() !== query.trim().toLowerCase())
  ].slice(0, 20);

  await setDoc(
    getUserRootRef(db, user.uid),
    {
      role: isAdminEmail(user.email) ? "admin" : "user",
      email: user.email || "",
      updatedAt: createdAt
    },
    { merge: true }
  );

  await addDoc(getUserSearchHistoryCollection(db, user.uid), {
    userId: user.uid,
    email: user.email || "",
    track: track || "workspace",
    query: query.trim(),
    createdAt
  });

  await setDoc(
    getUserSearchHistorySummaryRef(db, user.uid),
    {
      lastQuery: query.trim(),
      lastTrack: track || "workspace",
      updatedAt: createdAt
    },
    { merge: true }
  );

  await saveUserTrackState(db, user, track, {
    recentQueries: nextQueries
  });

  return nextQueries;
}
