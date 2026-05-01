"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthPanel from "@/components/auth-panel";
import HeroScene from "@/components/hero-scene";
import { auth, db, ensureFirebaseReady } from "@/lib/firebase/client";

const TRACK_LABELS = {
  lwc: "LWC",
  apex: "Apex",
  practice: "Practice Lab",
  final: "Final Test"
};

const DEFAULT_PROFILE = {
  displayName: "",
  headline: "Building modern Salesforce skills",
  bio: "I am turning focused practice into real project confidence.",
  focusTrack: "lwc"
};

function getStoredObject(key) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function getAllTopics(curriculum) {
  return [...curriculum.lwc, ...curriculum.apex];
}

function getTopicPool(curriculum, currentTab) {
  if (currentTab === "lwc") {
    return curriculum.lwc;
  }

  if (currentTab === "apex") {
    return curriculum.apex;
  }

  if (currentTab === "practice") {
    return getAllTopics(curriculum);
  }

  return [];
}

function getCompletionPercent(allTopics, done) {
  const completed = allTopics.filter((topic) => done[topic.id]).length;
  return Math.round((completed / Math.max(allTopics.length, 1)) * 100);
}

function getInitials(user, profile) {
  const source = profile.displayName || user?.displayName || user?.email || "Learner";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function LearnerDevApp({ curriculum, curriculumAudit }) {
  const firebaseReady = ensureFirebaseReady();
  const allTopics = useMemo(() => getAllTopics(curriculum), [curriculum]);
  const skipCloudSyncRef = useRef(true);

  const [currentTab, setCurrentTab] = useState("lwc");
  const [currentTopicId, setCurrentTopicId] = useState(curriculum.lwc[0]?.id || "");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState({});
  const [practiceNotes, setPracticeNotes] = useState({});
  const [theme, setTheme] = useState("neo");
  const [copyState, setCopyState] = useState(false);
  const [savedState, setSavedState] = useState("");
  const [finalAnswers, setFinalAnswers] = useState({});
  const [finalResult, setFinalResult] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState({});
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");

  const topicPool = useMemo(() => getTopicPool(curriculum, currentTab), [curriculum, currentTab]);
  const currentTopic = useMemo(
    () => allTopics.find((topic) => topic.id === currentTopicId) || topicPool[0] || allTopics[0] || null,
    [allTopics, currentTopicId, topicPool]
  );
  const filteredTopics = useMemo(() => {
    if (currentTab === "final") {
      return [];
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return topicPool;
    }

    return topicPool.filter((topic) => {
      const haystack = [
        topic.title,
        topic.level,
        topic.focus,
        ...(topic.objectives || []),
        ...(topic.subtopics || []),
        ...(topic.keyTerms || [])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [currentTab, search, topicPool]);
  const completionPercent = useMemo(() => getCompletionPercent(allTopics, done), [allTopics, done]);
  const focusCount = currentTopic ? (currentTopic.subtopics || []).length : 0;
  const practiceCount = Object.values(practiceNotes).filter(Boolean).length;

  useEffect(() => {
    setDone(getStoredObject("mastery_done"));
    setPracticeNotes(getStoredObject("mastery_practice_notes"));
    setTheme(window.localStorage.getItem("learner_dev_theme") || "neo");
  }, []);

  useEffect(() => {
    if (!firebaseReady || !auth || !db) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError("");
      setProfileStatus("");

      if (!nextUser) {
        skipCloudSyncRef.current = true;
        setProfile(DEFAULT_PROFILE);
        setDraftProfile(DEFAULT_PROFILE);
        return;
      }

      const profileRef = doc(db, "profiles", nextUser.uid);
      const snapshot = await getDoc(profileRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const nextProfile = { ...DEFAULT_PROFILE, ...(data.profile || {}) };
        setDone(data.done || {});
        setPracticeNotes(data.practiceNotes || {});
        setTheme(data.theme || "neo");
        setProfile(nextProfile);
        setDraftProfile(nextProfile);
        if (nextProfile.focusTrack && TRACK_LABELS[nextProfile.focusTrack]) {
          setCurrentTab(nextProfile.focusTrack);
        }
      } else {
        const seededDone = getStoredObject("mastery_done");
        const seededNotes = getStoredObject("mastery_practice_notes");
        const seededTheme = window.localStorage.getItem("learner_dev_theme") || "neo";
        const nextProfile = {
          ...DEFAULT_PROFILE,
          displayName: nextUser.displayName || ""
        };

        await setDoc(profileRef, {
          email: nextUser.email || "",
          theme: seededTheme,
          done: seededDone,
          practiceNotes: seededNotes,
          profile: nextProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setDone(seededDone);
        setPracticeNotes(seededNotes);
        setTheme(seededTheme);
        setProfile(nextProfile);
        setDraftProfile(nextProfile);
      }

      skipCloudSyncRef.current = false;
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("learner_dev_theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("mastery_done", JSON.stringify(done));
  }, [done]);

  useEffect(() => {
    window.localStorage.setItem("mastery_practice_notes", JSON.stringify(practiceNotes));
  }, [practiceNotes]);

  useEffect(() => {
    setQuizFeedback({});
    setSavedState("");
    setCopyState(false);
  }, [currentTopicId, currentTab]);

  async function persistCloud(nextValues) {
    if (!user || !db || skipCloudSyncRef.current) {
      return;
    }

    await setDoc(
      doc(db, "profiles", user.uid),
      {
        ...nextValues,
        email: user.email || "",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }

  function changeTab(tabName) {
    setCurrentTab(tabName);
    setSearch("");
    setFinalResult(null);
    setSavedState("");

    if (tabName === "lwc") {
      setCurrentTopicId(curriculum.lwc[0]?.id || "");
      return;
    }

    if (tabName === "apex") {
      setCurrentTopicId(curriculum.apex[0]?.id || "");
      return;
    }

    if (tabName === "practice") {
      setCurrentTopicId(allTopics[0]?.id || "");
    }
  }

  function markDone(topicId) {
    const nextDone = {
      ...done,
      [topicId]: true
    };

    setDone(nextDone);
    persistCloud({ done: nextDone });
  }

  function updatePracticeNote(topicId, value) {
    setPracticeNotes((current) => ({
      ...current,
      [topicId]: value
    }));
  }

  function savePracticeAnswer(topicId, value) {
    const nextNotes = {
      ...practiceNotes,
      [topicId]: value
    };

    setPracticeNotes(nextNotes);
    persistCloud({ practiceNotes: nextNotes });
    setSavedState(user ? "Saved to your device and Firebase." : "Saved locally in this browser.");
  }

  function updateTheme(nextTheme) {
    setTheme(nextTheme);
    persistCloud({ theme: nextTheme });
  }

  async function handleEmailLogin(email, password) {
    if (!auth || !firebaseReady) {
      setAuthError("Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* keys first.");
      return;
    }

    try {
      setAuthError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleEmailSignup(email, password) {
    if (!auth || !firebaseReady) {
      setAuthError("Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* keys first.");
      return;
    }

    try {
      setAuthError("");
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    setProfileOpen(false);
  }

  async function handleProfileSave() {
    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...draftProfile
    };

    setProfile(nextProfile);
    setProfileStatus("Profile saved.");

    if (auth?.currentUser && nextProfile.displayName && auth.currentUser.displayName !== nextProfile.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: nextProfile.displayName
      });
    }

    await persistCloud({
      profile: nextProfile
    });

    if (TRACK_LABELS[nextProfile.focusTrack]) {
      changeTab(nextProfile.focusTrack);
    }
  }

  async function copyCodeExample() {
    if (!currentTopic?.example) {
      return;
    }

    await navigator.clipboard.writeText(currentTopic.example);
    setCopyState(true);
    window.setTimeout(() => setCopyState(false), 1200);
  }

  function submitFinalMcq() {
    const questions = curriculum.finalTest.multipleChoice;
    let score = 0;

    questions.forEach((question, index) => {
      if (Number(finalAnswers[index]) === question.answer) {
        score += 1;
      }
    });

    const percent = Math.round((score / Math.max(questions.length, 1)) * 100);
    setFinalResult({
      score,
      percent,
      total: questions.length
    });
  }

  function renderLessonView() {
    if (!currentTopic) {
      return null;
    }

    return (
      <>
        <section className="hero-grid modern-panel">
          <div className="hero-copy">
            <div className="panel-kicker">Immersive Study Lab</div>
            <h2>{currentTopic.title}</h2>
            <p className="hero-lead">{currentTopic.focus}</p>

            <div className="stat-row">
              <div className="stat-pill">
                <span>{currentTab.toUpperCase()}</span>
                <strong>{currentTopic.level}</strong>
              </div>
              <div className="stat-pill">
                <span>Quick checks</span>
                <strong>{(currentTopic.quiz || []).length}</strong>
              </div>
              <div className="stat-pill">
                <span>Subtopics</span>
                <strong>{focusCount}</strong>
              </div>
            </div>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => markDone(currentTopic.id)} type="button">
                {done[currentTopic.id] ? "Completed" : "Mark Topic Done"}
              </button>
              <button className="secondary-btn" onClick={() => changeTab("practice")} type="button">
                Open Practice Lab
              </button>
            </div>
          </div>

          <HeroScene />
        </section>

        <section className="dashboard-strip">
          <article className="mini-card modern-panel">
            <span className="mini-label">Completion</span>
            <strong>{completionPercent}%</strong>
            <p>{Object.keys(done).length} milestones tracked</p>
          </article>
          <article className="mini-card modern-panel">
            <span className="mini-label">Practice Drafts</span>
            <strong>{practiceCount}</strong>
            <p>Saved answer spaces across the curriculum</p>
          </article>
          <article className="mini-card modern-panel">
            <span className="mini-label">Theme</span>
            <strong>{theme === "neo" ? "Neo Glass" : "Dark Flux"}</strong>
            <p>Switch the mood from the top right toggle</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="modern-panel content-panel span-two">
            <div className="section-heading">
              <div className="panel-kicker">Concept Breakdown</div>
              <h3>What this lesson is really teaching</h3>
            </div>
            <div className="rich-text">
              {(currentTopic.deepDive || []).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Core Objectives</div>
              <h3>What you should be able to do</h3>
            </div>
            <ul className="list-block">
              {(currentTopic.objectives || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Subtopics</div>
              <h3>Concept map</h3>
            </div>
            <ul className="list-block">
              {(currentTopic.subtopics || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="modern-panel content-panel span-two">
            <div className="section-heading">
              <div className="panel-kicker">Code Example</div>
              <h3>Reference implementation</h3>
            </div>
            <pre>
              <code>{currentTopic.example}</code>
            </pre>
            <button className="secondary-btn" onClick={copyCodeExample} type="button">
              {copyState ? "Copied" : "Copy Example"}
            </button>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Interview Answer</div>
              <h3>How to explain it clearly</h3>
            </div>
            <p className="rich-text">{currentTopic.interview}</p>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Key Terms</div>
              <h3>Vocabulary to remember</h3>
            </div>
            <div className="practice-meta">
              {(currentTopic.keyTerms || []).map((item) => (
                <span className="tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Common Mistakes</div>
              <h3>Things that usually go wrong</h3>
            </div>
            <ul className="list-block">
              {(currentTopic.pitfalls || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Project Scenarios</div>
              <h3>How this shows up in real work</h3>
            </div>
            <ul className="list-block">
              {(currentTopic.scenarios || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="modern-panel content-panel span-two">
            <div className="section-heading">
              <div className="panel-kicker">Revision Quiz</div>
              <h3>Fast recall check</h3>
            </div>
            <div className="quiz-grid">
              {(currentTopic.quiz || []).map((question, questionIndex) => {
                const feedback = quizFeedback[questionIndex];
                return (
                  <div className="quiz-card" key={question.q}>
                    <p>
                      <strong>
                        {questionIndex + 1}. {question.q}
                      </strong>
                    </p>
                    {question.options.map((option, optionIndex) => {
                      const isAnswered = Boolean(feedback);
                      const isCorrect = feedback && optionIndex === question.answer;
                      const isWrong = feedback && feedback.selected === optionIndex && optionIndex !== question.answer;
                      const className = `option${isCorrect ? " correct" : ""}${isWrong ? " wrong" : ""}`;

                      return (
                        <button
                          className={className}
                          disabled={isAnswered}
                          key={option}
                          onClick={() =>
                            setQuizFeedback((current) => ({
                              ...current,
                              [questionIndex]: {
                                selected: optionIndex,
                                correct: optionIndex === question.answer
                              }
                            }))
                          }
                          type="button"
                        >
                          {option}
                        </button>
                      );
                    })}
                    <div className="feedback">
                      {feedback ? (feedback.correct ? "Correct" : "Needs one more review pass") : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Coverage Check</div>
              <h3>What the full track should include</h3>
            </div>
            <ul className="list-block">
              {(curriculumAudit[currentTab] || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Study Flow</div>
              <h3>How to practice this topic</h3>
            </div>
            <ul className="list-block">
              <li>Read the concept breakdown and restate it in your own words.</li>
              <li>Walk through the example until each line feels intentional.</li>
              <li>Use the practice lab to turn memory into output.</li>
              <li>Finish with the quiz after the deeper notes feel familiar.</li>
            </ul>
          </article>
        </section>
      </>
    );
  }

  function renderPracticeLab() {
    if (!currentTopic) {
      return null;
    }

    const currentValue = practiceNotes[currentTopic.id] || "";

    return (
      <>
        <section className="hero-grid modern-panel practice-hero-card">
          <div className="hero-copy">
            <div className="panel-kicker">Practice Lab</div>
            <h2>{currentTopic.exercise.title}</h2>
            <p className="hero-lead">{currentTopic.exercise.prompt}</p>
            <div className="practice-meta">
              <span className="tag">{currentTopic.title}</span>
              <span className="tag">{done[currentTopic.id] ? "Topic completed" : "Still in progress"}</span>
              {user ? <span className="tag">Saved per user in Firebase</span> : <span className="tag">Local save mode</span>}
            </div>
          </div>
          <div className="modern-panel floating-panel">
            <div className="panel-kicker">Answer checklist</div>
            <ul className="list-block">
              {(currentTopic.exercise.checklist || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="content-grid">
          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Starter Code</div>
              <h3>Base template</h3>
            </div>
            <pre>
              <code>{currentTopic.exercise.starter}</code>
            </pre>
          </article>

          <article className="modern-panel content-panel span-two">
            <div className="section-heading">
              <div className="panel-kicker">Your Answer</div>
              <h3>Write it your way</h3>
            </div>
            <textarea
              className="editor"
              onChange={(event) => updatePracticeNote(currentTopic.id, event.target.value)}
              placeholder="Write your LWC or Apex answer here..."
              value={currentValue}
            />
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => savePracticeAnswer(currentTopic.id, currentValue)} type="button">
                Save Answer
              </button>
              <button className="secondary-btn" onClick={() => markDone(currentTopic.id)} type="button">
                Mark Topic Done
              </button>
            </div>
            <div className="status-text">{savedState}</div>
          </article>
        </section>
      </>
    );
  }

  function renderFinalTest() {
    return (
      <>
        <section className="hero-grid modern-panel">
          <div className="hero-copy">
            <div className="panel-kicker">Combined Assessment</div>
            <h2>LWC + Apex Final Test</h2>
            <p className="hero-lead">
              This section mixes objective questions with written coding prompts so you can test recall, reasoning, and
              implementation together.
            </p>
            <div className="practice-meta">
              <span className="tag">{curriculum.finalTest.multipleChoice.length} MCQs</span>
              <span className="tag">{curriculum.finalTest.codingPrompts.length} coding prompts</span>
              <span className="tag">{completionPercent}% curriculum completed</span>
            </div>
          </div>
          <div className="modern-panel floating-panel">
            <div className="panel-kicker">Assessment Goals</div>
            <ul className="list-block">
              <li>LWC architecture, data flow, and communication</li>
              <li>Apex trigger design, bulkification, security, and testing</li>
              <li>Your ability to write compact, correct code from memory</li>
            </ul>
          </div>
        </section>

        <section className="content-grid">
          <article className="modern-panel content-panel span-two">
            <div className="section-heading">
              <div className="panel-kicker">Multiple Choice Review</div>
              <h3>Score your recall</h3>
            </div>
            {curriculum.finalTest.multipleChoice.map((question, index) => (
              <div className="quiz-card" key={question.q}>
                <p>
                  <strong>
                    {index + 1}. {question.q}
                  </strong>
                </p>
                <p className="muted-copy">{question.topic}</p>
                {question.options.map((option, optionIndex) => (
                  <label className="option option-label" key={option}>
                    <input
                      checked={String(finalAnswers[index]) === String(optionIndex)}
                      name={`final-q-${index}`}
                      onChange={() =>
                        setFinalAnswers((current) => ({
                          ...current,
                          [index]: optionIndex
                        }))
                      }
                      type="radio"
                      value={optionIndex}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ))}
            <button className="primary-btn" onClick={submitFinalMcq} type="button">
              Submit MCQ Test
            </button>
            {finalResult ? (
              <div className="result-box">
                <strong>
                  Score: {finalResult.score}/{finalResult.total} ({finalResult.percent}%)
                </strong>
                <p>
                  {finalResult.percent >= 80
                    ? "Strong result. Spend time on the written prompts next."
                    : "Review the lesson tabs once more, then retake this MCQ round."}
                </p>
              </div>
            ) : null}
          </article>

          <article className="modern-panel content-panel">
            <div className="section-heading">
              <div className="panel-kicker">Coding Prompts</div>
              <h3>Short-form writing</h3>
            </div>
            {curriculum.finalTest.codingPrompts.map((prompt, index) => (
              <div className="practice-card" key={prompt.id}>
                <h3>
                  {index + 1}. {prompt.title}
                </h3>
                <p className="muted-copy">{prompt.prompt}</p>
                <textarea
                  className="editor compact-editor"
                  onChange={(event) => updatePracticeNote(prompt.id, event.target.value)}
                  placeholder="Write your answer here..."
                  value={practiceNotes[prompt.id] || ""}
                />
                <button className="secondary-btn" onClick={() => savePracticeAnswer(prompt.id, practiceNotes[prompt.id] || "")} type="button">
                  Save Prompt Answer
                </button>
              </div>
            ))}
          </article>
        </section>
      </>
    );
  }

  return (
    <div className="app-shell-modern">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <header className="app-header modern-panel">
        <div className="brand">
          <div aria-hidden="true" className="logo">
            LD
          </div>
          <div>
            <p className="panel-kicker">Modernizr Study Mode</p>
            <h1>Learner DEV</h1>
          </div>
        </div>

        <nav aria-label="Main sections" className="tabs">
          {Object.entries(TRACK_LABELS).map(([key, label]) => (
            <button
              className={`tab ${currentTab === key ? "active" : ""}`}
              key={key}
              onClick={() => changeTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => updateTheme(theme === "neo" ? "dark" : "neo")}
            title={theme === "neo" ? "Switch to dark flux" : "Switch to neo glass"}
            type="button"
          >
            <span>{theme === "neo" ? "Neo Glass" : "Dark Flux"}</span>
          </button>

          {user ? (
            <button className="profile-chip" onClick={() => setProfileOpen(true)} type="button">
              <span className="avatar-orb">{getInitials(user, profile)}</span>
              <span className="profile-chip-copy">
                <strong>{profile.displayName || user.displayName || "Learner"}</strong>
                <small>{profile.headline}</small>
              </span>
            </button>
          ) : null}
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="left-rail">
          <AuthPanel
            authError={authError}
            authReady={authReady}
            firebaseReady={firebaseReady}
            onEmailLogin={handleEmailLogin}
            onEmailSignup={handleEmailSignup}
            onLogout={handleLogout}
            onOpenProfile={() => setProfileOpen(true)}
            user={user}
          />

          <section className="modern-panel side-panel">
            <div className="section-heading">
              <div className="panel-kicker">Navigator</div>
              <h3>Study Control</h3>
            </div>

            <input
              className="field search-field"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search topics, levels, or keywords"
              type="search"
              value={search}
            />

            <div className="progress-card">
              <div className="progress-meta">
                <span>Curriculum progress</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${completionPercent}%` }}></div>
              </div>
            </div>

            <div className="topic-list">
              {currentTab === "final" ? (
                <div className="topic-btn active">
                  <strong>Combined LWC + Apex Assessment</strong>
                  <span>MCQ review plus written coding prompts</span>
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <button
                    className={`topic-btn ${topic.id === currentTopic?.id ? "active" : ""}`}
                    key={topic.id}
                    onClick={() => setCurrentTopicId(topic.id)}
                    type="button"
                  >
                    {done[topic.id] ? <span className="done-dot">Done</span> : null}
                    <strong>{topic.title}</strong>
                    <span>
                      {topic.level} · {(topic.subtopics || []).length} subtopics
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <main className="main-stage">
          {currentTab === "practice" ? renderPracticeLab() : currentTab === "final" ? renderFinalTest() : renderLessonView()}
        </main>
      </section>

      {profileOpen ? (
        <div className="profile-modal-backdrop" onClick={() => setProfileOpen(false)} role="presentation">
          <section className="profile-modal modern-panel" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <div className="panel-kicker">Profile Studio</div>
              <h3>Edit your learner identity</h3>
            </div>

            <div className="profile-form">
              <label>
                Display name
                <input
                  className="field"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, displayName: event.target.value }))}
                  value={draftProfile.displayName}
                />
              </label>

              <label>
                Headline
                <input
                  className="field"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, headline: event.target.value }))}
                  value={draftProfile.headline}
                />
              </label>

              <label>
                Focus track
                <select
                  className="field"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, focusTrack: event.target.value }))}
                  value={draftProfile.focusTrack}
                >
                  <option value="lwc">LWC</option>
                  <option value="apex">Apex</option>
                  <option value="practice">Practice Lab</option>
                  <option value="final">Final Test</option>
                </select>
              </label>

              <label>
                Bio
                <textarea
                  className="editor compact-editor"
                  onChange={(event) => setDraftProfile((current) => ({ ...current, bio: event.target.value }))}
                  value={draftProfile.bio}
                />
              </label>
            </div>

            {profileStatus ? <p className="status-success">{profileStatus}</p> : null}

            <div className="hero-actions">
              <button className="primary-btn" onClick={handleProfileSave} type="button">
                Save profile
              </button>
              <button className="secondary-btn" onClick={() => setProfileOpen(false)} type="button">
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
