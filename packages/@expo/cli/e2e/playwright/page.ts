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
