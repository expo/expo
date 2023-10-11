import RudderAnalytics from '@expo/rudder-sdk-node';
import { spawn } from 'child_process';
import * as ciInfo from 'ci-info';
import fs from 'fs';
import os from 'os';
import path from 'path';

import UserSettings from '../../api/user/UserSettings';
import { getUserAsync } from '../../api/user/user';
import { env } from '../env';

const DETACHED_FLUSH = !env.EXPO_DEBUG;
const PLATFORM_TO_ANALYTICS_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

let client: RudderAnalytics | null = null;
let identified = false;
let identifyData: {
  userId: string;
  deviceId: string;
  traits: Record<string, any>;
} | null = null;

export type DetachedEventsQueue = Parameters<typeof logEventAsync>[];
const detachedFlushQueue: DetachedEventsQueue = [];

export function resetInternalStateForTesting() {
  identified = false;
  identifyData = null;
  client = null;
}

export function getRudderAnalyticsClient(): RudderAnalytics {
  if (client) {
    return client;
  }

  client = new RudderAnalytics(
    env.EXPO_STAGING || env.EXPO_LOCAL
      ? '24TKICqYKilXM480mA7ktgVDdea'
      : '24TKR7CQAaGgIrLTgu3Fp4OdOkI', // expo unified
    'https://cdp.expo.dev/v1/batch',
    {
      flushInterval: 300,
    }
  );

  // Install flush on exit...
  if (DETACHED_FLUSH) {
    console.log('DETACHED FLUSH ENABLED');
    process.on('SIGINT', () => flushDetached());
    process.on('SIGTERM', () => flushDetached());
  } else {
    console.log('DETACHED FLUSH DISABLED');
    process.on('SIGINT', () => client?.flush?.());
    process.on('SIGTERM', () => client?.flush?.());
  }

  return client;
}

export async function setUserDataAsync(userId: string, traits: Record<string, any>): Promise<void> {
  if (env.EXPO_NO_TELEMETRY) {
    return;
  }

  const deviceId = await UserSettings.getAnonymousIdentifierAsync();

  identifyData = {
    userId,
    deviceId,
    traits,
  };

  identifyIfNotYetIdentified();
}

export type Event =
  | 'action'
  | 'Open Url on Device'
  | 'Start Project'
  | 'Serve Manifest'
  | 'Serve Expo Updates Manifest'
  | 'dev client start command'
  | 'dev client run command'
  | 'metro config'
  | 'metro debug';

/**
 * Log an event, ensuring the user is identified before logging the event.
 **/
export async function logEventAsync(
  event: Event,
  properties: Record<string, any> = {}
): Promise<void> {
  if (env.EXPO_NO_TELEMETRY) {
    return;
  }

  // Keep in memory when using detached flush
  if (DETACHED_FLUSH) {
    detachedFlushQueue.push([event, properties]);
    return;
  }

  // this has the side effect of calling `setUserData` which fetches the user and populates identifyData
  try {
    await getUserAsync();
  } catch {}

  identifyIfNotYetIdentified();

  if (!identifyData) {
    return;
  }
  const { userId, deviceId } = identifyData;
  const commonEventProperties = { source_version: process.env.__EXPO_VERSION, source: 'expo' };

  const identity = { userId, anonymousId: deviceId };
  getRudderAnalyticsClient().track({
    event,
    properties: { ...properties, ...commonEventProperties },
    ...identity,
    context: getContext(),
  });
}

function identifyIfNotYetIdentified(): void {
  if (env.EXPO_NO_TELEMETRY || identified || !identifyData) {
    return;
  }

  getRudderAnalyticsClient().identify({
    userId: identifyData.userId,
    anonymousId: identifyData.deviceId,
    traits: identifyData.traits,
  });
  identified = true;
}

/** Exposed for testing only */
export function getContext(): Record<string, any> {
  const platform = PLATFORM_TO_ANALYTICS_PLATFORM[os.platform()] || os.platform();
  return {
    os: { name: platform, version: os.release() },
    device: { type: platform, model: platform },
    app: { name: 'expo', version: process.env.__EXPO_VERSION },
    ci: ciInfo.isCI ? { name: ciInfo.name, isPr: ciInfo.isPR } : undefined,
  };
}

export function flushDetached() {
  // Nothing to flush
  if (!detachedFlushQueue.length) {
    console.log('Skipping flush, no events to flush');
    return;
  }

  const eventsFile = path.join(UserSettings.getDirectory(), '_events.json');
  fs.writeFileSync(eventsFile, JSON.stringify(detachedFlushQueue));

  console.log('Written to', eventsFile);

  spawn(process.execPath, [require.resolve('./flushDetachedRudderstack'), eventsFile], {
    detached: true,
    windowsHide: true,
    shell: false,
  });
}
