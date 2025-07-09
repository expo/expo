import { Page, WebSocket } from '@playwright/test';
import fs from 'node:fs';

import { createExpoStart } from './expo';

export function makeHotPredicate(predicate: (data: Record<string, any>) => boolean) {
  return ({ payload }: { payload: string | Buffer }) => {
    const event = JSON.parse(typeof payload === 'string' ? payload : payload.toString());
    return predicate(event);
  };
}

export async function openPageAndEagerlyLoadJS(
  expo: ReturnType<typeof createExpoStart>,
  page: Page,
  url?: string
) {
  // Keep track of the `/message` socket, which is used to control the device programmatically
  const messageSocketPromise = page.waitForEvent('websocket', (ws) =>
    ws.url().endsWith('/message')
  );
  // Keep track of the `/hot` socket, which is used for HMR - and validate HMR fully initializes
  const hotSocketPromise = page
    .waitForEvent('websocket', (ws) => ws.url().endsWith('/hot'))
    .then((ws) => waitForHmrRegistration(ws));

  // Navigate to the page
  console.time('Open page');
  await page.goto(url || expo.url.href);
  console.timeEnd('Open page');

  // Ensure the sockets are registered
  const [hotSocket] = await Promise.all([
    raceOrFail(hotSocketPromise, 500, 'HMR on client took too long to connect.'),
    raceOrFail(messageSocketPromise, 500, 'Message socket on client took too long to connect.'),
  ]);

  return {
    waitForFashRefresh: () => waitForFashRefresh(hotSocket),
  };
}

export async function waitForHmrRegistration(ws: WebSocket): Promise<WebSocket> {
  // Ensure the entry point is registered
  await ws.waitForEvent('framesent', {
    predicate: makeHotPredicate(
      (event) => event.type === 'register-entrypoints' && !!event.entryPoints.length
    ),
  });

  // Observe the handshake with Metro
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => event.type === 'bundle-registered'),
  });

  return ws;
}

export async function waitForFashRefresh(ws: WebSocket): Promise<WebSocket> {
  // Metro begins the HMR process
  await raceOrFail(
    ws.waitForEvent('framereceived', {
      predicate: makeHotPredicate((event) => {
        return event.type === 'update-start';
      }),
    }),
    1000,
    'Metro took too long to detect the file change and start the HMR process.'
  );

  // Metro sends the HMR mutation
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => {
      return event.type === 'update' && !!event.body.modified.length;
    }),
  });

  // Metro completes the HMR update
  await ws.waitForEvent('framereceived', {
    predicate: makeHotPredicate((event) => {
      return event.type === 'update-done';
    }),
  });

  return ws;
}

export function raceOrFail<T>(promise: Promise<T>, timeout: number, message: string) {
  return Promise.race<T>([
    // Wrap promise with profile logging
    (async () => {
      const start = Date.now();
      const value = await promise;
      const end = Date.now();
      console.log('Resolved:', end - start + 'ms');
      return value;
    })(),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Test was too slow (${timeout}ms): ${message}`));
      }, timeout);
    }),
  ]);
}

export const mutateFile = async (file: string, mutator: (contents: string) => string) => {
  const indexContents = await fs.promises.readFile(file, 'utf8');
  await fs.promises.writeFile(file, mutator(indexContents), 'utf8');
};
