import execa from 'execa';

import { runExportSideEffects } from './export-side-effects';
import { bin, ensurePortFreeAsync, getRouterE2ERoot } from '../utils';

runExportSideEffects();

const projectRoot = getRouterE2ERoot();
it(`asserts the server env isn't correct`, async () => {
  await ensurePortFreeAsync(8081);

  await expect(
    execa('node', [bin, 'start'], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'server',
        E2E_ROUTER_ASYNC: 'development',
        EXPO_USE_FAST_RESOLVER: 'true',
        NODE_OPTIONS: '--no-experimental-fetch',
      },
    })
  ).rejects.toThrow(
    /NODE_OPTIONS="--no-experimental-fetch" is not supported with Expo server. Node.js built-in Request\/Response APIs are required to continue./
  );
});
afterAll(async () => {
  await ensurePortFreeAsync(8081);
});
