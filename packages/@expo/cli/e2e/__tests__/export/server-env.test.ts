/* eslint-env jest */
import execa from 'execa';

import { runExportSideEffects } from './export-side-effects';
import { bin, getRouterE2ERoot } from '../utils';

runExportSideEffects();

const projectRoot = getRouterE2ERoot();

it(`asserts the server env isn't correct`, async () => {
  await expect(
    execa('node', [bin, 'start', '--port', '3002'], {
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
}, 10000);
