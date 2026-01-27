/* eslint-env jest */
import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
  setupServer,
} from '../../utils/runtime';
import { getHtml } from '../utils';

runExportSideEffects();

describe('middleware matchers', () => {
  const configs = prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START], {
    fixtureName: 'server-middleware-matcher-async',
    export: {
      env: {
        E2E_ROUTER_SERVER_MIDDLEWARE: 'true',
      },
    },
  });

  describe('pattern matching', () => {
    describe.each(configs)('$name', (config) => {
      const server = setupServer(config, {
        serve: {
          env: {
            E2E_MIDDLEWARE_MATCHER_PATTERNS: JSON.stringify([
              '/api',
              '/posts/[postId]',
              '/catch-all/[...everything]',
            ]),
          },
        },
      });

      it('runs middleware when pattern matches an exact route', async () => {
        const response = await server.fetchAsync('/api');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('runs middleware when pattern matches a named parameter route', async () => {
        const response = await server.fetchAsync('/posts/1');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('runs middleware when pattern matches a catch-all route', async () => {
        const response = await server.fetchAsync('/catch-all/everything/1/2/3');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('does not run middleware when pattern does not match', async () => {
        const response = await server.fetchAsync('/');
        expect(response.status).toBe(200);
        const html = getHtml(await response.text());
        expect(html.querySelector('[data-testid="title"]')?.textContent).toBe('Index');
      });
    });
  });

  describe('method matching', () => {
    describe.each(configs)('$name', (config) => {
      const server = setupServer(config, {
        serve: {
          env: {
            E2E_MIDDLEWARE_MATCHER_METHODS: JSON.stringify(['POST']),
          },
        },
      });

      it('runs middleware when method matches', async () => {
        const response = await server.fetchAsync('/api', { method: 'POST' });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('does not run middleware when method does not match', async () => {
        const response = await server.fetchAsync('/api');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ method: 'get', route: 'api' });
      });
    });
  });

  describe('combined method and pattern matching', () => {
    describe.each(configs)('$name', (config) => {
      const server = setupServer(config, {
        serve: {
          env: {
            E2E_MIDDLEWARE_MATCHER_METHODS: JSON.stringify(['POST']),
            E2E_MIDDLEWARE_MATCHER_PATTERNS: JSON.stringify(['/api']),
          },
        },
      });

      it('runs middleware when both method and pattern match', async () => {
        const response = await server.fetchAsync('/api', { method: 'POST' });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('does not run middleware when pattern matches but method does not', async () => {
        const response = await server.fetchAsync('/api');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ method: 'get', route: 'api' });
      });

      it('does not run middleware when method matches but pattern does not', async () => {
        const response = await server.fetchAsync('/data', { method: 'POST' });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ method: 'post', route: 'data' });
      });
    });
  });

  describe('no matchers (should run on all requests)', () => {
    describe.each(configs)('$name', (config) => {
      const server = setupServer(config);

      it('runs middleware on root route when no matchers defined', async () => {
        const response = await server.fetchAsync('/');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });

      it('runs middleware on api route when no matchers defined', async () => {
        const response = await server.fetchAsync('/api');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ match: true });
      });
    });
  });
});
