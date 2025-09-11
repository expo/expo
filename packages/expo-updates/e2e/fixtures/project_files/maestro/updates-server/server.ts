const crypto = require('crypto');
import type * as cryptoTypes from 'crypto';
import { UpdatesLogEntry } from 'expo-updates';
const express = require('express');
const FormData = require('form-data');
const spawnAsync = require('@expo/spawn-async');
const fs = require('fs');
const path = require('path');
const serializeDictionary = require('structured-headers').serializeDictionary;
const setTimeout = require('timers/promises').setTimeout;
const setTimeoutNormal = require('timers').setTimeout;
const Update = require('./update').Update;
const projectRoot = path.resolve(__dirname, '../..');

import type { Request, Response } from 'express';

const supportedPlatforms = new Set(['android', 'ios']);
const supportedConfigurations = new Set(['debug', 'release']);
const supportedManifestRequests = new Set([
  'no-update-available',
  'test-update-basic',
  'test-update-invalid-hash',
  'test-update-with-invalid-asset-hash',
  'test-update-with-multiple-assets',
  'test-update-with-older-commit-time',
  'test-update-before-rollback',
  'test-rollback',
  'test-update-for-fingerprint',
  'test-update-for-asset-deletion',
  'test-update-crashing',
]);

const app = express();

let server: { close: () => void } | null;

let messages: any[] = [];
let responsesToServe: any[] = [];

let updateRequest: Request | null = null;

let manifestToServe: null = null;
let manifestHeadersToServe: { [x: string]: any } | null = null;
let serveChannel: string | null = null;

let logEntries: UpdatesLogEntry[] = [];

let multipartResponseToServe: any = null;
let requestedStaticFiles: string[] = [];

let protocolVersion: number = 1;
let artificialDelay: number = 0;
let serveOverriddenUrl: boolean = false;
let isRunning: boolean = false;

function start(
  protocol: number = 1,
  artificialDelayMs: number = 0,
  shouldServeOverriddenUrl: boolean = false
) {
  const port = Update.serverPort;
  console.log(`Starting server on port ${port}...`);
  isRunning = true;
  if (!server) {
    server = app.listen(port);
    protocolVersion = protocol;
    artificialDelay = artificialDelayMs;
    serveOverriddenUrl = shouldServeOverriddenUrl;
  }
}

function isStarted() {
  return isRunning;
}

function stop() {
  if (server) {
    server.close();
    server = null;
    isRunning = false;
  }
  messages = [];
  responsesToServe = [];
  updateRequest = null;
  manifestToServe = null;
  manifestHeadersToServe = null;
  serveChannel = null;
  multipartResponseToServe = null;
  requestedStaticFiles = [];
  logEntries = [];
}

function getRequestedStaticFilesLength() {
  return requestedStaticFiles.length;
}

function consumeRequestedStaticFiles() {
  const returnArray = requestedStaticFiles;
  requestedStaticFiles = [];
  return returnArray;
}

app.use(express.json());
app.use('/static', (req: { url: string }, res: any, next: () => void) => {
  requestedStaticFiles.push(path.basename(req.url));
  next();
});
app.use('/static', express.static(path.resolve(__dirname, '..', '.static')));

app.get(
  '/notify/:string',
  (
    req: { params: { string: any } },
    res: {
      set: (arg0: string, arg1: string) => void;
      json: (arg0: any) => void;
      send: (arg0: string) => void;
    }
  ) => {
    messages.push(req.params.string);
    res.set('Cache-Control', 'no-store');
    if (responsesToServe[0]) {
      res.json(responsesToServe.shift());
    } else {
      res.send('Received request');
    }
  }
);

app.post(
  '/post',
  (
    req: { body: any },
    res: {
      set: (arg0: string, arg1: string) => void;
      json: (arg0: any) => void;
      send: (arg0: string) => void;
    }
  ) => {
    messages.push(req.body);
    res.set('Cache-Control', 'no-store');
    if (responsesToServe[0]) {
      res.json(responsesToServe.shift());
    } else {
      res.send('Received request');
    }
  }
);

app.get('/update', (req: any, res: any) => {
  if (serveOverriddenUrl) {
    res.statusCode = 204;
    res.setHeader('expo-protocol-version', 1);
    res.setHeader('expo-sfv-version', 0);
    res.setHeader('cache-control', 'private, max-age=0');
    res.end();
    return;
  }
  updateRequestHandler(req, res);
});

app.get('/update-override', (req: any, res: any) => {
  // serve the update on overridden
  updateRequestHandler(req, res);
});

