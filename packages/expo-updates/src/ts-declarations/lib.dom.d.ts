// Expose this file as a module (see https://stackoverflow.com/a/59499895/4337317)
export {};

/**
 * Handle deprecations and missing typings that not available in the main lib.dom.d.ts file.
 */
declare global {
  interface Location {
    /**
     * @param forcedReload - Firefox non-standard parameter to force reload the page (re-fetch the same URL from the server omitting cache) (see https://developer.mozilla.org/en-US/docs/Web/API/Location/reload).
     */
    reload(forcedReload?: boolean): void;
  }
}
