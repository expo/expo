/**
 * A re-export of `@expo/dom-webview` that supports optional dependency.
 */

let module;
try {
  module = require('@expo/dom-webview').WebView;
} catch {}

export default module;
