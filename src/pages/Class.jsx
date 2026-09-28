import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { getVideoEmbedUrl, getVideoThumbnail, isDirectVideoUrl } from '../utils/videoUtils';
import { subscribeToTrainingUpdates } from '../utils/trainingSync';

export default function Class() {
  const api = useApi();

  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Search & Filter State: "on client side on the class page search option , then all then groups."
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Active Video Modal for Playback
  const [activeVideo, setActiveVideo] = useState(null);

  // Event completion loading and confirmation feedback states
  const [syncStatus, setSyncStatus] = useState(null); // { active: boolean, completed: boolean, message: string }
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Ref to track latest activeVideo and selectedGroup without stale closures
  const activeVideoRef = useRef(activeVideo);
  activeVideoRef.current = activeVideo;
  const selectedGroupRef = useRef(selectedGroup);
  selectedGroupRef.current = selectedGroup;

  // Equality comparators to ensure state changes ONLY happen when DB data changes
  const areVideosEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const v1 = a[i];
      const v2 = b[i];
      if (
        v1._id !== v2._id ||
        v1.title !== v2.title ||
        v1.url !== v2.url ||
        v1.category !== v2.category ||
        String(v1.categoryId || '') !== String(v2.categoryId || '') ||
        v1.duration !== v2.duration ||
        v1.thumbnailUrl !== v2.thumbnailUrl ||
        v1.description !== v2.description ||
        v1.updatedAt !== v2.updatedAt
      ) {
        return false;
      }
    }
    return true;
  };

  const areCategoriesEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const c1 = a[i];
      const c2 = b[i];
      if (
        c1._id !== c2._id ||
        c1.name !== c2.name ||
        c1.videoCount !== c2.videoCount ||
        c1.updatedAt !== c2.updatedAt
      ) {
        return false;
      }
    }
    return true;
  };

  // Helper to reliably check if a video belongs to a category object
  const isVideoInCategory = useCallback((video, categoryObj) => {
    if (!video || !categoryObj) return false;
    // 1. Direct categoryId comparison
    const vidCatId = video.categoryId?._id || video.categoryId;
    const targetCatId = categoryObj._id;
    if (vidCatId && targetCatId && String(vidCatId) === String(targetCatId)) {
      return true;
    }
    // 2. Normalized category name comparison (case-insensitive & trimmed)
    const vCat = (video.category || '').trim().toLowerCase();
    const cName = (categoryObj.name || '').trim().toLowerCase();
    return vCat.length > 0 && vCat === cName;
  }, []);

  // Fetch categories and videos — only updates state if DB data actually changed
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setError('');
    } else {
      setRefreshing(true);
    }

    try {
      const [catRes, vidRes] = await Promise.all([
        api.get('/api/training/categories'),
        api.get('/api/training/videos'),
      ]);

      const newCategories = catRes.categories || [];
      const newVideos = vidRes.videos || [];

      // State change ONLY occurs if database content actually changed
      setCategories((prevCategories) => {
        if (areCategoriesEqual(prevCategories, newCategories)) {
          return prevCategories; // Exact same reference: React skips re-render
        }
        return newCategories;
      });

      setVideos((prevVideos) => {
        if (areVideosEqual(prevVideos, newVideos)) {
          return prevVideos; // Exact same reference: React skips re-render
        }
        return newVideos;
      });

      setLastUpdated(new Date());

      // If a group is currently selected, verify it still exists after admin DB changes
      const currentSelected = selectedGroupRef.current;
      if (currentSelected && currentSelected !== 'All') {
        const stillExists = newCategories.some(
          (c) =>
            c.name.trim().toLowerCase() === currentSelected.trim().toLowerCase() ||
            String(c._id) === String(currentSelected)
        );
        if (!stillExists) {
          // Fall back gracefully to 'All' if admin deleted the selected group in DB
          setSelectedGroup('All');
        }
      }

      // If active video modal is open, keep it in sync with any edits made in DB
      if (activeVideoRef.current) {
        const updatedActive = newVideos.find(
          (v) => String(v._id) === String(activeVideoRef.current._id)
        );
        if (updatedActive) {
          setActiveVideo((prev) => (areVideosEqual([prev], [updatedActive]) ? prev : updatedActive));
        } else {
          // If video was deleted in DB while viewing modal, close modal
          setActiveVideo(null);
        }
      }
    } catch (err) {
      console.error('Failed to load class data:', err);
      if (!isBackground) {
        setError('Unable to load recorded classes. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  // Initial fetch on mount, and subscribe ONLY to admin DB change events
  useEffect(() => {
    // 1. Initial load on mount
    loadData(false);

    // 2. ONLY re-fetch when admin commits changes to the database
    const unsubscribeBroadcast = subscribeToTrainingUpdates(async (detail) => {
      let loadingLabel = 'Syncing tutorial updates...';
      if (detail?.type === 'video_created') loadingLabel = 'Syncing newly added video...';
      else if (detail?.type === 'video_updated') loadingLabel = 'Applying video updates...';
      else if (detail?.type === 'video_deleted') loadingLabel = 'Updating tutorial catalog...';
      else if (detail?.type === 'group_created') loadingLabel = 'Syncing newly added group...';
      else if (detail?.type === 'group_updated') loadingLabel = 'Updating group names...';
      else if (detail?.type === 'group_deleted') loadingLabel = 'Updating tutorial groups...';

      setSyncStatus({ active: true, completed: false, message: loadingLabel });

      await loadData(true);

      let doneLabel = 'Tutorial catalog synchronized';
      if (detail?.type?.includes('video')) doneLabel = 'Video changes confirmed & updated';
      else if (detail?.type?.includes('group')) doneLabel = 'Group changes confirmed & updated';

      setSyncStatus({ active: false, completed: true, message: doneLabel });
      const timer = setTimeout(() => {
        setSyncStatus(null);
      }, 3500);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribeBroadcast();
    };
  }, [loadData]);

  // Manual refresh handler with visual confirmation
  const handleManualRefresh = async () => {
    await loadData(false);
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2500);
  };

  // Filtered videos based on selectedGroup and searchQuery
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Group filter
      if (selectedGroup !== 'All') {
        const currentCatObj = categories.find(
          (c) =>
            c.name.trim().toLowerCase() === selectedGroup.trim().toLowerCase() ||
            String(c._id) === String(selectedGroup)
        );

        if (currentCatObj) {
          if (!isVideoInCategory(video, currentCatObj)) {
            return false;
          }
        } else {
          const videoCat = (video.category || '').toLowerCase().trim();
          const selCat = selectedGroup.toLowerCase().trim();
          if (videoCat !== selCat) {
            return false;
          }
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (video.title || '').toLowerCase().includes(q);
        const matchDesc = (video.description || '').toLowerCase().includes(q);
        const matchCat = (video.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [videos, categories, selectedGroup, searchQuery, isVideoInCategory]);

  return (
    <div className="space-y-6 px-4 md:px-0 max-w-6xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-6 md:p-8 text-white shadow-brand">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-4 w-28 h-28 rounded-full bg-brand-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold tracking-wide uppercase border border-white/20">
                <span
                  className={`w-2 h-2 rounded-full ${
                    refreshing || syncStatus?.active
                      ? 'bg-amber-300 animate-spin'
                      : syncStatus?.completed
                      ? 'bg-emerald-300'
                      : 'bg-emerald-300 animate-pulse'
                  }`}
                />
                {syncStatus?.active
                  ? syncStatus.message
                  : syncStatus?.completed
                  ? syncStatus.message
                  : refreshing
                  ? 'Syncing...'
                  : 'Recorded Sessions'}
              </div>
              <button
                id="refresh-tutorials-btn"
                onClick={handleManualRefresh}
                disabled={loading || refreshing || syncStatus?.active}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all duration-200 active:scale-95 disabled:opacity-50"
                title="Refresh tutorials and groups from database"
                aria-label="Refresh tutorials and groups"
              >
                {justRefreshed ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-200 font-bold">Updated</span>
                  </>
                ) : (
                  <>
                    <svg
                      className={`w-3.5 h-3.5 ${refreshing || syncStatus?.active ? 'animate-spin' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                  </>
                )}
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white mb-2">
              Recorded Tutorials
            </h1>
            <p className="text-sm md:text-base text-brand-50/90 leading-relaxed font-normal">
              Guided mobility routines, deep breathing, and wellness tutorials curated by health coaches. Watch and practice at your own pace anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Event Completion Confirmation Banner */}
      {syncStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition-all duration-300 animate-slide-up ${
            syncStatus.active
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncStatus.active ? (
              <svg className="w-4 h-4 animate-spin text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <span>{syncStatus.message}</span>
          </div>
          {!syncStatus.active && (
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
              Confirmed
            </span>
          )}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            id="tutorials-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by topic, title, or keyword..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options: "then all then groups" */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <span>Filter by Group</span>
          <span className="text-gray-400 font-medium">
            {filteredVideos.length} {filteredVideos.length === 1 ? 'tutorial' : 'tutorials'} found
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Option: "All" */}
          <button
            id="class-group-all"
            onClick={() => setSelectedGroup('All')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold tracking-tight transition-all duration-200 ${
              selectedGroup === 'All'
                ? 'bg-brand-500 text-white shadow-brand scale-[1.02]'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200 hover:bg-brand-50/50'
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                selectedGroup === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {videos.length}
            </span>
          </button>

          {/* Option: Each Group (Category) */}
          {categories.map((cat) => {
            const count = videos.filter((v) => isVideoInCategory(v, cat)).length;
            const isSelected =
              selectedGroup.trim().toLowerCase() === cat.name.trim().toLowerCase() ||
              selectedGroup === String(cat._id);

            return (
              <button
                key={cat._id || cat.name}
                id={`class-group-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedGroup(cat.name)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold tracking-tight transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-brand scale-[1.02]'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200 hover:bg-brand-50/50'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadData(false)}
            className="text-xs font-bold underline ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-200 p-4 space-y-3 shadow-sm animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-2xl w-full" />
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-100 rounded-md w-1/2" />
              <div className="h-8 bg-gray-100 rounded-xl w-full mt-2" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center max-w-md mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-gray-900">
              No tutorials found
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {searchQuery
                ? `No sessions match "${searchQuery}" in ${selectedGroup === 'All' ? 'all groups' : selectedGroup}.`
                : `There are currently no uploaded tutorials in ${selectedGroup}.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="py-2.5 px-4 bg-brand-50 text-brand-600 rounded-xl font-bold text-xs hover:bg-brand-100 transition-colors"
              >
                Clear Search Query
              </button>
            )}
            {selectedGroup !== 'All' && (
              <button
                onClick={() => setSelectedGroup('All')}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                View All Groups
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Video Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => {
            const thumb = getVideoThumbnail(video.url, video.thumbnailUrl);

            return (
              <div
                key={video._id}
                onClick={() => setActiveVideo(video)}
                className="group bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-card-hover hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-800 to-gray-900">
                      <svg className="w-12 h-12 text-brand-300/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Group / Category Tag */}
                  {video.category && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-gray-800 rounded-xl text-[11px] font-extrabold shadow-sm border border-white/40">
                        {video.category}
                      </span>
                    </div>
                  )}

                  {/* Duration Tag */}
                  {video.duration && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-white rounded-xl text-[11px] font-bold">
                        {video.duration}
                      </span>
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-500 transition-all duration-300">
                      <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-base text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <span className="text-xs font-bold text-brand-600 group-hover:underline flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch Tutorial
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">
                      Free Practice
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-gray-50/70">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-0.5">
                  {activeVideo.category && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-lg text-[10px] font-extrabold uppercase">
                      {activeVideo.category}
                    </span>
                  )}
                  {activeVideo.duration && (
                    <span className="text-xs font-semibold text-gray-500">
                      • {activeVideo.duration}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-extrabold text-base md:text-lg text-gray-900 truncate">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors shrink-0"
                title="Close video"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-black">
              {isDirectVideoUrl(activeVideo.url) ? (
                <video
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getVideoEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Video Description & Actions */}
            <div className="p-5 md:p-6 space-y-3 max-h-60 overflow-y-auto">
              <h4 className="font-display font-bold text-sm text-gray-900">About this session</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activeVideo.description || 'Follow along with the guided instructions in the video. Take deep breaths and move at your own comfort level.'}
              </p>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  <span>Open Video in New Tab</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Done Watching
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
