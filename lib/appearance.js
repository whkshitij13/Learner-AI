export const BODY_FONT_OPTIONS = [
  { label: "Manrope", value: '"Manrope", sans-serif' },
  { label: "Roboto", value: '"Roboto", sans-serif' },
  { label: "Baloo 2", value: '"Baloo 2", sans-serif' }
];

export const TERMINAL_FONT_OPTIONS = [
  { label: "Consolas", value: 'Consolas, "Courier New", monospace' },
  { label: "Fira Code", value: '"Fira Code", "Courier New", monospace' },
  { label: "JetBrains Mono", value: '"JetBrains Mono", "Courier New", monospace' }
];

export const SURFACE_STYLE_OPTIONS = [
  { label: "Soft", value: "soft" },
  { label: "Sharp", value: "sharp" },
  { label: "Glassy", value: "glassy" }
];

export function applyAppearance(appearance = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const body = document.body;
  const {
    mode,
    accent,
    bodyFont,
    terminalFont,
    surfaceStyle
  } = appearance;

  if (mode) {
    body.dataset.theme = mode;
    window.localStorage.setItem("learner-dev-theme", mode);
  }

  body.dataset.surfaceStyle = surfaceStyle || "soft";

  if (accent) {
    body.style.setProperty("--user-accent", accent);
    body.style.setProperty("--accent", accent);
  } else {
    body.style.removeProperty("--user-accent");
    body.style.removeProperty("--accent");
  }

  body.style.setProperty("--user-body-font", bodyFont || '"Manrope", sans-serif');
  body.style.setProperty("--user-terminal-font", terminalFont || 'Consolas, "Courier New", monospace');
}