const updateRequestHandler = (req: any, res: any) => {
  console.log('Received update request: ', JSON.stringify(req.headers, null, 2));
  updateRequest = req;
  if (multipartResponseToServe && isChannelMatched(req)) {
    console.log('Serving multipart response');
    // Protocol 1: multipart and rollbacks supported
    const form = new FormData();

    if (multipartResponseToServe.manifest) {
      form.append('manifest', JSON.stringify(multipartResponseToServe.manifest), {
        contentType: 'application/json',
        header: {
          'content-type': 'application/json; charset=utf-8',
          'expo-signature': multipartResponseToServe.manifestSignature,
        },
      });
    }

    if (multipartResponseToServe.directive) {
      form.append('directive', JSON.stringify(multipartResponseToServe.directive), {
        contentType: 'application/json',
        header: {
          'content-type': 'application/json; charset=utf-8',
          'expo-signature': multipartResponseToServe.directiveSignature,
        },
      });
    }

    const sendResponse = () => {
      res.statusCode = 200;
      res.setHeader('expo-protocol-version', 1);
      res.setHeader('expo-sfv-version', 0);
      res.setHeader('cache-control', 'private, max-age=0');
      res.setHeader('content-type', `multipart/mixed; boundary=${form.getBoundary()}`);
      res.write(form.getBuffer());
      res.end();
    };

    if (artificialDelay > 0) {
      setTimeoutNormal(() => {
        sendResponse();
      }, artificialDelay);
    } else {
      sendResponse();
    }
  } else if (manifestToServe && isChannelMatched(req)) {
    // Protocol 0
    console.log('Serving manifest with protocol 0');
    if (manifestHeadersToServe) {
      Object.keys(manifestHeadersToServe).forEach((headerName) => {
        res.set(headerName, manifestHeadersToServe ? manifestHeadersToServe[headerName] : '');
      });
    }
    res.json(manifestToServe);
  } else {
    console.log('No manifest to serve');
    res.status(404).send('No update available');
  }
};

function isChannelMatched(req: any): boolean {
  if (!serveChannel) {
    return true;
  }
  const channel = req.headers['expo-channel-name'];
  return channel === serveChannel;
}

async function waitForUpdateRequest(timeout: number): Promise<{ headers: any }> {
  const finishTime = new Date().getTime() + timeout;
  while (!updateRequest && server) {
    const currentTime = new Date().getTime();
    if (currentTime >= finishTime) {
      throw new Error('Timed out waiting for update request');
    }
    if (!server) {
      throw new Error('Server killed while waiting for update');
    }
    await setTimeout(50);
  }

  const request: { headers: any } = updateRequest || { headers: {} };
  updateRequest = null;
  return request;
}

async function getPrivateKeyAsync(projectRoot: string) {
  const codeSigningPrivateKeyPath = path.join(projectRoot, 'keys', 'private-key.pem');
  const pemBuffer = fs.readFileSync(path.resolve(codeSigningPrivateKeyPath));
  return pemBuffer.toString('utf8');
}

function signRSASHA256(
  data: string,
  privateKey: cryptoTypes.KeyLike | cryptoTypes.SignKeyObjectInput | cryptoTypes.SignPrivateKeyInput
) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data, 'utf8');
  sign.end();
  return sign.sign(privateKey, 'base64');
}

function convertToDictionaryItemsRepresentation(
  obj: { [s: string]: unknown } | ArrayLike<unknown>
): any {
  return new Map(
    Object.entries(obj).map(([k, v]) => {
      return [k, [v, new Map()]];
    })
  );
}

function serveManifest(manifest: any, headers: any = null) {
  manifestToServe = manifest;
  manifestHeadersToServe = headers;
}

async function serveSignedManifest(manifest: any, projectRoot: any) {
  if (protocolVersion === 0) {
    serveSignedManifest0(manifest, projectRoot);
  } else {
    serveSignedManifest1(manifest, projectRoot);
  }
}

// Protocol 0
async function serveSignedManifest0(manifest: any, projectRoot: any) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const manifestString = JSON.stringify(manifest);
  const hashSignature = signRSASHA256(manifestString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  serveManifest(manifest, { 'expo-protocol-version': '0', 'expo-signature': signature });
}

// Protocol 1 multipart response
async function serveSignedManifest1(manifest: any, projectRoot: any) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const manifestString = JSON.stringify(manifest);
  const hashSignature = signRSASHA256(manifestString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  multipartResponseToServe = {
    manifest,
    manifestSignature: signature,
  };
}

// Protocol 1 directive response (including rollback)
async function serveSignedDirective(directive: any, projectRoot: string) {
  const privateKey = await getPrivateKeyAsync(projectRoot);
  const directiveString = JSON.stringify(directive);
  const hashSignature = signRSASHA256(directiveString, privateKey);
  const dictionary = convertToDictionaryItemsRepresentation({
    sig: hashSignature,
    keyid: 'main',
  });
  const signature = serializeDictionary(dictionary);
  multipartResponseToServe = {
    directive,
    directiveSignature: signature,
  };
}

