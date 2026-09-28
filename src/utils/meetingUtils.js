import { format, parseISO } from 'date-fns';

/**
 * Format a 24-hour time string ("HH:mm") into a 12-hour human readable time ("h:mm a").
 */
export function formatMeetingTime(timeStr = '09:00') {
  if (!timeStr) return '9:00 AM';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}

/**
 * Format duration in minutes into a friendly string.
 */
export function formatMeetingDuration(minutes = 60) {
  const m = Number(minutes) || 60;
  if (m < 60) return `${m} mins`;
  if (m % 60 === 0) {
    const hrs = m / 60;
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return `${hrs}h ${rem}m`;
}

/**
 * Validate Google Meet or meeting URL
 */
export function isValidMeetingLink(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Calculate meeting status and timing states.
 *
 * @param {Object} meeting
 * @param {string} meeting.meetingName
 * @param {string} meeting.meetingLink
 * @param {string} meeting.meetingTime (HH:mm, 24-hr)
 * @param {number} meeting.meetingDuration (in minutes)
 * @param {string|Date} meeting.startDate (batch start date)
 * @param {Date} now Current time instance
 */
export function calculateMeetingState(meeting, now = new Date()) {
  if (!meeting) {
    return {
      hasMeeting: false,
      hasMeetingLink: false,
      status: 'NO_MEETING',
      isInsideMeetingTime: false,
      isCountdownActive: false,
      secondsToStart: 0,
      formattedCountdown: '',
      nextSessionDate: null,
      underContainerText: 'No live session scheduled for your batch.',
    };
  }

  const meetingName = meeting.meetingName || 'Daily Live Session';
  const meetingLink = (meeting.meetingLink || '').trim();
  const hasMeetingLink = isValidMeetingLink(meetingLink);
  const meetingTime = meeting.meetingTime || '09:00';
  const durationMinutes = Number(meeting.meetingDuration) || 60;

  let [hour, minute] = meetingTime.split(':').map((v) => parseInt(v, 10));
  if (isNaN(hour)) hour = 9;
  if (isNaN(minute)) minute = 0;

  // Batch start date
  let batchStart = null;
  if (meeting.startDate) {
    batchStart = typeof meeting.startDate === 'string'
      ? (meeting.startDate.includes('T') ? new Date(meeting.startDate) : parseISO(meeting.startDate))
      : new Date(meeting.startDate);
  }

  if (batchStart && !isNaN(batchStart.getTime())) {
    batchStart = new Date(batchStart);
    batchStart.setHours(0, 0, 0, 0);

    const nowStartOfDay = new Date(now);
    nowStartOfDay.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((nowStartOfDay - batchStart) / (1000 * 60 * 60 * 24));
    const currentDayNumber = diffDays + 1;

    // Case 1: Batch hasn't started yet
    if (diffDays < 0) {
      const firstSession = new Date(batchStart);
      firstSession.setHours(hour, minute, 0, 0);

      const nextSessionText = `${format(firstSession, 'EEEE, MMM d')} at ${format(firstSession, 'h:mm a')}`;
      return {
        hasMeeting: true,
        hasMeetingLink,
        meetingName,
        meetingLink,
        meetingTime,
        durationMinutes,
        status: 'UPCOMING_BATCH',
        isInsideMeetingTime: false,
        isCountdownActive: false,
        secondsToStart: Math.max(0, Math.floor((firstSession - now) / 1000)),
        formattedCountdown: '',
        nextSessionDate: firstSession,
        underContainerText: `Next session: ${nextSessionText}`,
      };
    }

    // Case 2: Batch has completed all 30 days
    if (currentDayNumber > 30) {
      return {
        hasMeeting: true,
        hasMeetingLink,
        meetingName,
        meetingLink,
        meetingTime,
        durationMinutes,
        status: 'BATCH_COMPLETED',
        isInsideMeetingTime: false,
        isCountdownActive: false,
        secondsToStart: 0,
        formattedCountdown: '',
        nextSessionDate: null,
        underContainerText: 'Today live session completed. All 30 challenge sessions concluded.',
      };
    }
  }

  // Today's session window
  const todaySessionStart = new Date(now);
  todaySessionStart.setHours(hour, minute, 0, 0);

  const durationMs = durationMinutes * 60 * 1000;
  const todaySessionEnd = new Date(todaySessionStart.getTime() + durationMs);

  // Countdown starts 30 minutes before meeting starts
  const countdownStart = new Date(todaySessionStart.getTime() - 30 * 60 * 1000);

  // Tomorrow's session
  const tomorrowSessionStart = new Date(todaySessionStart);
  tomorrowSessionStart.setDate(tomorrowSessionStart.getDate() + 1);

  // Check where 'now' is:
  // Case A: Before countdown start today
  if (now < countdownStart) {
    const nextSessionFormatted = `Today, ${format(todaySessionStart, 'MMM d')} at ${format(todaySessionStart, 'h:mm a')}`;
    return {
      hasMeeting: true,
      hasMeetingLink,
      meetingName,
      meetingLink,
      meetingTime,
      durationMinutes,
      status: 'SCHEDULED_TODAY',
      isInsideMeetingTime: false,
      isCountdownActive: false,
      secondsToStart: Math.floor((todaySessionStart - now) / 1000),
      formattedCountdown: '',
      nextSessionDate: todaySessionStart,
      underContainerText: hasMeetingLink
        ? `Next session: ${nextSessionFormatted}`
        : 'Meeting link will be updated by your coach soon.',
    };
  }

  // Case B: Within 30 minutes countdown before start
  if (now >= countdownStart && now < todaySessionStart) {
    const totalSecs = Math.max(0, Math.floor((todaySessionStart - now) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formattedCountdown = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    const nextSessionFormatted = `Today, ${format(todaySessionStart, 'MMM d')} at ${format(todaySessionStart, 'h:mm a')}`;

    return {
      hasMeeting: true,
      hasMeetingLink,
      meetingName,
      meetingLink,
      meetingTime,
      durationMinutes,
      status: 'COUNTDOWN',
      isInsideMeetingTime: false,
      isCountdownActive: true,
      secondsToStart: totalSecs,
      formattedCountdown,
      nextSessionDate: todaySessionStart,
      underContainerText: `Next session: ${nextSessionFormatted}`,
    };
  }

  // Case C: Currently inside meeting duration (LIVE NOW)
  if (now >= todaySessionStart && now <= todaySessionEnd) {
    const remainingSecs = Math.max(0, Math.floor((todaySessionEnd - now) / 1000));
    const remMins = Math.floor(remainingSecs / 60);
    const remSecs = remainingSecs % 60;
    const formattedRemaining = `${remMins}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;

    return {
      hasMeeting: true,
      hasMeetingLink,
      meetingName,
      meetingLink,
      meetingTime,
      durationMinutes,
      status: 'LIVE_NOW',
      isInsideMeetingTime: true,
      isCountdownActive: false,
      secondsRemaining: remainingSecs,
      formattedRemaining,
      nextSessionDate: tomorrowSessionStart,
      underContainerText: `Live session is active now! Concludes at ${format(todaySessionEnd, 'h:mm a')}.`,
    };
  }

  // Case D: Today's meeting has completed (now > todaySessionEnd)
  const tomorrowFormatted = `Tomorrow, ${format(tomorrowSessionStart, 'MMM d')} at ${format(tomorrowSessionStart, 'h:mm a')}`;
  return {
    hasMeeting: true,
    hasMeetingLink,
    meetingName,
    meetingLink,
    meetingTime,
    durationMinutes,
    status: 'TODAY_COMPLETED',
    isInsideMeetingTime: false,
    isCountdownActive: false,
    secondsToStart: Math.floor((tomorrowSessionStart - now) / 1000),
    formattedCountdown: '',
    nextSessionDate: tomorrowSessionStart,
    underContainerText: `today live session completed next session ${tomorrowFormatted}`,
  };
}
