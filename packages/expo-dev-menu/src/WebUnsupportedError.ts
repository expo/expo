export default class WebUnsupportedError extends Error {
  constructor() {
    super("`expo-dev-menu` isn't supported on Expo Web.");
  }
}