// Endpoints for use by Maestro to control the server and get info
// on recent requests

app.get('/uninstall-client', async (req: Request, res: Response) => {
  console.log(`Received request to remove client on platform ${req.query.platform}`);
  if (!supportedPlatforms.has(req.query.platform as string)) {
    res.status(400).send(`Missing or unknown platform: ${req.query.platform}`);
    return;
  }
  await uninstallClient(req.query.platform as string);
  await setTimeout(2000);
  res.status(200).send('OK');
});

app.get('/install-client', async (req: Request, res: Response) => {
  console.log(
    `Received request to install client on platform ${req.query.platform} with configuration ${req.query.configuration}`
  );
  if (!supportedConfigurations.has(req.query.configuration as string)) {
    res.status(400).send(`Missing or unknown configuration: ${req.query.configuration}`);
    return;
  }
  if (!supportedPlatforms.has(req.query.platform as string)) {
    res.status(400).send(`Missing or unknown platform: ${req.query.platform}`);
    return;
  }
  await installClient(req.query.platform as string, req.query.configuration as string);
  await setTimeout(5000);
  res.status(200).send('OK');
});

async function uninstallClient(platform: string) {
  console.log(`yarn maestro:${platform}:uninstall`);
  // If app not present, this will fail but that's OK
  try {
    await spawnAsync('yarn', [`maestro:${platform}:uninstall`], {
      cwd: projectRoot,
    });
  } catch (e) {
    console.log("Failed to uninstall app, but that's OK if it wasn't installed", e);
  }
}

async function installClient(platform: string, configuration: string) {
  console.log(`yarn maestro:${platform}:${configuration}:install`);
  await spawnAsync('yarn', [`maestro:${platform}:${configuration}:install`], {
    cwd: projectRoot,
  });
}

app.get('/restart-server', (req: Request, res: Response) => {
  console.log('Received request to restart server');
  let newArtificialDelay = 0;
  let newServeOverriddenUrl = false;
  if (req.query.ms) {
    newArtificialDelay = parseInt(req.query.ms as string, 10);
    console.log(`Setting artificial delay to ${artificialDelay} ms`);
  }
  if (req.query.serveOverriddenUrl) {
    newServeOverriddenUrl = true;
  }
  res.status(200).send('OK');
  restartServer(newArtificialDelay, newServeOverriddenUrl);
});

async function restartServer(newArtificialDelay: number, newServeOverriddenUrl: boolean) {
  console.log('Restarting server');
  await setTimeout(100);
  Server.stop();
  Server.start(protocolVersion, newArtificialDelay, newServeOverriddenUrl);
  console.log('Server restarted');
}

app.get('/stop-server', (_: Request, res: Response) => {
  console.log('Received request to stop server');
  res.status(200).send('OK');
  stopServer();
});

async function stopServer() {
  console.log('Stopping server');
  await setTimeout(100);
  Server.stop();
}

app.get('/static-file-count', (_: Request, res: Response) => {
  console.log('Received request for static file count');
  const count = getRequestedStaticFilesLength();
  console.log('Static file count: ', count);
  res.status(200).send({
    count,
  });
});

app.post('/upload-log-entries', (req: Request, res: Response) => {
  console.log('Received request to upload logs');
  logEntries = req.body as unknown as UpdatesLogEntry[];
  console.log(`Received ${logEntries.length} log entries`);
  res.status(200).send('OK');
});

app.get('/log-entries', (_: Request, res: Response) => {
  console.log('Received request for log entries');
  res.status(200).json(logEntries).end();
});

app.get('/delay', async (req: Request, res: Response) => {
  console.log('Received request to delay: ', req.query.ms);
  if (!req.query.ms) {
    res.status(400).send('Missing delay');
    return;
  }
  const delay = parseInt(req.query.ms as string);
  await setTimeout(delay);
  res.status(200).send('OK');
});

app.get('/last-request-headers', (_: Request, res: Response) => {
  console.log('Last request headers: ', JSON.stringify(updateRequest?.headers, null, 2));
  if (!updateRequest) {
    res.status(404).send('No update request');
    return;
  }
  res.status(200).json(updateRequest.headers).end();
  return;
});

