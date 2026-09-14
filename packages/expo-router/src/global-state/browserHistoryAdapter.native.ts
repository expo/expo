import type { BrowserHistoryAdapter } from './browserHistoryTypes';

// There is no browser history on native; the reducer never produces browser commands here either.
export function createBrowserHistoryAdapter(): BrowserHistoryAdapter {
  return {
    apply: () => {},
    listen: () => () => {},
  };
}
