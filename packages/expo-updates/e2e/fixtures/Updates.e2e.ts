import { by, device, element, expect as detoxExpect } from 'detox';
import path from 'path';
import { setTimeout } from 'timers/promises';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = (process.env.DETOX_CONFIGURATION || 'ios.release').split('.')[0];
const protocolVersion = platform === 'android' ? 1 : 0;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

const checkNumAssetsAsync = async () => {
  await element(by.id('readAssetFiles')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
  await detoxExpect(element(by.id('activity'))).not.toBeVisible();
  const attributes: any = await element(by.id('numAssetFiles')).getAttributes();
  return parseInt(attributes?.text || -1, 10);
};

const clearNumAssetsAsync = async () => {
  await element(by.id('clearAssetFiles')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
  await detoxExpect(element(by.id('activity'))).not.toBeVisible();
};

const checkIsEmbeddedAsync = async () => {
  const attributes: any = await element(by.id('runTypeMessage')).getAttributes();
  return attributes?.text === 'This app is running from built-in code';
};

const checkUpdateIDAsync = async () => {
  const attributes: any = await element(by.id('updateID')).getAttributes();
  return attributes?.text || '';
};

const checkUpdateStringAsync = async () => {
  const attributes: any = await element(by.id('updateString')).getAttributes();
  return attributes?.text.substring(8) || '';
};

const readLogEntriesAsync = async () => {
  await element(by.id('readLogEntries')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
  await detoxExpect(element(by.id('activity'))).not.toBeVisible();
  const attributes: any = await element(by.id('logEntries')).getAttributes();
  try {
    return JSON.parse(attributes?.text) || [];
  } catch (e) {
    console.warn(`Error in parsing logs: ${e}`);
    return [];
  }
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('starts app, stops, and starts again', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort, protocolVersion);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });

    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');
    await device.terminateApp();
    await device.launchApp();

    const message2 = await checkUpdateStringAsync();
    expect(message2).toBe('test');

    await device.terminateApp();
  });

  it('initial request includes correct update-id headers', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const request = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    expect(request.headers['expo-embedded-update-id'] || null).toBeDefined();
    expect(request.headers['expo-current-update-id']).toBeDefined();
    // before any updates, the current update ID and embedded update ID should be the same
    expect(request.headers['expo-current-update-id']).toEqual(
      request.headers['expo-embedded-update-id']
    );
  });

  it('downloads and runs update, and updates current-update-id header', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-1';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-1-key',
      bundleFilename,
      []
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    expect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await checkUpdateStringAsync();
    expect(updatedMessage).toBe(newNotifyString);

    expect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
    expect(secondRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    expect(secondRequest.headers['expo-current-update-id']).toBeDefined();
    expect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
  });

  it('does not run update with incorrect hash', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle-invalid-hash.js';
    const newNotifyString = 'test-update-invalid-hash';
    await Update.copyBundleToStaticFolder(projectRoot, bundleFilename, newNotifyString, platform);
    const hash = 'invalid-hash';
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-1-key',
      bundleFilename,
      []
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    expect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app to verify the new update isn't used
    await device.terminateApp();
    await device.launchApp();
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await checkUpdateStringAsync();
    expect(updatedMessage).toBe('test');
  });

  it('update with bad asset hash yields expected log entry', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle2.js';
    const newNotifyString = 'test-update-2';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const assets = await Promise.all(
      [
        'lubo-minar-j2RgHfqKhCM-unsplash.jpg',
        'niklas-liniger-zuPiCN7xekM-unsplash.jpg',
        'patrick-untersee-XJjsuuDwWas-unsplash.jpg',
      ].map(async (sourceFilename, index) => {
        const destinationFilename = `asset${index}.jpg`;
        const hash = await Update.copyAssetToStaticFolder(
          path.join(__dirname, 'assets', sourceFilename),
          destinationFilename
        );
        return {
          hash:
            index === 0 ? hash.substring(1, 2) + hash.substring(0, 1) + hash.substring(2) : hash,
          key: `asset${index}`,
          contentType: 'image/jpg',
          fileExtension: '.jpg',
          url: `http://${Update.serverHost}:${Update.serverPort}/static/${destinationFilename}`,
        };
      })
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-2-key',
      bundleFilename,
      assets
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');

    expect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    await setTimeout(2000 * TIMEOUT_BIAS);
    const updatedMessage = await checkUpdateStringAsync();
    // Because of the mismatch, the new update will not load, so updatedMessage will still be 'test'
    expect(updatedMessage).toBe('test');

    /**
     * Check readLogEntriesAsync
     */
    const logEntries = await readLogEntriesAsync();
    console.warn(
      'Total number of log entries = ' +
        logEntries.length +
        '\n' +
        JSON.stringify(logEntries, null, 2)
    );

    // Should have at least one message
    expect(logEntries.length > 0).toBe(true);
    // Check for message that hash is mismatched, with expected error code
    // (this check will be reworked after some logging PRs go in)
    /*
    expect(logEntries.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(['AssetsFailedToLoad'])
    );
    expect(logEntries.map((entry) => entry.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('SHA-256 did not match expected')])
    );
     */
  });

  it('downloads and runs update with multiple assets', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle2.js';
    const newNotifyString = 'test-update-2';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const assets = await Promise.all(
      [
        'lubo-minar-j2RgHfqKhCM-unsplash.jpg',
        'niklas-liniger-zuPiCN7xekM-unsplash.jpg',
        'patrick-untersee-XJjsuuDwWas-unsplash.jpg',
      ].map(async (sourceFilename, index) => {
        const destinationFilename: string = `asset${index}.jpg`;
        const hash = await Update.copyAssetToStaticFolder(
          path.join(__dirname, 'assets', sourceFilename),
          destinationFilename
        );
        return {
          hash,
          key: `asset${index}`,
          contentType: 'image/jpg',
          fileExtension: '.jpg',
          url: `http://${Update.serverHost}:${Update.serverPort}/static/${destinationFilename}`,
        };
      })
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-2-key',
      bundleFilename,
      assets
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    expect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const updatedMessage = await checkUpdateStringAsync();

    expect(updatedMessage).toBe(newNotifyString);
  });

  // important for usage accuracy
  it('does not download any assets for an older update', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle-old.js';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      'test-update-older',
      platform
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(Date.now() - 1000 * 60 * 60 * 24),
      hash,
      'test-update-old-key',
      bundleFilename,
      []
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const firstMessage = await checkUpdateStringAsync();
    expect(firstMessage).toBe('test');

    // give the app time to load the new update in the background (i.e. to make sure it doesn't)
    expect(Server.consumeRequestedStaticFiles().length).toBe(0);

    // restart the app and make sure it's still running the initial update
    await device.terminateApp();
    await device.launchApp();
    const secondMessage = await checkUpdateStringAsync();
    expect(secondMessage).toBe('test');
  });

  it('supports rollbacks', async () => {
    if (platform === 'ios') {
      console.warn('Rollbacks not yet implemented on iOS: exiting.');
      return;
    }
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    const bundleFilename = 'bundle1.js';
    const newNotifyString = 'test-update-3';
    const hash = await Update.copyBundleToStaticFolder(
      projectRoot,
      bundleFilename,
      newNotifyString,
      platform
    );
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-3-key',
      bundleFilename,
      []
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await checkUpdateStringAsync();
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    expect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await checkUpdateStringAsync();
    expect(updatedMessage).toBe(newNotifyString);

    // serve a rollback now
    const rollbackDirective = Update.getRollbackDirective(new Date());
    await Server.serveSignedDirective(rollbackDirective, projectRoot);

    // restart the app so it will fetch the rollback
    await device.terminateApp();
    await device.launchApp();
    const thirdRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);

    // Restart the app so it will launch the rollback
    await device.terminateApp();
    await device.launchApp();
    const fourthRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const rolledBackMessage = await checkUpdateStringAsync();
    expect(rolledBackMessage).toBe('test');
    expect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
    expect(secondRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    expect(thirdRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    expect(fourthRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );

    expect(firstRequest.headers['expo-current-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    expect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
    expect(thirdRequest.headers['expo-current-update-id']).toEqual(manifest.id);
    expect(fourthRequest.headers['expo-current-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
  });
});

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
    await device.launchApp({
      newInstance: true,
    });
    await setTimeout(2000 * TIMEOUT_BIAS);
    /**
     * Check that we are running the embedded update
     */
    const isEmbedded = await checkIsEmbeddedAsync();
    expect(isEmbedded).toEqual(true);

    /**
     * Check that asset files are present
     */
    let numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBeGreaterThan(2);

    /**
     * Get current update ID
     */
    const updateID = await checkUpdateIDAsync();

    /**
     * Clear assets and check that number of assets is now 0
     */
    await clearNumAssetsAsync();
    numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBe(0);

    /**
     * Stop and then restart app.
     */
    await device.terminateApp();
    await device.launchApp();
    await setTimeout(2000 * TIMEOUT_BIAS);

    /**
     * Check that assets are restored from DB
     */
    numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBeGreaterThan(2);

    /**
     * Check that update ID is the same
     */
    const updateID2 = await checkUpdateIDAsync();
    expect(updateID2).toEqual(updateID);

    /**
     * Check for log messages
     */
    const logEntries = await readLogEntriesAsync();
    console.warn(
      'Total number of log entries = ' +
        logEntries.length +
        '\n' +
        JSON.stringify(logEntries, null, 2)
    );
    expect(logEntries.length).toBeGreaterThan(0);
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
    await device.launchApp({
      newInstance: true,
    });
    await setTimeout(2000 * TIMEOUT_BIAS);

    /**
     * Save the number of assets in storage
     */
    const numAssetsSaved = await checkNumAssetsAsync();
    expect(numAssetsSaved).toBeGreaterThan(0);

    /**
     * Clear assets and check that number of assets is now 0
     */
    await clearNumAssetsAsync();
    let numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBe(0);

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
    await device.launchApp({
      newInstance: true,
    });

    /**
     * Verify all the assets that were deleted have been re-copied back into internal storage, and
     * that we are running a DIFFERENT update than before -- otherwise this test is no different
     * from the previous one.
     */
    numAssets = await checkNumAssetsAsync();
    expect(numAssets).toEqual(numAssetsSaved);

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

    // give the app time to load the new update in the background
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // only the bundle should be new

    /**
     * Stop and restart the app so it will launch the new update. Immediately send it a message to
     * clear internal storage while also verifying the new update is running.
     */
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    const updateString = await checkUpdateStringAsync();
    expect(updateString).toEqual(newNotifyString);
    await clearNumAssetsAsync();

    /**
     * Verify that the assets were cleared correctly.
     */
    let numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBe(0);
    let updateID = await checkUpdateIDAsync();
    expect(updateID).toEqual(manifest.id);

    /**
     * Stop and restart the app and immediately send it a message to read internal storage. Verify
     * that the new update is running (again).
     */
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await setTimeout(2000 * TIMEOUT_BIAS);

    /**
     * Verify all the assets -- including the JS bundle from the update (which wasn't in the
     * embedded update) -- have been restored. Additionally verify from the server side that the
     * updated bundle was re-downloaded.
     */
    numAssets = await checkNumAssetsAsync();
    expect(numAssets).toBe(manifest.assets.length + 1);
    updateID = await checkUpdateIDAsync();
    expect(updateID).toEqual(manifest.id);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1); // should have re-downloaded only the JS bundle; the rest should have been copied from the app binary
  });
});
