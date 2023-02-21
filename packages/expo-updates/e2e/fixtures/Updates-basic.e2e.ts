import { device } from 'detox';
import path from 'path';
import { setTimeout } from 'timers/promises';

import Server from './utils/server';

import Update from './utils/update';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const platform = (process.env.DETOX_CONFIGURATION || 'ios.release').split('.')[0];

const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

describe('', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('starts app, stops, and starts again', async () => {
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    console.warn(`Message = ${message}`);
    expect(message).toBe('test');
    await device.terminateApp();

    await expect(Server.waitForRequest(5000 * TIMEOUT_BIAS)).rejects.toThrow(
      'Timed out waiting for message'
    );

    await device.launchApp();
    const message2 = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
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
    await setTimeout(3000);
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

    Server.start(Update.serverPort);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
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

    Server.start(Update.serverPort);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(1);

    // restart the app to verify the new update isn't used
    await device.terminateApp();
    await device.launchApp();
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
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

    Server.start(Update.serverPort);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    // Because of the mismatch, the new update will not load, so updatedMessage will still be 'test'
    expect(updatedMessage).toBe('test');

    /**
     * Check readLogEntriesAsync
     */
    const logEntries = await Server.waitForLogEntries(10000 * TIMEOUT_BIAS);
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

    Server.start(Update.serverPort);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(message).toBe('test');

    // give the app time to load the new update in the background
    await setTimeout(2000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(4);

    // restart the app so it will launch the new update
    await device.terminateApp();
    await device.launchApp();
    const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);

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

    Server.start(Update.serverPort);
    await Server.serveSignedManifest(manifest, projectRoot);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
    const firstMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(firstMessage).toBe('test');

    // give the app time to load the new update in the background (i.e. to make sure it doesn't)
    await setTimeout(3000 * TIMEOUT_BIAS);
    expect(Server.consumeRequestedStaticFiles().length).toBe(0);

    // restart the app and make sure it's still running the initial update
    await device.terminateApp();
    await device.launchApp();
    const secondMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
    expect(secondMessage).toBe('test');
  });
});
