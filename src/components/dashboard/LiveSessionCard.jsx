import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { useUserStore } from '../../store/useUserStore';
import {
  calculateMeetingState,
  formatMeetingTime,
  formatMeetingDuration,
} from '../../utils/meetingUtils';

export default function LiveSessionCard() {
  const api = useApi();
  const user = useUserStore((s) => s.user);

  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // 1-second ticker to update countdowns and live status in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current live session details for the logged-in customer's batch
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveSession() {
      try {
        setLoading(true);
        const res = await api.get('/api/user/live-session');
        if (isMounted) {
          if (res.hasBatch) {
            setMeetingData(res);
          } else {
            setMeetingData(user?.batch || null);
          }
        }
      } catch {
        if (isMounted && user?.batch) {
          setMeetingData(user.batch);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLiveSession();

    // Poll every 60 seconds to catch admin updates without page reload
    const pollInterval = setInterval(fetchLiveSession, 60000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [user?.batchId]);

  // Compute live meeting state relative to current second
  const state = useMemo(() => {
    const meeting = meetingData || (user?.batch ? {
      meetingName: user.batch.meetingName,
      meetingLink: user.batch.meetingLink,
      meetingTime: user.batch.meetingTime,
      meetingDuration: user.batch.meetingDuration,
      startDate: user.batch.startDate || user.startDate,
    } : null);

    return calculateMeetingState(meeting, now);
  }, [meetingData, user?.batch, now]);

  if (loading && !meetingData) {
    return (
      <div className="bg-white rounded-3xl border border-brand-500/15 p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-brand-50 rounded w-1/3" />
          <div className="h-6 bg-brand-50 rounded-full w-20" />
        </div>
        <div className="h-10 bg-brand-50/60 rounded-2xl w-full" />
      </div>
    );
  }

  // If user is not assigned to a batch
  if (!meetingData && !user?.batchId) {
    return (
      <div className="bg-brand-500 text-white rounded-3xl border border-brand-400/50 p-5 sm:p-6 shadow-brand">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-white">Daily Live Session</h3>
            <p className="text-xs text-white/80 mt-0.5">Please contact your coach to join a batch for daily live sessions.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    meetingName,
    meetingLink,
    meetingTime,
    durationMinutes,
    status,
    isInsideMeetingTime,
    isCountdownActive,
    formattedCountdown,
    underContainerText,
    hasMeetingLink,
  } = state;

  const isLive = status === 'LIVE_NOW';

  return (
    <section className="bg-brand-500 text-white rounded-3xl p-5 sm:p-6 border border-brand-400/50 shadow-brand transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Area: Status, Meta Badges & Session Name (No subtext after name) */}
        <div className="space-y-2.5 min-w-0 flex-1">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Indicator Pill */}
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs ${
                isLive
                  ? 'bg-white text-brand-900 border-white'
                  : isCountdownActive
                  ? 'bg-white/25 text-white border-white/30'
                  : status === 'TODAY_COMPLETED'
                  ? 'bg-white/20 text-white/90 border-white/25'
                  : 'bg-white/20 text-white border-white/25'
              }`}
            >
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>LIVE NOW</span>
                </>
              ) : isCountdownActive ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  <span>STARTING SOON • {formattedCountdown}</span>
                </>
              ) : status === 'TODAY_COMPLETED' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <span>COMPLETED TODAY</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>DAILY LIVE SESSION</span>
                </>
              )}
            </span>

            {/* Time Pill */}
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-white/20 text-white border border-white/25 shadow-xs">
              {formatMeetingTime(meetingTime)}
            </span>

            {/* Duration Pill */}
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white/20 text-white border border-white/25 shadow-xs">
              {formatMeetingDuration(durationMinutes)}
            </span>
          </div>

          {/* Session Name (No text after session name) */}
          <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
            {meetingName || 'Daily Live Session'}
          </h3>
        </div>

        {/* Right Area: Join Button & Session Updates Text Directly Underneath */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          {/* Join Button */}
          {isInsideMeetingTime && hasMeetingLink ? (
            <a
              href={meetingLink.startsWith('http') ? meetingLink : `https://${meetingLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-brand-900 hover:bg-brand-50 font-display font-black text-xs shadow-md active:scale-[0.98] transition-all text-center group"
            >
              <svg className="w-4 h-4 text-brand-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              <span>Join Live Session</span>
              <svg className="w-3.5 h-3.5 text-brand-700 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title={
                !hasMeetingLink
                  ? 'Meeting link not uploaded yet'
                  : 'Join button unlocks during scheduled meeting time'
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600/70 text-white/75 border border-brand-400/40 font-display font-bold text-xs cursor-not-allowed select-none"
            >
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Join Live Session</span>
            </button>
          )}

          {/* Session Updates Text: Positioned directly under the Join Button */}
          <div className="flex items-center justify-center sm:justify-end gap-1.5 px-1 text-center sm:text-right">
            <svg
              className="w-3.5 h-3.5 text-white/90 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] font-semibold text-white/95 leading-tight">
              {underContainerText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
