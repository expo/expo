// Globals every Expo file can use: React Native's, the ones shared by Node and browsers, and
// the browser-only ones.
export function useGlobals() {
  const timer = setTimeout(() => clearTimeout(timer), 0);
  const url = new URL('https://expo.dev');
  const controller = new AbortController();
  const bytes = new TextEncoder().encode(url.href);
  const copy = structuredClone({ bytes });
  const frame = requestAnimationFrame(() => cancelAnimationFrame(frame));
  const body = document.body;
  return __DEV__ ? { controller, copy, body, position: navigator.geolocation } : null;
}
