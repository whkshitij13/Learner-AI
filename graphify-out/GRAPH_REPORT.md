# Graph Report - Learner Dev  (2026-05-03)

## Corpus Check
- 48 files · ~38,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 185 nodes · 239 edges · 19 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `getUserDashboardState()` - 8 edges
2. `logUserQuery()` - 8 edges
3. `renderLessonView()` - 7 edges
4. `isAdminEmail()` - 7 edges
5. `saveUserTrackState()` - 7 edges
6. `getUserRootRef()` - 7 edges
7. `renderFinalTest()` - 6 edges
8. `LearnerDevApp()` - 6 edges
9. `getVideoEmbedUrl()` - 6 edges
10. `getRenderableImageUrl()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `StudyHeader()` --calls--> `isAdminEmail()`  [INFERRED]
  components\study-header.jsx → lib\admin.js
- `Page()` --calls--> `loadLegacyCurriculum()`  [INFERRED]
  app\page.js → lib\curriculum.js
- `GET()` --calls--> `loadLegacyCurriculum()`  [INFERRED]
  app\api\tracks\[track]\route.js → lib\curriculum.js
- `GET()` --calls--> `loadLegacyCurriculum()`  [INFERRED]
  app\api\tracks\[track]\[topicId]\route.js → lib\curriculum.js
- `DashboardPage()` --calls--> `loadLegacyCurriculum()`  [INFERRED]
  app\dashboard\page.js → lib\curriculum.js

## Hyperedges (group relationships)
- **data_flow** — legacy_static_app, legacy_curriculum_data, curriculum_loader, landing_route, dashboard_index_route, dashboard_track_route, track_collection_api, topic_detail_api [EXTRACTED 0.96]
- **auth_flow** — landing_page, firebase_client, firebase_auth_service, dashboard_index_route [EXTRACTED 0.94]
- **persistence_flow** — dashboard_index_route, dashboard_track_route, topic_dashboard, local_browser_storage [EXTRACTED 0.95]
- **review_flow** — practice_terminal, ai_feedback_api, ai_review_lib, gemini_api [INFERRED 0.86]
- **workspace_flow** — learner_dev_app_shell, learner_dev_app, auth_panel, hero_scene, firebase_client, firebase_auth_service, firestore_profiles, local_browser_storage [EXTRACTED 0.93]
- **feature_cluster** — recommendations_lib, media_shelf, diagram_card, landing_page, learner_dev_app [AMBIGUOUS 0.63]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (18): isAdminEmail(), clearUserSearchHistory(), deleteSearchHistoryEntry(), purgeUserData(), removeRecentQueryFromTracks(), updateAdminUserProfile(), buildDefaultState(), getUserDashboardState() (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (14): getTrackPrompts(), isArticleMediaItem(), isPhotoMediaItem(), isPlaceholderDomain(), isPlayablePreviewVideo(), isPodcastMediaItem(), isSafeHttpUrl(), isVideoMediaItem() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.28
Nodes (14): LearnerDevApp(), escapeHtml(), getCompletionPercent(), getCurrentTopic(), getTopicPool(), renderFinalCodingPrompts(), renderFinalMcq(), renderFinalTest() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (15): canRenderVideoItem(), getAudioUrl(), getRenderableImageUrl(), getVideoEmbedUrl(), getVimeoEmbedUrl(), getYouTubeEmbedUrl(), getYouTubeThumbnailUrl(), getYouTubeVideoId() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (6): Page(), DashboardPage(), loadLegacyCurriculum(), GET(), TrackDashboardPage(), GET()

### Community 5 - "Community 5"
Cohesion: 0.36
Nodes (7): fetchGeminiFeedback(), POST(), analyzeApex(), analyzeGenericCode(), analyzeLwc(), buildPracticeReview(), getFallbackTemplate()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (3): getAllTopics(), getInitials(), getTopicPool()

### Community 7 - "Community 7"
Cohesion: 0.6
Nodes (3): fetchGeminiTopic(), getResponseSchema(), POST()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (2): LandingPage(), ensureFirebaseReady()

### Community 9 - "Community 9"
Cohesion: 0.6
Nodes (3): isPhotoMediaItem(), isPodcastMediaItem(), isVideoMediaItem()

### Community 10 - "Community 10"
Cohesion: 0.83
Nodes (3): DashboardHome(), formatTrackLabel(), getRankLabel()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (1): StudyHeader()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (2): ThemeAmbientScene(), useThemePreset()

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): getInitials(), ProfilePage()

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): Legacy Static Learning App, Upgrade and Migration Docs

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Firebase Auth

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Firestore Profiles Store

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Browser Local Storage

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Gemini GenerateContent API

## Knowledge Gaps
- **6 isolated node(s):** `Legacy Static Learning App`, `Firebase Auth`, `Firestore Profiles Store`, `Browser Local Storage`, `Gemini GenerateContent API` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (5 nodes): `landing-page.jsx`, `LandingPage()`, `ensureFirebaseReady()`, `getFirebaseAnalytics()`, `client.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (4 nodes): `getInitials()`, `study-header.jsx`, `StudyHeader()`, `ThemeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `AmbientGlyphs()`, `theme-ambient-scene.jsx`, `ThemeAmbientScene()`, `useThemePreset()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (3 nodes): `getInitials()`, `profile-page.jsx`, `ProfilePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `Legacy Static Learning App`, `Upgrade and Migration Docs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Firebase Auth`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Firestore Profiles Store`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `Browser Local Storage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Gemini GenerateContent API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LearnerDevApp()` connect `Community 2` to `Community 8`, `Community 6`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `isAdminEmail()` connect `Community 0` to `Community 11`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `ensureFirebaseReady()` connect `Community 8` to `Community 2`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getUserDashboardState()` (e.g. with `getUserDashboardRef()` and `getUserRootRef()`) actually correct?**
  _`getUserDashboardState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `logUserQuery()` (e.g. with `getUserRootRef()` and `isAdminEmail()`) actually correct?**
  _`logUserQuery()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `isAdminEmail()` (e.g. with `StudyHeader()` and `getUserDashboardState()`) actually correct?**
  _`isAdminEmail()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `saveUserTrackState()` (e.g. with `getUserDashboardRef()` and `getUserRootRef()`) actually correct?**
  _`saveUserTrackState()` has 3 INFERRED edges - model-reasoned connections that need verification._