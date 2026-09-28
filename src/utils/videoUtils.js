// Video helper functions for YouTube, Vimeo, and direct video sources

export function getYouTubeId(url = '') {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function getVimeoId(url = '') {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?)([0-9]+)/);
  return match ? match[1] : null;
}

export function isDirectVideoUrl(url = '') {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

export function getVideoEmbedUrl(url = '') {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube
  const ytId = getYouTubeId(trimmed);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
  }

  // Vimeo
  const vimeoId = getVimeoId(trimmed);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  }

  return trimmed;
}

export function getVideoThumbnail(url = '', customThumbnail = '') {
  if (customThumbnail && customThumbnail.trim()) {
    return customThumbnail.trim();
  }
  const ytId = getYouTubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return '';
}
