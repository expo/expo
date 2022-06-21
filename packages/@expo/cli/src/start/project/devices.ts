import { createTemporaryProjectFile } from './dotExpo';

const debug = require('debug')('expo:start:project:devices') as typeof console.log;

export type DeviceInfo = {
  installationId: string;
  lastUsed: number;
};

export type DevicesInfo = {
  devices: DeviceInfo[];
};

const DEVICES_FILE_NAME = 'devices.json';

const MILLISECONDS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export const DevicesFile = createTemporaryProjectFile<DevicesInfo>(DEVICES_FILE_NAME, {
  devices: [],
});

let devicesInfo: DevicesInfo | null = null;

export async function getDevicesInfoAsync(projectRoot: string): Promise<DevicesInfo> {
  if (devicesInfo) {
    return devicesInfo;
  }
  return readDevicesInfoAsync(projectRoot);
}

export async function readDevicesInfoAsync(projectRoot: string): Promise<DevicesInfo> {
  try {
    devicesInfo = await DevicesFile.readAsync(projectRoot);

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
    return await DevicesFile.setAsync(projectRoot, { devices: [] });
  }
}

export async function setDevicesInfoAsync(
  projectRoot: string,
  json: DevicesInfo
): Promise<DevicesInfo> {
  devicesInfo = json;
  return await DevicesFile.setAsync(projectRoot, json);
}

export async function saveDevicesAsync(
  projectRoot: string,
  deviceIds: string | string[]
): Promise<void> {
  const currentTime = Date.now();
  const newDeviceIds = typeof deviceIds === 'string' ? [deviceIds] : deviceIds;

  debug(`Saving devices: ${newDeviceIds}`);
  const { devices } = await getDevicesInfoAsync(projectRoot);
  const newDevicesJson = devices
    .filter((device) => !newDeviceIds.includes(device.installationId))
    .concat(newDeviceIds.map((deviceId) => ({ installationId: deviceId, lastUsed: currentTime })));
  await setDevicesInfoAsync(projectRoot, { devices: filterOldDevices(newDevicesJson) });
}

function filterOldDevices(devices: DeviceInfo[]) {
  const currentTime = Date.now();
  return (
    devices
      // filter out any devices that haven't been used to open this project in 30 days
      .filter((device) => currentTime - device.lastUsed <= MILLISECONDS_IN_30_DAYS)
      // keep only the 10 most recently used devices
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 10)
  );
}
