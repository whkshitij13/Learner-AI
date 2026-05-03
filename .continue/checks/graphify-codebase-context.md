---
name: Graphify Codebase Context
description: Ensures codebase changes respect the local Graphify knowledge graph workflow.
---

Review this pull request for Graphify workflow drift.

Flag as failing if any of these are true:

- Code changes introduce or rename important modules, routes, exported helpers, or cross-module flows without a corresponding update to Graphify output or documentation explaining why the graph is intentionally unchanged.
- `AGENTS.md` removes or weakens the instruction to read `graphify-out/GRAPH_REPORT.md` before architecture or codebase questions.
- `.gitignore` changes cause required Graphify report artifacts, especially `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, or `graphify-out/graph.html`, to be ignored unintentionally.
- Generated Graphify files are edited by hand in a way that conflicts with the source code rather than being regenerated.

Pass if Graphify instructions remain intact and source-level architecture changes are accompanied by regenerated or intentionally preserved graph artifacts.
