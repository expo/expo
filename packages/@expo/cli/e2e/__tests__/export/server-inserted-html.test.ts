/* eslint-env jest */
import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { getHtml } from '../utils';

runExportSideEffects();

describe('exports server with server-inserted HTML', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
      fixtureName: 'server-inserted-html',
      export: {
        env: {
          E2E_ROUTER_SERVER_RENDERING: 'true',
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('streams suspense content with the server-resolved data', async () => {
      const html = getHtml(await server.fetchAsync('/').then((res) => res.text()));

      expect(html.querySelector('[data-testid="index-text"]')?.textContent).toEqual('Index');
      expect(html.querySelector('[data-testid="fast-value"]')?.textContent).toEqual('fast-data');
      expect(html.querySelector('[data-testid="slow-value"]')?.textContent).toEqual('slow-data');
    });

    it('injects a data script for each suspense boundary before the React chunk revealing it', async () => {
      const html = await server.fetchAsync('/').then((res) => res.text());

      const fastScriptIndex = html.indexOf('["fast","fast-data"]');
      const slowScriptIndex = html.indexOf('["slow","slow-data"]');
      const fastContentIndex = html.indexOf('data-testid="fast-value"');
      const slowContentIndex = html.indexOf('data-testid="slow-value"');

      // Both boundaries flushed an inserted script with the serialized data
      expect(fastScriptIndex).toBeGreaterThanOrEqual(0);
      expect(slowScriptIndex).toBeGreaterThanOrEqual(0);

      // The inserted script is emitted before the React chunk that reveals the
      // suspense content using the data, so it executes before hydration of
      // that boundary can run on the client.
      expect(fastScriptIndex).toBeLessThan(fastContentIndex);
      expect(slowScriptIndex).toBeLessThan(slowContentIndex);

      // The boundaries resolved in order of their delays
      expect(fastContentIndex).toBeLessThan(slowScriptIndex);
    });

    it('streams the suspense fallbacks in the shell', async () => {
      const html = await server.fetchAsync('/').then((res) => res.text());

      expect(html).toContain('data-testid="fast-fallback"');
      expect(html).toContain('data-testid="slow-fallback"');
    });
  });
});
