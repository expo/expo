// TODO: (barthap) Create this stub on iOS native side instead
export default {
  get name(): string {
    return 'ExpoLightSensor';
  },
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
  startObserving() {},
  stopObserving() {},
  addListener() {},
  removeListeners() {},
};
