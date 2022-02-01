import JsonFile from '@expo/json-file';
import path from 'path';

import { dotExpoProjectDirectory } from './ProjectSettings';

export type DeviceInfo = {
  installationId: string;
  lastUsed: number;
};

export type DevicesInfo = {
  devices: DeviceInfo[];
};

const devicesFile = 'devices.json';

const MILLISECONDS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function devicesJsonFile(projectRoot: string): JsonFile<DevicesInfo> {
  return new JsonFile<DevicesInfo>(path.join(dotExpoProjectDirectory(projectRoot), devicesFile));
}

let devicesInfo: DevicesInfo | null = null;

export async function getDevicesInfoAsync(projectRoot: string): Promise<DevicesInfo> {
  if (devicesInfo) {
    return devicesInfo;
  }
  return readDevicesInfoAsync(projectRoot);
}

export async function readDevicesInfoAsync(projectRoot: string): Promise<DevicesInfo> {
  try {
    devicesInfo = await devicesJsonFile(projectRoot).readAsync({
      cantReadFileDefault: { devices: [] },
    });

    // if the file on disk has old devices, filter them out here before we use them
    const filteredDevices = filterOldDevices(devicesInfo.devices);
    if (filteredDevices.length < devicesInfo.devices.length) {
      devicesInfo = {
        ...devicesInfo,
        devices: filteredDevices,
      };
      // save the newly filtered list for consistency
      try {
        await setDevicesInfoAsync(projectRoot, devicesInfo);
      } catch {
        // do nothing here, we'll just keep using the filtered list in memory for now
      }
    }

    return devicesInfo;
  } catch {
    return await devicesJsonFile(projectRoot).writeAsync({ devices: [] });
  }
}

export async function setDevicesInfoAsync(
  projectRoot: string,
  json: DevicesInfo
): Promise<DevicesInfo> {
  devicesInfo = json;

  try {
    return await devicesJsonFile(projectRoot).mergeAsync(json, {
      cantReadFileDefault: { devices: [] },
    });
  } catch {
    return await devicesJsonFile(projectRoot).writeAsync(json);
  }
}

export async function saveDevicesAsync(
  projectRoot: string,
  deviceIds: string | string[]
): Promise<void> {
  const currentTime = new Date().getTime();
  const newDeviceIds = typeof deviceIds === 'string' ? [deviceIds] : deviceIds;

  const { devices } = await getDevicesInfoAsync(projectRoot);
  const newDevicesJson = devices
    .filter((device) => {
      if (newDeviceIds.includes(device.installationId)) {
        return false;
      }
      return true;
    })
    .concat(newDeviceIds.map((deviceId) => ({ installationId: deviceId, lastUsed: currentTime })));
  await setDevicesInfoAsync(projectRoot, { devices: filterOldDevices(newDevicesJson) });
}

function filterOldDevices(devices: DeviceInfo[]) {
  const currentTime = new Date().getTime();
  return (
    devices
      .filter((device) => {
        // filter out any devices that haven't been used to open this project in 30 days
        if (currentTime - device.lastUsed > MILLISECONDS_IN_30_DAYS) {
          return false;
        }
        return true;
      })
      // keep only the 10 most recently used devices
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 10)
  );
}
