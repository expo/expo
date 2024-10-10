/**
 * A re-export of `react-native-webview` that supports optional dependency.
 */

let module;
try {
  module = require('react-native-webview').WebView;
} catch {}

export default module;

export type { WebView as RNWebView, WebViewProps as RNWebViewProps } from 'react-native-webview';
