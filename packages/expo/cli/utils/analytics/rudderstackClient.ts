import RudderAnalytics from '@expo/rudder-sdk-node';
import os from 'os';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';

import UserSettings from '../user/UserSettings';

const PLATFORM_TO_ANALYTICS_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

let rudderstackClient: RudderAnalytics | null = null;
let userIdentified = false;
let identifyData: {
  userId: string;
  deviceId: string;
  traits: Record<string, any>;
} | null = null;

export async function initAsync(): Promise<void> {
  // TODO: remove after some time
  const amplitudeEnabled = await UserSettings.getAsync('amplitudeEnabled', null);
  if (amplitudeEnabled !== null) {
    await UserSettings.setAsync('analyticsEnabled', amplitudeEnabled);
    await UserSettings.deleteKeyAsync('amplitudeEnabled');
  }
  const amplitudeDeviceId = await UserSettings.getAsync('amplitudeDeviceId', null);
  if (amplitudeDeviceId !== null) {
    await UserSettings.setAsync('analyticsDeviceId', amplitudeDeviceId);
    await UserSettings.deleteKeyAsync('amplitudeDeviceId');
  }
  // TODO: cut here
  if (process.env.DISABLE_EAS_ANALYTICS) {
    await UserSettings.setAsync('analyticsEnabled', false);
  }

  const analyticsEnabled = await UserSettings.getAsync('analyticsEnabled', true);
  if (analyticsEnabled) {
    const config =
      process.env.EXPO_STAGING || process.env.EXPO_LOCAL
        ? {
            // staging environment
            rudderstackWriteKey: '1wpX20Da4ltFGSXbPFYUL00Chb7',
            rudderstackDataPlaneURL: 'https://cdp.expo.dev',
          }
        : {
            // prod environment
            rudderstackWriteKey: '1wpXLFxmujq86etH6G6cc90hPcC',
            rudderstackDataPlaneURL: 'https://cdp.expo.dev',
          };

    rudderstackClient = new RudderAnalytics(
      config.rudderstackWriteKey,
      new URL('/v1/batch', config.rudderstackDataPlaneURL).toString(),
      {
        flushInterval: 300,
      }
    );
  }
}

export async function setUserDataAsync(userId: string, traits: Record<string, any>): Promise<void> {
  const savedDeviceId = await UserSettings.getAsync('analyticsDeviceId', null);
  const deviceId = savedDeviceId ?? uuidv4();
  if (!savedDeviceId) {
    await UserSettings.setAsync('analyticsDeviceId', deviceId);
  }

  identifyData = {
    userId,
    deviceId,
    traits,
  };

  ensureUserIdentified();
}

export async function flushAsync(): Promise<void> {
  if (rudderstackClient) {
    await rudderstackClient.flush();
  }
}

export function logEvent(name: string, properties: Record<string, any> = {}): void {
  if (!rudderstackClient) {
    return;
  }
  ensureUserIdentified();

  const { userId, deviceId } = identifyData ?? {};
  const commonEventProperties = { source_version: process.env.__EXPO_VERSION, source: 'expo' };

  const identity = { userId: userId ?? undefined, anonymousId: deviceId ?? uuidv4() };
  rudderstackClient.track({
    event: name,
    properties: { ...properties, ...commonEventProperties },
    ...identity,
    context: getRudderStackContext(),
  });
}

function ensureUserIdentified(): void {
  if (!rudderstackClient || userIdentified || !identifyData) {
    return;
  }

  rudderstackClient.identify({
    userId: identifyData.userId,
    anonymousId: identifyData.deviceId,
    traits: identifyData.traits,
  });
  userIdentified = true;
}

function getRudderStackContext(): Record<string, any> {
  const platform = PLATFORM_TO_ANALYTICS_PLATFORM[os.platform()] || os.platform();
  return {
    os: { name: platform, version: os.release() },
    device: { type: platform, model: platform },
    app: { name: 'expo', version: process.env.__EXPO_VERSION ?? undefined },
  };
}

export enum AnalyticsEvent {
  ACTION = 'action', // generic event type which is used to determine the 'daily active user' stat, include an `action: eas ${subcommand}` property inside of the event properties object
}
