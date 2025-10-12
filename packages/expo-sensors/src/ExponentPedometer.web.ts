export default {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  async isRecordingAvailableAsync(): Promise<boolean> {
    return false;
  },
  async startEventUpdates(): Promise<boolean> {
    return false;
  },
  async stopEventUpdates(): Promise<void> {
    // no-op on web
  },
  async subscribeRecording(): Promise<void> {
    // no-op on web
  },
  async unsubscribeRecording(): Promise<void> {
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
