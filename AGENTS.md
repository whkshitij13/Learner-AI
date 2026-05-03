## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `python -m graphify query "<question>"`, `python -m graphify path "<A>" "<B>"`, or `python -m graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `python -m graphify update .` to keep the graph current (AST-only, no API cost). On machines where the `graphify` CLI is on PATH, `graphify update .` is also fine.
