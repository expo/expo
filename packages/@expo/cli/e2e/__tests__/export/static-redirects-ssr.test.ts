import type { RedirectConfig } from 'expo-router';

import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPRESS_SERVER,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe.each(
  prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPRESS_SERVER, RUNTIME_WORKERD], {
    app: 'server-tester',
    uniqueOutputKey: 'redirects-ssr',
    export: {
      env: {
        E2E_ROUTER_REDIRECTS: JSON.stringify([
          { source: '/redirects/external', destination: 'https://expo.dev' },
        ] satisfies RedirectConfig[]),
      },
    },
  })
)('external redirects - $name', (config) => {
  const server = setupServer(config);

  it('gets an external URL redirect', async () => {
    const res = await server.fetchAsync('/redirects/external');
    expect(res.status).toBe(200);
    expect(res.url).toBe('https://expo.dev/');
  });
});
