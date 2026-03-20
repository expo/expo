export default {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async isRecordingAvailableAsync(): Promise<boolean> {
    return false;
  },
  async isEventTrackingAvailableAsync(): Promise<boolean> {
    return false;
  },
  async startEventUpdates(): Promise<void> {
    // no-op on web
  },
  async stopEventUpdates(): Promise<void> {
    // no-op on web
  },
  async subscribeRecordingAsync(): Promise<void> {
    // no-op on web
  },
  async unsubscribeRecordingAsync(): Promise<void> {
    // no-op on web
  },
  addListener() {
    return {
      remove() {},
    };
  },
  removeListeners() {},
  startObserving() {},
  stopObserving() {},
};
