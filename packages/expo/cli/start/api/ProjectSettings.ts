import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

type ProjectStatus = 'running' | 'ill' | 'exited';

export type ProjectSettings = {
  scheme: string | null;
  hostType: 'localhost' | 'lan' | 'tunnel';
  lanType: 'ip' | 'hostname';
  dev: boolean;
  devClient: boolean;
  minify: boolean;
  urlRandomness: string | null;
  https: boolean;
};
export type Settings = ProjectSettings;

const projectSettingsFile = 'settings.json';
const projectSettingsDefaults: ProjectSettings = {
  scheme: null,
  hostType: 'lan',
  lanType: 'ip',
  devClient: false,
  dev: true,
  minify: false,
  urlRandomness: null,
  https: false,
};

type PackagerInfo = {
  packagerPort?: number | null;
  packagerPid?: number | null;
  packagerNgrokUrl?: string | null;
  ngrokPid?: number | null;
  devToolsPort?: number | null;
  webpackServerPort?: number | null;
  target?: 'managed' | 'bare';
};
const packagerInfoFile = 'packager-info.json';

export type DeviceInfo = {
  installationId: string;
  lastUsed: number;
};
export type DevicesInfo = {
  devices: DeviceInfo[];
};
const devicesFile = 'devices.json';

const MILLISECONDS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function projectSettingsJsonFile(projectRoot: string): JsonFile<ProjectSettings> {
  return new JsonFile<ProjectSettings>(
    path.join(dotExpoProjectDirectory(projectRoot), projectSettingsFile)
  );
}

function packagerInfoJsonFile(projectRoot: string): JsonFile<PackagerInfo> {
  return new JsonFile<PackagerInfo>(
    path.join(dotExpoProjectDirectory(projectRoot), packagerInfoFile)
  );
}

function devicesJsonFile(projectRoot: string): JsonFile<DevicesInfo> {
  return new JsonFile<DevicesInfo>(path.join(dotExpoProjectDirectory(projectRoot), devicesFile));
}

export async function readAsync(projectRoot: string): Promise<ProjectSettings> {
  let projectSettings;
  try {
    projectSettings = await projectSettingsJsonFile(projectRoot).readAsync();
  } catch (e) {
    projectSettings = await projectSettingsJsonFile(projectRoot).writeAsync(
      projectSettingsDefaults
    );
  }
  migrateDeprecatedSettings(projectSettings);
  // Set defaults for any missing fields
  return { ...projectSettingsDefaults, ...projectSettings };
}

function migrateDeprecatedSettings(projectSettings: any): void {
  if (projectSettings.hostType === 'ngrok') {
    // 'ngrok' is deprecated
    projectSettings.hostType = 'tunnel';
  }

  if (projectSettings.urlType) {
    // urlType is deprecated as a project setting
    delete projectSettings.urlType;
  }

  if ('strict' in projectSettings) {
    // strict mode is not supported at the moment
    delete projectSettings.strict;
  }
}

export async function setAsync(
  projectRoot: string,
  json: Partial<ProjectSettings>
): Promise<ProjectSettings> {
  try {
    return await projectSettingsJsonFile(projectRoot).mergeAsync(json, {
      cantReadFileDefault: projectSettingsDefaults,
    });
  } catch (e) {
    return await projectSettingsJsonFile(projectRoot).writeAsync({
      ...projectSettingsDefaults,
      ...json,
    });
  }
}

export async function readPackagerInfoAsync(projectRoot: string): Promise<PackagerInfo> {
  try {
    return await packagerInfoJsonFile(projectRoot).readAsync({
      cantReadFileDefault: {},
    });
  } catch (e) {
    return await packagerInfoJsonFile(projectRoot).writeAsync({});
  }
}

export async function setPackagerInfoAsync(
  projectRoot: string,
  json: Partial<PackagerInfo>
): Promise<PackagerInfo> {
  try {
    return await packagerInfoJsonFile(projectRoot).mergeAsync(json, {
      cantReadFileDefault: {},
    });
  } catch (e) {
    return await packagerInfoJsonFile(projectRoot).writeAsync(json);
  }
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

export function dotExpoProjectDirectory(projectRoot: string): string {
  const dirPath = path.join(projectRoot, '.expo');
  try {
    // move .exponent to .expo
    const oldDirPath = path.join(projectRoot, '.exponent');
    if (fs.statSync(oldDirPath).isDirectory()) {
      fs.renameSync(oldDirPath, dirPath);
    }
  } catch (e) {
    // no old directory, continue
  }

  fs.mkdirpSync(dirPath);

  const readmeFilePath = path.resolve(dirPath, 'README.md');
  if (!fs.existsSync(readmeFilePath)) {
    fs.writeFileSync(
      readmeFilePath,
      `> Why do I have a folder named ".expo" in my project?
The ".expo" folder is created when an Expo project is started using "expo start" command.
> What do the files contain?
- "devices.json": contains information about devices that have recently opened this project. This is used to populate the "Development sessions" list in your development builds.
- "packager-info.json": contains port numbers and process PIDs that are used to serve the application to the mobile device/simulator.
- "settings.json": contains the server configuration that is used to serve the application manifest.
> Should I commit the ".expo" folder?
No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.
`
    );
  }
  return dirPath;
}

export function dotExpoProjectDirectoryExists(projectRoot: string): boolean {
  const dirPath = path.join(projectRoot, '.expo');
  try {
    if (fs.statSync(dirPath).isDirectory()) {
      return true;
    }
  } catch (e) {
    // file doesn't exist
  }

  return false;
}
