import { useMemo, useState } from "react";

function getYouTubeEmbedUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = new URL(rawValue);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const videoId =
        url.searchParams.get("v") ||
        (pathParts[0] === "shorts" ? pathParts[1] : "") ||
        (pathParts[0] === "embed" ? pathParts[1] : "");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
    }

    if (hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function getYouTubeVideoId(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = new URL(rawValue);
    const hostname = url.hostname.replace(/^www\./, "");
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      return url.searchParams.get("v") || (pathParts[0] === "shorts" ? pathParts[1] : "") || (pathParts[0] === "embed" ? pathParts[1] : "");
    }

    if (hostname === "youtu.be") {
      return pathParts[0] || "";
    }
  } catch {
    return "";
  }

  return "";
}

function getYouTubeThumbnailUrl(value) {
  const videoId = getYouTubeVideoId(value);

  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
}

function getVimeoEmbedUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = new URL(rawValue);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function getVideoEmbedUrl(item) {
  return getYouTubeEmbedUrl(item?.href) || getVimeoEmbedUrl(item?.href);
}

function canRenderVideoItem(item) {
  return Boolean(item?.previewVideo || getVideoEmbedUrl(item));
}

function isVideoItem(item, mode) {
  return mode === "video" || /video/i.test(String(item?.type || "")) || Boolean(item?.previewVideo || getVideoEmbedUrl(item));
}

function isAudioItem(item) {
  const type = String(item?.type || "").toLowerCase();
  const href = String(item?.href || "").trim();

  return type.includes("podcast") || type.includes("audio") || /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href);
}

function isDirectImageUrl(value) {
  return /^https?:\/\/.+\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(String(value || "").trim());
}

function isArticleItem(item) {
  const type = String(item?.type || "").toLowerCase();

  return type.includes("article") || type.includes("guide") || type.includes("reading");
}

function isDiagramItem(item, mode) {
  const type = String(item?.type || "").toLowerCase();

  return mode === "diagram" || type.includes("diagram") || type.includes("map") || type.includes("chart") || type.includes("infographic");
}

function getAudioUrl(item) {
  const href = String(item?.audio || item?.href || "").trim();

  return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href) ? href : "";
}

function getRenderableImageUrl(item, isVideo) {
  if (item?.image) {
    return item.image;
  }

  if (isVideo) {
    return getYouTubeThumbnailUrl(item?.href);
  }

  if (isDirectImageUrl(item?.href)) {
    return item.href;
  }

  return "";
}

function MediaThumb({ item, isVideo }) {
  const [imageFailed, setImageFailed] = useState(false);
  const renderableImage = getRenderableImageUrl(item, isVideo);
  const canRenderImage = renderableImage && !imageFailed;

  if (item.previewVideo) {
    return (
      <div className="media-thumb-wrap media-thumb-wrap-video">
        <video
          className="media-thumb media-video-thumb"
          loop
          muted
          playsInline
          poster={canRenderImage ? renderableImage : ""}
          preload="metadata"
          src={item.previewVideo}
        />
        <span className="media-play-indicator">Play here</span>
      </div>
    );
  }

  if (canRenderImage) {
    return (
      <div className={`media-thumb-wrap ${isVideo ? "media-thumb-wrap-video" : ""}`}>
        <img alt={item.title} className="media-thumb" onError={() => setImageFailed(true)} src={renderableImage} />
        {isVideo ? <span className="media-play-indicator">Open player</span> : null}
      </div>
    );
  }

  if (isAudioItem(item)) {
    return (
      <div className="media-thumb-wrap media-thumb-fallback media-thumb-audio">
        <span className="media-fallback-icon">Listen</span>
      </div>
    );
  }

  if (isDiagramItem(item)) {
    return (
      <div className="media-thumb-wrap media-thumb-fallback media-thumb-diagram">
        <span className="media-fallback-icon">Diagram</span>
      </div>
    );
  }

  if (isArticleItem(item)) {
    return (
      <div className="media-thumb-wrap media-thumb-fallback media-thumb-article">
        <span className="media-fallback-icon">Read</span>
      </div>
    );
  }

  return (
    <div className={`media-thumb-wrap media-thumb-fallback ${isVideo ? "media-thumb-wrap-video" : ""}`}>
      <span className="media-fallback-icon">{isVideo ? "Play" : "View"}</span>
    </div>
  );
}

