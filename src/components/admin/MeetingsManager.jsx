import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { formatMeetingTime, formatMeetingDuration, isValidMeetingLink } from '../../utils/meetingUtils';

export default function MeetingsManager() {
  const api = useApi();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('running'); // 'running' | 'upcoming' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Local form state for each batch: { [batchId]: { meetingName, meetingLink, meetingTime, meetingDuration, isDirty } }
  const [formData, setFormData] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveSuccessId, setSaveSuccessId] = useState(null);
  const [saveError, setSaveError] = useState({});

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/admin/meetings');
      const batchList = data.batches || [];
      setBatches(batchList);

      // Populate form data
      const initialForm = {};
      batchList.forEach((b) => {
        initialForm[b._id] = {
          meetingName: b.meetingName || 'Daily Live Session',
          meetingLink: b.meetingLink || '',
          meetingTime: b.meetingTime || '09:00',
          meetingDuration: b.meetingDuration || 60,
          isDirty: false,
        };
      });
      setFormData(initialForm);
    } catch (err) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFieldChange = (batchId, field, value) => {
    setFormData((prev) => {
      const current = prev[batchId] || {};
      return {
        ...prev,
        [batchId]: {
          ...current,
          [field]: value,
          isDirty: true,
        },
      };
    });
    // Clear any previous save error for this batch
    setSaveError((prev) => ({ ...prev, [batchId]: '' }));
  };

  const handleSave = async (batchId) => {
    const current = formData[batchId];
    if (!current) return;

    if (current.meetingLink && !isValidMeetingLink(current.meetingLink)) {
      setSaveError((prev) => ({
        ...prev,
        [batchId]: 'Please provide a valid URL (e.g. https://meet.google.com/abc-defg-hij)',
      }));
      return;
    }

    try {
      setSavingId(batchId);
      setSaveError((prev) => ({ ...prev, [batchId]: '' }));

      const res = await api.put('/api/admin/meetings', {
        batchId,
        meetingName: current.meetingName,
        meetingLink: current.meetingLink,
        meetingTime: current.meetingTime,
        meetingDuration: current.meetingDuration,
      });

      // Update in batches array
      setBatches((prev) =>
        prev.map((b) => (b._id === batchId ? { ...b, ...res.batch } : b))
      );

      // Mark form as clean
      setFormData((prev) => ({
        ...prev,
        [batchId]: {
          ...prev[batchId],
          isDirty: false,
        },
      }));

      setSaveSuccessId(batchId);
      setTimeout(() => {
        setSaveSuccessId((prev) => (prev === batchId ? null : prev));
      }, 3000);
    } catch (err) {
      setSaveError((prev) => ({
        ...prev,
        [batchId]: err.message || 'Failed to save meeting settings',
      }));
    } finally {
      setSavingId(null);
    }
  };

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Tab filter
      if (filterTab === 'running' && !b.isRunning) return false;
      if (filterTab === 'upcoming' && !b.isUpcoming) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesMeeting = (b.meetingName || '').toLowerCase().includes(q);
        return matchesName || matchesMeeting;
      }

      return true;
    });
  }, [batches, filterTab, searchQuery]);

  const runningCount = batches.filter((b) => b.isRunning).length;
  const configuredCount = batches.filter((b) => b.meetingLink && b.meetingLink.trim()).length;
  const totalEnrolled = batches.reduce((acc, b) => acc + (b.customerCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
            <h2 className="font-display font-black text-xl text-gray-900">Live Meetings Management</h2>
          </div>
          <p className="text-xs text-muted mt-1.5 max-w-2xl">
            Configure Google Meet links, meeting titles, daily times, and durations for running batches. Enrolled members will see the live session link and countdown on their dashboard overview.
          </p>
        </div>

        <button
          onClick={fetchBatches}
          disabled={loading}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-border text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Running Batches</p>
            <p className="text-2xl font-display font-black text-brand-600 mt-1">{runningCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Meetings Configured</p>
            <p className="text-2xl font-display font-black text-gray-900 mt-1">{configuredCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            ✓
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Total Enrolled Members</p>
            <p className="text-2xl font-display font-black text-gray-900 mt-1">{totalEnrolled}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-3xl border border-border p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'running', label: 'Running Batches', count: runningCount },
            { id: 'upcoming', label: 'Upcoming Batches', count: batches.filter((b) => b.isUpcoming).length },
            { id: 'all', label: 'All Batches', count: batches.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center gap-2 ${
                filterTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === tab.id ? 'bg-brand-50 text-brand-600 font-extrabold' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-border">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500">Loading batches and meeting links...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-700 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchBatches} className="underline hover:text-red-900">Try Again</button>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-border text-xs text-gray-400">
          {filterTab === 'running'
            ? 'No running batches currently in active progress (Day 1 - 30).'
            : 'No batches found matching your filter criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBatches.map((batch) => {
            const current = formData[batch._id] || {
              meetingName: batch.meetingName || 'Daily Live Session',
              meetingLink: batch.meetingLink || '',
              meetingTime: batch.meetingTime || '09:00',
              meetingDuration: batch.meetingDuration || 60,
              isDirty: false,
            };

            const isSaving = savingId === batch._id;
            const isSuccess = saveSuccessId === batch._id;
            const batchErr = saveError[batch._id];
            const hasLink = Boolean(current.meetingLink && current.meetingLink.trim());

            return (
              <div
                key={batch._id}
                className="bg-white rounded-3xl border border-border p-6 shadow-sm hover:border-brand-200 transition-all space-y-5"
              >
                {/* Batch Top Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-black text-lg text-gray-900">{batch.name}</h3>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        batch.isRunning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : batch.isUpcoming
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {batch.isRunning
                          ? `Day ${batch.currentDayNumber} of 30`
                          : batch.isUpcoming
                          ? 'Upcoming'
                          : 'Challenge Ended'}
                      </span>
                      {hasLink ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Link Configured
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          Link Missing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      Start Date:{' '}
                      <span className="font-bold text-gray-700">
                        {new Date(batch.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>{' '}
                      • Enrolled:{' '}
                      <span className="font-bold text-gray-700">{batch.customerCount || 0} members</span>
                    </p>
                  </div>

                  {/* Quick status pill for admin */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                      {formatMeetingTime(current.meetingTime)} ({formatMeetingDuration(current.meetingDuration)})
                    </span>
                  </div>
                </div>

                {/* Batch Meeting Configuration Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Field 1: Meeting Name */}
                  <div className="lg:col-span-1 space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Meeting Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={current.meetingName}
                      onChange={(e) => handleFieldChange(batch._id, 'meetingName', e.target.value)}
                      placeholder="e.g. Daily Live Session"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-muted">Title shown on the client dashboard</p>
                  </div>

                  {/* Field 2: Meeting Link */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">
                        Google Meet Link <span className="text-red-500">*</span>
                      </label>
                      {current.meetingLink && (
                        <a
                          href={current.meetingLink.startsWith('http') ? current.meetingLink : `https://${current.meetingLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                        >
                          <span>Test Link</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <input
                        type="url"
                        value={current.meetingLink}
                        onChange={(e) => handleFieldChange(batch._id, 'meetingLink', e.target.value)}
                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-muted">Join button on client side redirects to this Google Meet link</p>
                  </div>

                  {/* Field 3: Meeting Time */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Session Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={current.meetingTime}
                      onChange={(e) => handleFieldChange(batch._id, 'meetingTime', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-muted">Daily meeting start time (24h)</p>
                  </div>

                  {/* Field 4: Meeting Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Duration (Minutes) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={current.meetingDuration}
                      onChange={(e) => handleFieldChange(batch._id, 'meetingDuration', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 Hour)</option>
                      <option value={75}>75 Minutes</option>
                      <option value={90}>90 Minutes (1.5 Hours)</option>
                      <option value={120}>120 Minutes (2 Hours)</option>
                    </select>
                    <p className="text-[10px] text-muted">Meeting join window duration</p>
                  </div>
                </div>

                {/* Error Banner if any */}
                {batchErr && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{batchErr}</span>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Countdown starts 30 minutes before {formatMeetingTime(current.meetingTime)}.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Saved successfully!
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSave(batch._id)}
                      disabled={isSaving}
                      className={`px-5 py-2.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                        current.isDirty
                          ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand active:scale-95'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span>{current.isDirty ? 'Save Meeting Settings' : 'Update Meeting'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
