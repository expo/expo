import path from 'path';
import { setTimeout } from 'timers/promises';
import uuid from 'uuid/v4';

import * as Server from '../utils/server';
import * as Simulator from '../utils/simulator';
import { copyAssetToStaticFolder, copyBundleToStaticFolder } from '../utils/update';

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
const updateDistPath = path.join(process.env.ARTIFACTS_DEST, 'dist-basic');

export default () =>
  describe('Basic e2e', () => {
    afterEach(async () => {
      await Simulator.uninstallApp();
      Server.stop();
    });

    it('starts app, stops, and starts again', async () => {
      jest.setTimeout(300000 * TIMEOUT_BIAS);
      Server.start(SERVER_PORT);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(message).toBe('test');
      await Simulator.stopApp();

      await expect(Server.waitForRequest(5000 * TIMEOUT_BIAS)).rejects.toThrow(
        'Timed out waiting for message'
      );

      await Simulator.startApp();
      const message2 = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(message2).toBe('test');
    });

    it('initial request includes correct update-id headers', async () => {
      jest.setTimeout(300000 * TIMEOUT_BIAS);
      Server.start(SERVER_PORT);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      const request = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
      expect(request.headers['expo-embedded-update-id']).toBeDefined();
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
      const hash = await copyBundleToStaticFolder(updateDistPath, bundleFilename, newNotifyString);
      const manifest = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        runtimeVersion: RUNTIME_VERSION,
        launchAsset: {
          hash,
          key: 'test-update-1-key',
          contentType: 'application/javascript',
          url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${bundleFilename}`,
        },
        assets: [],
        metadata: {},
        extra: {},
      };

      Server.start(SERVER_PORT);
      await Server.serveSignedManifest(manifest, projectRoot);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
      const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(message).toBe('test');

      // give the app time to load the new update in the background
      await setTimeout(2000 * TIMEOUT_BIAS);
      expect(Server.consumeRequestedStaticFiles().length).toBe(1);

      // restart the app so it will launch the new update
      await Simulator.stopApp();
      await Simulator.startApp();
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
      await copyBundleToStaticFolder(updateDistPath, bundleFilename, newNotifyString);
      const hash = 'invalid-hash';
      const manifest = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        runtimeVersion: RUNTIME_VERSION,
        launchAsset: {
          hash,
          key: 'test-update-1-key',
          contentType: 'application/javascript',
          url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${bundleFilename}`,
        },
        assets: [],
        metadata: {},
        extra: {},
      };

      Server.start(SERVER_PORT);
      await Server.serveSignedManifest(manifest, projectRoot);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
      const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(message).toBe('test');

      // give the app time to load the new update in the background
      await setTimeout(2000 * TIMEOUT_BIAS);
      expect(Server.consumeRequestedStaticFiles().length).toBe(1);

      // restart the app to verify the new update isn't used
      await Simulator.stopApp();
      await Simulator.startApp();
      await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
      const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(updatedMessage).toBe('test');
    });

    it('downloads and runs update with multiple assets', async () => {
      jest.setTimeout(300000 * TIMEOUT_BIAS);
      const bundleFilename = 'bundle2.js';
      const newNotifyString = 'test-update-2';
      const hash = await copyBundleToStaticFolder(updateDistPath, bundleFilename, newNotifyString);
      const assets = await Promise.all(
        [
          'lubo-minar-j2RgHfqKhCM-unsplash.jpg',
          'niklas-liniger-zuPiCN7xekM-unsplash.jpg',
          'patrick-untersee-XJjsuuDwWas-unsplash.jpg',
        ].map(async (sourceFilename, index) => {
          const destinationFilename = `asset${index}.jpg`;
          const hash = await copyAssetToStaticFolder(
            path.resolve(__dirname, '..', 'assets', sourceFilename),
            destinationFilename
          );
          return {
            hash,
            key: `asset${index}`,
            contentType: 'image/jpg',
            fileExtension: '.jpg',
            url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${destinationFilename}`,
          };
        })
      );
      const manifest = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        runtimeVersion: RUNTIME_VERSION,
        launchAsset: {
          hash,
          key: 'test-update-2-key',
          contentType: 'application/javascript',
          url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${bundleFilename}`,
        },
        assets,
        metadata: {},
        extra: {},
      };

      Server.start(SERVER_PORT);
      await Server.serveSignedManifest(manifest, projectRoot);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      const message = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(message).toBe('test');

      // give the app time to load the new update in the background
      await setTimeout(2000 * TIMEOUT_BIAS);
      expect(Server.consumeRequestedStaticFiles().length).toBe(4);

      // restart the app so it will launch the new update
      await Simulator.stopApp();
      await Simulator.startApp();
      const updatedMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(updatedMessage).toBe(newNotifyString);
    });

    // important for usage accuracy
    it('does not download any assets for an older update', async () => {
      jest.setTimeout(300000 * TIMEOUT_BIAS);
      const bundleFilename = 'bundle-old.js';
      const hash = await copyBundleToStaticFolder(
        updateDistPath,
        bundleFilename,
        'test-update-older'
      );
      const manifest = {
        id: uuid(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
        runtimeVersion: RUNTIME_VERSION,
        launchAsset: {
          hash,
          key: 'test-update-old-key',
          contentType: 'application/javascript',
          url: `http://${SERVER_HOST}:${SERVER_PORT}/static/${bundleFilename}`,
        },
        assets: [],
        metadata: {},
        extra: {},
      };

      Server.start(SERVER_PORT);
      await Server.serveSignedManifest(manifest, projectRoot);
      await Simulator.installApp('basic');
      await Simulator.startApp();
      await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
      const firstMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(firstMessage).toBe('test');

      // give the app time to load the new update in the background (i.e. to make sure it doesn't)
      await setTimeout(3000 * TIMEOUT_BIAS);
      expect(Server.consumeRequestedStaticFiles().length).toBe(0);

      // restart the app and make sure it's still running the initial update
      await Simulator.stopApp();
      await Simulator.startApp();
      const secondMessage = await Server.waitForRequest(10000 * TIMEOUT_BIAS);
      expect(secondMessage).toBe('test');
    });
  });
