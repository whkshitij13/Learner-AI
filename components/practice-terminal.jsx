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
  review
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
        {isOpen ? "Close Practice Terminal" : "Open Practice Terminal"}
      </button>
      {isOpen ? (
        <aside className="terminal-shell">
          <div className="terminal-topbar">
            <div>
              <p className="eyebrow">Practice Terminal</p>
              <h3>{terminalTitle}</h3>
              <p className="muted-copy">{terminalDescription}</p>
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
            placeholder={activePlaceholder}
            value={drafts[activeFile] || ""}
          />

          <div className="terminal-actions">
            <button className="primary-btn" onClick={onAnalyze} type="button">
              {isAnalyzing ? "Reviewing..." : `${compilerLabel} review`}
            </button>
            <p className="muted-copy">
              Uses topic-aware validation first, then Gemini feedback when `GEMINI_API_KEY` is configured.
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
