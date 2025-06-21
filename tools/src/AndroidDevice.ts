import spawnAsync from '@expo/spawn-async';
import os from 'node:os';

type AndroidDeviceId = string;

export async function getAttachedDevicesAsync(): Promise<AndroidDeviceId[]> {
  const { stdout } = await spawnAsync('adb', ['devices', '-l']);
  const lines = stdout
    .split(os.EOL)
    .slice(1) // First line is `"List of devices attached"`, remove it
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0]);
  return lines;
}

export async function installAppAsync({
  device,
  appPath,
}: {
  device: AndroidDeviceId;
  appPath: string;
}): Promise<void> {
  await spawnAsync('adb', ['-s', device, 'install', appPath]);
}

export async function uninstallAppAsync({
  device,
  appId,
}: {
  device: AndroidDeviceId;
  appId: string;
}): Promise<void> {
  await spawnAsync('adb', ['-s', device, 'uninstall', appId]);
}

export async function startActivityAsync({
  device,
  activity,
}: {
  device: AndroidDeviceId;
  activity: string;
}): Promise<void> {
  await spawnAsync('adb', ['-s', device, 'shell', 'am', 'start', '-n', activity]);
}
