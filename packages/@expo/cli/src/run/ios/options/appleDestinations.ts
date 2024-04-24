import spawnAsync from '@expo/spawn-async';

import { Log } from '../../../log';
import { OSType } from '../../../start/platforms/ios/simctl';
import * as SimControl from '../../../start/platforms/ios/simctl';
import { BuildProps } from '../XcodeBuild.types';
import * as AppleDevice from '../appleDevice/AppleDevice';

const debug = require('debug')('expo:apple-destination') as typeof console.log;

interface Destination {
  // 'visionOS'
  platform: string;
  // 'arm64'
  arch?: string;
  // 'Designed for [iPad,iPhone]'
  variant?: string;
  // '00008112-001A20EC1E78A01E'
  id: string;
  // 'Apple Vision Pro'
  name: string;
  // Available in simulators
  OS?: string;
}

function coerceDestinationPlatformToOsType(platform: string): OSType {
  // The only two devices I have to test against...
  switch (platform) {
    case 'iOS':
      return 'iOS';
    case 'xrOS':
    case 'visionOS':
      return 'xrOS';
    case 'macOS':
      return 'macOS';
    default:
      debug('Unknown destination platform (needs to be added to Expo CLI):', platform);
      return platform as OSType;
  }
}

// Runs `.filter(Boolean)` on the array with correct types.
function filterBoolean<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(Boolean) as T[];
}

function warnDestinationObject(obj: any): Destination | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  if ('platform' in obj && 'id' in obj && 'name' in obj) {
    return obj;
  }
  Log.warn('Unexpected xcode destination object:', obj);
  return null;
}

function parseXcodeDestinationString(str: string): Destination[] {
  const parsedLines = filterBoolean(
    str
      .trim()
      .split('\n')
      .map((line: string) => {
        line = line.trim();
        return line.startsWith('{') ? line : null;
      })
  ).map((line) => {
    const inner = line.match(/{(.*)}/)?.[1];

    if (!inner) return null;

    return Object.fromEntries(
      filterBoolean(
        inner
          .trim()
          .split(', ')
          .map((item) => item.trim().match(/(?<key>[^:]+):(?<value>.+)/)?.groups)
      ).map((item) => [item!.key, item!.value])
    );
  });

  return filterBoolean(parsedLines.map(warnDestinationObject));
}

function coercePhysicalDevice(
  device: Destination
): Pick<AppleDevice.ConnectedDevice, 'udid' | 'name' | 'osType' | 'deviceType' | 'osVersion'> {
  // physical device
  return {
    /** @example `00008101-001964A22629003A` */
    udid: device.id,
    /** @example `Evan's phone` */
    name: device.name,
    /** @example `iPhone13,4` */
    // model: 'UNKNOWN',
    /** @example `device` */
    deviceType: 'device',
    osType: coerceDestinationPlatformToOsType(device.platform),

    osVersion: '',
  };
}

function coerceSimulatorDevice(
  device: Destination
): Pick<
  SimControl.Device,
  | 'udid'
  | 'name'
  | 'osType'
  | 'osVersion'
  | 'runtime'
  | 'isAvailable'
  | 'deviceTypeIdentifier'
  | 'state'
  | 'windowName'
> {
  // simulator
  return {
    /** '00E55DC0-0364-49DF-9EC6-77BE587137D4' */
    udid: device.id,
    /** 'com.apple.CoreSimulator.SimRuntime.iOS-15-1' */
    runtime: '',
    /** If the device is "available" which generally means that the OS files haven't been deleted (this can happen when Xcode updates).  */
    isAvailable: true,

    deviceTypeIdentifier: '',

    state: 'Shutdown',
    /** 'iPhone 13 Pro' */
    name: device.name,
    /** Type of OS the device uses. */
    osType: device.platform === 'visionOS Simulator' ? 'xrOS' : 'iOS',
    /** '15.1' */
    osVersion: device.OS!,
    /** 'iPhone 13 Pro (15.1)' */
    windowName: `${device.name} (${device.OS})`,
  };
}

function coerceDestinationObjectToKnownDeviceType(device: Destination) {
  if (device.arch) {
    // physical device
    return coercePhysicalDevice(device);
  } else if (device.OS) {
    // simulator
    return coerceSimulatorDevice(device);
  } else {
    // "Any device"
    return null;
  }
}

export async function resolveDestinationsAsync(
  props: Pick<BuildProps, 'configuration' | 'scheme' | 'xcodeProject'>
): Promise<{ name: string; osType: OSType; osVersion: string; udid: string }[]> {
  // xcodebuild -workspace /Users/evanbacon/Documents/GitHub/lab/apr23/ios/apr23.xcworkspace -configuration Debug -scheme apr23 -showdestinations -json

  const { stdout } = await spawnAsync('xcodebuild', [
    props.xcodeProject.isWorkspace ? '-workspace' : '-project',
    props.xcodeProject.name,
    '-configuration',
    props.configuration,
    '-scheme',
    props.scheme,
    '-showdestinations',
    '-quiet',
  ]);

  //   console.log(JSON.stringify(stdout, null, 2));

  const destinationObjects = parseXcodeDestinationString(stdout);

  return filterBoolean(destinationObjects.map(coerceDestinationObjectToKnownDeviceType));
}
