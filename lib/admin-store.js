import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";
import { getUserDashboardRef, getUserProfileRef, getUserRootRef, getUserSearchHistoryCollection, getUserSearchHistorySummaryRef } from "@/lib/user-store";

export async function getAdminUserSnapshots(db) {
  const usersQuery = query(collection(db, "users"), orderBy("updatedAt", "desc"));
  const usersSnapshot = await getDocs(usersQuery);

  return Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const root = userDoc.data();
      const [profileSnapshot, dashboardSnapshot, searchSnapshot] = await Promise.all([
        getDocs(query(collection(db, "users", userId, "private"), orderBy("__name__"))),
        getDocs(query(collection(db, "users", userId, "searchHistory"), orderBy("createdAt", "desc"))),
        Promise.resolve(null)
      ]);

      const profileDoc = profileSnapshot.docs.find((item) => item.id === "profile");
      const dashboardDoc = profileSnapshot.docs.find((item) => item.id === "dashboard");
      const historyDoc = profileSnapshot.docs.find((item) => item.id === "history");

      return {
        id: userId,
        root,
        profile: profileDoc?.data()?.profile || null,
        dashboard: dashboardDoc?.data() || null,
        historySummary: historyDoc?.data() || null,
        searches: dashboardSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      };
    })
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

export async function deleteSearchHistoryEntry(db, userId, entryId) {
  await deleteDoc(doc(db, "users", userId, "searchHistory", entryId));
}

export async function purgeUserData(db, userId) {
  const searchHistorySnapshot = await getDocs(getUserSearchHistoryCollection(db, userId));

  await Promise.all(searchHistorySnapshot.docs.map((item) => deleteDoc(item.ref)));
  await Promise.all([
    deleteDoc(getUserProfileRef(db, userId)),
    deleteDoc(getUserDashboardRef(db, userId)),
    deleteDoc(getUserSearchHistorySummaryRef(db, userId)),
    deleteDoc(getUserRootRef(db, userId))
  ]);
}
