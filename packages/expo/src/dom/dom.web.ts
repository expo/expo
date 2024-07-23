export { StyleNoSelect } from './webview-wrapper';

export function isWebview() {
  return (
    typeof window !== 'undefined' &&
    // @ts-expect-error: Added via react-native-webview
    typeof window.ReactNativeWebView !== 'undefined'
  );
}
