// Web-only files may use browser globals.
export function useBrowserGlobals() {
  localStorage.setItem('key', document.title);
  return window.location.href;
}
