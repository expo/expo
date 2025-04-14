import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';
import path from 'path';
import { setTimeout } from 'timers/promises';

import Server from './utils/server';
import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = device.getPlatform();
const protocolVersion = 1;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

const checkNumAssetsAsync = async () => {
  await element(by.id('readAssetFiles')).tap();
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
  const attributes: any = await element(by.id('numAssetFiles')).getAttributes();
  return parseInt(attributes?.text || -1, 10);
};

const clearNumAssetsAsync = async () => {
  await element(by.id('clearAssetFiles')).tap();
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
};

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const pressTestButtonAsync = async (testID: string) => {
  await element(by.id(testID)).tap();
};

const waitForAsynchronousTaskCompletion = async (timeout: number = 1000) => {
  await waitFor(element(by.id('numActive')))
    .toHaveText('0')
    .withTimeout(timeout);
};

const waitForExpectationAsync = async (
  expectation: () => void,
  { timeout, interval }: { timeout: number; interval: number }
) => {
  const maxTries = Math.ceil(timeout / interval);
  let tryNumber = 0;
  while (true) {
    tryNumber += 1;

    try {
      expectation();
      return;
    } catch (e) {
      if (tryNumber >= maxTries) {
        throw e;
      }
    }

    await setTimeout(interval);
  }
};

