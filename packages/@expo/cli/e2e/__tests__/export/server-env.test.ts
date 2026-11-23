import semver from 'semver';

import { executeExpoAsync } from '../../utils/expo';
import { getServerTesterRoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

const projectRoot = getServerTesterRoot();

// TODO: drop this test when the oldest supported Node version is >=23
(semver.major(process.versions.node) >= 23 ? it.skip : it)(
  `asserts the server env isn't correct`,
  async () => {
    await expect(
      executeExpoAsync(projectRoot, ['start', '--port', '3002'], {
        verbose: false,
        env: {
          NODE_ENV: 'production',
          E2E_ROUTER_WEB_OUTPUT: 'server',
          E2E_ROUTER_ASYNC: 'development',
          NODE_OPTIONS: '--no-experimental-fetch',
        },
      })
    ).rejects.toThrow(
      /NODE_OPTIONS="--no-experimental-fetch" is not supported with Expo server. Node.js built-in Request\/Response APIs are required to continue./
    );
  }
);
