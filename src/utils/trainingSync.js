// Real-time synchronization broadcaster and subscriber for tutorial videos and groups

const CHANNEL_NAME = 'elderoplus_training_channel';
const STORAGE_KEY = 'elderoplus_training_sync';

/**
 * Broadcast an update event across the current tab and all open tabs/windows
 * @param {Object} detail - Optional metadata about the update (e.g. { type: 'video_saved' })
 */
export function broadcastTrainingUpdate(detail = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    type: 'TRAINING_UPDATED',
    timestamp: Date.now(),
    ...detail,
  };

  // 1. Dispatch custom event for current window/tab
  try {
    window.dispatchEvent(new CustomEvent('elderoplus:training-updated', { detail: payload }));
  } catch (e) {
    // Ignore environments where CustomEvent might be restricted
  }

  // 2. Broadcast to all open tabs in same browser via BroadcastChannel
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch (e) {
      // Ignore if BroadcastChannel fails
    }
  }

  // 3. Fallback for older browsers via localStorage storage event
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // Ignore storage quota or disabled storage
  }
}

/**
 * Subscribe to tutorial videos & categories changes
 * @param {Function} callback - Called when training updates are detected
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToTrainingUpdates(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {};
  }

  // Handler for window CustomEvent
  const handleCustomEvent = (e) => {
    callback(e.detail || {});
  };
  window.addEventListener('elderoplus:training-updated', handleCustomEvent);

  // Handler for BroadcastChannel across tabs
  let channel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'TRAINING_UPDATED') {
          callback(event.data);
        }
      };
    } catch (e) {
      // BroadcastChannel unavailable
    }
  }

  // Handler for Storage event across windows
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        callback(data);
      } catch {
        callback({});
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('elderoplus:training-updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      try {
        channel.close();
      } catch (e) {
        // Ignore
      }
    }
  };
}
