"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import DiagramCard from "@/components/diagram-card";
import MediaShelf from "@/components/media-shelf";
import PracticeTerminal from "@/components/practice-terminal";
import StudyHeader from "@/components/study-header";
import ThemeAmbientScene from "@/components/theme-ambient-scene";
import { auth, db } from "@/lib/firebase/client";
import { getUserDashboardState, logUserQuery, saveUserTrackState } from "@/lib/dashboard-store";
import { getSuggestionsForInterests, INTEREST_OPTIONS, recommendThemePreset } from "@/lib/personalization";
import { ensureUserProfile, saveUserProfilePreferences } from "@/lib/profile-store";
import { MEDIA_LIBRARY, PROMPT_LIBRARY } from "@/lib/recommendations";

const TRACK_CONFIG = {
  workspace: {
    label: "Learning Dashboard",
    intro: "Search any topic, generate deep study cards, and unlock practice only when the topic needs it."
  },
  lwc: {
    label: "Learning Dashboard",
    intro: "Search a topic, generate deep study cards, and unlock practice only when the topic needs it."
  },
  apex: {
    label: "Learning Dashboard",
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

export function normalizeTopic(topic, activeTrack) {
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
      : Boolean(looksTechnical || topic.exercise?.starter);
  const assessmentLevels = topic.assessments || {
    beginner: { level: "beginner", quiz: topic.quiz || [], mockPrompts: topic.mockPrompts || [] },
    intermediate: { level: "intermediate", quiz: [], mockPrompts: [] },
    advanced: { level: "advanced", quiz: [], mockPrompts: [] }
  };

  return {
    ...topic,
    topicKind: topic.topicKind || (isTechnical ? "technical" : "general"),
    objectives: topic.objectives || [],
    deepDive: topic.deepDive || [],
    longRead: topic.longRead || topic.deepDive || [],
    subtopics: topic.subtopics || [],
    branchTopics: topic.branchTopics?.length ? topic.branchTopics : topic.subtopics || [],
    subtopicCards:
      topic.subtopicCards?.length
        ? topic.subtopicCards
        : (topic.branchTopics || topic.subtopics || []).map((item, index) => ({
            id: `${slugifyTopicTitle(title)}-${index}`,
            title: item,
            summary: `Study ${item} as part of ${title}.`,
            goal: "Understand the core idea and move deeper when ready."
          })),
    keyTerms: topic.keyTerms || [],
    quiz: topic.quiz || [],
    mockPrompts: topic.mockPrompts || [],
    assessments: assessmentLevels,
    scenarios: topic.scenarios || [],
    media: topic.media || [],
    capabilities: {
      quizEnabled:
        typeof topic.capabilities?.quizEnabled === "boolean"
          ? topic.capabilities.quizEnabled
          : Boolean(assessmentLevels.beginner?.quiz?.length || assessmentLevels.intermediate?.quiz?.length || assessmentLevels.advanced?.quiz?.length),
      terminalEnabled:
        typeof topic.capabilities?.terminalEnabled === "boolean"
          ? topic.capabilities.terminalEnabled
          : Boolean(isTechnical),
      mockEnabled:
        typeof topic.capabilities?.mockEnabled === "boolean"
          ? topic.capabilities.mockEnabled
          : Boolean(
              assessmentLevels.beginner?.mockPrompts?.length ||
                assessmentLevels.intermediate?.mockPrompts?.length ||
                assessmentLevels.advanced?.mockPrompts?.length
            )
    }
  };
}

export function slugifyTopicTitle(value) {
  return String(value || "topic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPlayablePreviewVideo(value) {
  return /^https?:\/\/.+\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(String(value || "").trim());
}

function isVideoMediaItem(item) {
  const type = String(item?.type || "").toLowerCase();
  const href = String(item?.href || "").toLowerCase();

  return (
    type.includes("video") ||
    isPlayablePreviewVideo(item?.previewVideo) ||
    href.includes("youtube.com/watch") ||
    href.includes("youtu.be/") ||
    href.includes("vimeo.com/")
  );
}

function isPhotoMediaItem(item) {
  const type = String(item?.type || "").toLowerCase();

  return Boolean(item?.image && !isVideoMediaItem(item) && !type.includes("podcast") && !type.includes("audio"));
}

export default function TopicDashboard({ curriculum, activeTrack }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [expandedSidebarTopicId, setExpandedSidebarTopicId] = useState("");
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
  const [assessmentLevel, setAssessmentLevel] = useState("beginner");
  const [mockResult, setMockResult] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const hasLoadedTrackState = useRef(false);
  const shouldAutoScrollToTopicRef = useRef(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [recentThemeSignals, setRecentThemeSignals] = useState([]);
  const [profileState, setProfileState] = useState(null);
  const [progressByTopic, setProgressByTopic] = useState({});
  const [jumpRailOpen, setJumpRailOpen] = useState(false);

  const trackTopics = curriculum[activeTrack] || [];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("learner-dev-theme") || "dark";
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
    setProgressByTopic({});
    setExpandedSidebarTopicId("");
    setAssessmentLevel("beginner");
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
      const nextThemeSignals = Object.values(dashboardState.tracks || {})
        .flatMap((item) => item?.recentQueries || [])
        .map((item) => item.text)
        .filter(Boolean)
        .slice(0, 12);

      setCustomTopics((trackState?.topics || []).map((topic) => normalizeTopic(topic, activeTrack)));
      setMockAnswers(trackState?.mockAnswers || {});
      setProgressByTopic(trackState?.progressByTopic || {});
      setRecentThemeSignals(nextThemeSignals);
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
      setProfileState(nextProfile);
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
        mockAnswers,
        progressByTopic
      });
    }

    persistTrackState();
  }, [activeTrack, customTopics, mockAnswers, progressByTopic, user]);

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

  useEffect(() => {
    async function syncRecommendedTheme() {
      if (!user || !db || !profileState) {
        return;
      }

      const latestProfile = await ensureUserProfile(db, user);

      if (latestProfile.themePreferenceSource === "manual") {
        if (latestProfile.themePreset !== profileState.themePreset) {
          setProfileState(latestProfile);
          document.body.dataset.themePreset = latestProfile.themePreset || "aurora-notes";
        }
        return;
      }

      const recommendedPreset = recommendThemePreset({
        interests: latestProfile.interests || selectedInterests,
        recentQueries: recentThemeSignals,
        focus: latestProfile.focus,
        headline: latestProfile.headline,
        bio: latestProfile.bio
      });

      if (!recommendedPreset || recommendedPreset === latestProfile.themePreset) {
        return;
      }

      const nextProfile = await saveUserProfilePreferences(db, user, {
        themePreset: recommendedPreset,
        themePreferenceSource: "auto"
      });

      setProfileState(nextProfile);
      document.body.dataset.themePreset = nextProfile.themePreset || recommendedPreset;
    }

    syncRecommendedTheme();
  }, [db, profileState, recentThemeSignals, selectedInterests, user]);

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
    if (currentTopic?.id) {
      setExpandedSidebarTopicId(currentTopic.id);
    }
  }, [currentTopic?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentConfig = TRACK_CONFIG[activeTrack] || TRACK_CONFIG.workspace;
  const fallbackMediaItems = MEDIA_LIBRARY[activeTrack] || [];
  const prompts = [...PROMPT_LIBRARY.beginner, ...PROMPT_LIBRARY["project-builder"]].slice(0, 4);
  const mockPrompts = getTrackPrompts(curriculum.finalTest, activeTrack);
  const normalizedCurrentTopic = normalizeTopic(currentTopic, activeTrack);
  const mediaItems = normalizedCurrentTopic?.media?.length ? normalizedCurrentTopic.media : fallbackMediaItems;
  const videoMediaItems = mediaItems.filter((item) => isVideoMediaItem(item));
  const photoMediaItems = mediaItems.filter((item) => isPhotoMediaItem(item));
  const topicCapabilities = normalizedCurrentTopic?.capabilities || {
    quizEnabled: false,
    terminalEnabled: false,
    mockEnabled: false
  };
  const isTechnicalTopic = Boolean(topicCapabilities.terminalEnabled);
  const branchTopics = normalizedCurrentTopic?.branchTopics?.length
    ? normalizedCurrentTopic.branchTopics
    : normalizedCurrentTopic?.subtopics || [];
  const subtopicCards = normalizedCurrentTopic?.subtopicCards || [];
  const activeAssessment = normalizedCurrentTopic?.assessments?.[assessmentLevel] || { quiz: [], mockPrompts: [] };
  const activeMockPrompts = activeAssessment.mockPrompts?.length
    ? activeAssessment.mockPrompts
    : normalizedCurrentTopic?.mockPrompts?.length
      ? normalizedCurrentTopic.mockPrompts
      : mockPrompts;
  const activeQuizQuestions = activeAssessment.quiz?.length ? activeAssessment.quiz : normalizedCurrentTopic?.quiz || [];
  const currentTopicProgress = progressByTopic[normalizedCurrentTopic?.id] || {
    completedSubtopics: [],
    milestoneClaimed: false,
    certificateUnlocked: false
  };
  const completionPercent = subtopicCards.length
    ? Math.round((currentTopicProgress.completedSubtopics.length / subtopicCards.length) * 100)
    : 0;
  const interestSuggestions = getSuggestionsForInterests(selectedInterests, SUGGESTED_PROMPTS);
  const visiblePanels = ["learn"];

  if (topicCapabilities.quizEnabled) {
    visiblePanels.push("practice");
  }

  if (topicCapabilities.mockEnabled) {
    visiblePanels.push("mock");
  }

  const quickJumpItems = [
    { id: "subtopics", label: "Subtopics", visible: subtopicCards.length > 0 },
    { id: "key-terms", label: "Key terms", visible: normalizedCurrentTopic?.keyTerms?.length > 0 },
    { id: "videos", label: "Videos", visible: videoMediaItems.length > 0 },
    { id: "photos", label: "Photos", visible: photoMediaItems.length > 0 }
  ].filter((item) => item.visible);

  useEffect(() => {
    if (!visiblePanels.includes(activePanel)) {
      setActivePanel("learn");
    }
  }, [activePanel, visiblePanels]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pendingSearch = window.sessionStorage.getItem("learner-pending-topic-search");

    if (!pendingSearch) {
      return;
    }

    try {
      const parsed = JSON.parse(pendingSearch);

      if (parsed?.track && parsed.track !== activeTrack) {
        return;
      }

      if (parsed?.query) {
        window.sessionStorage.removeItem("learner-pending-topic-search");
        setTopicPrompt(parsed.query);
        shouldAutoScrollToTopicRef.current = true;
        generateTopic(parsed.query);
      }
    } catch {
      window.sessionStorage.removeItem("learner-pending-topic-search");
    }
  }, [activeTrack]);

  useEffect(() => {
    if (!shouldAutoScrollToTopicRef.current || isGeneratingTopic || !currentTopic?.id) {
      return;
    }

    const anchor = document.getElementById("topicContentAnchor");

    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    shouldAutoScrollToTopicRef.current = false;
  }, [currentTopic?.id, isGeneratingTopic]);

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
    setAssessmentLevel("beginner");
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
    const questions = activeQuizQuestions;
    const score = questions.reduce(
      (total, question, index) => (String(topicQuizAnswers[index]) === String(question.answer) ? total + 1 : total),
      0
    );

    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    setMockResult({ score, total: questions.length, percent });

    if (normalizedCurrentTopic?.id && percent >= 70) {
      setProgressByTopic((current) => ({
        ...current,
        [normalizedCurrentTopic.id]: {
          ...(current[normalizedCurrentTopic.id] || {}),
          completedSubtopics: current[normalizedCurrentTopic.id]?.completedSubtopics || [],
          milestoneClaimed: true,
          certificateUnlocked:
            (current[normalizedCurrentTopic.id]?.completedSubtopics || []).length >= Math.max(1, subtopicCards.length - 1)
        }
      }));
    }
  }

  function toggleSubtopicCompletion(subtopicId) {
    if (!normalizedCurrentTopic?.id) {
      return;
    }

    setProgressByTopic((current) => {
      const topicProgress = current[normalizedCurrentTopic.id] || {
        completedSubtopics: [],
        milestoneClaimed: false,
        certificateUnlocked: false
      };
      const completedSubtopics = topicProgress.completedSubtopics.includes(subtopicId)
        ? topicProgress.completedSubtopics.filter((item) => item !== subtopicId)
        : [...topicProgress.completedSubtopics, subtopicId];

      return {
        ...current,
        [normalizedCurrentTopic.id]: {
          ...topicProgress,
          completedSubtopics,
          certificateUnlocked:
            topicProgress.milestoneClaimed && completedSubtopics.length >= Math.max(1, subtopicCards.length)
        }
      };
    });
  }

  async function handleLogout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    router.replace("/");
  }

  function scrollStageToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setJumpRailOpen(false);
    }
  }

  function handleSidebarTopicSelect(topicId) {
    setSelectedTopicId(topicId);
    setExpandedSidebarTopicId((current) => (current === topicId ? "" : topicId));
  }

  function deleteSavedTopic(event, topicId) {
    event.stopPropagation();

    const remainingCustomTopics = customTopics.filter((topic) => topic.id !== topicId);
    setCustomTopics(remainingCustomTopics);
    setProgressByTopic((current) => {
      const nextProgress = { ...current };
      delete nextProgress[topicId];
      return nextProgress;
    });

    if (selectedTopicId === topicId) {
      const nextTopic = trackTopics[0] || remainingCustomTopics[0] || null;
      setSelectedTopicId(nextTopic?.id || "");
      setExpandedSidebarTopicId(nextTopic?.id || "");
      setMockResult(null);
      setTopicQuizAnswers({});
      setActivePanel("learn");
      return;
    }

    if (expandedSidebarTopicId === topicId) {
      setExpandedSidebarTopicId(selectedTopicId || "");
    }
  }

  function openBranchTopic(branch) {
    if (!branch) {
      return;
    }

    const scopedQuery = normalizedCurrentTopic?.title ? `${normalizedCurrentTopic.title} ${branch}` : branch;
    setTopicPrompt(scopedQuery);
    shouldAutoScrollToTopicRef.current = true;
    generateTopic(scopedQuery);
  }

  function openTopicReader() {
    if (!normalizedCurrentTopic?.id) {
      return;
    }

    const readerPath =
      activeTrack === "workspace"
        ? `/dashboard/read/${encodeURIComponent(normalizedCurrentTopic.id)}`
        : `/dashboard/${activeTrack}/read/${encodeURIComponent(normalizedCurrentTopic.id)}`;

    router.push(readerPath);
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
      shouldAutoScrollToTopicRef.current = true;
      setActivePanel("learn");
      setAssessmentLevel("beginner");
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
      const themePreset = recommendThemePreset({
        interests: selectedInterests,
        recentQueries: recentThemeSignals
      });
      const nextProfile = await saveUserProfilePreferences(db, user, {
        interests: selectedInterests,
        themePreset,
        themePreferenceSource: "auto",
        onboardingCompleted: true
      });

      setProfileState(nextProfile);
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
    <div className={`dashboard-shell ${sidebarCollapsed ? "dashboard-sidebar-collapsed" : "dashboard-sidebar-open"}`}>
      <ThemeAmbientScene />
      {showOnboarding ? (
        <div className="profile-modal-backdrop" role="presentation">
          <section className="profile-modal glass-card onboarding-modal">
            <div className="section-heading compact-heading">
              <span className="eyebrow">Welcome</span>
              <h2>Pick at least three interests so we can shape your first study space.</h2>
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
        {/* <section className="dashboard-hero glass-card">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>{currentConfig.label}</h1>
            <p>
              Search a topic, open the guided learning path on the left, and keep moving through reading,
              subtopics, assessments, and milestones from one clean workspace.
            </p>
          </div>
          <div className="dashboard-badges">
            <span>{activeTrack === "workspace" ? "Workspace" : activeTrack.toUpperCase()}</span>
            <span>{trackTopics.length + customTopics.length} topics ready</span>
            <span>{completionPercent}% progress</span>
          </div>
        </section> */}

        <section className={`study-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <div className="study-sidebar-sticky">
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

              <div className="study-sidebar-body">
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
                      {visibleTopics.map((topic) => {
                        const normalizedSidebarTopic = normalizeTopic(topic, activeTrack);
                        const sidebarSubtopics = normalizedSidebarTopic?.subtopicCards || [];
                        const sidebarTopicProgress = progressByTopic[topic.id] || {
                          completedSubtopics: []
                        };
                        const canDeleteTopic = customTopics.some((item) => item.id === topic.id);

                        return (
                          <article
                            className={`sidebar-topic-card ${topic.id === currentTopic?.id ? "active" : ""} ${
                              expandedSidebarTopicId === topic.id ? "expanded" : ""
                            }`}
                            key={topic.id}
                          >
                            <div className="sidebar-topic-row">
                            <button
                              aria-expanded={expandedSidebarTopicId === topic.id}
                              className={`study-topic-button sidebar-topic-toggle ${topic.id === currentTopic?.id ? "active" : ""}`}
                              onClick={() => handleSidebarTopicSelect(topic.id)}
                              type="button"
                            >
                              <span className="sidebar-topic-copy">
                                <strong>{topic.title}</strong>
                                <span>{topic.level}</span>
                              </span>
                              <span
                                aria-hidden="true"
                                className={`sidebar-topic-chevron ${expandedSidebarTopicId === topic.id ? "open" : ""}`}
                              >
                                ▾
                              </span>
                            </button>
                              {canDeleteTopic ? (
                                <button
                                  aria-label={`Delete ${topic.title}`}
                                  className="sidebar-topic-delete"
                                  onClick={(event) => deleteSavedTopic(event, topic.id)}
                                  title="Delete from history"
                                  type="button"
                                >
                                  x
                                </button>
                              ) : null}
                            </div>

                            {expandedSidebarTopicId === topic.id ? (
                              <div className="sidebar-topic-accordion">
                                {sidebarSubtopics.length ? (
                                  <div className="sidebar-subtopic-list">
                                    {sidebarSubtopics.map((item) => (
                                      <article className="sidebar-subtopic-card" key={item.id}>
                                        <button className="sidebar-subtopic-button" onClick={() => openBranchTopic(item.title)} type="button">
                                          <strong>{item.title}</strong>
                                          <span>{item.summary}</span>
                                        </button>
                                        <button
                                          className={`sidebar-subtopic-check ${
                                            sidebarTopicProgress.completedSubtopics.includes(item.id) ? "active" : ""
                                          }`}
                                          onClick={() => toggleSubtopicCompletion(item.id)}
                                          type="button"
                                        >
                                          {sidebarTopicProgress.completedSubtopics.includes(item.id) ? "Done" : "Mark done"}
                                        </button>
                                      </article>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="muted-line sidebar-empty-line">No subtopic cards yet for this topic.</p>
                                )}
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
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
              </div>
            </aside>
          </div>

          <section className="study-stage" id="studyStageScroll">
            <section className="composer-grid">
              <article className="glass-card ai-composer">
                <div className="ai-composer-copy">
                  <span className="eyebrow">AI topic builder</span>
                  <h2>Search any topic and turn it into a guided learning path.</h2>
                  <p>
                    The AI decides whether a topic should stay reading-first or include assessment and practice layers,
                    so the dashboard stays relevant to what the learner actually searched.
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

              <article className="glass-card quick-draft-card">
                <div className="topic-card-top">
                  <div>
                    <span className="eyebrow">Quick draft</span>
                    <h3>Add your own topic</h3>
                  </div>
                  <span className="topic-kind">Manual</span>
                </div>
                <p>Create a custom topic draft here instead of mixing creation controls into the left navigation rail.</p>
                <p>Use this when you already know the structure you want and just need it saved into the dashboard.</p>
                <form className="topic-form" onSubmit={addTopic}>
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
              </article>
            </section>

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
                <article className="glass-card topic-overview-card" id="topicContentAnchor">
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
                      <span>{isTechnicalTopic ? "Objectives" : "Reading depth"}</span>
                      <strong>{isTechnicalTopic ? normalizedCurrentTopic.objectives.length : normalizedCurrentTopic.longRead.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Learning path</span>
                      <strong>{subtopicCards.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Progress</span>
                      <strong>{completionPercent}%</strong>
                    </div>
                  </div>
                </article>

                <article className="glass-card milestone-card">
                  <div className="topic-card-top">
                    <div>
                      <span className="eyebrow">Milestones</span>
                      <h3>Track your learning journey</h3>
                    </div>
                    <span className="topic-kind">{currentTopicProgress.certificateUnlocked ? "Certificate ready" : "In progress"}</span>
                  </div>
                  <p>
                    Complete the learning path cards and clear at least one assessment level to unlock a digital certificate for this topic.
                  </p>
                  <div className="milestone-progress-bar" aria-hidden="true">
                    <span style={{ width: `${completionPercent}%` }} />
                  </div>
                  <div className="dashboard-badges">
                    <span>{currentTopicProgress.completedSubtopics.length} subtopics done</span>
                    <span>{currentTopicProgress.milestoneClaimed ? "Assessment cleared" : "Assessment pending"}</span>
                    <span>{currentTopicProgress.certificateUnlocked ? "Certificate unlocked" : "Keep going"}</span>
                  </div>
                </article>

                <div className="panel-switch">
                  {visiblePanels.map((value) => (
                    <button
                      className={`mode-button ${activePanel === value ? "active" : ""}`}
                      key={value}
                      onClick={() => setActivePanel(value)}
                      type="button"
                    >
                      {value === "learn" ? "Learn" : value === "practice" ? "Practice Test" : "Mock Test"}
                    </button>
                  ))}
                </div>

                {activePanel === "learn" ? (
                  <section className="study-grid">
                    <article className="glass-card study-card study-card-wide">
                      <div className="topic-card-top">
                        <div>
                          <span className="eyebrow">Deep dive</span>
                          <h3>Explanation</h3>
                        </div>
                        {normalizedCurrentTopic.longRead.length ? (
                          <button className="read-more-button" onClick={openTopicReader} type="button">
                            Read more
                          </button>
                        ) : null}
                      </div>
                      <div className="stacked-copy">
                        {normalizedCurrentTopic.deepDive.map((item) => (
                          <p key={item}>{renderLinkedText(item, `deep-${item}`)}</p>
                        ))}
                      </div>
                      {branchTopics.length ? (
                        <div className="explanation-search-row">
                          {branchTopics.slice(0, 8).map((item) => (
                            <button className="tag tag-button key-term-glow searchable-glow-link" key={item} onClick={() => openBranchTopic(item)} type="button">
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>

                    {normalizedCurrentTopic.objectives.length || normalizedCurrentTopic.keyTerms.length ? (
                      <article
                        className={`glass-card study-card study-card-wide coverage-keyterms-card ${
                          normalizedCurrentTopic.objectives.length && normalizedCurrentTopic.keyTerms.length ? "" : "single-panel"
                        }`}
                        id="key-terms"
                      >
                        {normalizedCurrentTopic.objectives.length ? (
                          <section className="coverage-keyterms-panel">
                            <span className="eyebrow">{isTechnicalTopic ? "Objectives" : "Coverage"}</span>
                            <h3>{isTechnicalTopic ? "What to cover" : "What this topic explains"}</h3>
                            <ul className="list-block compact-list-block">
                              {normalizedCurrentTopic.objectives.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </section>
                        ) : null}

                        {normalizedCurrentTopic.keyTerms.length ? (
                          <section className="coverage-keyterms-panel">
                            <span className="eyebrow">Key terms</span>
                            <h3>{isTechnicalTopic ? "Important language" : "Important names and terms"}</h3>
                            <div className="chip-row">
                              {normalizedCurrentTopic.keyTerms.map((item) => (
                                <button className="tag tag-button key-term-glow searchable-glow-link" key={item} onClick={() => openBranchTopic(item)} type="button">
                                  {item}
                                </button>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </article>
                    ) : null}

                    <article className="glass-card study-card study-card-wide" id="subtopics">
                      <span className="eyebrow">Subtopics</span>
                      <h3>Walk the topic step by step</h3>
                      <div className="subtopic-card-grid">
                        {subtopicCards.map((item) => (
                          <article className="subtopic-learning-card" key={item.id}>
                            <strong>{item.title}</strong>
                            <p>{item.summary}</p>
                            <small>{item.goal}</small>
                            <div className="header-actions-compact">
                              <button className="button button-secondary" onClick={() => openBranchTopic(item.title)} type="button">
                                Open
                              </button>
                              <button className="ghost-btn" onClick={() => toggleSubtopicCompletion(item.id)} type="button">
                                {currentTopicProgress.completedSubtopics.includes(item.id) ? "Completed" : "Mark complete"}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </article>

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
                      <article className="glass-card study-card study-card-wide">
                        <span className="eyebrow">Diagram</span>
                        <h3>Visual help</h3>
                        <DiagramCard track={activeTrack} />
                      </article>
                    ) : null}

                    {videoMediaItems.length ? (
                      <article className="glass-card study-card study-card-wide media-section-card" id="videos">
                        <span className="eyebrow">Videos</span>
                        <h3>Watch and preview resources</h3>
                        <MediaShelf items={videoMediaItems} mode="video" />
                      </article>
                    ) : null}

                    {photoMediaItems.length ? (
                      <article className="glass-card study-card study-card-wide media-section-card" id="photos">
                        <span className="eyebrow">Photos</span>
                        <h3>Visual references</h3>
                        <MediaShelf items={photoMediaItems} mode="photo" />
                      </article>
                    ) : null}

                    {!videoMediaItems.length && !photoMediaItems.length && mediaItems.length ? (
                      <article className="glass-card study-card study-card-wide media-section-card">
                        <span className="eyebrow">Media</span>
                        <h3>Resources</h3>
                        <MediaShelf items={mediaItems} />
                      </article>
                    ) : null}
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
                      <h3>Level-based MCQ check</h3>
                      <div className="difficulty-switch">
                        {["beginner", "intermediate", "advanced"].map((value) => (
                          <button
                            className={`mode-button ${assessmentLevel === value ? "active" : ""}`}
                            key={value}
                            onClick={() => setAssessmentLevel(value)}
                            type="button"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {topicCapabilities.quizEnabled && activeQuizQuestions.length ? (
                        <>
                          {activeQuizQuestions.map((question, index) => (
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
                        <p>This topic does not need a practice test at the {assessmentLevel} level right now.</p>
                      )}
                    </article>
                  </section>
                ) : null}

                {activePanel === "mock" ? (
                  <section className="study-grid">
                    <article className="glass-card study-card study-card-wide">
                      <span className="eyebrow">Track mock test</span>
                      <h3>{topicCapabilities.mockEnabled ? "Level-based applied prompts" : "Reflection prompts"}</h3>
                      {topicCapabilities.mockEnabled ? (
                        <div className="difficulty-switch">
                          {["beginner", "intermediate", "advanced"].map((value) => (
                            <button
                              className={`mode-button ${assessmentLevel === value ? "active" : ""}`}
                              key={value}
                              onClick={() => setAssessmentLevel(value)}
                              type="button"
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      ) : null}
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
                <p>Try clearing the search or create a topic from the quick draft card in the main workspace.</p>
              </article>
            )}
          </section>
        </section>
      </main>

      {showBackToTop ? (
        <button aria-label="Back to top" className="back-to-top-floating" onClick={scrollStageToTop} type="button">
          <span aria-hidden="true">↑</span>
        </button>
      ) : null}

      {activePanel === "learn" && quickJumpItems.length ? (
        <div className={`section-jump-rail ${jumpRailOpen ? "open" : ""}`} role="navigation" aria-label="Topic sections">
          <button
            aria-expanded={jumpRailOpen}
            aria-label={jumpRailOpen ? "Close section shortcuts" : "Open section shortcuts"}
            className="section-jump-toggle"
            onClick={() => setJumpRailOpen((current) => !current)}
            type="button"
          >
            <span className="section-jump-toggle-icon" aria-hidden="true">
              ✦
            </span>
          </button>
          <div className="section-jump-list">
            {quickJumpItems.map((item) => (
              <button className="section-jump-button" key={item.id} onClick={() => scrollToSection(item.id)} type="button">
                {item.label}
              </button>
            ))}
          </div>
        </div>
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
