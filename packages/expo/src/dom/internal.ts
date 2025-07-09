export { default as WebView } from './webview-wrapper';

// Skip all dom-only functions to give 'undefined is not a function' errors.
export const registerDOMComponent: undefined | typeof import('./dom-entry').registerDOMComponent =
  undefined;
