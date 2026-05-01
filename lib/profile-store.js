import { doc, getDoc, setDoc } from "firebase/firestore";
import { getUserProfileRef, getUserRootRef } from "@/lib/user-store";
import { isAdminEmail } from "@/lib/admin";

export const DEFAULT_PROFILE = {
  displayName: "",
  headline: "AI study explorer",
  bio: "Learning topic by topic with practice tests and code labs.",
  focus: "LWC and Apex",
  photoDataUrl: "",
  interests: [],
  themePreset: "aurora-notes",
  onboardingCompleted: false,
  appearance: {
    mode: "light",
    accent: "",
    bodyFont: '"Manrope", sans-serif',
    terminalFont: 'Consolas, "Courier New", monospace',
    surfaceStyle: "soft"
  }
};

export async function ensureUserProfile(db, user) {
  if (!db || !user) {
    return DEFAULT_PROFILE;
  }

  const profileRef = getUserProfileRef(db, user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    const mergedProfile = {
      ...DEFAULT_PROFILE,
      ...(data.profile || {}),
      displayName: data.profile?.displayName || user.displayName || "",
      photoDataUrl: data.profile?.photoDataUrl || user.photoURL || ""
    };

    if (JSON.stringify(mergedProfile) !== JSON.stringify({ ...DEFAULT_PROFILE, ...(data.profile || {}) })) {
      await setDoc(
        profileRef,
        {
          role: isAdminEmail(user.email) ? "admin" : "user",
          userId: user.uid,
          email: user.email || "",
          profile: mergedProfile,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    return mergedProfile;
  }

  const legacySnapshot = await getDoc(doc(db, "profiles", user.uid));

  if (legacySnapshot.exists()) {
    const legacyData = legacySnapshot.data();
    const migratedProfile = {
      ...DEFAULT_PROFILE,
      ...(legacyData.profile || {}),
      displayName: legacyData.profile?.displayName || user.displayName || "",
      photoDataUrl: legacyData.profile?.photoDataUrl || user.photoURL || ""
    };

    await setDoc(
      getUserRootRef(db, user.uid),
        {
          role: isAdminEmail(user.email) ? "admin" : "user",
          email: user.email || "",
          createdAt: legacyData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    await setDoc(
      profileRef,
      {
        userId: user.uid,
        email: user.email || "",
        profile: migratedProfile,
        createdAt: legacyData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return migratedProfile;
  }

  const nextProfile = {
    ...DEFAULT_PROFILE,
    displayName: user.displayName || "",
    photoDataUrl: user.photoURL || ""
  };

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
    profileRef,
    {
      role: isAdminEmail(user.email) ? "admin" : "user",
      userId: user.uid,
      email: user.email || "",
      profile: nextProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return nextProfile;
}

export async function saveUserProfilePreferences(db, user, partialProfile) {
  if (!db || !user) {
    return DEFAULT_PROFILE;
  }

  const currentProfile = await ensureUserProfile(db, user);
  const nextProfile = {
    ...currentProfile,
    ...partialProfile
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
    getUserProfileRef(db, user.uid),
    {
      role: isAdminEmail(user.email) ? "admin" : "user",
      userId: user.uid,
      email: user.email || "",
      profile: nextProfile,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return nextProfile;
}
