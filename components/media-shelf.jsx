export default function MediaShelf({ items }) {
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

  return (
    <section className="topic-media-grid">
      {items.map((item) => (
        <a
          key={item.title}
          className="media-card"
          href={item.href}
          onMouseEnter={playPreview}
          onMouseLeave={stopPreview}
          rel="noreferrer"
          target="_blank"
        >
          {item.previewVideo ? (
            <div className="media-thumb-wrap">
              <video
                className="media-thumb media-video-thumb"
                loop
                muted
                playsInline
                poster={item.image || ""}
                preload="metadata"
                src={item.previewVideo}
              />
            </div>
          ) : item.image ? (
            <div className="media-thumb-wrap">
              <img alt={item.title} className="media-thumb" src={item.image} />
            </div>
          ) : null}
          <span className="pill">{item.type}</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span className="media-link">Open resource</span>
        </a>
      ))}
    </section>
  );
}
