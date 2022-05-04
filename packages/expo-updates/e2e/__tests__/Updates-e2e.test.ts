import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Dictionary, serializeDictionary } from 'structured-headers';
import { setTimeout } from 'timers/promises';
import uuid from 'uuid/v4';

import * as Server from './utils/server';
import * as Simulator from './utils/simulator';
import { copyBundleToStaticFolder } from './utils/update';

const SERVER_HOST = process.env.UPDATES_HOST;
const SERVER_PORT = parseInt(process.env.UPDATES_PORT, 10);

// Keep in sync with the manifest in .github/workflows/updates-e2e.yml
const RUNTIME_VERSION = '1.0.0';

const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

async function getPrivateKeyAsync() {
  const privateKeyPath = process.env.TEST_PRIVATE_KEY_PATH;
  const pemBuffer = fs.readFileSync(path.resolve(privateKeyPath));
  return pemBuffer.toString('utf8');
}

function signRSASHA256(data: string, privateKey: string) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data, 'utf8');
  sign.end();
  return sign.sign(privateKey, 'base64');
}

function convertToDictionaryItemsRepresentation(obj: { [key: string]: string }): Dictionary {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}

beforeEach(async () => {});

afterEach(async () => {
  await Simulator.uninstallApp();
  Server.stop();
});

test('starts app, stops, and starts again', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await Simulator.installApp();
  await Simulator.startApp();
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');
  await Simulator.stopApp();

  await expect(Server.waitForResponse(5000 * TIMEOUT_BIAS)).rejects.toThrow(
    'Timed out waiting for response'
  );

  await Simulator.startApp();
  const response2 = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response2).toBe('test');
});

test('initial request includes correct update-id headers', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await Simulator.installApp();
  await Simulator.startApp();
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
    createdAt: new Date().toISOString(),
    runtimeVersion: RUNTIME_VERSION,
    launchAsset: {
      hash,
      key: 'test-update-1-key',
      contentType: 'application/javascript',
      url: `http://${SERVER_HOST}:${SERVER_PORT}/static/bundle1.js`,
    },
    assets: [],
    metadata: {},
    extra: {},
  };

  const privateKey = await getPrivateKeyAsync();
  const manifestString = JSON.stringify(manifest);
  const hashSignature = signRSASHA256(manifestString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);

  Server.start(SERVER_PORT);
  Server.serveManifest(manifest, { 'expo-protocol-version': '0', 'expo-signature': signature });
  await Simulator.installApp();
  await Simulator.startApp();
  const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');

  // give the app time to load the new update in the background
  await setTimeout(2000 * TIMEOUT_BIAS);

  // restart the app so it will launch the new update
  await Simulator.stopApp();
  await Simulator.startApp();
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
