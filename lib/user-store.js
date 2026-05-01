import { collection, doc } from "firebase/firestore";

export function getUserRootRef(db, userId) {
  return doc(db, "users", userId);
}

export function getUserProfileRef(db, userId) {
  return doc(db, "users", userId, "private", "profile");
}

export function getUserDashboardRef(db, userId) {
  return doc(db, "users", userId, "private", "dashboard");
}

export function getUserSearchHistoryCollection(db, userId) {
  return collection(db, "users", userId, "searchHistory");
}

export function getUserSearchHistorySummaryRef(db, userId) {
  return doc(db, "users", userId, "private", "history");
}
