import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { parse } from 'node:url';
import { promisify } from 'node:util';
import { ClientOptions, WebSocket } from 'ws';

import { createMetroMiddleware } from '../createMetroMiddleware';

export function withMetroServer(projectRoot = '/project'): {
  projectRoot: string;
  metro: ReturnType<typeof createMetroMiddleware>;
  server: ReturnType<typeof createServer> & {
    fetch: (url: string, init?: RequestInit) => Promise<Response>;
    connect: (url: string) => WebSocket;
  };
} {
  const metro = createMetroMiddleware({ projectRoot });
  const server = createServer(metro.middleware);

  const closeServer = promisify(server.close.bind(server));
  const closeSockets = () =>
    Promise.all(
      Object.values(metro.websocketEndpoints).map(async (socket) => {
        socket.clients.forEach((client) => client.terminate());

        // Wait until all clients have been disconnected
        await waitForExpect(() => expect(socket.clients.size).toBe(0));
      })
    );

  // Ensure the websockets can be tested
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!);
    if (pathname != null && metro.websocketEndpoints[pathname]) {
      metro.websocketEndpoints[pathname].handleUpgrade(request, socket, head, (ws) => {
        metro.websocketEndpoints[pathname].emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  function listen() {
    return new Promise<void>((resolve) => {
      server.listen(() => {
        const address = server.address() as AddressInfo;
        const hostname = address.family === 'IPv6' ? `[${address.address}]` : address.address;

        Object.defineProperty(server, 'fetch', {
          value: (url = '', init?: RequestInit) =>
            fetch(`http://${hostname}:${address.port}${url}`, init),
        });

        Object.defineProperty(server, 'connect', {
          value: (url = '', options?: ClientOptions) =>
            new WebSocket(`ws://${hostname}:${address.port}${url}`),
        });

        resolve();
      });
    });
  }

  beforeAll(() => listen());
  afterAll(() => closeSockets().finally(() => closeServer()));
  afterEach(() => closeSockets());

  return { metro, server: server as any, projectRoot };
}

/**
 * Retry a given expect statements a couple of times before failing or passing.
 * This is useful for async tests that may need to wait a short period of time before the assertion is true.
 *
 * @see https://github.com/TheBrainFamily/wait-for-expect/blob/6be6e2ed8e47fd5bc62ab2fc4bd39289c58f2f66/src/index.ts
 */
export function waitForExpect(
  expectation: () => void | Promise<void>,
  timeout = 4000,
  interval = 50
) {
  const setTimeout = runWithRealTimers(() => globalThis.setTimeout);
  const triesMaxCount = Math.ceil(timeout / interval);
  let triesCount = 0;

  return new Promise<void>((resolve, reject) => {
    const retryOnReject = (error: Error) => {
      if (triesCount > triesMaxCount) {
        return reject(error);
      }

      setTimeout(runExpectation, interval);
    };

    function runExpectation() {
      triesCount++;

      try {
        Promise.resolve(expectation()).then(resolve).catch(retryOnReject);
      } catch (error) {
        retryOnReject(error);
      }
    }

    runExpectation();
  });
}

function runWithRealTimers<T>(callback: () => T): T {
  const usingJestFakeTimers =
    (globalThis.setTimeout as any)._isMockFunction && typeof jest !== 'undefined';

  if (usingJestFakeTimers) {
    jest.useRealTimers();
  }

  const result = callback();

  if (usingJestFakeTimers) {
    jest.useFakeTimers();
  }

  return result;
}
