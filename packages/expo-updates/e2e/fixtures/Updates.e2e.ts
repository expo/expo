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
  await setTimeout(20 * TIMEOUT_BIAS);
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
  const attributes: any = await element(by.id('numAssetFiles')).getAttributes();
  return parseInt(attributes?.text || -1, 10);
};

const clearNumAssetsAsync = async () => {
  await element(by.id('clearAssetFiles')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
};

const testElementValueAsync = async (testID: string) => {
  const attributes: any = await element(by.id(testID)).getAttributes();
  return attributes?.text || '';
};

const pressTestButtonAsync = async (testID: string) => await element(by.id(testID)).tap();

const readLogEntriesAsync = async () => {
  await element(by.id('readLogEntries')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
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

const clearLogEntriesAsync = async () => {
  await element(by.id('clearLogEntries')).tap();
  await setTimeout(20 * TIMEOUT_BIAS);
  await waitFor(element(by.id('activity')))
    .not.toBeVisible()
    .withTimeout(2000);
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(2000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('starts app, stops, and starts again', async () => {
    console.warn(`Platform = ${platform}`);
    jest.setTimeout(300000 * TIMEOUT_BIAS);
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

  it('initial request includes correct update-id headers', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
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
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
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
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app to verify the new update isn't used
    await device.terminateApp();
    await device.launchApp();
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await testElementValueAsync('updateString');
    jestExpect(updatedMessage).toBe('test');
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
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

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
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const updatedMessage = await testElementValueAsync('updateString');

    jestExpect(updatedMessage).toBe(newNotifyString);
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
    await waitForAppToBecomeVisible();
    const firstMessage = await testElementValueAsync('updateString');
    jestExpect(firstMessage).toBe('test');

    // give the app time to load the new update in the background (i.e. to make sure it doesn't)
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(0);

    // restart the app and make sure it's still running the initial update
    await device.terminateApp();
    await device.launchApp();
    const secondMessage = await testElementValueAsync('updateString');
    jestExpect(secondMessage).toBe('test');
  });

  it('supports rollbacks', async () => {
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
    await waitForAppToBecomeVisible();
    const message = await testElementValueAsync('updateString');
    jestExpect(message).toBe('test');

    // give the app time to load the new update in the background
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

    // Test extra params
    await pressTestButtonAsync('setExtraParams');
    const extraParamsString = await testElementValueAsync('extraParamsString');
    console.warn(`extraParamsString = ${extraParamsString}`);
    jestExpect(extraParamsString).toContain('testparam');
    jestExpect(extraParamsString).toContain('testvalue');
    jestExpect(extraParamsString).not.toContain('testsetnull');

    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await pressTestButtonAsync('checkForUpdate');
    const availableUpdateID = await testElementValueAsync('availableUpdateID');
    jestExpect(availableUpdateID).toEqual(manifest.id);
    await pressTestButtonAsync('downloadUpdate');
    await setTimeout(2000);
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

    // Launch app
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    // Check state
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

    // Now serve a manifest
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);

    // Check for update, and expect isUpdateAvailable to be true
    await pressTestButtonAsync('checkForUpdate');
    await pressTestButtonAsync('checkForUpdate');
    await pressTestButtonAsync('checkForUpdate');
    await pressTestButtonAsync('checkForUpdate');

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

    // Download update and expect isUpdatePending to be true
    await pressTestButtonAsync('downloadUpdate');
    await pressTestButtonAsync('downloadUpdate');
    await pressTestButtonAsync('downloadUpdate');
    await pressTestButtonAsync('downloadUpdate');

    const isUpdatePending3 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable3 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId3 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId3 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback3 = await testElementValueAsync('state.isRollback');
    await waitFor(element(by.id('activity')))
      .not.toBeVisible()
      .withTimeout(2000);

    console.warn(`isUpdatePending3 = ${isUpdatePending3}`);
    console.warn(`isUpdateAvailable3 = ${isUpdateAvailable3}`);
    console.warn(`isRollback3 = ${isRollback3}`);
    console.warn(`latestManifestId3 = ${latestManifestId3}`);
    console.warn(`downloadedManifestId3 = ${downloadedManifestId3}`);

    // Terminate and relaunch app, we should be running the update, and back to the default state
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();

    const isUpdatePending4 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable4 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId4 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId4 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback4 = await testElementValueAsync('state.isRollback');

    console.warn(`isUpdatePending4 = ${isUpdatePending4}`);
    console.warn(`isUpdateAvailable4 = ${isUpdateAvailable4}`);
    console.warn(`isRollback4 = ${isRollback4}`);
    console.warn(`latestManifestId4 = ${latestManifestId4}`);
    console.warn(`downloadedManifestId4 = ${downloadedManifestId4}`);

    // Now serve a rollback
    const rollbackDirective = Update.getRollbackDirective(new Date());
    await Server.serveSignedDirective(rollbackDirective, projectRoot);

    // Check for update, and expect isRollback to be true
    await pressTestButtonAsync('checkForUpdate');

    const isUpdatePending5 = await testElementValueAsync('state.isUpdatePending');
    const isUpdateAvailable5 = await testElementValueAsync('state.isUpdateAvailable');
    const latestManifestId5 = await testElementValueAsync('state.latestManifest.id');
    const downloadedManifestId5 = await testElementValueAsync('state.downloadedManifest.id');
    const isRollback5 = await testElementValueAsync('state.isRollback');

    console.warn(`isUpdatePending5 = ${isUpdatePending5}`);
    console.warn(`isUpdateAvailable5 = ${isUpdateAvailable5}`);
    console.warn(`isRollback5 = ${isRollback5}`);
    console.warn(`latestManifestId5 = ${latestManifestId5}`);
    console.warn(`downloadedManifestId5 = ${downloadedManifestId5}`);

    {
      const logEntries: any[] = await readLogEntriesAsync();
      console.warn(
        'Total number of log entries = ' +
          logEntries.length +
          '\n' +
          JSON.stringify(logEntries, null, 2)
      );
      await clearLogEntriesAsync();
    }

    // Verify correct behavior
    // On launch
    jestExpect(isUpdateAvailable).toEqual('false');
    jestExpect(isUpdatePending).toEqual('false');
    jestExpect(isRollback).toEqual('false');
    jestExpect(latestManifestId).toEqual('');
    jestExpect(downloadedManifestId).toEqual('');
    // After check for update and getting a manifest
    jestExpect(isUpdateAvailable2).toEqual('true');
    jestExpect(isUpdatePending2).toEqual('false');
    jestExpect(isRollback2).toEqual('false');
    jestExpect(latestManifestId2).toEqual(manifest.id);
    jestExpect(downloadedManifestId2).toEqual('');
    // After downloading the update
    jestExpect(isUpdateAvailable3).toEqual('true');
    jestExpect(isUpdatePending3).toEqual('true');
    jestExpect(isRollback3).toEqual('false');
    jestExpect(latestManifestId3).toEqual(manifest.id);
    jestExpect(downloadedManifestId3).toEqual(manifest.id);
    // After restarting
    jestExpect(isUpdateAvailable4).toEqual('false');
    jestExpect(isUpdatePending4).toEqual('false');
    jestExpect(isRollback4).toEqual('false');
    jestExpect(latestManifestId4).toEqual('');
    jestExpect(downloadedManifestId4).toEqual('');
    // After check for update and getting a rollback
    jestExpect(isUpdateAvailable5).toEqual('true');
    jestExpect(isUpdatePending5).toEqual('false');
    jestExpect(isRollback5).toEqual('true');
    jestExpect(latestManifestId5).toEqual('');
    jestExpect(downloadedManifestId5).toEqual('');
  });

  it('Receives expected events when update available on start', async () => {
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
    // Launch app
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();
    {
      const logEntries: any[] = await readLogEntriesAsync();
      console.warn(
        'Total number of log entries = ' +
          logEntries.length +
          '\n' +
          JSON.stringify(logEntries, null, 2)
      );
      await clearLogEntriesAsync();
    }

    const lastUpdateEventType = await testElementValueAsync('lastUpdateEventType');
    // Server is not running, so error received
    console.warn(`lastUpdateEventType = ${lastUpdateEventType}`);

    // Start server with no update available directive,
    // then restart app, we should get "No update available" event
    let lastUpdateEventType2 = '';
    if (protocolVersion === 1) {
      Server.start(Update.serverPort, protocolVersion);
      const directive = Update.getNoUpdateAvailableDirective();
      await Server.serveSignedDirective(directive, projectRoot);
      await device.terminateApp();
      await device.launchApp();
      await waitForAppToBecomeVisible();
      {
        const logEntries: any[] = await readLogEntriesAsync();
        console.warn(
          'Total number of log entries = ' +
            logEntries.length +
            '\n' +
            JSON.stringify(logEntries, null, 2)
        );
        await clearLogEntriesAsync();
      }

      lastUpdateEventType2 = await testElementValueAsync('lastUpdateEventType');
      console.warn(`lastUpdateEventType2 = ${lastUpdateEventType2}`);
      Server.stop();
    }

    // Relaunch app after server has an update,
    // we should get the 'update available' event
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();
    {
      const logEntries: any[] = await readLogEntriesAsync();
      console.warn(
        'Total number of log entries = ' +
          logEntries.length +
          '\n' +
          JSON.stringify(logEntries, null, 2)
      );
      jestExpect(logEntries.length).toBeGreaterThan(0);
      await clearLogEntriesAsync();
    }

    const lastUpdateEventType3 = await testElementValueAsync('lastUpdateEventType');
    console.warn(`lastUpdateEventType3 = ${lastUpdateEventType3}`);

    // Test passes if all the event types seen are the expected ones
    // This test not working on Android in 0.72 in the CI environment, so disable it for now.
    if (platform === 'ios') {
      jestExpect(lastUpdateEventType).toEqual('error');
      jestExpect(lastUpdateEventType2).toEqual('noUpdateAvailable');
      jestExpect(lastUpdateEventType3).toEqual('updateAvailable');
    }
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
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('embedded assets deleted from internal storage should be re-copied', async () => {
    // Simplest scenario; only one update (embedded) is loaded, then assets are cleared from
    // internal storage. The app is then relaunched with the same embedded update.
    // DatabaseLauncher should copy all the missing assets and run the update as normal.
    jest.setTimeout(300000 * TIMEOUT_BIAS);
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
  });

  it('embedded assets deleted from internal storage should be re-copied from a new embedded update', async () => {
    // This test ensures that when trying to launch a NEW update that includes some OLD assets we
    // already have (according to SQLite), even if those assets are actually missing from disk
    // (but included in the embedded update) DatabaseLauncher can recover.
    //
    // To create this scenario, we load a single (embedded) update, then clear assets from
    // internal storage. Then we install a NEW build with a NEW embedded update but that includes
    // some of the same assets. When we launch this new build, DatabaseLauncher should still copy
    // the missing assets and run the update as normal.
    jest.setTimeout(300000 * TIMEOUT_BIAS);
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
  });

  it('assets in a downloaded update deleted from internal storage should be re-copied or re-downloaded', async () => {
    // This test ensures we can (or at least try to) recover missing assets that originated from a
    // downloaded update, as opposed to assets originally copied from an embedded update (which
    // the previous 2 tests concern).
    //
    // To create this scenario, we launch an app, download an update with multiple assets
    // (including at least one -- the bundle -- not part of the embedded update), make sure the
    // update runs, then clear assets from internal storage. When we relaunch the app,
    // DatabaseLauncher should re-download the missing assets and run the update as normal.
    jest.setTimeout(300000 * TIMEOUT_BIAS);

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
    const manifest = Update.getUpdateManifestForBundleFilename(
      new Date(),
      bundleHash,
      'test-assets-bundle',
      bundleFilename,
      assets
    );

    // Install the app and launch it so that it downloads the new update we're hosting
    Server.start(Update.serverPort, protocolVersion);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({ newInstance: true });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);

    // give the app time to load the new update in the background
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1); // only the bundle should be new

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
    numAssets = await checkNumAssetsAsync();
    jestExpect(numAssets).toBe(manifest.assets.length + 1);
    updateID = await testElementValueAsync('updateID');
    jestExpect(updateID).toEqual(manifest.id);
    jestExpect(Server.consumeRequestedStaticFiles().length).toBe(1); // should have re-downloaded only the JS bundle; the rest should have been copied from the app binary
  });
});
