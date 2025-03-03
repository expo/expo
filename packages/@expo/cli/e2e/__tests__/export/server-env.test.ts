/* eslint-env jest */
import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

const projectRoot = getRouterE2ERoot();

it(`asserts the server env isn't correct`, async () => {
  const [major] = process.versions.node.split('.').map(Number);
  if (major >= 23) {
    expect(true).toBe(true);
    // `--no-experimental-fetch` is a legacy flag fetch it not experimental in Node.js 23+
    return;
  }
  await expect(
    executeExpoAsync(projectRoot, ['start', '--port', '3002'], {
      verbose: false,
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
