---
name: Learning UI Regression
description: Guards the main learning dashboard, reader, practice terminal, and theme surfaces against common UX regressions.
---

Review this pull request for regressions in the Learner Dev learning experience.

Flag as failing if any of these are true:

- Changes to `components/topic-dashboard.jsx`, `components/topic-reader-page.jsx`, `components/practice-terminal.jsx`, `components/media-shelf.jsx`, or `components/diagram-card.jsx` remove an existing empty, loading, saving, disabled, or error state.
- A new async action lacks user-visible pending and failure handling, especially for topic generation, AI feedback, profile saves, dashboard saves, sign-in, sign-out, or Firestore sync.
- User-entered code, notes, prompts, media titles, descriptions, URLs, or generated topic content are rendered as raw HTML or passed to `dangerouslySetInnerHTML` without a clear sanitizer.
- A change breaks keyboard or screen-reader basics on interactive learning controls, such as buttons without labels, clickable non-buttons, hidden focus states, or form controls without accessible names.
- New layout or CSS for dashboard, reader, terminal, or theme-studio views uses fixed dimensions that are likely to overflow on mobile or overlap existing controls.

Pass if the changed learning surfaces keep their expected loading/error states, preserve accessible controls, and avoid raw rendering of untrusted content.
