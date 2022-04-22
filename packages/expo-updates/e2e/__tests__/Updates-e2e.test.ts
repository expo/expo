import { setTimeout } from 'timers/promises';
import uuid from 'uuid/v4';

import { copyBundleToStaticFolder } from './utils/bundle';
import * as Device from './utils/device.ios'; // TODO: fix!!!!
import * as Server from './utils/server';

const SERVER_HOST = process.env.UPDATES_HOST;
const SERVER_PORT = parseInt(process.env.UPDATES_PORT, 10);

const RUNTIME_VERSION = '1.0.0';

const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

beforeEach(async () => {});

afterEach(async () => {
  await Device.uninstallApp();
  Server.stop();
});

test('starts app, stops, and starts again', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await Device.installApp();
  await Device.startApp();
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');
  await Device.stopApp();

  await expect(Server.waitForResponse(5000 * TIMEOUT_BIAS)).rejects.toThrow(
    'Timed out waiting for response'
  );

  await Device.startApp();
  const response2 = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response2).toBe('test');
});

test('initial request includes correct update-id headers', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await Device.installApp();
  await Device.startApp();
  const request = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  expect(request.headers['expo-embedded-update-id']).toBeDefined();
  expect(request.headers['expo-current-update-id']).toBeDefined();
  // before any updates, the current update ID and embedded update ID should be the same
  expect(request.headers['expo-current-update-id']).toEqual(
    request.headers['expo-embedded-update-id']
  );
});

test('downloads and runs update, and updates current-update-id header', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  const hash = await copyBundleToStaticFolder('bundle1.js', 'test-update-1');
  const manifest = {
    id: uuid(),
    createdAt: new Date().getTime(),
    runtimeVersion: RUNTIME_VERSION,
    launchAsset: {
      hash,
      key: '801599597d77b3522bf40c7021eb0313',
      contentType: 'application/javascript',
      url: `http://${SERVER_HOST}:${SERVER_PORT}/static/bundle1.js`,
    },
    assets: [],
    metadata: {},
    extra: {},
  };

  Server.start(SERVER_PORT);
  Server.serveManifest(manifest, { 'expo-protocol-version': '0' });
  await Device.installApp();
  await Device.startApp();
  const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');

  // give the app time to load the new update in the background
  await setTimeout(2000 * TIMEOUT_BIAS);

  // restart the app so it will launch the new update
  await Device.stopApp();
  await Device.startApp();
  const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  const updatedResponse = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(updatedResponse).toBe('test-update-1');

  expect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
  expect(secondRequest.headers['expo-embedded-update-id']).toEqual(
    firstRequest.headers['expo-embedded-update-id']
  );
  expect(secondRequest.headers['expo-current-update-id']).toBeDefined();
  expect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
});
