import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  getYouTubeId,
  getVideoEmbedUrl,
  getVideoThumbnail,
  isDirectVideoUrl,
} from '../../utils/videoUtils';
import { broadcastTrainingUpdate } from '../../utils/trainingSync';

export default function RecordedVideosManager() {
  const api = useApi();

  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');

  // Video Upload / Edit Modal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    url: '',
    category: '',
    duration: '',
    description: '',
    thumbnailUrl: '',
  });
  const [videoFormLoading, setVideoFormLoading] = useState(false);
  const [videoFormError, setVideoFormError] = useState('');

  // Group Create / Edit Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
  });
  const [groupFormLoading, setGroupFormLoading] = useState(false);
  const [groupFormError, setGroupFormError] = useState('');

  // Inline Quick Add Group inside Video Modal
  const [isInlineGroupInputOpen, setIsInlineGroupInputOpen] = useState(false);
  const [inlineGroupName, setInlineGroupName] = useState('');
  const [inlineGroupLoading, setInlineGroupLoading] = useState(false);

  // Video Preview Modal
  const [previewVideo, setPreviewVideo] = useState(null);

  // Delete Confirmations & Loading states
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, vidRes] = await Promise.all([
        api.get('/api/training/categories'),
        api.get('/api/training/videos'),
      ]);
      setCategories(catRes.categories || []);
      setVideos(vidRes.videos || []);
    } catch (err) {
      console.error('Error fetching recorded videos & groups:', err);
      setError('Failed to load video and group data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      if (selectedGroupFilter !== 'All') {
        if ((vid.category || '').toLowerCase().trim() !== selectedGroupFilter.toLowerCase().trim()) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (vid.title || '').toLowerCase().includes(q);
        const matchDesc = (vid.description || '').toLowerCase().includes(q);
        const matchCat = (vid.category || '').toLowerCase().includes(q);
        const matchUrl = (vid.url || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchUrl) {
          return false;
        }
      }

      return true;
    });
  }, [videos, selectedGroupFilter, searchQuery]);

  // Open Video Modal for Create
  const handleOpenAddVideo = (preselectedCategory = '') => {
    setEditingVideo(null);
    setVideoFormData({
      title: '',
      url: '',
      category: preselectedCategory || (categories[0]?.name || ''),
      duration: '',
      description: '',
      thumbnailUrl: '',
    });
    setVideoFormError('');
    setIsInlineGroupInputOpen(categories.length === 0);
    setInlineGroupName('');
    setIsVideoModalOpen(true);
  };

  // Open Video Modal for Edit
  const handleOpenEditVideo = (video) => {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title || '',
      url: video.url || '',
      category: video.category || (categories[0]?.name || ''),
      duration: video.duration || '',
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl || '',
    });
    setVideoFormError('');
    setIsInlineGroupInputOpen(false);
    setInlineGroupName('');
    setIsVideoModalOpen(true);
  };

  // Submit Video (Create or Update)
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!videoFormData.title.trim()) {
      setVideoFormError('Please enter a video title.');
      return;
    }
    if (!videoFormData.url.trim()) {
      setVideoFormError('Please enter a video URL link.');
      return;
    }
    if (!videoFormData.category.trim()) {
      setVideoFormError('Please select or create a group for this video.');
      return;
    }

    setVideoFormLoading(true);
    setVideoFormError('');

    try {
      if (editingVideo) {
        // PUT update
        const res = await api.put('/api/training/videos', {
          id: editingVideo._id,
          ...videoFormData,
        });
        setVideos((prev) =>
          prev.map((v) => (v._id === editingVideo._id ? res.video : v))
        );
        showSuccess('Video updated successfully.');
        broadcastTrainingUpdate({ type: 'video_updated', videoId: editingVideo._id });
      } else {
        // POST create
        const res = await api.post('/api/training/videos', videoFormData);
        setVideos((prev) => [res.video, ...prev]);
        showSuccess('Video uploaded and added to group successfully.');
        broadcastTrainingUpdate({ type: 'video_created', videoId: res.video?._id });
      }
      setIsVideoModalOpen(false);
      // Refresh categories to update counts
      api.get('/api/training/categories').then((r) => setCategories(r.categories || []));
    } catch (err) {
      console.error('Failed to save video:', err);
      setVideoFormError(err.message || 'Error saving video. Please verify the fields.');
    } finally {
      setVideoFormLoading(false);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (id) => {
    setIsDeletingVideo(true);
    try {
      await api.delete(`/api/training/videos?id=${id}`);
      setVideos((prev) => prev.filter((v) => v._id !== id));
      setDeletingVideoId(null);
      showSuccess('Video deleted permanently from database.');
      broadcastTrainingUpdate({ type: 'video_deleted', videoId: id });
      api.get('/api/training/categories').then((r) => setCategories(r.categories || []));
    } catch (err) {
      console.error('Failed to delete video:', err);
      alert(err.message || 'Failed to delete video.');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  // Open Group Modal for Create
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupFormData({ name: '', description: '' });
    setGroupFormError('');
    setIsGroupModalOpen(true);
  };

  // Open Group Modal for Edit
  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name || '',
      description: group.description || '',
    });
    setGroupFormError('');
    setIsGroupModalOpen(true);
  };

  // Save Group (Create or Update)
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupFormData.name.trim()) {
      setGroupFormError('Please enter a group name.');
      return;
    }

    setGroupFormLoading(true);
    setGroupFormError('');

    try {
      if (editingGroup) {
        const res = await api.put('/api/training/categories', {
          id: editingGroup._id,
          ...groupFormData,
        });
        setCategories((prev) =>
          prev.map((c) => (c._id === editingGroup._id ? res.category : c))
        );
        // Also update videos category string locally
        setVideos((prev) =>
          prev.map((v) =>
            v.category === editingGroup.name ? { ...v, category: groupFormData.name.trim() } : v
          )
        );
        showSuccess('Group updated and synced successfully.');
        broadcastTrainingUpdate({ type: 'group_updated', groupId: editingGroup._id, name: groupFormData.name.trim() });
      } else {
        const res = await api.post('/api/training/categories', groupFormData);
        setCategories((prev) => [...prev, res.category]);
        showSuccess('Group created successfully.');
        broadcastTrainingUpdate({ type: 'group_created', groupId: res.category?._id, name: res.category?.name });
      }
      setIsGroupModalOpen(false);
    } catch (err) {
      console.error('Failed to save group:', err);
      setGroupFormError(err.message || 'Error saving group.');
    } finally {
      setGroupFormLoading(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id) => {
    setIsDeletingGroup(true);
    try {
      const groupToDelete = categories.find((c) => c._id === id);
      const groupName = groupToDelete?.name;
      await api.delete(`/api/training/categories?id=${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setVideos((prev) =>
        prev.map((v) =>
          v.categoryId === id || (groupName && v.category === groupName)
            ? { ...v, categoryId: null, category: 'Uncategorized' }
            : v
        )
      );
      if (selectedGroupFilter && groupName && selectedGroupFilter.toLowerCase() === groupName.toLowerCase()) {
        setSelectedGroupFilter('All');
      }
      setDeletingGroupId(null);
      showSuccess('Group deleted permanently from database.');
      broadcastTrainingUpdate({ type: 'group_deleted', groupId: id });
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert(err.message || 'Failed to delete group.');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // Quick inline create group directly in Video modal
  const handleQuickAddGroup = async () => {
    if (!inlineGroupName.trim()) return;
    setInlineGroupLoading(true);
    try {
      const res = await api.post('/api/training/categories', {
        name: inlineGroupName.trim(),
        description: '',
      });
      setCategories((prev) => [...prev, res.category]);
      setVideoFormData((prev) => ({ ...prev, category: res.category.name }));
      setInlineGroupName('');
      setIsInlineGroupInputOpen(false);
      showSuccess(`Group "${res.category.name}" created and selected!`);
      broadcastTrainingUpdate({ type: 'group_created', groupId: res.category?._id, name: res.category?.name });
    } catch (err) {
      alert(err.message || 'Failed to create group');
    } finally {
      setInlineGroupLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Alert Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center justify-between gap-3 shadow-md animate-slide-up">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <div className="text-[11px] uppercase font-extrabold tracking-wider text-emerald-700">Operation Confirmed</div>
              <div className="text-sm font-bold text-emerald-900">{successMsg}</div>
            </div>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
            title="Dismiss confirmation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Header Banner & Primary Actions */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold tracking-wide uppercase mb-2 border border-brand-100">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Class Management
          </div>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-gray-900 tracking-tight">
            Recorded Videos &amp; Groups
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Upload video class links (YouTube, Vimeo, MP4) and organize them under groups for your clients to watch on their Class page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="admin-create-group-btn"
            onClick={handleOpenAddGroup}
            className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 hover:border-brand-300 hover:bg-brand-50/40 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Create Group</span>
          </button>

          <button
            id="admin-upload-video-btn"
            onClick={() => handleOpenAddVideo()}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-2xl text-xs font-bold transition-all shadow-brand active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Upload Video Link</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Videos</p>
          <p className="text-3xl font-display font-extrabold text-gray-900 mt-1">{videos.length}</p>
          <span className="text-[11px] text-brand-600 font-semibold mt-1 inline-block">Active on Client App</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Groups</p>
          <p className="text-3xl font-display font-extrabold text-gray-900 mt-1">{categories.length}</p>
          <span className="text-[11px] text-gray-400 font-semibold mt-1 inline-block">Categorized wellness sets</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtered Count</p>
          <p className="text-3xl font-display font-extrabold text-brand-600 mt-1">{filteredVideos.length}</p>
          <span className="text-[11px] text-gray-400 font-semibold mt-1 inline-block">
            {selectedGroupFilter === 'All' ? 'All categories included' : `In ${selectedGroupFilter}`}
          </span>
        </div>
      </div>

      {/* Groups (Categories) Management Section */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-900">
              Groups &amp; Categories
            </h3>
            <p className="text-xs text-gray-500">
              Groups organize your recorded videos into specific wellness sections (e.g., Yoga, Meditation).
            </p>
          </div>
          <button
            onClick={handleOpenAddGroup}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 py-1.5 px-3 rounded-xl transition-colors"
          >
            + Add New Group
          </button>
        </div>

        {/* Group Pill / Cards Grid */}
        {categories.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 space-y-2">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-xs font-bold text-gray-700">No groups created yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Groups organize your recorded tutorials into wellness topics like "Yoga & Mobility" or "Meditation".
            </p>
            <button
              onClick={handleOpenAddGroup}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors"
            >
              <span>+ Create First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {categories.map((cat) => {
            const count = videos.filter(
              (v) => (v.category || '').toLowerCase() === cat.name.toLowerCase()
            ).length;
            const isFilterActive = selectedGroupFilter.toLowerCase() === cat.name.toLowerCase();

            return (
              <div
                key={cat._id || cat.name}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isFilterActive
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-sm text-gray-900 leading-snug">
                      {cat.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 font-extrabold text-[11px] shrink-0">
                      {count} {count === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedGroupFilter(isFilterActive ? 'All' : cat.name)
                    }
                    className={`text-xs font-bold transition-colors ${
                      isFilterActive ? 'text-brand-700 underline' : 'text-gray-600 hover:text-brand-600'
                    }`}
                  >
                    {isFilterActive ? 'Showing in table' : 'Filter by this'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAddVideo(cat.name)}
                      title="Add video to this group"
                      className="p-1.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors text-xs font-bold"
                    >
                      + Video
                    </button>
                    <button
                      onClick={() => handleOpenEditGroup(cat)}
                      title="Edit group"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingGroupId(cat._id)}
                      title="Delete group"
                      className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Videos Section with Search & Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm space-y-4 p-6">
        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-gray-900">
              Uploaded Recorded Videos
            </h3>
            <p className="text-xs text-gray-500">
              All video links accessible by clients in the Class screen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Group Filter Dropdown */}
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Groups ({videos.length})</option>
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Videos Table or Grid */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
            Loading recorded videos and categories...
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-sm text-gray-900">No videos found</h4>
            <p className="text-xs text-gray-500">
              {searchQuery || selectedGroupFilter !== 'All'
                ? 'Try adjusting your search query or group filter.'
                : 'No recorded video links uploaded yet.'}
            </p>
            <button
              onClick={() => handleOpenAddVideo()}
              className="py-2 px-4 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors"
            >
              + Upload First Video
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Video</th>
                  <th className="py-3 px-3">Group</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Link / Source</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVideos.map((video) => {
                  const thumb = getVideoThumbnail(video.url, video.thumbnailUrl);

                  return (
                    <tr key={video._id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Video Thumbnail & Title */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 max-w-sm">
                          <div
                            onClick={() => setPreviewVideo(video)}
                            className="relative w-16 h-10 rounded-lg overflow-hidden bg-gray-900 shrink-0 cursor-pointer group-hover:ring-2 ring-brand-500 transition-all shadow-sm"
                          >
                            {thumb ? (
                              <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-[9px]">
                                Play
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-xs md:text-sm truncate">
                              {video.title}
                            </p>
                            {video.description && (
                              <p className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100">
                          {video.category || 'Unassigned'}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-gray-600 font-semibold">
                        {video.duration || '—'}
                      </td>

                      {/* Video Link */}
                      <td className="py-3 px-3 max-w-xs">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 truncate max-w-[200px]"
                          title={video.url}
                        >
                          <span className="truncate">{video.url}</span>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewVideo(video)}
                            title="Preview playback"
                            className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors text-xs font-bold"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleOpenEditVideo(video)}
                            title="Edit Video"
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingVideoId(video._id)}
                            title="Delete Video"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────── MODALS ────────────────── */}

      {/* 1. UPLOAD / EDIT VIDEO MODAL */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900">
                  {editingVideo ? 'Edit Recorded Video' : 'Upload Video Link'}
                </h3>
                <p className="text-xs text-gray-500">
                  Provide video link and assign it to a group for clients.
                </p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {videoFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                {videoFormError}
              </div>
            )}

            <form onSubmit={handleSaveVideo} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gentle Morning Chair Yoga"
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Video URL Link */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Video URL Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or MP4 URL"
                  value={videoFormData.url}
                  onChange={(e) => setVideoFormData({ ...videoFormData, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Paste YouTube, Vimeo, or direct video URL. YouTube thumbnails are automatically fetched.
                </p>

                {/* Auto YouTube Thumbnail Preview */}
                {getYouTubeId(videoFormData.url) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(videoFormData.url)}/hqdefault.jpg`}
                      alt="Thumbnail preview"
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                    <div className="text-[11px] text-emerald-700 font-bold">
                      ✓ YouTube Video Detected: Preview ready
                    </div>
                  </div>
                )}
              </div>

              {/* Group Selection with Inline "+ Quick Add Group" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Select Group *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInlineGroupInputOpen(!isInlineGroupInputOpen)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>+ Quick Create Group</span>
                  </button>
                </div>

                {isInlineGroupInputOpen && (
                  <div className="mb-2 p-3 bg-brand-50/70 border border-brand-200 rounded-xl space-y-2 animate-fade-in">
                    <label className="block text-[11px] font-bold text-brand-800 uppercase">
                      New Group Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Chair Cardio"
                        value={inlineGroupName}
                        onChange={(e) => setInlineGroupName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        disabled={inlineGroupLoading || !inlineGroupName.trim()}
                        onClick={handleQuickAddGroup}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        {inlineGroupLoading ? 'Creating...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}

                <select
                  required
                  value={videoFormData.category}
                  onChange={(e) => setVideoFormData({ ...videoFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="" disabled>
                    -- Select a Group --
                  </option>
                  {categories.map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 min or 20 min"
                  value={videoFormData.duration}
                  onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the exercises or routine..."
                  value={videoFormData.description}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Custom Thumbnail URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Custom Thumbnail URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Leave empty to use automatic thumbnail"
                  value={videoFormData.thumbnailUrl}
                  onChange={(e) => setVideoFormData({ ...videoFormData, thumbnailUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={videoFormLoading}
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoFormLoading}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-brand disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {videoFormLoading && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  <span>
                    {videoFormLoading
                      ? editingVideo
                        ? 'Saving changes...'
                        : 'Uploading video link...'
                      : editingVideo
                      ? 'Save Changes'
                      : 'Upload Video Link'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT GROUP MODAL */}
      {isGroupModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-base text-gray-900">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h3>
                <p className="text-xs text-gray-500">
                  Groups categorize videos on the client Class screen.
                </p>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {groupFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                {groupFormError}
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strength & Balance, Yoga, Sleep..."
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what kind of classes belong in this group..."
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={groupFormLoading}
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupFormLoading}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-brand disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {groupFormLoading && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  <span>
                    {groupFormLoading
                      ? editingGroup
                        ? 'Saving changes...'
                        : 'Creating group...'
                      : editingGroup
                      ? 'Save Changes'
                      : 'Create Group'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. VIDEO PREVIEW / PLAYBACK MODAL */}
      {previewVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-gray-50">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-brand-100 text-brand-700 rounded-md">
                  {previewVideo.category}
                </span>
                <h3 className="font-display font-extrabold text-sm md:text-base text-gray-900 truncate mt-1">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {isDirectVideoUrl(previewVideo.url) ? (
                <video src={previewVideo.url} controls autoPlay className="w-full h-full">
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getVideoEmbedUrl(previewVideo.url)}
                  title={previewVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            <div className="p-4 bg-white flex items-center justify-between border-t border-gray-100">
              <span className="text-xs text-gray-500 font-semibold">
                Duration: {previewVideo.duration || 'Not specified'}
              </span>
              <button
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONFIRM DELETE VIDEO MODAL */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-gray-900">Delete Video Link?</h4>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove this video? Clients will no longer see this session on their Class page.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingVideo}
                onClick={() => setDeletingVideoId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingVideo}
                onClick={() => handleDeleteVideo(deletingVideoId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                {isDeletingVideo && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                <span>{isDeletingVideo ? 'Deleting video...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRM DELETE GROUP MODAL */}
      {deletingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-gray-900">Delete Group?</h4>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete this group? Videos currently in this group will remain in the database.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingGroup}
                onClick={() => setDeletingGroupId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingGroup}
                onClick={() => handleDeleteGroup(deletingGroupId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                {isDeletingGroup && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                <span>{isDeletingGroup ? 'Deleting group...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
