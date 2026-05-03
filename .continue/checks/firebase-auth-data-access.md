---
name: Firebase Auth Data Access
description: Checks that Firestore reads and writes stay user-scoped and admin-only behavior remains protected.
---

Review this pull request for Firebase Auth and Firestore access regressions.

Flag as failing if any of these are true:

- A Firestore read or write for user data is added without deriving the document path from the authenticated user's `uid` or an existing user-scoped helper.
- A component or API route performs admin behavior without checking the existing admin gate, such as `isAdminEmail()` or the established admin store flow.
- A new delete, purge, profile update, dashboard save, search-history update, or recommendation update can target another user's data from client-controlled input.
- A new unauthenticated path writes to Firestore or assumes `auth`, `db`, or Firebase configuration is available without the existing null/ready guards.
- Firestore rules or store helpers are changed in a way that broadens access to all users, all profiles, all dashboard states, or all search history without a documented admin-only reason.

Pass if the change preserves user-scoped document paths, keeps admin actions behind the admin check, and handles missing Firebase configuration without crashing the app.
