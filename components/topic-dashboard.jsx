"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import DiagramCard from "@/components/diagram-card";
import MediaShelf from "@/components/media-shelf";
import PracticeTerminal from "@/components/practice-terminal";
import StudyHeader from "@/components/study-header";
import { auth, db } from "@/lib/firebase/client";
import { getUserDashboardState, logUserQuery, saveUserTrackState } from "@/lib/dashboard-store";
import { assignThemePreset, getSuggestionsForInterests, INTEREST_OPTIONS } from "@/lib/personalization";
import { ensureUserProfile, saveUserProfilePreferences } from "@/lib/profile-store";
import { MEDIA_LIBRARY, PROMPT_LIBRARY } from "@/lib/recommendations";

const TRACK_CONFIG = {
  workspace: {
    label: "Study Workspace",
    intro: "Search any topic, generate deep study cards, and unlock practice only when the topic needs it."
  },
  lwc: {
    label: "Study Workspace",
    intro: "Search a topic, generate deep study cards, and unlock practice only when the topic needs it."
  },
  apex: {
    label: "Study Workspace",
    intro: "Search a topic, generate deep study cards, and unlock practice only when the topic needs it."
  }
};

const SUGGESTED_PROMPTS = [
  "Build a full study card for JavaScript promises",
  "Explain travel planning for Japan in a structured study format",
  "Create a beginner study pack for photosynthesis",
  "Generate a concept guide for CSS flexbox with practice ideas"
];

const LOADING_MESSAGES = [
  "Thinking through the topic map...",
  "Pulling together a deeper study path...",
  "Writing clear explanations and subtopics...",
  "Drafting practice ideas and useful checkpoints...",
  "Turning the topic into a scrollable study card..."
];

const DEFAULT_FILES = {
  workspace: {
    html: "<section class=\"practice-card\">\n  <h1>Start building</h1>\n  <p>Use this space to test the idea you are learning.</p>\n</section>",
    js: "const topicTitle = 'Practice topic';\n\nconsole.log(`Exploring ${topicTitle}`);",
    css: "body {\n  font-family: Arial, sans-serif;\n}\n\n.practice-card {\n  padding: 16px;\n}"
  },
  lwc: {
    html: "<section class=\"practice-card\">\n  <h1>Start building</h1>\n  <p>Use this space to test the idea you are learning.</p>\n</section>",
    js: "const topicTitle = 'Practice topic';\n\nconsole.log(`Exploring ${topicTitle}`);",
    css: "body {\n  font-family: Arial, sans-serif;\n}\n\n.practice-card {\n  padding: 16px;\n}"
  },
  apex: {
    class: "public with sharing class PracticeController {\n  public static void run() {\n    System.debug('Start here');\n  }\n}"
  }
};

function getTrackPrompts(finalTest, track) {
  const keyword = track === "lwc" ? "LWC" : "Apex";
  return (finalTest?.codingPrompts || []).filter(
    (item) => item.title.includes(keyword) || item.prompt.includes(keyword)
  );
}

function normalizeTopic(topic, activeTrack) {
  if (!topic) {
    return null;
  }

  const title = topic.title || "Generated topic";
  const keywords = `${title} ${topic.focus || ""} ${(topic.subtopics || []).join(" ")}`.toLowerCase();
  const explicitTechnical = topic.capabilities?.terminalEnabled;
  const looksTechnical = /(javascript|js|css|html|apex|lwc|react|node|api|sql|python|java|code|coding|developer|programming)/.test(
    keywords
  );
  const isTechnical =
    typeof explicitTechnical === "boolean"
      ? explicitTechnical
      : Boolean(topic.example || topic.exercise?.starter || looksTechnical || !topic.media?.length);

  return {
    ...topic,
    topicKind: topic.topicKind || (isTechnical ? "technical" : "general"),
    objectives: topic.objectives || [],
    deepDive: topic.deepDive || [],
    subtopics: topic.subtopics || [],
    branchTopics: topic.branchTopics?.length ? topic.branchTopics : topic.subtopics || [],
    keyTerms: topic.keyTerms || [],
    quiz: topic.quiz || [],
    mockPrompts: topic.mockPrompts || [],
    scenarios: topic.scenarios || [],
    media: topic.media || [],
    capabilities: {
      quizEnabled:
        typeof topic.capabilities?.quizEnabled === "boolean"
          ? topic.capabilities.quizEnabled
          : Boolean(topic.quiz?.length) || isTechnical,
      terminalEnabled:
        typeof topic.capabilities?.terminalEnabled === "boolean"
          ? topic.capabilities.terminalEnabled
          : Boolean(isTechnical),
      mockEnabled:
        typeof topic.capabilities?.mockEnabled === "boolean"
          ? topic.capabilities.mockEnabled
          : Boolean(isTechnical || topic.quiz?.length)
    }
  };
}