const readLogEntriesAsync = async () => {
  await element(by.id('readLogEntries')).tap();
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
  const attributes: any = await element(by.id('logEntries')).getAttributes();
  try {
    return JSON.parse(attributes?.text) || [];
  } catch (e) {
    console.warn(`Error in parsing logs: ${e}`);
    return [];
  }
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(3000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('starts app, stops, and starts again', async () => {
    console.warn(`Platform = ${platform}`);

    Server.start(Update.serverPort, protocolVersion);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();

    const message2 = await testElementValueAsync('updateString');
    jestExpect(message2).toBe('test');

    await device.terminateApp();
  });

  it('reloads', async () => {
    Server.start(Update.serverPort, protocolVersion);
    await device.installApp();
    await device.launchApp({
      newInstance: true,

      // The ReactContext is required by detox synchronization on Android.
      // However ReactContext will be changed after the app is reloaded.
      // All future tests will be blocked after reloading, so we need to disable synchronization for reload tests.
      launchArgs: device.getPlatform() === 'android' ? { detoxEnableSynchronization: 0 } : {},
    });
    await waitForAppToBecomeVisible();

    const isReloadingBefore = await testElementValueAsync('isReloading');
    jestExpect(isReloadingBefore).toBe('false');
    const startTimeBefore = parseInt(await testElementValueAsync('startTime'), 10);
    jestExpect(startTimeBefore).toBeGreaterThan(0);

    await pressTestButtonAsync('reload');

    // wait 3 seconds for reload to complete
    // it's delayed 2 seconds after the button press in the client so the button press finish registers in detox
    await setTimeout(3000);

    const isReloadingAfter = await testElementValueAsync('isReloading');
    jestExpect(isReloadingAfter).toBe('false');
    const startTimeAfter = parseInt(await testElementValueAsync('startTime'), 10);
    jestExpect(startTimeAfter).toBeGreaterThan(startTimeBefore);

    const restartCount = await testElementValueAsync('state.restartCount');
    jestExpect(restartCount).toBe('1');

    await device.terminateApp();
  });

  it('initial request includes correct update-id headers', async () => {
    Server.start(Update.serverPort);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const request = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    jestExpect(request.headers['expo-embedded-update-id'] || null).toBeDefined();
    jestExpect(request.headers['expo-current-update-id']).toBeDefined();
    // before any updates, the current update ID and embedded update ID should be the same
    jestExpect(request.headers['expo-current-update-id']).toEqual(
      request.headers['expo-embedded-update-id']
    );
  });

  it('downloads and runs update, and updates current-update-id header', async () => {
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
      [],
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(1),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const updatedMessage = await testElementValueAsync('updateString');
    jestExpect(updatedMessage).toBe(newNotifyString);

    jestExpect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
    jestExpect(secondRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    jestExpect(secondRequest.headers['expo-current-update-id']).toBeDefined();
    jestExpect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
  });

  it('does not run update with incorrect hash', async () => {
    const bundleFilename = 'bundle-invalid-hash.js';
    const newNotifyString = 'test-update-invalid-hash';
    await Update.copyBundleToStaticFolder(projectRoot, bundleFilename, newNotifyString, platform);
    const hash = 'invalid-hash';
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      hash,
      'test-update-1-key',
      bundleFilename,
      [],
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(1),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app to verify the new update isn't used
    await device.terminateApp();
    await device.launchApp();
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await testElementValueAsync('updateString');
    jestExpect(updatedMessage).toBe('test');
  });

  it('update with bad asset hash yields expected log entry', async () => {
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
      assets,
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });

    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(4),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();
    await setTimeout(2000 * TIMEOUT_BIAS);
    const updatedMessage = await testElementValueAsync('updateString');
    // Because of the mismatch, the new update will not load, so updatedMessage will still be 'test'
    jestExpect(updatedMessage).toBe('test');

    // Check readLogEntriesAsync
    const logEntries: any[] = await readLogEntriesAsync();
    console.warn(
      'Total number of log entries = ' +
        logEntries.length +
        '\n' +
        JSON.stringify(logEntries, null, 2)
    );

    // Should have at least one message
    jestExpect(logEntries.length > 0).toBe(true);
    // Check for message that hash is mismatched, with expected error code
    jestExpect(logEntries.map((entry) => entry.code)).toEqual(
      jestExpect.arrayContaining(['AssetsFailedToLoad'])
    );
  });

  it('downloads and runs update with multiple assets', async () => {
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
      assets,
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(4),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const updatedMessage = await testElementValueAsync('updateString');

    jestExpect(updatedMessage).toBe(newNotifyString);
  });

  // important for usage accuracy
  it('does not download any assets for an older update', async () => {
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
      [],
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const firstMessage = await testElementValueAsync('updateString');
    jestExpect(firstMessage).toBe('test');

    // give the app time to load the new update in the background (i.e. to make sure it doesn't)
    await setTimeout(5000);
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(0);

    // restart the app and make sure it's still running the initial update
    await device.terminateApp();
    await device.launchApp();
    const secondMessage = await testElementValueAsync('updateString');
    jestExpect(secondMessage).toBe('test');
  });

  it('supports rollbacks', async () => {
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
      [],
      projectRoot
    );

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(1),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    await waitForAppToBecomeVisible();
    const updatedMessage = await testElementValueAsync('updateString');
    jestExpect(updatedMessage).toBe(newNotifyString);

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
    await waitForAppToBecomeVisible();
    const rolledBackMessage = await testElementValueAsync('updateString');
    jestExpect(rolledBackMessage).toBe('test');
    jestExpect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
    jestExpect(secondRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    jestExpect(thirdRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    jestExpect(fourthRequest.headers['expo-embedded-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );

    jestExpect(firstRequest.headers['expo-current-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
    jestExpect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
    jestExpect(thirdRequest.headers['expo-current-update-id']).toEqual(manifest.id);
    jestExpect(fourthRequest.headers['expo-current-update-id']).toEqual(
      firstRequest.headers['expo-embedded-update-id']
    );
  });
});

describe('JS API tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('downloads and runs update with JS API', async () => {
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
      [],
      projectRoot
    );
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toEqual('test');
    const isEmbedded = await testElementValueAsync('isEmbeddedLaunch');
    jestExpect(isEmbedded).toEqual('true');
    const checkAutomatically = await testElementValueAsync('checkAutomatically');
    jestExpect(checkAutomatically).toEqual('ON_LOAD');
    const launchDuration = await testElementValueAsync('launchDuration');
    jestExpect(parseInt(launchDuration, 10)).toBeGreaterThan(0);

    // Test extra params
    await pressTestButtonAsync('setExtraParams');
    await waitForAsynchronousTaskCompletion();

    const extraParamsString = await testElementValueAsync('extraParamsString');
    console.warn(`extraParamsString = ${extraParamsString}`);
    jestExpect(extraParamsString).toContain('testparam');
    jestExpect(extraParamsString).toContain('testvalue');
    jestExpect(extraParamsString).not.toContain('testsetnull');

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);

    await pressTestButtonAsync('checkForUpdate');
    console.warn(((await element(by.id('numActive')).getAttributes()) as any).text);
    await waitForAsynchronousTaskCompletion();

    const availableUpdateID = await testElementValueAsync('availableUpdateID');
    jestExpect(availableUpdateID).toEqual(manifest.id);

    await pressTestButtonAsync('downloadUpdate');
    await waitForAsynchronousTaskCompletion();

    Server.stop();
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();
    const runningUpdateID = await testElementValueAsync('updateID');
    jestExpect(runningUpdateID).toEqual(manifest.id);
    const isEmbeddedAfterUpdate = await testElementValueAsync('isEmbeddedLaunch');
    jestExpect(isEmbeddedAfterUpdate).toEqual('false');
  });

  it('Receives state machine change events', async () => {
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
      [],
      projectRoot
    );

    // Launch app
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // Check state on launch
    const isUpdatePending = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback = await testElementValueAsync('state.isRollback');
    console.warn(`isUpdatePending = ${isUpdatePending}`);
    console.warn(`isUpdateAvailable = ${isUpdateAvailable}`);
    console.warn(`isRollback = ${isRollback}`);
    console.warn(`latestManifestId = ${latestManifestId}`);
    console.warn(`downloadedManifestId = ${downloadedManifestId}`);
    jestExpect(isUpdateAvailable).toEqual('false');
    jestExpect(isUpdatePending).toEqual('false');
    jestExpect(isRollback).toEqual('false');
    jestExpect(latestManifestId).toEqual('null');
    jestExpect(downloadedManifestId).toEqual('null');

    const updatesExpoClientEmbeddedString = await testElementValueAsync('updates.expoClient');
    const constantsExpoConfigEmbeddedString = await testElementValueAsync('constants.expoConfig');
    console.warn(`updatesExpoClientEmbedded = ${updatesExpoClientEmbeddedString}`);
    console.warn(`constantsExpoConfigEmbedded = ${constantsExpoConfigEmbeddedString}`);
    const updatesExpoConfigEmbedded = JSON.parse(updatesExpoClientEmbeddedString);
    jestExpect(updatesExpoConfigEmbedded).not.toBeNull();

    // Now serve a manifest
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);

    // Check for update, and expect isUpdateAvailable to be true
    await pressTestButtonAsync('checkForUpdate');
    await waitForAsynchronousTaskCompletion();

    const isUpdatePending2 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable2 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId2 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId2 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback2 = await testElementValueAsync('state.isRollback');
    console.warn(`isUpdatePending2 = ${isUpdatePending2}`);
    console.warn(`isUpdateAvailable2 = ${isUpdateAvailable2}`);
    console.warn(`isRollback2 = ${isRollback2}`);
    console.warn(`latestManifestId2 = ${latestManifestId2}`);
    console.warn(`downloadedManifestId2 = ${downloadedManifestId2}`);
    jestExpect(isUpdateAvailable2).toEqual('true');
    jestExpect(isUpdatePending2).toEqual('false');
    jestExpect(isRollback2).toEqual('false');
    jestExpect(latestManifestId2).toEqual(manifest.id);
    jestExpect(downloadedManifestId2).toEqual('null');

    // Download update and expect isUpdatePending to be true
    await pressTestButtonAsync('downloadUpdate');
    await waitForAsynchronousTaskCompletion();

    const isUpdatePending3 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable3 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId3 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId3 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback3 = await testElementValueAsync('state.isRollback');
    console.warn(`isUpdatePending3 = ${isUpdatePending3}`);
    console.warn(`isUpdateAvailable3 = ${isUpdateAvailable3}`);
    console.warn(`isRollback3 = ${isRollback3}`);
    console.warn(`latestManifestId3 = ${latestManifestId3}`);
    console.warn(`downloadedManifestId3 = ${downloadedManifestId3}`);
    jestExpect(isUpdateAvailable3).toEqual('true');
    jestExpect(isUpdatePending3).toEqual('true');
    jestExpect(isRollback3).toEqual('false');
    jestExpect(latestManifestId3).toEqual(manifest.id);
    jestExpect(downloadedManifestId3).toEqual(manifest.id);

    // Terminate and relaunch app, we should be running the update, and back to the default state
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();

    const isUpdatePending4 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable4 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId4 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId4 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback4 = await testElementValueAsync('state.isRollback');
    const rollbackCommitTime4 = await testElementValueAsync('state.rollbackCommitTime');
    console.warn(`isUpdatePending4 = ${isUpdatePending4}`);
    console.warn(`isUpdateAvailable4 = ${isUpdateAvailable4}`);
    console.warn(`isRollback4 = ${isRollback4}`);
    console.warn(`latestManifestId4 = ${latestManifestId4}`);
    console.warn(`downloadedManifestId4 = ${downloadedManifestId4}`);
    console.warn(`rollbackCommitTime4 = ${rollbackCommitTime4}`);
    jestExpect(isUpdateAvailable4).toEqual('false');
    jestExpect(isUpdatePending4).toEqual('false');
    jestExpect(isRollback4).toEqual('false');
    jestExpect(latestManifestId4).toEqual('null');
    jestExpect(downloadedManifestId4).toEqual('null');
    jestExpect(rollbackCommitTime4).toEqual('null');

    const updatesExpoClientUpdateString = await testElementValueAsync('updates.expoClient');
    const constantsExpoConfigUpdateString = await testElementValueAsync('constants.expoConfig');
    console.warn(`updatesExpoClientUpdate = ${updatesExpoClientUpdateString}`);
    console.warn(`constantsExpoConfigUpdate = ${constantsExpoConfigUpdateString}`);

    // Now serve a rollback
    const rollbackDirective = Update.getRollbackDirective(new Date());
    await Server.serveSignedDirective(rollbackDirective, projectRoot);

    // Check for update, and expect isRollback to be true
    await pressTestButtonAsync('checkForUpdate');
    await waitForAsynchronousTaskCompletion();

    const isUpdatePending5 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable5 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId5 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId5 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback5 = await testElementValueAsync('state.isRollback');
    const rollbackCommitTime5 = await testElementValueAsync('state.rollbackCommitTime');
    console.warn(`isUpdatePending5 = ${isUpdatePending5}`);
    console.warn(`isUpdateAvailable5 = ${isUpdateAvailable5}`);
    console.warn(`isRollback5 = ${isRollback5}`);
    console.warn(`latestManifestId5 = ${latestManifestId5}`);
    console.warn(`downloadedManifestId5 = ${downloadedManifestId5}`);
    console.warn(`rollbackCommitTime5 = ${rollbackCommitTime5}`);
    jestExpect(isUpdateAvailable5).toEqual('true');
    jestExpect(isUpdatePending5).toEqual('false');
    jestExpect(isRollback5).toEqual('true');
    jestExpect(latestManifestId5).toEqual('null');
    jestExpect(downloadedManifestId5).toEqual('null');
    jestExpect(rollbackCommitTime5).not.toEqual('null');

    // Terminate and relaunch app, we should be running the original bundle again, and back to the default state
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();

    const isUpdatePending6 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable6 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId6 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId6 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback6 = await testElementValueAsync('state.isRollback');
    const rollbackCommitTime6 = await testElementValueAsync('state.rollbackCommitTime');

    console.warn(`isUpdatePending6 = ${isUpdatePending6}`);
    console.warn(`isUpdateAvailable6 = ${isUpdateAvailable6}`);
    console.warn(`isRollback6 = ${isRollback6}`);
    console.warn(`latestManifestId6 = ${latestManifestId6}`);
    console.warn(`downloadedManifestId6 = ${downloadedManifestId6}`);
    console.warn(`rollbackCommitTime6 = ${rollbackCommitTime6}`);

    const updatesExpoConfigRollbackString = await testElementValueAsync('updates.expoClient');
    const constantsExpoConfigRollbackString = await testElementValueAsync('constants.expoConfig');
    console.warn(`updatesExpoConfigRollback = ${updatesExpoConfigRollbackString}`);
    console.warn(`constantsExpoConfigRollback = ${constantsExpoConfigRollbackString}`);

    // Check for update, and expect isRollback to be true
    await pressTestButtonAsync('triggerParallelFetchAndDownload');
    await waitForAsynchronousTaskCompletion(4000);

    const didCheckAndDownloadHappenInParallel = await testElementValueAsync(
      'didCheckAndDownloadHappenInParallel'
    );
    jestExpect(didCheckAndDownloadHappenInParallel).toEqual('false');
  });
});

