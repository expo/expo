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
const updateDistPath = path.join(process.env.ARTIFACTS_DEST, 'dist-assets');

describe('Asset deletion recovery', () => {
  afterEach(async () => {
    await Simulator.uninstallApp();
    Server.stop();
  });

  it('embedded assets deleted from internal storage should be re-copied', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(SERVER_PORT);

    await Simulator.installApp('assets');
    // set up promise before starting the app to ensure the correct response is sent
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

    // set up promise before starting the app to ensure the correct response is sent
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
    // set up promise before starting the app to ensure the correct response is sent
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

    // set up promise before starting the app to ensure the correct response is sent
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

  it('assets in a downloaded update deleted from internal storage should be re-copied or re-downloaded', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);

    // prepare manifest and assets for hosting
    const bundleFilename = 'bundle-assets.js';
    const newNotifyString = 'test-assets-1';
    const bundleHash = await copyBundleToStaticFolder(
      updateDistPath,
      bundleFilename,
      newNotifyString
    );
    const { bundledAssets } = require(path.join(
      updateDistPath,
      Simulator.ExportedManifestFilename
    ));
    const assets = await Promise.all(
      bundledAssets.map(async (filename) => {
        const key = filename.replace('asset_', '').replace(/\.[^/.]+$/, '');
        const hash = await copyAssetToStaticFolder(
          path.join(updateDistPath, 'assets', key),
          filename
        );
        return {
          hash,
          key,
          contentType: 'image/jpg',
          fileExtension: '.jpg',
          url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${filename}`,
        };
      })
    );
    const manifest = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      runtimeVersion: RUNTIME_VERSION,
      launchAsset: {
        hash: bundleHash,
        key: 'test-assets-bundle',
        contentType: 'application/javascript',
        url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${bundleFilename}`,
      },
      assets,
      metadata: {},
      extra: {},
    };

    Server.start(SERVER_PORT);
    await Server.serveSignedManifest(manifest, projectRoot);
    await Simulator.installApp('assets');
    await Simulator.startApp();
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // only the bundle should be new

    // restart the app so it will launch the new update
    await Simulator.stopApp();

    // send instructions to clear the internal assets dir
    // while also verifying that the new update is running
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await Simulator.startApp();
    const updatedMessage = await promise;
    expect(updatedMessage).toBe(newNotifyString);

    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(4); // png, ttf, 2 JS bundles
    expect(clearAssetsMessage.numFilesAfter).toBe(0);
    expect(clearAssetsMessage.updateId).toEqual(manifest.id);

    await Simulator.stopApp();

    // set up promise before starting the app to ensure the correct response is sent
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    await Simulator.startApp();
    const updatedMessageAfterClearExpoInternal = await promise2;
    expect(updatedMessageAfterClearExpoInternal).toBe(newNotifyString);

    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }
    expect(readAssetsMessage.numFiles).toEqual(manifest.assets.length + 1); // assets + JS bundle
    expect(readAssetsMessage.updateId).toEqual(manifest.id);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // should have re-downloaded only the JS bundle; the rest should have been copied from the app binary
  });
});