export default function TopicDashboard({ curriculum, activeTrack }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [customTopics, setCustomTopics] = useState([]);
  const [draft, setDraft] = useState({ title: "", focus: "", level: "Custom" });
  const [activePanel, setActivePanel] = useState("learn");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const isApexTrack = activeTrack === "apex";
  const defaultDraftFiles = DEFAULT_FILES[activeTrack] || DEFAULT_FILES.workspace;
  const [activeFile, setActiveFile] = useState(isApexTrack ? "class" : "html");
  const [drafts, setDrafts] = useState(defaultDraftFiles);
  const [review, setReview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topicQuizAnswers, setTopicQuizAnswers] = useState({});
  const [mockAnswers, setMockAnswers] = useState({});
  const [mockResult, setMockResult] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const hasLoadedTrackState = useRef(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const trackTopics = curriculum[activeTrack] || [];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("learner-dev-theme") || "light";
    setTheme(storedTheme);
    document.body.dataset.theme = storedTheme;
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("learner-dev-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    hasLoadedTrackState.current = false;
    setCustomTopics([]);
    setMockAnswers({});
    setActiveFile(activeTrack === "apex" ? "class" : "html");
    setDrafts(DEFAULT_FILES[activeTrack] || DEFAULT_FILES.workspace);
    setReview(null);
    setMockResult(null);
    setActivePanel("learn");
  }, [activeTrack]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      router.replace("/");
    }
  }, [authReady, router, user]);

  useEffect(() => {
    async function loadDashboardState() {
      if (!user || !db) {
        return;
      }

      const dashboardState = await getUserDashboardState(db, user);
      const trackState = dashboardState.tracks?.[activeTrack];

      setCustomTopics((trackState?.topics || []).map((topic) => normalizeTopic(topic, activeTrack)));
      setMockAnswers(trackState?.mockAnswers || {});
      hasLoadedTrackState.current = true;
    }

    loadDashboardState();
  }, [activeTrack, user]);

  useEffect(() => {
    async function loadProfileState() {
      if (!user || !db) {
        setSelectedInterests([]);
        return;
      }

      const nextProfile = await ensureUserProfile(db, user);
      setSelectedInterests(nextProfile.interests || []);
      setShowOnboarding(!nextProfile.onboardingCompleted);
      document.body.dataset.themePreset = nextProfile.themePreset || "aurora-notes";
    }

    loadProfileState();
  }, [user]);

  useEffect(() => {
    async function persistTrackState() {
      if (!user || !db || !hasLoadedTrackState.current) {
        return;
      }

      await saveUserTrackState(db, user, activeTrack, {
        topics: customTopics,
        mockAnswers
      });
    }

    persistTrackState();
  }, [activeTrack, customTopics, mockAnswers, user]);

  useEffect(() => {
    if (!isGeneratingTopic) {
      setLoadingMessageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isGeneratingTopic]);

  const visibleTopics = useMemo(() => {
    const combined = [...trackTopics, ...customTopics];
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return combined;
    }

    return combined.filter((topic) =>
      [topic.title, topic.focus, topic.level, ...(topic.subtopics || []), ...(topic.keyTerms || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [customTopics, query, trackTopics]);

  const currentTopic = useMemo(
    () => visibleTopics.find((topic) => topic.id === selectedTopicId) || trackTopics[0] || customTopics[0] || null,
    [customTopics, selectedTopicId, trackTopics, visibleTopics]
  );

  useEffect(() => {
    if (!visibleTopics.length) {
      setSelectedTopicId("");
      return;
    }

    if (!visibleTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(visibleTopics[0].id);
    }
  }, [selectedTopicId, visibleTopics]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const stage = document.getElementById("studyStageScroll");

    if (!stage) {
      return undefined;
    }

    const handleScroll = () => {
      setShowBackToTop(stage.scrollTop > 280);
    };

    handleScroll();
    stage.addEventListener("scroll", handleScroll, { passive: true });
    return () => stage.removeEventListener("scroll", handleScroll);
  }, [activePanel, currentTopic?.id]);

  const currentConfig = TRACK_CONFIG[activeTrack] || TRACK_CONFIG.workspace;
  const fallbackMediaItems = MEDIA_LIBRARY[activeTrack] || [];
  const prompts = [...PROMPT_LIBRARY.beginner, ...PROMPT_LIBRARY["project-builder"]].slice(0, 4);
  const mockPrompts = getTrackPrompts(curriculum.finalTest, activeTrack);
  const normalizedCurrentTopic = normalizeTopic(currentTopic, activeTrack);
  const mediaItems = normalizedCurrentTopic?.media?.length ? normalizedCurrentTopic.media : fallbackMediaItems;
  const activeMockPrompts = normalizedCurrentTopic?.mockPrompts?.length ? normalizedCurrentTopic.mockPrompts : mockPrompts;
  const topicCapabilities = normalizedCurrentTopic?.capabilities || {
    quizEnabled: true,
    terminalEnabled: true,
    mockEnabled: true
  };
  const isTechnicalTopic = Boolean(topicCapabilities.terminalEnabled);
  const branchTopics = normalizedCurrentTopic?.branchTopics?.length
    ? normalizedCurrentTopic.branchTopics
    : normalizedCurrentTopic?.subtopics || [];
  const interestSuggestions = getSuggestionsForInterests(selectedInterests, SUGGESTED_PROMPTS);

  async function addTopic(event) {
    event.preventDefault();

    if (!draft.title.trim() || !draft.focus.trim()) {
      return;
    }

    const nextTopic = normalizeTopic(
      {
      id: `custom-${activeTrack}-${Date.now()}`,
      title: draft.title.trim(),
      focus: draft.focus.trim(),
      level: draft.level.trim() || "Custom",
      objectives: ["Custom topic added from dashboard."],
      deepDive: ["Detailed topic generation will be connected later."],
      quiz: [],
      exercise: {
        title: "Practice area coming next",
        prompt: "You will be able to connect AI-generated practice later.",
        starter: "",
        checklist: []
      },
      subtopics: [],
      keyTerms: [],
      scenarios: []
      },
      activeTrack
    );

    if (user && db) {
      try {
        await logUserQuery(db, user, activeTrack, draft.title.trim());
      } catch (error) {
        console.error("Could not save topic draft history.", error);
      }
    }

    setCustomTopics((current) => [nextTopic, ...current]);
    setSelectedTopicId(nextTopic.id);
    setDraft({ title: "", focus: "", level: "Custom" });
  }

  function updateDraft(fileId, value) {
    setDrafts((current) => ({
      ...current,
      [fileId]: value
    }));
  }

  async function analyzePractice() {
    setIsAnalyzing(true);
    setReview(null);

    try {
      const response = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          track: activeTrack,
          topicTitle: currentTopic?.title,
          files: drafts
        })
      });

      const data = await response.json();
      setReview(data);
    } catch {
      setReview({
        provider: "Unavailable",
        staticReview: {
          summary: "The review request could not be completed.",
          errors: ["Check that the app server is running and try again."],
          hints: []
        },
        template: ""
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function scoreMockTest() {
    const questions = currentTopic?.quiz || [];
    const score = questions.reduce(
      (total, question, index) => (String(topicQuizAnswers[index]) === String(question.answer) ? total + 1 : total),
      0
    );

    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    setMockResult({ score, total: questions.length, percent });
  }

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace("/");
  }

  function scrollStageToTop() {
    const stage = document.getElementById("studyStageScroll");
    stage?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openBranchTopic(branch) {
    if (!branch) {
      return;
    }

    const scopedQuery = normalizedCurrentTopic?.title ? `${normalizedCurrentTopic.title} ${branch}` : branch;
    setTopicPrompt(scopedQuery);
    generateTopic(scopedQuery);
  }

  function renderLinkedText(text, keyPrefix) {
    if (!text) {
      return null;
    }

    const linkableTerms = [...new Set([...(branchTopics || []), ...(normalizedCurrentTopic?.keyTerms || [])])]
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)
      .slice(0, 14);

    if (!linkableTerms.length) {
      return text;
    }

    const escapedTerms = linkableTerms.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const matcher = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = String(text).split(matcher);

    return parts.map((part, index) => {
      const matchedTerm = linkableTerms.find((item) => item.toLowerCase() === part.toLowerCase());

      if (!matchedTerm) {
        return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
      }

      return (
        <button
          className="inline-topic-link"
          key={`${keyPrefix}-link-${index}`}
          onClick={() => openBranchTopic(matchedTerm)}
          type="button"
        >
          {part}
        </button>
      );
    });
  }

  async function generateTopic(promptOverride) {
    const queryText = (promptOverride || topicPrompt).trim();

    if (!queryText) {
      setGenerationError("Enter a topic first.");
      return;
    }

    setIsGeneratingTopic(true);
    setGenerationError("");

    try {
      if (user && db) {
        try {
          await logUserQuery(db, user, activeTrack, queryText);
        } catch (error) {
          console.error("Could not save search history.", error);
        }
      }

      const response = await fetch("/api/topic-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: queryText,
          activeTrack
        })
      });

      const data = await response.json();

      if (!response.ok || !data?.topic) {
        throw new Error(data?.error || "Topic generation failed.");
      }

      const nextTopic = normalizeTopic(
        {
          id: `generated-${activeTrack}-${Date.now()}`,
          ...data.topic,
          level: data.topic.level || "AI generated"
        },
        activeTrack
      );

      setCustomTopics((current) => [nextTopic, ...current]);
      setSelectedTopicId(nextTopic.id);
      setActivePanel("learn");
      setTopicPrompt("");
      setMockResult(null);
      setTopicQuizAnswers({});
    } catch (error) {
      setGenerationError(error.message || "Topic generation failed.");
    } finally {
      setIsGeneratingTopic(false);
    }
  }

  function toggleInterest(interest) {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  }

  async function completeOnboarding() {
    if (selectedInterests.length < 3) {
      setOnboardingError("Choose at least three interests.");
      return;
    }

    if (!user || !db) {
      return;
    }

    setSavingOnboarding(true);
    setOnboardingError("");

    try {
      const themePreset = assignThemePreset(selectedInterests);
      const nextProfile = await saveUserProfilePreferences(db, user, {
        interests: selectedInterests,
        themePreset,
        onboardingCompleted: true
      });

      setSelectedInterests(nextProfile.interests || selectedInterests);
      setShowOnboarding(false);
      document.body.dataset.themePreset = themePreset;
    } catch {
      setOnboardingError("Could not save your preferences. Try again.");
    } finally {
      setSavingOnboarding(false);
    }
  }

  return (
    <div className="dashboard-shell">
      {showOnboarding ? (
        <div className="profile-modal-backdrop" role="presentation">
          <section className="profile-modal glass-card onboarding-modal">
            <div className="section-heading compact-heading">
              <span className="eyebrow">Welcome</span>
              <h2>Pick at least three interests to shape your study space.</h2>
            </div>
            <p className="muted-line">
              We’ll match your dashboard with a theme preset and better topic suggestions based on what you like.
            </p>
            <div className="interest-grid">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  className={`interest-chip ${selectedInterests.includes(interest) ? "active" : ""}`}
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  type="button"
                >
                  {interest}
                </button>
              ))}
            </div>
            {onboardingError ? <p className="error-line">{onboardingError}</p> : null}
            <div className="header-actions-compact">
              <button className="button" onClick={completeOnboarding} type="button">
                {savingOnboarding ? "Saving..." : "Continue"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <StudyHeader
        onLoginClick={() => {
          window.location.href = "/";
        }}
        onLogout={handleLogout}
        onSignupClick={() => {
          window.location.href = "/";
        }}
        onThemeChange={setTheme}
        theme={theme}
        user={user}
      />

      <main className="dashboard-main">
        <section className="dashboard-hero glass-card">
          <div>
            <span className="eyebrow">Study workspace</span>
            <h1>{currentConfig.label}</h1>
            <p>{currentConfig.intro}</p>
          </div>
          <div className="dashboard-badges">
            <span>{trackTopics.length} topics</span>
            <span>{customTopics.length} custom drafts</span>
            <span>{normalizedCurrentTopic?.quiz?.length || 0} MCQs in topic</span>
          </div>
        </section>

        <section className={`study-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <aside className={`glass-card study-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}>
            <div className="sidebar-topbar">
              {!sidebarCollapsed ? (
                <div className="section-heading compact-heading">
                  <span className="eyebrow">Dashboard</span>
                  <h2>Topics</h2>
                </div>
              ) : null}
              <button
                aria-label={sidebarCollapsed ? "Expand topic rail" : "Collapse topic rail"}
                className="collapse-button"
                onClick={() => setSidebarCollapsed((current) => !current)}
                type="button"
              >
                {sidebarCollapsed ? ">" : "<"}
              </button>
            </div>

            {!sidebarCollapsed ? (
              <>
                <input
                  className="dashboard-input"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search topics"
                  type="search"
                  value={query}
                />

                <div className="study-topic-list">
                  {visibleTopics.map((topic) => (
                    <button
                      className={`study-topic-button ${topic.id === currentTopic?.id ? "active" : ""}`}
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      type="button"
                    >
                      <strong>{topic.title}</strong>
                      <span>{topic.level}</span>
                    </button>
                  ))}
                </div>

                <form className="topic-form" onSubmit={addTopic}>
                  <div className="section-heading compact-heading">
                    <span className="eyebrow">Custom</span>
                    <h2>Add topic</h2>
                  </div>
                  <input
                    className="dashboard-input"
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Topic title"
                    value={draft.title}
                  />
                  <textarea
                    className="dashboard-input dashboard-textarea"
                    onChange={(event) => setDraft((current) => ({ ...current, focus: event.target.value }))}
                    placeholder="Topic description"
                    value={draft.focus}
                  />
                  <input
                    className="dashboard-input"
                    onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))}
                    placeholder="Level"
                    value={draft.level}
                  />
                  <button className="button" type="submit">
                    Save draft
                  </button>
                </form>
              </>
            ) : (
              <div className="study-topic-list collapsed-topic-list">
                {visibleTopics.map((topic) => (
                  <button
                    aria-label={topic.title}
                    className={`study-topic-button compact-topic-button ${topic.id === currentTopic?.id ? "active" : ""}`}
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    title={topic.title}
                    type="button"
                  >
                    <strong>{topic.title.slice(0, 1)}</strong>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="study-stage" id="studyStageScroll">
            <article className="glass-card ai-composer">
              <div className="ai-composer-copy">
                <span className="eyebrow">AI topic builder</span>
                <h2>Search any topic and turn it into a full study card.</h2>
                <p>
                  Ask for a technical topic like LWC or JavaScript and the dashboard can include practice tests and a
                  coding terminal. Ask for a general topic like travel and it will stay content-first.
                </p>
              </div>

              <div className="ai-composer-box">
                <textarea
                  className="dashboard-input dashboard-textarea topic-prompt-input"
                  onChange={(event) => setTopicPrompt(event.target.value)}
                  placeholder="Ask something like: Build a complete study card for travel planning in Japan..."
                  value={topicPrompt}
                />
                <div className="ai-composer-actions">
                  <button className="button" onClick={() => generateTopic()} type="button">
                    {isGeneratingTopic ? "Generating..." : "Generate topic"}
                  </button>
                  {generationError ? <p className="error-line">{generationError}</p> : null}
                </div>
                <div className="suggestion-row">
                  {interestSuggestions.map((item) => (
                    <button
                      className="suggestion-chip"
                      key={item}
                      onClick={() => generateTopic(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </article>

            {isGeneratingTopic ? (
              <section className="ai-loading-shell">
                <article className="glass-card ai-loader-card">
                  <div className="ai-loader-orb" />
                  <div className="ai-loader-copy">
                    <span className="eyebrow">AI is building your topic</span>
                    <h3>{LOADING_MESSAGES[loadingMessageIndex]}</h3>
                    <p>
                      Creating a deeper topic structure with detailed explanations, more subtopics, and longer study
                      content.
                    </p>
                  </div>
                </article>

                <section className="study-grid skeleton-grid">
                  <article className="glass-card study-card skeleton-card skeleton-card-wide">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-medium" />
                  </article>

                  <article className="glass-card study-card skeleton-card">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-stack">
                      <div className="skeleton-line skeleton-line-full" />
                      <div className="skeleton-line skeleton-line-medium" />
                      <div className="skeleton-line skeleton-line-long" />
                    </div>
                  </article>

                  <article className="glass-card study-card skeleton-card">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-stack">
                      <div className="skeleton-line skeleton-line-full" />
                      <div className="skeleton-line skeleton-line-medium" />
                      <div className="skeleton-line skeleton-line-long" />
                    </div>
                  </article>

                  <article className="glass-card study-card skeleton-card skeleton-card-wide">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-medium" />
                  </article>
                </section>
              </section>
            ) : null}

            {!isGeneratingTopic && currentTopic ? (
              <>
                <article className="glass-card topic-overview-card">
                  <div className="topic-card-top">
                    <div>
                      <span className="eyebrow">Selected topic</span>
                      <h2>{normalizedCurrentTopic.title}</h2>
                    </div>
                    <span className="topic-kind">{normalizedCurrentTopic.level || "Custom"}</span>
                  </div>
                  <p>{normalizedCurrentTopic.focus}</p>

                  <div className="study-stats">
                    <div className="metric-card">
                      <span>{isTechnicalTopic ? "Objectives" : "Deep sections"}</span>
                      <strong>{isTechnicalTopic ? normalizedCurrentTopic.objectives.length : normalizedCurrentTopic.deepDive.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Branch topics</span>
                      <strong>{branchTopics.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>{isTechnicalTopic ? "Practice test" : "Media links"}</span>
                      <strong>{isTechnicalTopic ? normalizedCurrentTopic.quiz.length : mediaItems.length}</strong>
                    </div>
                  </div>
                </article>

                <div className="panel-switch">
                  {[
                    ["learn", "Learn"],
                    ["practice", "Practice Test"],
                    ["mock", "Mock Test"]
                  ].map(([value, label]) => (
                    <button
                      className={`mode-button ${activePanel === value ? "active" : ""}`}
                      key={value}
                      onClick={() => setActivePanel(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {activePanel === "learn" ? (
                  <section className="study-grid">
                    <article className="glass-card study-card study-card-wide">
                      <span className="eyebrow">Deep dive</span>
                      <h3>Explanation</h3>
                      <div className="stacked-copy">
                        {normalizedCurrentTopic.deepDive.map((item) => (
                          <p key={item}>{renderLinkedText(item, `deep-${item}`)}</p>
                        ))}
                      </div>
                    </article>

                    {normalizedCurrentTopic.objectives.length ? (
                      <article className="glass-card study-card">
                        <span className="eyebrow">{isTechnicalTopic ? "Objectives" : "Coverage"}</span>
                        <h3>{isTechnicalTopic ? "What to cover" : "What this topic explains"}</h3>
                        <ul className="list-block">
                          {normalizedCurrentTopic.objectives.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ) : null}

                    <article className="glass-card study-card">
                      <span className="eyebrow">Subtopics</span>
                      <h3>Click to explore deeper</h3>
                      <div className="chip-row">
                        {branchTopics.map((item) => (
                          <button className="tag tag-button" key={item} onClick={() => openBranchTopic(item)} type="button">
                            {item}
                          </button>
                        ))}
                      </div>
                    </article>

                    {normalizedCurrentTopic.keyTerms.length ? (
                      <article className="glass-card study-card study-card-wide">
                        <span className="eyebrow">Key terms</span>
                        <h3>{isTechnicalTopic ? "Important language" : "Important names and terms"}</h3>
                        <div className="chip-row">
                          {normalizedCurrentTopic.keyTerms.map((item) => (
                            <button className="tag tag-button" key={item} onClick={() => openBranchTopic(item)} type="button">
                              {item}
                            </button>
                          ))}
                        </div>
                      </article>
                    ) : null}

                    {normalizedCurrentTopic.example ? (
                      <article className="glass-card study-card study-card-wide">
                        <span className="eyebrow">{isTechnicalTopic ? "Example" : "Reference"}</span>
                        <h3>{isTechnicalTopic ? "Reference code" : "Reference note"}</h3>
                        {isTechnicalTopic ? (
                          <pre className="code-block">
                            <code>{normalizedCurrentTopic.example}</code>
                          </pre>
                        ) : (
                          <div className="stacked-copy">
                            <p>{renderLinkedText(normalizedCurrentTopic.example, "example")}</p>
                          </div>
                        )}
                      </article>
                    ) : null}

                    <article className="glass-card study-card study-card-wide">
                      <span className="eyebrow">Applied view</span>
                      <h3>Scenarios and real use cases</h3>
                      <div className="stacked-copy">
                        {normalizedCurrentTopic.scenarios.length ? (
                          normalizedCurrentTopic.scenarios.map((item) => <p key={item}>{renderLinkedText(item, `scenario-${item}`)}</p>)
                        ) : (
                          <p>Use cases and applied scenarios will appear here for this topic.</p>
                        )}
                      </div>
                    </article>

                    {isTechnicalTopic ? (
                      <article className="glass-card study-card">
                        <span className="eyebrow">Diagram</span>
                        <h3>Visual help</h3>
                        <DiagramCard track={activeTrack} />
                      </article>
                    ) : null}

                    <article className="glass-card study-card">
                      <span className="eyebrow">Media</span>
                      <h3>Videos, photos, and podcast links</h3>
                      <MediaShelf items={mediaItems} />
                    </article>
                  </section>
                ) : null}

                {activePanel === "practice" ? (
                  <section className="study-grid">
                    <article className="glass-card study-card study-card-wide">
                      <span className="eyebrow">Practice task</span>
                      <h3>{normalizedCurrentTopic.exercise?.title || "Practice module"}</h3>
                      <p>{normalizedCurrentTopic.exercise?.prompt || "Exercise details will appear here."}</p>
                      {normalizedCurrentTopic.exercise?.checklist?.length ? (
                        <ul className="list-block">
                          {normalizedCurrentTopic.exercise.checklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>

                    <article className="glass-card study-card">
                      <span className="eyebrow">AI prompts</span>
                      <h3>Useful prompt ideas</h3>
                      <div className="chip-row">
                        {prompts.map((item) => (
                          <span className="tag" key={item}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="glass-card study-card">
                      <span className="eyebrow">Topic practice test</span>
                      <h3>Quick MCQ check</h3>
                      {topicCapabilities.quizEnabled && normalizedCurrentTopic.quiz.length ? (
                        <>
                          {normalizedCurrentTopic.quiz.map((question, index) => (
                            <div className="mock-question" key={question.q}>
                              <p>
                                <strong>
                                  {index + 1}. {question.q}
                                </strong>
                              </p>
                              <div className="mock-options">
                                {question.options.map((option, optionIndex) => (
                                  <label className="mock-option" key={option}>
                                    <input
                                      checked={String(topicQuizAnswers[index]) === String(optionIndex)}
                                      name={`topic-${index}`}
                                      onChange={() =>
                                        setTopicQuizAnswers((current) => ({
                                          ...current,
                                          [index]: optionIndex
                                        }))
                                      }
                                      type="radio"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button className="button" onClick={scoreMockTest} type="button">
                            Score topic test
                          </button>
                          {mockResult ? (
                            <p className="muted-line">
                              Score: {mockResult.score}/{mockResult.total} ({mockResult.percent}%)
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p>This topic is better suited to guided reading and examples than an MCQ set right now.</p>
                      )}
                    </article>
                  </section>
                ) : null}

                {activePanel === "mock" ? (
                  <section className="study-grid">
                    <article className="glass-card study-card study-card-wide">
                      <span className="eyebrow">Track mock test</span>
                      <h3>{topicCapabilities.mockEnabled ? "Code writing prompts" : "Reflection prompts"}</h3>
                      {topicCapabilities.mockEnabled ? (
                        activeMockPrompts.length ? (
                          activeMockPrompts.map((prompt) => (
                          <div className="mock-question" key={prompt.id}>
                            <p>
                              <strong>{prompt.title}</strong>
                            </p>
                            <p>{prompt.prompt}</p>
                            <textarea
                              className="dashboard-input dashboard-textarea mock-textarea"
                              onChange={(event) =>
                                setMockAnswers((current) => ({
                                  ...current,
                                  [prompt.id]: event.target.value
                                }))
                              }
                              placeholder="Write your answer here..."
                            value={mockAnswers[prompt.id] || ""}
                          />
                        </div>
                          ))
                        ) : (
                          <div className="mock-question">
                            <p>
                              <strong>Build one applied answer from this topic and explain your reasoning clearly.</strong>
                            </p>
                            <textarea
                              className="dashboard-input dashboard-textarea mock-textarea"
                              onChange={(event) =>
                                setMockAnswers((current) => ({
                                  ...current,
                                  applied: event.target.value
                                }))
                              }
                              placeholder="Write your answer here..."
                              value={mockAnswers.applied || ""}
                            />
                          </div>
                        )
                      ) : (
                        <div className="mock-question">
                          <p>
                            <strong>Write a short summary, explain the idea in your own words, and list one real-world
                            use case.</strong>
                          </p>
                          <textarea
                            className="dashboard-input dashboard-textarea mock-textarea"
                            onChange={(event) =>
                              setMockAnswers((current) => ({
                                ...current,
                                reflection: event.target.value
                              }))
                            }
                            placeholder="Write your reflection here..."
                            value={mockAnswers.reflection || ""}
                          />
                        </div>
                      )}
                    </article>
                  </section>
                ) : null}

                <footer className="study-footer glass-card">
                  <div>
                    <span className="eyebrow">Keep learning</span>
                    <h3>Study the topic, check your understanding, then practice your code.</h3>
                  </div>
                  <p>
                    This workspace is ready for more AI-generated topics, richer media, and custom tracks that users
                    add later from the dashboard.
                  </p>
                </footer>
              </>
            ) : (
              <article className="glass-card study-card">
                <h2>No topics found</h2>
                <p>Try clearing the search or add a draft topic from the left panel.</p>
              </article>
            )}
          </section>
        </section>
      </main>

      {showBackToTop ? (
        <button className="back-to-top-floating" onClick={scrollStageToTop} type="button">
          Top
        </button>
      ) : null}

      <PracticeTerminal
        available={topicCapabilities.terminalEnabled}
        activeFile={activeFile}
        drafts={drafts}
        isAnalyzing={isAnalyzing}
        isOpen={terminalOpen}
        onAnalyze={analyzePractice}
        onDraftChange={updateDraft}
        onFileChange={setActiveFile}
        onToggle={() => setTerminalOpen((current) => !current)}
        review={review}
        track={activeTrack}
      />
    </div>
  );
}
