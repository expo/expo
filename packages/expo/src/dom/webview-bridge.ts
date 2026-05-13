import { type MarshalledProps } from './dom-entry';

interface WebViewBridge {
  postMessage: (message: string) => void;
  injectedObjectJson: () => string;
}

interface WebViewWindow extends Window {
  ReactNativeWebView?: WebViewBridge;
}

function readBridge(): WebViewBridge | undefined {
  return typeof window !== 'undefined' ? (window as WebViewWindow).ReactNativeWebView : undefined;
}

/**
 * Whether the react-native-webview bridge is available in the current runtime.
 * Use this to branch on DOM Component context; use `getWebViewBridge()` to
 * actually interact with the bridge.
 */
export function hasWebViewBridge(): boolean {
  return readBridge() != null;
}

/**
 * Returns the react-native-webview bridge for DOM Component code. Throws when
 * the bridge is not available (e.g. the same module being evaluated outside of
 * a WebView); guard with `hasWebViewBridge()` when the caller may run in both
 * contexts.
 */
export function getWebViewBridge(): WebViewBridge {
  const bridge = readBridge();
  if (!bridge) {
    throw new Error(
      'The react-native-webview bridge (window.ReactNativeWebView) is not available. ' +
        'This module must only be called from code running inside a DOM Component WebView. ' +
        'Guard the call with hasWebViewBridge() when the caller may also run on web or React Native.'
    );
  }
  return bridge;
}

declare global {
  interface Window {
    $$EXPO_DOM_HOST_OS?: string;
    $$EXPO_INITIAL_PROPS?: MarshalledProps;
  }
}
