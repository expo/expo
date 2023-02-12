import spawnAsync from '@expo/spawn-async';
import { spawnSync } from 'child_process';

import { Platform } from './Platform';

export function yarnInstall(path: string) {
  spawnSync('yarn', ['install', '--silent'], { stdio: 'inherit', cwd: path });
}

export const delay: (ms: number) => Promise<void> = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function killEmulatorAsync(): Promise<void> {
  try {
    console.log('Trying to kill emulator...');
    await spawnAsync('adb', ['-s', 'emulator-5554', 'emu', 'kill'], { stdio: 'inherit' });
    console.log('Emulator was killed.');
  } catch (e) {
    console.log("Couldn't kill emulator");
    console.log(e);
  }
}

export async function killSimulatorAsync(): Promise<void> {
  try {
    console.log('Trying to kill simulator...');
    await spawnAsync('xcrun', ['simctl', 'shutdown', 'all'], { stdio: 'inherit' });
    console.log('Simulator was killed.');
  } catch (e) {
    console.log("Couldn't kill simulator.");
    console.log(e);
  }
}

export async function killVirtualDevicesAsync(platform: Platform): Promise<void> {
  if ((platform & Platform.Android) > 0) {
    await killEmulatorAsync();
  }

  if ((platform & Platform.iOS) > 0) {
    await killSimulatorAsync();
  }
}
