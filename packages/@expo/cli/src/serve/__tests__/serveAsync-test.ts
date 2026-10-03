import { vol } from 'memfs';
import { once } from 'node:events';
import http from 'node:http';

import { serveAsync } from '../serveAsync';

jest.mock('../../utils/nodeEnv', () => ({ loadEnvFiles: jest.fn() }));
jest.mock('../../utils/port', () => ({
  // Bind to port 0 so the OS assigns a free ephemeral port to every test server.
  resolveMetroPortAsync: jest.fn(async () => 0),
}));

const indexHtml = `<!DOCTYPE html><html><body><div id="root">single-page shell</div></body></html>`;
const exploreHtml = `<!DOCTYPE html><html><body><div id="root">prerendered explore</div></body></html>`;

/** A `web.output: 'single'` export: only `index.html`, no `_expo/.routes.json`. */
function singlePageExport(projectRoot: string) {
  return {
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'single-app' }),
    [`${projectRoot}/dist/index.html`]: indexHtml,
    [`${projectRoot}/dist/_expo/static/js/web/entry-abc123.js`]: `console.log('entry')`,
  };
}

/** A `web.output: 'static'` export: one HTML file per route, plus `_expo/.routes.json`. */
function staticExport(projectRoot: string) {
  return {
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'static-app' }),
    [`${projectRoot}/dist/index.html`]: indexHtml,
    [`${projectRoot}/dist/explore.html`]: exploreHtml,
    [`${projectRoot}/dist/_expo/.routes.json`]: JSON.stringify({}),
    [`${projectRoot}/dist/_expo/static/js/web/entry-abc123.js`]: `console.log('entry')`,
  };
}

const servers: http.Server[] = [];
const createServer = http.createServer;

beforeEach(() => {
  vol.reset();
  jest.spyOn(http, 'createServer').mockImplementation((...args: any[]) => {
    const server = (createServer as any)(...args);
    servers.push(server);
    return server;
  });
});

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve)))
  );
});

/** Serve `<projectRoot>/dist` and return the ephemeral port it is listening on. */
async function serveFixtureAsync(projectRoot: string): Promise<number> {
  await serveAsync(projectRoot, { isDefaultDirectory: true });

  const server = servers[servers.length - 1];
  if (!server) {
    throw new Error('Expected `serveAsync` to have created an HTTP server');
  }
  if (!server.listening) {
    await once(server, 'listening');
  }

  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error(`Expected the server to be listening on a TCP port, found: ${address}`);
  }
  return address.port;
}

/** Request a URL the way a browser requests a document, e.g. a reload or a deep link. */
function navigateAsync(port: number, pathname: string) {
  return fetch(`http://127.0.0.1:${port}${pathname}`, {
    headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  });
}

describe(serveAsync, () => {
  describe(`web.output: 'single'`, () => {
    it(`serves index.html for a client-side route`, async () => {
      vol.fromJSON(singlePageExport('/single-app'));

      const port = await serveFixtureAsync('/single-app');
      const response = await navigateAsync(port, '/explore');

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/text\/html/);
      await expect(response.text()).resolves.toBe(indexHtml);
    });

    it(`serves index.html for a nested client-side route`, async () => {
      vol.fromJSON(singlePageExport('/single-app'));

      const port = await serveFixtureAsync('/single-app');
      const response = await navigateAsync(port, '/products/42?ref=email');

      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toBe(indexHtml);
    });

    it(`returns 404 for a missing asset instead of the HTML shell`, async () => {
      vol.fromJSON(singlePageExport('/single-app'));

      const port = await serveFixtureAsync('/single-app');
      const response = await fetch(
        `http://127.0.0.1:${port}/_expo/static/js/web/entry-missing.js`,
        { headers: { accept: '*/*' } }
      );

      expect(response.status).toBe(404);
      await expect(response.text()).resolves.toBe('Not Found');
    });

    it(`serves existing files as-is`, async () => {
      vol.fromJSON(singlePageExport('/single-app'));

      const port = await serveFixtureAsync('/single-app');
      const response = await fetch(`http://127.0.0.1:${port}/_expo/static/js/web/entry-abc123.js`);

      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toBe(`console.log('entry')`);
    });
  });

  describe(`web.output: 'static'`, () => {
    it(`returns 404 for an unknown route`, async () => {
      vol.fromJSON(staticExport('/static-app'));

      const port = await serveFixtureAsync('/static-app');
      const response = await navigateAsync(port, '/does-not-exist');

      expect(response.status).toBe(404);
      await expect(response.text()).resolves.toBe('Not Found');
    });

    it(`serves the prerendered HTML file for a known route`, async () => {
      vol.fromJSON(staticExport('/static-app'));

      const port = await serveFixtureAsync('/static-app');
      const response = await navigateAsync(port, '/explore');

      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toBe(exploreHtml);
    });
  });

  it(`returns 404 when the export has no index.html`, async () => {
    vol.fromJSON({
      '/native-app/package.json': JSON.stringify({ name: 'native-app' }),
      '/native-app/dist/_expo/static/js/ios/entry-abc123.hbc': `native bundle`,
    });

    const port = await serveFixtureAsync('/native-app');
    const response = await navigateAsync(port, '/explore');

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe('Not Found');
  });
});
