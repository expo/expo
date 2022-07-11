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
    await Simulator.uninstallApp();
    Server.stop();
  });

  it('embedded assets deleted from internal storage should be re-copied', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(SERVER_PORT);

    await Simulator.installApp('assets');
    // set up promise before starting the app so the correct response is sent
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await Simulator.startApp();
    await promise;

    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(3); // JS bundle, png, ttf
    expect(clearAssetsMessage.numFilesAfter).toBe(0);

    await Simulator.stopApp();

    // set up promise before starting the app so the correct response is sent
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    await Simulator.startApp();
    await promise2;

    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }
    expect(readAssetsMessage.numFiles).toEqual(clearAssetsMessage.numFilesBefore);

    expect(readAssetsMessage.updateId).toEqual(clearAssetsMessage.updateId);
  });

  it('embedded assets deleted from internal storage should be re-copied from a new embedded update', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(SERVER_PORT);

    await Simulator.installApp('assets');
    // set up promise before starting the app so the correct response is sent
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await Simulator.startApp();
    await promise;

    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(3); // JS bundle, png, ttf
    expect(clearAssetsMessage.numFilesAfter).toBe(0);

    await Simulator.stopApp();

    await Simulator.installApp('assets2');

    // set up promise before starting the app so the correct response is sent
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    await Simulator.startApp();
    await promise2;

    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }
    expect(readAssetsMessage.numFiles).toEqual(clearAssetsMessage.numFilesBefore);

    expect(readAssetsMessage.updateId).not.toEqual(clearAssetsMessage.updateId);
  });

  xit('assets in a downloaded update deleted from internal storage should be re-copied or re-downloaded', async () => {});
});
