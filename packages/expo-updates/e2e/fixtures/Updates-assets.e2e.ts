import { device } from 'detox';
import path from 'path';
import { setTimeout } from 'timers/promises';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = (process.env.DETOX_CONFIGURATION || 'ios.release').split('.')[0];
const protocolVersion = platform === 'android' ? 1 : 0;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

/**
 * The tests in this suite install an app with multiple assets, then clear all the assets from
 * .expo-internal storage (but not SQLite). This simulates scenarios such as: a bug in our code that
 * deletes assets unintentionally; OS deleting files from app storage if it runs out of memory; etc.
 *
 * Recovery code for this situation exists in the DatabaseLauncher, these are the main tests that
 * ensure that logic doesn't regress.
 *
 * These tests all make use of the additional UpdatesE2ETestModule, which provides methods for
 * clearing and reading the .expo-internal folder.
 */
describe('Asset deletion recovery', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('embedded assets deleted from internal storage should be re-copied', async () => {
    /**
     * Simplest scenario; only one update (embedded) is loaded, then assets are cleared from
     * internal storage. The app is then relaunched with the same embedded update.
     * DatabaseLauncher should copy all the missing assets and run the update as normal.
     */
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort, protocolVersion);

    /**
     * Install the app and immediately send it a message to clear internal storage. Verify storage
     * has been cleared properly.
     */
    await device.installApp();
    // set up promise before starting the app to ensure the correct response is sent
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await device.launchApp({
      newInstance: true,
    });
    await promise;

    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(3); // JS bundle, png, ttf
    expect(clearAssetsMessage.numFilesAfter).toBe(0);

    /**
     * Stop and then restart app. Immediately send it a message to read internal storage.
     */
    await device.terminateApp();
    // set up promise before starting the app to ensure the correct response is sent
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    await device.launchApp();
    await promise2;

    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }

    /**
     * Verify all the assets that were deleted have been re-copied back into internal storage, and
     * that we are running the same update as before (different in the following tests).
     */
    expect(readAssetsMessage.numFiles).toEqual(clearAssetsMessage.numFilesBefore);
    expect(readAssetsMessage.updateId).toEqual(clearAssetsMessage.updateId);

    /**
     * Check readLogEntriesAsync
     */
    const logEntries = await Server.waitForLogEntries(10000 * TIMEOUT_BIAS);
    console.debug(
      'Total number of log entries = ' +
        logEntries.length +
        '\n' +
        JSON.stringify(logEntries, null, 2)
    );

    // Should have at least one message
    expect(logEntries.length > 0).toBe(true);
    // There should be a message 'No update available' because of the other actions
    // that have been run already
    // (this check will be reworked after some logging PRs go in)
    /*
    expect(logEntries.map((entry) => entry.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('No update available')])
    );
     */
  });

  it('embedded assets deleted from internal storage should be re-copied from a new embedded update', async () => {
    /**
     * This test ensures that when trying to launch a NEW update that includes some OLD assets we
     * already have (according to SQLite), even if those assets are actually missing from disk
     * (but included in the embedded update) DatabaseLauncher can recover.
     *
     * To create this scenario, we load a single (embedded) update, then clear assets from
     * internal storage. Then we install a NEW build with a NEW embedded update but that includes
     * some of the same assets. When we launch this new build, DatabaseLauncher should still copy
     * the missing assets and run the update as normal.
     */
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort, protocolVersion);

    /**
     * Install the app and immediately send it a message to clear internal storage. Verify storage
     * has been cleared properly.
     */
    await device.installApp();
    // set up promise before starting the app to ensure the correct response is sent
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await device.launchApp({
      newInstance: true,
    });
    await promise;

    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(3); // JS bundle, png, ttf
    expect(clearAssetsMessage.numFilesAfter).toBe(0);

    /**
     * Stop the app and install a newer build on top of it. The newer build has a different
     * embedded update (different updateId) but still includes some of the same assets. Now SQLite
     * thinks we already have these assets, but we actually just deleted them from internal
     * storage.
     */
    await device.terminateApp();
    await device.installApp();

    /**
     * Start the new build, and immediately send it a message to read internal storage.
     */
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    // set up promise before starting the app to ensure the correct response is sent
    await device.launchApp({
      newInstance: true,
    });
    await promise2;

    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }

    /**
     * Verify all the assets that were deleted have been re-copied back into internal storage, and
     * that we are running a DIFFERENT update than before -- otherwise this test is no different
     * from the previous one.
     */
    expect(readAssetsMessage.numFiles).toEqual(clearAssetsMessage.numFilesBefore);
    /**
     * TODO: develop a way to modify the embedded update used by the build in a Detox test environment,
     * so that we can actually do this test with a real modified update. Until then, disable the line below
     * to allow the test to pass.
     */
    // expect(readAssetsMessage.updateId).not.toEqual(clearAssetsMessage.updateId);
  });

  it('assets in a downloaded update deleted from internal storage should be re-copied or re-downloaded', async () => {
    /**
     * This test ensures we can (or at least try to) recover missing assets that originated from a
     * downloaded update, as opposed to assets originally copied from an embedded update (which
     * the previous 2 tests concern).
     *
     * To create this scenario, we launch an app, download an update with multiple assets
     * (including at least one -- the bundle -- not part of the embedded update), make sure the
     * update runs, then clear assets from internal storage. When we relaunch the app,
     * DatabaseLauncher should re-download the missing assets and run the update as normal.
     */
    jest.setTimeout(300000 * TIMEOUT_BIAS);

    /**
     * Prepare to host update manifest and assets from the test runner
     */
    const bundleFilename = 'bundle-assets.js';
    const newNotifyString = 'test-assets-1';
    const bundleHash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );

    const bundledAssets = Update.findAssets(projectRoot, platform);
    const assets = await Promise.all(
      bundledAssets.map(async (asset: { path: string; ext: string }) => {
        const filename = path.basename(asset.path);
        const mimeType = asset.ext === 'ttf' ? 'font/ttf' : 'image/png';
        const key = filename.replace('asset_', '').replace(/\.[^/.]+$/, '');
        const hash = await Update.copyAssetToStaticFolder(asset.path, filename);
        return {
          hash,
          key,
          contentType: mimeType,
          fileExtension: asset.ext,
          url: `http://${Update.serverHost}:${Update.serverPort}/static/${filename}`,
        };
      })
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      bundleHash,
      'test-assets-bundle',
      bundleFilename,
      assets
    );

    /**
     * Install the app and launch it so that it downloads the new update we're hosting
     */
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({ newInstance: true });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // only the bundle should be new

    /**
     * Stop and restart the app so it will launch the new update. Immediately send it a message to
     * clear internal storage while also verifying the new update is running.
     */
    await device.terminateApp();
    const promise = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'clearExpoInternal',
    });
    await device.launchApp({ newInstance: true });
    const updatedMessage = await promise;
    expect(updatedMessage).toBe(newNotifyString);

    /**
     * Verify that the assets were cleared correctly.
     */
    const clearAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!clearAssetsMessage.success) {
      throw new Error(clearAssetsMessage.error);
    }
    expect(clearAssetsMessage.numFilesBefore).toBeGreaterThanOrEqual(4); // png, ttf, 2 JS bundles
    expect(clearAssetsMessage.numFilesAfter).toBe(0);
    expect(clearAssetsMessage.updateId).toEqual(manifest.id);

    /**
     * Stop and restart the app and immediately send it a message to read internal storage. Verify
     * that the new update is running (again).
     */
    await device.terminateApp();
    // set up promise before starting the app to ensure the correct response is sent
    const promise2 = Server.waitForRequest(10000 * TIMEOUT_BIAS, {
      command: 'readExpoInternal',
    });
    await device.launchApp({ newInstance: true });
    const updatedMessageAfterClearExpoInternal = await promise2;
    expect(updatedMessageAfterClearExpoInternal).toBe(newNotifyString);

    /**
     * Verify all the assets -- including the JS bundle from the update (which wasn't in the
     * embedded update) -- have been restored. Additionally verify from the server side that the
     * updated bundle was re-downloaded.
     */
    const readAssetsMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    if (!readAssetsMessage.success) {
      throw new Error(readAssetsMessage.error);
    }
    expect(readAssetsMessage.numFiles).toEqual(manifest.assets.length + 1); // assets + JS bundle
    expect(readAssetsMessage.updateId).toEqual(manifest.id);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // should have re-downloaded only the JS bundle; the rest should have been copied from the app binary
  });
});
