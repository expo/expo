import JsonFile from '@expo/json-file';
import TelemetryClient from '@expo/rudder-sdk-node';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

import type { CommandOptions } from './types';
import { env } from './utils/env';

const packageJson = require('../package.json');

/** The telemetry client instance to use */
let client: TelemetryClient | null = null;
/** The anonymous identity ID */
let telemetryId: string | null = null;

export function getTelemetryClient() {
  if (!client) {
    client = new TelemetryClient(
      env.EXPO_STAGING || env.EXPO_LOCAL
        ? '24TKICqYKilXM480mA7ktgVDdea'
        : '24TKR7CQAaGgIrLTgu3Fp4OdOkI', // expo unified,
      'https://cdp.expo.dev/v1/batch',
      {
        flushInterval: 300,
      }
    );

    // Empty the telemetry queue on exit
    process.on('SIGINT', () => client?.flush?.());
    process.on('SIGTERM', () => client?.flush?.());
  }

  return client;
}

// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
function getExpoHomeDirectory() {
  const home = os.homedir();
  if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
    return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
  } else if (env.EXPO_STAGING) {
    return path.join(home, '.expo-staging');
  } else if (env.EXPO_LOCAL) {
    return path.join(home, '.expo-local');
  }
  return path.join(home, '.expo');
}

function getUserStatePath() {
  return path.join(getExpoHomeDirectory(), 'state.json');
}

/** Get the randomly generated anonymous ID from the persistent storage, see @expo/cli */
async function getTelemetryIdAsync() {
  const settings = new JsonFile<{ uuid?: string }>(getUserStatePath(), {
    ensureDir: true,
    jsonParseErrorDefault: {},
    cantReadFileDefault: {},
  });

  let id = await settings.getAsync('uuid', null);

  if (!id) {
    id = crypto.randomUUID();
    await settings.setAsync('uuid', id);
  }

  return id;
}

function getTelemetryContext() {
  const PLATFORM_NAMES: Partial<Record<NodeJS.Platform, string>> = {
    darwin: 'Mac',
    win32: 'Windows',
    linux: 'Linux',
  };

  return {
    os: { name: PLATFORM_NAMES[os.platform()] ?? os.platform(), version: os.release() },
    app: { name: 'create-expo-module', version: packageJson.version ?? undefined },
  };
}

type Event = {
  event: 'create expo module';
  properties: Record<string, any>;
};

export async function logEventAsync(event: Event) {
  if (env.EXPO_NO_TELEMETRY) {
    return;
  }

  if (!telemetryId) {
    telemetryId = await getTelemetryIdAsync();
    getTelemetryClient().identify({ anonymousId: telemetryId });
  }

  const commonProperties = {
    source: 'create-expo-module',
    source_version: packageJson.version ?? undefined,
  };

  getTelemetryClient().track({
    ...event,
    properties: { ...event.properties, ...commonProperties },
    anonymousId: telemetryId,
    context: getTelemetryContext(),
  });
}

export function eventCreateExpoModule(packageManager: string, options: CommandOptions) {
  return {
    event: 'create expo module' as const, // DO NOT EDIT, unless knowing what you are doing
    properties: {
      nodeVersion: process.version,
      packageManager,
      withTemplate: !!options.source,
      withReadme: options.withReadme,
      withChangelog: options.withChangelog,
      withExample: options.example,
      local: !!options.local,
    },
  };
}
