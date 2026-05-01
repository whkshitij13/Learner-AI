# Learner DEV Next.js Upgrade

This version turns the original static learning page into a Next.js + Firebase workspace with:

- App Router based UI
- Firebase auth for Google, Twitter/X, and email/password
- Firestore-backed user profile, preferences, progress, and practice notes
- A floating practice terminal for LWC and Apex
- Local validation plus optional low-cost Gemini review
- Category-based prompt suggestions
- Suggested official media links and simple learning diagrams

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add your Firebase web app keys.
3. Add a Gemini API key if you want AI review in addition to local validation.
4. Install dependencies with `npm install`.
5. Start with `npm run dev`.

## Important limitation

The practice terminal does not do real Salesforce compilation. It performs rule-based validation and can optionally ask Gemini for corrective feedback. Real LWC/Apex compilation still requires a Salesforce org, Salesforce CLI, or server-side compiler flow.

## Data source

The Next.js app reads the existing curriculum content from the legacy [script.js](/D:/Projects/git/Learner%20Dev/script.js) file so your current material stays intact during the migration.
