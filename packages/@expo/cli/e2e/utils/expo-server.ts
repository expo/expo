import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';
import stripAnsi from 'strip-ansi';

import {
  type BackgroundServer,
  type BackgroundServerOptions,
  createBackgroundServer,
  findPrefixedValue,
} from './server';

const EXPO_CLI_BIN = require.resolve('../../build/bin/cli');

export function createExpoServeServer(options: Partial<BackgroundServerOptions> = {}) {
  return createBackgroundServer({
    command: (port) => [EXPO_CLI_BIN, 'serve', `--port=${port}`],
    host: (chunk) => findPrefixedValue(stripAnsi(chunk.toString()), 'Server running at '),
    ...options,
  });
}

export function createExpoStartServer(options: Partial<BackgroundServerOptions> = {}) {
  const server = createBackgroundServer({
    command: (port) => [EXPO_CLI_BIN, 'start', `--port=${port}`],
    host: (chunk) => {
      const output = stripAnsi(chunk.toString());
      const serverInfo = findPrefixedValue(output, '[__EXPO_E2E_TEST:server]');
      if (serverInfo) {
        const url = new URL(JSON.parse(serverInfo).url);
        url.host = '127.0.0.1';
        return url;
      }
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
      // Enable the server host log, to check if the server is ready
      __EXPO_E2E_TEST: '1',
      ...options.env,
    },
  });

  return Object.assign(server, {
    fetchBundleAsync: (url: string) => fetchBundleAsync(server, url),
    fetchAsExpoGoAsync: (url: string) => fetchAsExpoGoAsync(server, url),
    fetchExpoGoManifestAsync: () => fetchExpoGoManifestAsync(server),
  });
}

async function fetchBundleAsync(server: BackgroundServer, url: string) {
  const response = await server.fetchAsync(url);

  // This is the same Metro error handling we use elsewhere
  if (response.status === 500) {
    const text = await response.text();

    if (
      text.startsWith('{"originModulePath"') ||
      text.startsWith('{"type":"TransformError"') ||
      text.startsWith('{"type":"InternalError"')
    ) {
      const error = JSON.parse(text);
      throw new Error(`Bundle fetch failed, received ${stripAnsi(error.message)}`);
    }

    throw new Error(`Bundle fetch failed, received ${response.statusText} (${response.status})`);
  }

  return response;
}

function fetchAsExpoGoAsync(server: BackgroundServer, url: string) {
  return server.fetchAsync(url, {
    headers: {
      // TODO: Match up all headers
      'expo-platform': 'ios',
      Accept: 'multipart/mixed',
    },
  });
}
async function fetchExpoGoManifestAsync(server: BackgroundServer) {
  const response = await fetchAsExpoGoAsync(server, '/');
  const multiparts = await parseMultipartMixedResponseAsync(
    response.headers.get('content-type') as string,
    Buffer.from(await response.arrayBuffer())
  );

  const manifest = multiparts.find((part) => isMultipartPartWithName(part, 'manifest'));
  assert(manifest, 'Manifest not found in the multipart response');
  return JSON.parse(manifest.body);
}