function MediaViewerImage({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const renderableImage = getRenderableImageUrl(item, false);

  if (!renderableImage || imageFailed) {
    return <MediaThumb isVideo={false} item={item} />;
  }

  return <img alt={item.title} className="media-viewer-image" onError={() => setImageFailed(true)} src={renderableImage} />;
}

export default function MediaShelf({ items, mode = "mixed" }) {
  const [activeItem, setActiveItem] = useState(null);
  const shelfClassName = useMemo(
    () =>
      `topic-media-grid ${mode === "video" ? "topic-media-grid-video" : ""} ${mode === "photo" ? "topic-media-grid-photo" : ""} ${
        mode === "article" ? "topic-media-grid-article" : ""
      } ${mode === "podcast" ? "topic-media-grid-podcast" : ""} ${mode === "diagram" ? "topic-media-grid-diagram" : ""}`.trim(),
    [mode]
  );

  function playPreview(event) {
    const video = event.currentTarget.querySelector("video");

    if (video) {
      video.play().catch(() => {});
    }
  }

  function stopPreview(event) {
    const video = event.currentTarget.querySelector("video");

    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }

  function openItem(item) {
    const itemIsAudio = isAudioItem(item);
    const itemIsArticle = isArticleItem(item) || mode === "article";

    if (isVideoItem(item, mode)) {
      if (!canRenderVideoItem(item) && item.href) {
        window.open(item.href, "_blank", "noopener,noreferrer");
        return;
      }

      setActiveItem(item);
      return;
    }

    if (mode === "photo" || mode === "diagram") {
      if (item.image) {
        setActiveItem(item);
        return;
      }

      if (item.href) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (itemIsAudio) {
      if (getAudioUrl(item)) {
        setActiveItem(item);
        return;
      }

      if (item.href) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (itemIsArticle && item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <>
      <section className={shelfClassName}>
        {items.map((item) => {
          const itemIsVideo = isVideoItem(item, mode);
          const itemIsAudio = isAudioItem(item);

          return (
            <button
              key={item.title}
              className={`media-card ${itemIsVideo ? "media-card-video" : ""} ${itemIsAudio ? "media-card-audio" : ""}`}
              onBlur={stopPreview}
              onClick={() => openItem(item)}
              onFocus={playPreview}
              onMouseEnter={playPreview}
              onMouseLeave={stopPreview}
              type="button"
            >
              <MediaThumb isVideo={itemIsVideo} item={item} />
              <span className="pill">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="media-link">
                {itemIsVideo
                  ? canRenderVideoItem(item)
                    ? "Open player"
                    : "Open video source"
                  : itemIsAudio
                    ? "Open podcast"
                    : isDiagramItem(item, mode)
                      ? "Open diagram"
                      : isArticleItem(item) || mode === "article"
                      ? "Open article"
                      : mode === "photo"
                        ? "Open photo"
                        : "Open resource"}
              </span>
            </button>
          );
        })}
      </section>

      {activeItem ? (
        <div className="media-viewer-backdrop" onClick={() => setActiveItem(null)} role="presentation">
          <section className="media-viewer-modal glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="topic-card-top">
              <div>
                <span className="eyebrow">{activeItem.type}</span>
                <h3>{activeItem.title}</h3>
              </div>
              <button className="button button-secondary" onClick={() => setActiveItem(null)} type="button">
                Close
              </button>
            </div>

            {isVideoItem(activeItem, mode) && activeItem.previewVideo ? (
              <video
                autoPlay
                className="media-viewer-player"
                controls
                playsInline
                poster={activeItem.image || ""}
                src={activeItem.previewVideo}
              />
            ) : isVideoItem(activeItem, mode) && getVideoEmbedUrl(activeItem) ? (
              <iframe
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="media-viewer-player media-viewer-embed"
                src={getVideoEmbedUrl(activeItem)}
                title={activeItem.title}
              />
            ) : isVideoItem(activeItem, mode) ? (
              <div className="media-viewer-fallback">
                <MediaThumb isVideo item={activeItem} />
                {activeItem.href ? (
                  <button className="button" onClick={() => window.open(activeItem.href, "_blank", "noopener,noreferrer")} type="button">
                    Open source
                  </button>
                ) : null}
              </div>
            ) : isAudioItem(activeItem) ? (
              <div className="media-viewer-fallback">
                <MediaThumb isVideo={false} item={activeItem} />
                {getAudioUrl(activeItem) ? <audio className="media-viewer-audio" controls src={getAudioUrl(activeItem)} /> : null}
                {activeItem.href ? (
                  <button className="button" onClick={() => window.open(activeItem.href, "_blank", "noopener,noreferrer")} type="button">
                    Open source
                  </button>
                ) : null}
              </div>
            ) : getRenderableImageUrl(activeItem, false) ? (
              <MediaViewerImage item={activeItem} />
            ) : null}

            <p>{activeItem.description}</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
