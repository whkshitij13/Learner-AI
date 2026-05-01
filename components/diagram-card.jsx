export default function DiagramCard({ track }) {
  const isLwc = track === "lwc";

  return (
    <div className="diagram-card">
      <div className="diagram-header">
        <p className="eyebrow">Diagram</p>
        <h3>{isLwc ? "LWC Bundle Flow" : "Apex Runtime Flow"}</h3>
      </div>
      <svg className="diagram-svg" viewBox="0 0 520 200" role="img" aria-label={`${track} learning diagram`}>
        <rect x="20" y="56" width="120" height="88" rx="22" />
        <text x="80" y="100" textAnchor="middle">
          {isLwc ? "HTML" : "Trigger"}
        </text>
        <rect x="200" y="26" width="120" height="60" rx="20" />
        <text x="260" y="62" textAnchor="middle">
          {isLwc ? "JS Class" : "Class"}
        </text>
        <rect x="200" y="116" width="120" height="60" rx="20" />
        <text x="260" y="152" textAnchor="middle">
          {isLwc ? "CSS" : "Test"}
        </text>
        <rect x="380" y="56" width="120" height="88" rx="22" />
        <text x="440" y="100" textAnchor="middle">
          {isLwc ? "Rendered UI" : "Governor-safe Logic"}
        </text>
        <path d="M140 100 H200" />
        <path d="M320 56 H380" />
        <path d="M320 146 H380" />
      </svg>
      <p className="muted-copy">
        {isLwc
          ? "Use the practice terminal to keep template, JavaScript, and CSS concerns separate."
          : "Practice both implementation and tests together so feedback catches missing structure early."}
      </p>
    </div>
  );
}
