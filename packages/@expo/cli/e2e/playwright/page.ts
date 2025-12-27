import type { ConsoleMessage, Page } from '@playwright/test';

/** Collect all console and thrown errors of the page */
export function pageCollectErrors(page: Page) {
  const collected = {
    errors: [] as Error[],
    logs: [] as ConsoleMessage[],
    all: [] as (Error | ConsoleMessage)[],
  };

  page.on('console', (log) => {
    if (log.type() === 'error') {
      // Ignore 404 errors for non-essential resources (favicon, etc.)
      const text = log.text();
      const location = log.location();
      if (
        text.includes('Failed to load resource') &&
        text.includes('404') &&
        (location.url.includes('favicon') || !location.url.includes('.js'))
      ) {
        return;
      }
      collected.logs.push(log);
      collected.all.push(log);
    }
  });

  page.on('pageerror', (error) => {
    collected.errors.push(error);
    collected.all.push(error);
  });

  return collected;
}
