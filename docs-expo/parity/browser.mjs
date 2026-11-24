import { chromium } from 'playwright-core';

// The URL of each build. `serve.mjs` serves an output directory on a port.
export const BUILDS = {
  next: process.env.NEXT_URL ?? 'http://127.0.0.1:8101',
  expo: process.env.EXPO_URL ?? 'http://127.0.0.1:8102',
};

/** Starts Chromium. Set `CHROMIUM_PATH` to use a browser that Playwright did not install. */
export function launchBrowser() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
}

/** Makes a browser context that stops each request to a different origin. */
export async function newContext(browser, baseUrl, options) {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    ...options,
  });
  await context.route(
    url => !url.href.startsWith(baseUrl),
    route => route.abort()
  );
  return context;
}
