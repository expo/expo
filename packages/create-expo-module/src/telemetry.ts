import { getUserStatePath } from '@expo/config/build/getUserState';
import JsonFile from '@expo/json-file';
import TelemetryClient from '@expo/rudder-sdk-node';
import crypto from 'crypto';
import { boolish } from 'getenv';
import os from 'os';

import { CommandOptions } from './types';

const packageJson = require('../package.json');

/** If telemetry is disabled by the user */
const EXPO_NO_TELEMETRY = boolish('EXPO_NO_TELEMETRY', false);
/** If the tool is running in a sanboxed environment, either staging or local envs */
const EXPO_SANDBOX = boolish('EXPO_STAGING', false) || boolish('EXPO_LOCAL', false);

/** The telemetry client instance to use */
let client: TelemetryClient | null = null;
/** The anonymous identity ID */
let telemetryId: string | null = null;

export function getTelemetryClient() {
  if (!client) {
    client = new TelemetryClient(
      EXPO_SANDBOX ? '24TKICqYKilXM480mA7ktgVDdea' : '24TKR7CQAaGgIrLTgu3Fp4OdOkI', // expo unified,
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
  if (EXPO_NO_TELEMETRY) {
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