app.get('/serve-manifest', async (req: Request, res: Response) => {
  if (req.query.channel) {
    console.log(
      `Received request to serve manifest named: ${req.query.name} on platform: ${req.query.platform} with channel: ${req.query.channel}`
    );
  } else {
    console.log(
      `Received request to serve manifest named: ${req.query.name} on platform: ${req.query.platform}`
    );
  }
  try {
    if (!supportedManifestRequests.has(req.query.name as string)) {
      const errorMessage = `Missing or unknown manifest name: ${req.query.name}`;
      console.log(errorMessage);
      res.status(400).send(errorMessage);
      return;
    }
    if (!supportedPlatforms.has(req.query.platform as string)) {
      const errorMessage = `Missing or unknown platform: ${req.query.platform}`;
      console.log(errorMessage);
      res.status(400).send(errorMessage);
      return;
    }
    if (req.query.channel) {
      serveChannel = String(req.query.channel);
    }
    const manifestId = await respondToServeManifestRequest(
      req.query.name as string,
      req.query.platform as string
    );
    res.status(200).send(manifestId);
  } catch (e) {
    console.log('Error serving manifest: ', e);
    res.status(500).send('Error serving manifest: ' + e);
    return;
  }
});

// Set up the updates server to serve the different test updates

async function respondToServeManifestRequest(
  name: string,
  platform: string = 'android'
): Promise<string> {
  switch (name) {
    case 'no-update-available':
      return await serveNoUpdateAvailable();
    case 'test-update-basic':
      return await serveTestUpdate1(platform);
    case 'test-update-invalid-hash':
      return await serveTestUpdateInvalidHash(platform);
    case 'test-update-with-invalid-asset-hash':
      return await serveTestUpdateWithInvalidAssetHash(platform);
    case 'test-update-with-multiple-assets':
      return await serveTestUpdateWithMultipleAssets(platform);
    case 'test-update-with-older-commit-time':
      return await serveTestUpdateWithOlderCommitTime(platform);
    case 'test-update-before-rollback':
      return await serveTestUpdateBeforeRollback(platform);
    case 'test-rollback':
      return await serveRollback();
    case 'test-update-for-asset-deletion':
      return await serveTestUpdateForAssetDeletion(platform);
    case 'test-update-for-fingerprint':
      return await serveTestUpdateWithFingerprint(platform);
    case 'test-update-crashing':
      return await serveTestUpdateCrashing(platform);
    default:
      throw new Error('Unknown manifest name: ' + name);
  }
}

async function serveNoUpdateAvailable(): Promise<string> {
  await serveSignedDirective(Update.getNoUpdateAvailableDirective(), projectRoot);
  return '';
}

async function serveTestUpdateCrashing(platform: string): Promise<string> {
  const bundleFilename = 'bundle1.js';
  const newNotifyString = 'test-update-crashing';
  const hash = await Update.copyBundleToStaticFolder(
    projectRoot,
    bundleFilename,
    newNotifyString,
    platform
  );
  const manifest = Update.getUpdateManifestForBundleFilename(
    new Date(),
    hash,
    'test-update-crashing-key',
    bundleFilename,
    [],
    projectRoot
  );

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateWithFingerprint(platform: string): Promise<string> {
  const bundleFilename = 'bundle1.js';
  const newNotifyString = 'test-update-1';
  const hash = await Update.copyBundleToStaticFolder(
    projectRoot,
    bundleFilename,
    newNotifyString,
    platform
  );
  const manifest =
    await Update.getUpdateManifestForBundleFilenameWithFingerprintRuntimeVersionAsync(
      new Date(),
      hash,
      'test-update-1-key',
      bundleFilename,
      [],
      projectRoot,
      platform
    );
  console.log(`Serving fingerprint manifest: ${JSON.stringify(manifest, null, 2)}`);
  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdate1(platform: string): Promise<string> {
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
  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateInvalidHash(platform: string): Promise<string> {
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateWithInvalidAssetHash(platform: string): Promise<string> {
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
        hash: index === 0 ? hash.substring(1, 2) + hash.substring(0, 1) + hash.substring(2) : hash,
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateWithMultipleAssets(platform: string): Promise<string> {
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateWithOlderCommitTime(platform: string): Promise<string> {
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveTestUpdateBeforeRollback(platform: string): Promise<string> {
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

async function serveRollback(): Promise<string> {
  // serve a rollback now
  const rollbackDirective = Update.getRollbackDirective(new Date());
  await serveSignedDirective(rollbackDirective, projectRoot);
  return 'rollback';
}

async function serveTestUpdateForAssetDeletion(platform: string): Promise<string> {
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

  await serveSignedManifest(manifest, projectRoot);
  return manifest.id;
}

const Server = {
  start,
  stop,
  isStarted,
  waitForUpdateRequest,
  serveManifest,
  serveSignedManifest,
  serveSignedDirective,
  getRequestedStaticFilesLength,
  consumeRequestedStaticFiles,
};

module.exports = { Server };
