import { getConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';
import path from 'path';
import tempy from 'tempy';
import fs from 'fs';

import { ANONYMOUS_USERNAME, getUserAsync } from '../api/user/user';
import { Log } from '../log';
import { AppleAppIdResolver } from '../start/platforms/ios/AppleAppIdResolver';
import {
  AppleDeviceManager,
  EXPO_GO_BUNDLE_IDENTIFIER,
} from '../start/platforms/ios/AppleDeviceManager';
import { assertSystemRequirementsAsync } from '../start/platforms/ios/assertSystemRequirements';
import * as simctl from '../start/platforms/ios/simctl';
import { CommandError } from '../utils/errors';
import { setNodeEnv } from '../utils/nodeEnv';
import { fetchAsync } from '../api/rest/client';

type Options = {
  go?: boolean;
  devClient?: boolean;
  force?: boolean;
};

const debug = require('debug')('expo:push') as typeof console.log;

export async function pushAsync(projectRoot: string, options: Options) {
  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  await assertSystemRequirementsAsync();

  const { exp } = getConfig(projectRoot);
  const device = await AppleDeviceManager.resolveAsync();
  device.activateWindowAsync();

  const isAmbiguous = !options.go && !options.devClient;
  let applicationId: string = EXPO_GO_BUNDLE_IDENTIFIER;
  if (!options.go || options.devClient) {
    try {
      applicationId = await new AppleAppIdResolver(projectRoot).getAppIdAsync();
      if (!(await device.isAppInstalledAsync(applicationId))) {
        throw new CommandError(
          `Cannot push notifications to ${applicationId} for device ${device.name} because the app is not installed. Run with --go to push to Expo Go.`
        );
      } else {
        debug(`Pushing notifications to ${applicationId} for device ${device.name}`);
      }
      options.devClient = true;
    } catch (error) {
      debug(error);
      options.go = true;
    }
  }

  Log.log(
    chalk`Pushing notifications to ${device.device.name} for {cyan ${
      options.go ? 'Expo Go' : 'development build'
    }} {gray (${applicationId})}`
  );

  if (options.force) {
    // TODO: Apple doesn't support toggling on notifications permissions
    // await simctl.privacyAsync(device.device, {
    //   action: 'grant',
    //   service: 'all',
    //   bundleIdentifier: applicationId,
    // });
  }

  const jsonFilePath = tempy.file({ extension: 'json' });

  const notification = await getNotificationFileAsync(projectRoot);

  let payload: PushConfig = {};

  if (options.go) {
    await device.ensureExpoGoAsync(exp.sdkVersion);

    const user = await getUserAsync();
    payload = {
      // "Simulator Target Bundle": "host.exp.Exponent",
      experienceId: `@${
        user?.__typename === 'User'
          ? user.username
          : user?.__typename === 'SSOUser'
          ? user.username
          : ANONYMOUS_USERNAME ?? ANONYMOUS_USERNAME
      }/${exp.slug}`,
      ...notification,
      body: {
        type: 'IOS_PUSH',
        ...notification.body,
      },
    };
  } else {
    payload = {
      ...notification,

      body: {
        ...notification.body,
      },
    };
  }

  if (payload?.aps?.sound) {
    const soundRef = payload.aps.sound;
    if (typeof soundRef === 'string') {
      payload.aps.sound =
        (await ensureAudioFileAsync(projectRoot, {
          soundRef,
          applicationId,
          device,
        })) ?? soundRef;
    } else if (typeof soundRef === 'object' && typeof soundRef.name === 'string') {
      payload.aps.sound.name =
        (await ensureAudioFileAsync(projectRoot, {
          soundRef: soundRef.name,
          applicationId,
          device,
        })) ?? soundRef;
    }
  }

  // TODO: Measure 4096 byte limit

  await JsonFile.writeAsync(jsonFilePath, payload);

  console.log('payload', payload);
  debug(`Pushing notification to ${device.device.udid} with payload ${jsonFilePath}`);
  await simctl.pushAsync(device.device, {
    bundleIdentifier: applicationId,
    jsonFilePath,
  });
}

async function ensureAudioFileAsync(
  projectRoot: string,
  {
    device,
    soundRef,
    applicationId,
  }: { device: AppleDeviceManager; soundRef: string; applicationId: string }
): Promise<string | null> {
  if (!soundRef) {
    return null;
  } else if (soundRef === 'default') {
    return soundRef;
  } else if (soundRef.match(/^https?:\/\//)) {
    // Download with node-fetch

    const cacheKey = soundRef.replace(/[^a-z0-9_-]/gi, '_');

    const tempFile = path.join(projectRoot, '.expo/notifications/sound-cache', cacheKey);

    if (fs.existsSync(tempFile)) {
      debug('using cached remote audio file:', tempFile);
      return ensureAudioFileAsync(projectRoot, { device, soundRef: tempFile, applicationId });
    }

    const response = await fetchAsync(soundRef);
    if (!response.ok) {
      throw new CommandError(`Failed to download sound file from ${soundRef}`);
    }
    const buffer = await response.buffer();

    // Write to temp file

    await fs.promises.mkdir(path.dirname(tempFile), { recursive: true });
    fs.writeFileSync(tempFile, buffer);
    Log.log(`Downloaded sound file from ${soundRef}`);
    return ensureAudioFileAsync(projectRoot, { device, soundRef: tempFile, applicationId });
  }

  if (soundRef.startsWith('/') || soundRef.startsWith('~') || soundRef.startsWith('.')) {
    const soundRefResolved = path.resolve(soundRef);
    if (!fs.existsSync(soundRefResolved)) {
      throw new CommandError(`Sound file ${soundRefResolved} does not exist`);
    }
    const container = await simctl.getContainerPathAsync(device.device, {
      appId: applicationId,
      type: 'data',
    });

    if (!container) {
      throw new CommandError(
        `App for bundle identifier "${applicationId}" is not installed on "${device.device.name}"`
      );
    }
    const soundsDir = path.join(container, 'Library/Sounds');
    await fs.promises.mkdir(soundsDir, { recursive: true });
    const tempFileName = 'expo-cli-temp' + path.extname(soundRef);
    const outputFile = path.join(soundsDir, tempFileName);
    fs.copyFileSync(soundRefResolved, outputFile);
    Log.log(`Copied sound file ${soundRefResolved} to ${soundsDir}`);
    return tempFileName;
  }
  return null;
}

async function getNotificationFileAsync(projectRoot: string): Promise<PushConfig> {
  const pushConfigFile = resolveFrom.silent(projectRoot, './expo-push.config.js');
  if (pushConfigFile) {
    const notificationExport = require(pushConfigFile);

    return typeof notificationExport === 'function'
      ? await notificationExport()
      : notificationExport;
  }
  const pushConfigJsonFile = resolveFrom.silent(projectRoot, './expo-push.config.json');
  if (pushConfigJsonFile) {
    return await JsonFile.readAsync(pushConfigJsonFile);
  }
  throw new CommandError(`No expo-push.config.js or expo-push.config.json found in project root`);
}

// https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943360
// `aps sound path:/(^|\/)*\.apns$/`
export type PushConfig = {
  /** For Expo Go */
  experienceId?: string;
  aps?: {
    alert?: {
      title: string;
      subtitle?: string;
      body?: string;
    };
    category?: string;
    /** https://developer.apple.com/documentation/usernotifications/unnotificationsound */
    sound?:
      | 'default'
      | string
      | {
          critical: 1;
          name: string;
          /** 0 - 1 (1 is max) */
          volume: number;
        };
    badge?: number;
  };
  body?: {
    type?: string;
    url?: string;
  } & Record<string, any>;
};
