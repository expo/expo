import type { ConsoleMessage, Page, Request } from '@playwright/test';

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

export async function replayRequestText(request: Request) {
  const headers = { ...request.headers() };
  delete headers.connection;
  delete headers['content-length'];
  delete headers.host;

  const response = await fetch(request.url(), {
    method: request.method(),
    headers,
    body: request.postData() ?? undefined,
  });

  return await response.text();
}
