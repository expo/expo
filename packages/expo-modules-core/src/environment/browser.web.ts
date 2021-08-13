declare global {
  // Add IE-specific interface to Window
  interface Window {
    attachEvent(event: string, listener: EventListener): boolean;
  }
}

// Used for delegating node actions when browser APIs aren't available
// like in SSR websites.
export const isDOMAvailable = typeof window !== 'undefined' && !!window.document?.createElement;
export const canUseEventListeners =
  isDOMAvailable && !!(window.addEventListener || window.attachEvent);
export const canUseViewport = isDOMAvailable && !!window.screen;
