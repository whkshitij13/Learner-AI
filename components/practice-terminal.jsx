"use client";

import { useMemo } from "react";

export default function PracticeTerminal({
  available = true,
  isOpen,
  onToggle,
  terminalConfig,
  drafts,
  activeFile,
  onFileChange,
  onDraftChange,
  onAnalyze,
  isAnalyzing,
  review,
  terminalReviewed = false,
  badgeTier = "none"
}) {
  const files = useMemo(() => terminalConfig?.files || [], [terminalConfig]);
  const terminalTitle = terminalConfig?.title || "Practice terminal";
  const terminalDescription = terminalConfig?.description || "Topic-aware practice space";
  const compilerLabel = terminalConfig?.compiler || "Gemini";
  const activePlaceholder = files.find((file) => file.id === activeFile)?.placeholder || "Start writing here...";

  if (!available) {
    return null;
  }

  return (
    <>
      <button className="terminal-launcher" onClick={onToggle} type="button">
        {isOpen ? "Close Challenge Terminal" : terminalReviewed ? "Terminal Reviewed" : "Open Challenge Terminal"}
      </button>
      {isOpen ? (
        <aside className="terminal-shell">
          <div className="terminal-topbar">
            <div>
              <p className="eyebrow">Challenge Terminal</p>
              <h3>{terminalTitle}</h3>
              <p className="muted-copy">{terminalDescription}</p>
            </div>
            <div className="terminal-rank-chip">
              <span>{badgeTier}</span>
              <strong>{terminalReviewed ? "Reviewed" : "Boss gate"}</strong>
            </div>
            <button className="ghost-btn" onClick={onToggle} type="button">
              Hide
            </button>
          </div>

          <div className="terminal-quest-strip">
            <span className="complete">Read the brief</span>
            <span>Edit the starter files</span>
            <span className={terminalReviewed ? "complete" : ""}>Request review</span>
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
            placeholder={activePlaceholder}
            value={drafts[activeFile] || ""}
          />

          <div className="terminal-actions">
            <button className="primary-btn" onClick={onAnalyze} type="button">
              {isAnalyzing ? "Reviewing..." : terminalReviewed ? "Review again" : `${compilerLabel} challenge review`}
            </button>
            <p className="muted-copy">
              This terminal milestone is stored in Firestore after a review, then contributes to the topic badge.
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
