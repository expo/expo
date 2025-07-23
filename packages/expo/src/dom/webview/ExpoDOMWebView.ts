/**
 * A re-export of `@expo/dom-webview` that supports optional dependency.
 */

let module: undefined | typeof import('@expo/dom-webview').WebView;
try {
  module = require('@expo/dom-webview').WebView;
} catch {}

export default module;
