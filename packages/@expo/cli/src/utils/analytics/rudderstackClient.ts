import RudderAnalytics from '@expo/rudder-sdk-node';
import * as ciInfo from 'ci-info';
import os from 'os';

import UserSettings from '../../api/user/UserSettings';
import { getUserAsync } from '../../api/user/user';
import { env } from '../env';

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
  process.on('SIGINT', () => client?.flush?.());
  process.on('SIGTERM', () => client?.flush?.());

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

type Event =
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
