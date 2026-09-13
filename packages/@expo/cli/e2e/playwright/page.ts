import { expect, type ConsoleMessage, type Page, type Request } from '@playwright/test';

export async function waitForLoaderData(page: Page, data: unknown) {
  await expect(page.locator('[data-testid="loader-result"]')).toHaveText(
    JSON.stringify(data, null, 2)
  );
}

/** Collect all console and thrown errors of the page */
export function pageCollectErrors(page: Page) {
  const collected = {
    errors: [] as Error[],
    logs: [] as ConsoleMessage[],
    warnings: [] as ConsoleMessage[],
    all: [] as (Error | ConsoleMessage)[],
  };

  page.on('console', (log) => {
    if (log.type() === 'error') {
      collected.logs.push(log);
      collected.all.push(log);
    } else if (log.type() === 'warning') {
      collected.warnings.push(log);
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

/**
 * Statuses of network-served responses for a loader path. Browser-cache hits are excluded via
 * CDP's `fromDiskCache` (Playwright responses don't expose it), so a non-growing status list
 * proves a cache hit.
 */
export async function trackLoaderNetworkStatuses(page: Page, pathname: string): Promise<number[]> {
  const session = await page.context().newCDPSession(page);
  const requestUrls = new Map<string, string>();
  const statuses: number[] = [];

  await session.send('Network.enable');
  session.on('Network.requestWillBeSent', ({ requestId, request }) => {
    requestUrls.set(requestId, request.url);
  });
  session.on('Network.responseReceived', ({ requestId, response }) => {
    if (requestUrls.get(requestId)?.includes(pathname) && !response.fromDiskCache) {
      statuses.push(response.status);
    }
  });

  return statuses;
}
