---
name: Client Server Secret Boundary
description: Flags secret leaks and unsafe client/server environment usage in Next.js, Firebase, and Gemini code.
---

Review this pull request for secret handling regressions in the Learner Dev Next.js app.

Flag as failing if any of these are true:

- A server-only secret such as `GEMINI_API_KEY`, service account JSON, private key material, tokens, passwords, or admin credentials is added to a client component, browser bundle, `.env.example`, README, fixture, screenshot, or checked-in generated file.
- A non-`NEXT_PUBLIC_` environment variable is read from a file that can run in the browser, including files under `components/` and client-side Firebase helpers.
- A `NEXT_PUBLIC_` variable is used for anything that grants privileged access beyond normal browser Firebase configuration.
- A new API route logs request bodies, AI prompts, user submissions, access tokens, Firebase IDs, or raw Gemini responses that could contain user data or secrets.
- A new external API call sends user data or source code without a clear server-side boundary and explicit error handling.

Pass if the change only uses public Firebase browser configuration in client code, keeps Gemini and other server secrets inside `app/api/**/route.js` or other server-only files, and avoids logging sensitive data.
