import RudderAnalytics from '@expo/rudder-sdk-node';
import os from 'os';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { EXPO_LOCAL, EXPO_STAGING, EXPO_NO_TELEMETRY } from '../env';
import UserSettings from '../user/UserSettings';

const PLATFORM_TO_ANALYTICS_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

let rudderstackClient: RudderAnalytics | null = null;
let identifier = false;
let identifyData: {
  userId: string;
  deviceId: string;
  traits: Record<string, any>;
} | null = null;

export async function initAsync(): Promise<void> {
  if (EXPO_NO_TELEMETRY) {
    const config =
      EXPO_STAGING || EXPO_LOCAL
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

  ensureIdentified();
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
  ensureIdentified();

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

function ensureIdentified(): void {
  if (!rudderstackClient || identifier || !identifyData) {
    return;
  }

  rudderstackClient.identify({
    userId: identifyData.userId,
    anonymousId: identifyData.deviceId,
    traits: identifyData.traits,
  });
  identifier = true;
}

function getRudderStackContext(): Record<string, any> {
  const platform = PLATFORM_TO_ANALYTICS_PLATFORM[os.platform()] || os.platform();
  return {
    os: { name: platform, version: os.release() },
    device: { type: platform, model: platform },
    app: { name: 'expo', version: process.env.__EXPO_VERSION },
  };
}

export enum AnalyticsEvent {
  ACTION = 'action', // generic event type which is used to determine the 'daily active user' stat, include an `action: expo ${subcommand}` property inside of the event properties object
}
