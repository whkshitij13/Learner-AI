"use client";

import { useMemo } from "react";

const WEB_FILES = [
  { id: "html", label: "index.html" },
  { id: "js", label: "script.js" },
  { id: "css", label: "styles.css" }
];

const APEX_FILES = [{ id: "class", label: "Example.cls" }];

export default function PracticeTerminal({
  available = true,
  isOpen,
  onToggle,
  track,
  drafts,
  activeFile,
  onFileChange,
  onDraftChange,
  onAnalyze,
  isAnalyzing,
  review
}) {
  const isApex = track === "apex";
  const files = useMemo(() => (isApex ? APEX_FILES : WEB_FILES), [isApex]);

  if (!available) {
    return null;
  }

  return (
    <>
      <button className="terminal-launcher" onClick={onToggle} type="button">
        {isOpen ? "Close Practice Terminal" : "Open Practice Terminal"}
      </button>
      {isOpen ? (
        <aside className="terminal-shell">
          <div className="terminal-topbar">
            <div>
              <p className="eyebrow">Practice Terminal</p>
              <h3>{isApex ? "Apex class reviewer" : "Web code practice space"}</h3>
            </div>
            <button className="ghost-btn" onClick={onToggle} type="button">
              Hide
            </button>
          </div>

          <div className="terminal-files">
            {files.map((file) => (
              <button
                key={file.id}
                className={`file-tab ${activeFile === file.id ? "active" : ""}`}
                onClick={() => onFileChange(file.id)}
                type="button"
              >
                {file.label}
              </button>
            ))}
          </div>

          <textarea
            className="terminal-editor"
            onChange={(event) => onDraftChange(activeFile, event.target.value)}
            placeholder={isApex ? "Write an Apex class or test here..." : "Write HTML, JS, or CSS here..."}
            value={drafts[activeFile] || ""}
          />

          <div className="terminal-actions">
            <button className="primary-btn" onClick={onAnalyze} type="button">
              {isAnalyzing ? "Reviewing..." : "Compile & Review"}
            </button>
            <p className="muted-copy">
              Uses static validation first, then optional low-cost AI if `GEMINI_API_KEY` is configured.
            </p>
          </div>

          {review ? (
            <div className="terminal-output">
              <p className="pill">{review.provider}</p>
              <h4>Quick read</h4>
              <p>{review.staticReview.summary}</p>
              {review.staticReview.errors.length ? (
                <>
                  <h4>Detected issues</h4>
                  <ul className="list-block">
                    {review.staticReview.errors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {review.staticReview.hints.length ? (
                <>
                  <h4>Small suggestions</h4>
                  <div className="chip-row">
                    {review.staticReview.hints.map((item) => (
                      <span className="tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              {review.aiReview?.fixes?.length ? (
                <>
                  <h4>AI fix ideas</h4>
                  <ul className="list-block">
                    {review.aiReview.fixes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h4>Starter correction</h4>
              <pre className="code-block">{review.template}</pre>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
