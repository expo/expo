// TODO: Maybe this could be a bundler global instead.
export const IS_DOM =
  typeof window !== 'undefined' &&
  // @ts-expect-error: Added via react-native-webview
  typeof window.ReactNativeWebView !== 'undefined';
