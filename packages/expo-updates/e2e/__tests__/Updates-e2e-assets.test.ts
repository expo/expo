import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers/promises';
import uuid from 'uuid/v4';

import * as Server from './utils/server';
import * as Simulator from './utils/simulator';
import { copyAssetToStaticFolder, copyBundleToStaticFolder } from './utils/update';

const SERVER_HOST = process.env.UPDATES_HOST;
const SERVER_PORT = parseInt(process.env.UPDATES_PORT, 10);

const RUNTIME_VERSION = '1.0.0';

const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

const repoRoot = process.env.EXPO_REPO_ROOT;
if (!repoRoot) {
  throw new Error(
    'You must provide the path to the repo root in the EXPO_REPO_ROOT environment variable'
  );
}

const projectRoot = process.env.TEST_PROJECT_ROOT ?? path.resolve(repoRoot, '..', 'updates-e2e');
const updateDistPath = path.join(projectRoot, 'dist-assets');

describe('Asset deletion recovery', () => {
  afterEach(async () => {
    // await Simulator.uninstallApp();
    Server.stop();
  });

  it('embedded assets deleted from internal storage should be re-copied', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(SERVER_PORT);
    Server.setResponses([{ command: 'clearExpoInternal' }, { command: 'readExpoInternal' }]);
    const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
    expect(response).toBe('test');

    const response2 = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
    if (!response2.success) {
      throw new Error(response2.error);
    }
    expect(response2.success).toBe(true);

    const response3 = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
    if (!response3.success) {
      throw new Error(response3.error);
    }
    expect(response3.success).toBe(true);
    expect(response3.numFiles).toBe(1);
  });

  xit('embedded assets deleted from internal storage should be re-copied from a new embedded update', async () => {});

  xit('assets in a downloaded update deleted from internal storage should be re-copied if embedded', async () => {});

  xit('downloaded assets deleted from internal storage should be re-downloaded', async () => {});
});
