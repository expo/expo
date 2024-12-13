import type { ExpoUpdatesManifest } from '@expo/config';
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import assert from 'node:assert';
import { stripVTControlCharacters } from 'node:util';

import { executeAsync, processFindPrefixedValue } from './process';
import {
  type BackgroundServer,
  type BackgroundServerOptions,
  createBackgroundServer,
} from './server';

const EXPO_CLI_BIN = require.resolve('../../build/bin/cli');

/** Execute the Expo CLI, from source and with verbose logging on unexpected errors */
export const executeExpoAsync: typeof executeAsync = (cwd, flags, options) =>
  executeAsync(cwd, flags, {
    command: ['node', EXPO_CLI_BIN],
    ...options,
  });

/** Install any (dev) dependencies with Bun and verbose logging on unexpected errors */
export const executeBunAsync: typeof executeAsync = (cwd, flags, options) =>
  executeAsync(cwd, flags, {
    command: ['bun'],
    ...options,
  });

/** Create a managed background server running `expo serve` from source */
export function createExpoServe(options: Partial<BackgroundServerOptions> = {}) {
  return createBackgroundServer({
    command: (port) => [EXPO_CLI_BIN, 'serve', `--port=${port}`],
    host: (chunk) => processFindPrefixedValue(chunk, 'Server running at'),
    ...options,
  });
}

/** Create a managed background server running `expo start` from source with helper fetchers */
export function createExpoStart(options: Partial<BackgroundServerOptions> = {}) {
  const server = createBackgroundServer({
    command: (port) => [EXPO_CLI_BIN, 'start', `--port=${port}`],
    host: (chunk) => {
      const info = processFindPrefixedValue(chunk, '[__EXPO_E2E_TEST:server]');
      if (info) {
        const url = new URL(JSON.parse(info).url);
        // NOTE(cedric): it returns `localhost`, but prefer to use `127.0.0.1` for Windows
        url.host = '127.0.0.1';
        return url;
      }

      const output = stripVTControlCharacters(chunk.toString());
      if (/Use port \d+ instead/.test(output)) {
        throw new Error('Expo start tried to use a busy port');
      }
      if (/Skipping dev server/.test(output)) {
        throw new Error('Expo start is skipping the dev server');
      }

      return null;
    },
    ...options,
    env: {
      // Enable the output line that returns the host of the server
      __EXPO_E2E_TEST: '1',
      ...options.env,
    },
  });

  return Object.assign(server, {
    /** Fetch any bundle from the server, and assert the response does not include Metro errors */
    fetchBundleAsync: (url: string, init?: RequestInit) => fetchBundleAsync(server, url, init),
    /** Fetch anything from the server, while using similar headers as Expo Go */
    fetchAsExpoGoAsync: (url: string, init?: RequestInit) => fetchAsExpoGoAsync(server, url, init),
    /** Fetch the Expo Go manifest, while fetching as Expo Go itself */
    fetchExpoGoManifestAsync: (init?: RequestInit) => fetchExpoGoManifestAsync(server, init),
  });
}

/** Fetch any bundle from the server, and assert the response does not include Metro errors */
async function fetchBundleAsync(server: BackgroundServer, url: string, init?: RequestInit) {
  const response = await server.fetchAsync(url, init);

  // This is the same Metro error handling we use elsewhere
  if (response.status === 500) {
    const text = await response.text();

    if (
      text.startsWith('{"originModulePath"') ||
      text.startsWith('{"type":"TransformError"') ||
      text.startsWith('{"type":"InternalError"')
    ) {
      const error = JSON.parse(text);
      throw new Error(`Bundle fetch failed, received ${stripVTControlCharacters(error.message)}`);
    }

    throw new Error(`Bundle fetch failed, received ${response.statusText} (${response.status})`);
  }

  return response;
}

/** Fetch anything from the server, while using similar headers as Expo Go */
function fetchAsExpoGoAsync(server: BackgroundServer, url: string, init: RequestInit = {}) {
  return server.fetchAsync(url, {
    ...init,
    headers: {
      // TODO: Match up all headers
      'expo-platform': 'ios',
      Accept: 'multipart/mixed',
      ...init.headers,
    },
  });
}

/** Fetch the Expo Go manifest, while fetching as Expo Go itself */
async function fetchExpoGoManifestAsync(server: BackgroundServer, init?: RequestInit) {
  const response = await fetchAsExpoGoAsync(server, '/', init);
  const multiparts = await parseMultipartMixedResponseAsync(
    response.headers.get('content-type') as string,
    Buffer.from(await response.arrayBuffer())
  );

  const manifest = multiparts.find((part) => isMultipartPartWithName(part, 'manifest'));
  assert(manifest, 'Manifest not found in the multipart response');
  return JSON.parse(manifest.body) as ExpoUpdatesManifest;
}
