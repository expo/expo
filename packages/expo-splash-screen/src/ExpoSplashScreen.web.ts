export default {
  get name(): string {
    return 'ExpoSplashScreen';
  },
  preventAutoHideAsync() {
    return false;
  },
  hideAsync() {
    return false;
  },
};