// The tests in this suite install an app with multiple assets, then clear all the assets from
// .expo-internal storage (but not SQLite). This simulates scenarios such as: a bug in our code that
// deletes assets unintentionally; OS deleting files from app storage if it runs out of memory; etc.
//
// Recovery code for this situation exists in the DatabaseLauncher, these are the main tests that
// ensure that logic doesn't regress.
//
// These tests all make use of the additional UpdatesE2ETestModule, which provides methods for
// clearing and reading the .expo-internal folder.
describe('Asset deletion recovery tests', () => {
  const shouldCopyEmbeddedAssets = platform !== 'android';
  const itWhenCopyEmbeddedAssets = shouldCopyEmbeddedAssets ? it : xit;

  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  itWhenCopyEmbeddedAssets(
    'embedded assets deleted from internal storage should be re-copied',
    async () => {
      // Simplest scenario; only one update (embedded) is loaded, then assets are cleared from
      // internal storage. The app is then relaunched with the same embedded update.
      // DatabaseLauncher should copy all the missing assets and run the update as normal.

      Server.start(Update.serverPort, protocolVersion);

      // Install the app and immediately send it a message to clear internal storage. Verify storage
      // has been cleared properly.
      await device.installApp();
      await device.launchApp({
        newInstance: true,
      });
      await waitForAppToBecomeVisible();

      // Check that we are running the embedded update
      const isEmbedded = await testElementValueAsync('isEmbeddedLaunch');
      jestExpect(isEmbedded).toEqual('true');

      // Check that asset files are present
      let numAssets = await checkNumAssetsAsync();
      jestExpect(numAssets).toBeGreaterThan(2);

      // Get current update ID
      const updateID = await testElementValueAsync('updateID');

      // Clear assets and check that number of assets is now 0
      await clearNumAssetsAsync();
      numAssets = await checkNumAssetsAsync();
      jestExpect(numAssets).toBe(0);

      // Stop and then restart app.
      await device.terminateApp();
      await device.launchApp();
      await waitForAppToBecomeVisible();

      // Check that assets are restored from DB
      numAssets = await checkNumAssetsAsync();
      jestExpect(numAssets).toBeGreaterThan(2);

      // Check that update ID is the same
      const updateID2 = await testElementValueAsync('updateID');
      jestExpect(updateID2).toEqual(updateID);

      // Check for log messages
      const logEntries = await readLogEntriesAsync();
      console.warn(
        'Total number of log entries = ' +
          logEntries.length +
          '\n' +
          JSON.stringify(logEntries, null, 2)
      );
      jestExpect(logEntries.length).toBeGreaterThan(0);
    }
  );

  itWhenCopyEmbeddedAssets(
    'embedded assets deleted from internal storage should be re-copied from a new embedded update',
    async () => {
      // This test ensures that when trying to launch a NEW update that includes some OLD assets we
      // already have (according to SQLite), even if those assets are actually missing from disk
      // (but included in the embedded update) DatabaseLauncher can recover.
      //
      // To create this scenario, we load a single (embedded) update, then clear assets from
      // internal storage. Then we install a NEW build with a NEW embedded update but that includes
      // some of the same assets. When we launch this new build, DatabaseLauncher should still copy
      // the missing assets and run the update as normal.

      Server.start(Update.serverPort, protocolVersion);

      // Install the app and immediately send it a message to clear internal storage. Verify storage
      // has been cleared properly.
      await device.installApp();
      await device.launchApp({
        newInstance: true,
      });
      await waitForAppToBecomeVisible();

      // Save the number of assets in storage
      const numAssetsSaved = await checkNumAssetsAsync();
      jestExpect(numAssetsSaved).toBeGreaterThan(0);

      // Clear assets and check that number of assets is now 0
      await clearNumAssetsAsync();
      let numAssets = await checkNumAssetsAsync();
      jestExpect(numAssets).toBe(0);

      // Stop the app and install a newer build on top of it. The newer build has a different
      // embedded update (different updateId) but still includes some of the same assets. Now SQLite
      // thinks we already have these assets, but we actually just deleted them from internal
      // storage.
      await device.terminateApp();
      await device.installApp();

      // Start the new build, and immediately send it a message to read internal storage.
      await device.launchApp({
        newInstance: true,
      });
      await waitForAppToBecomeVisible();

      // Verify all the assets that were deleted have been re-copied back into internal storage, and
      // that we are running a DIFFERENT update than before -- otherwise this test is no different
      // from the previous one.
      numAssets = await checkNumAssetsAsync();
      jestExpect(numAssets).toEqual(numAssetsSaved);

      // TODO: develop a way to modify the embedded update used by the build in a Detox test environment,
      // so that we can actually do this test with a real modified update. Until then, disable the line below
      // to allow the test to pass.
      //jestExpect(readAssetsMessage.updateId).not.toEqual(clearAssetsMessage.updateId);
    }
  );

  it('assets in a downloaded update deleted from internal storage should be re-copied or re-downloaded', async () => {
    // This test ensures we can (or at least try to) recover missing assets that originated from a
    // downloaded update, as opposed to assets originally copied from an embedded update (which
    // the previous 2 tests concern).
    //
    // To create this scenario, we launch an app, download an update with multiple assets
    // (including at least one -- the bundle -- not part of the embedded update), make sure the
    // update runs, then clear assets from internal storage. When we relaunch the app,
    // DatabaseLauncher should re-download the missing assets and run the update as normal.

    // Prepare to host update manifest and assets from the test runner
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

    // Append a new asset that is not embedded and should be re-downloaded
    async function createNewAssetAsync(file: string = 'patrick-untersee-XJjsuuDwWas-unsplash.jpg') {
      const newAsset = path.join(__dirname, 'assets', file);
      const filename = path.basename(newAsset);
      const mimeType = 'image/jpg';
      const key = filename.replace('asset_', '').replace(/\.[^/.]+$/, '');
      const hash = await Update.copyAssetToStaticFolder(newAsset, filename);
      return {
        hash,
        key,
        contentType: mimeType,
        fileExtension: '.jpg',
        url: `http://${Update.serverHost}:${Update.serverPort}/static/${filename}`,
      };
    }
    assets.push(await createNewAssetAsync());

    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      bundleHash,
      'test-assets-bundle',
      bundleFilename,
      assets,
      projectRoot
    );

    // Install the app and launch it so that it downloads the new update we're hosting
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({ newInstance: true });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);

    // give the app time to load the new update in the background
    await waitForExpectationAsync(
      () => jestExpect(Server.getRequestedStaticFilesLength()).toBe(2),
      {
        timeout: 10000,
        interval: 1000,
      }
    );
    // only the bundle and the new asset should be requested
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(2);

    // Stop and restart the app so it will launch the new update. Immediately send it a message to
    // clear internal storage while also verifying the new update is running.
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await waitForAppToBecomeVisible();
    const updateString = await testElementValueAsync('updateString');
    jestExpect(updateString).toEqual(newNotifyString);
    await clearNumAssetsAsync();

    // Verify that the assets were cleared correctly.
    let numAssets = await checkNumAssetsAsync();
    jestExpect(numAssets).toBe(0);
    let updateID = await testElementValueAsync('updateID');
    jestExpect(updateID).toEqual(manifest.id);

    // Stop and restart the app and immediately send it a message to read internal storage. Verify
    // that the new update is running (again).
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await waitForAppToBecomeVisible();

    // Verify all the assets -- including the JS bundle from the update (which wasn't in the
    // embedded update) -- have been restored. Additionally verify from the server side that the
    // updated bundle was re-downloaded.
    // With asset exclusion, on Android, the number of assets found may be greater than the number in the manifest,
    // as the total will include embedded assets that were copied.
    numAssets = await checkNumAssetsAsync();
    const expectedNumAssets = shouldCopyEmbeddedAssets ? manifest.assets.length + 1 : 2;
    if (platform === 'ios') {
      jestExpect(numAssets).toBe(expectedNumAssets);
    } else {
      jestExpect(numAssets).toBeGreaterThanOrEqual(expectedNumAssets);
    }
    updateID = await testElementValueAsync('updateID');
    jestExpect(updateID).toEqual(manifest.id);
    // should have re-downloaded only the JS bundle and the new asset; the rest should have been copied from the app binary.
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(2);
  });
});
