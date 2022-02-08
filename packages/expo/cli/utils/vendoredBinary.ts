import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import fs from 'fs/promises';
import hasbin from 'hasbin';
import path from 'path';

import { UserSettings } from '../api/user/UserSettings';
import { CommandError } from './errors';

export const OSX_SOURCE_PATH = path.join(__dirname, '../../..', 'static/binaries', 'osx');

function hasBinaryAsync(name: string) {
  return new Promise((resolve) => {
    hasbin(name, (result) => {
      resolve(result);
    });
  });
}

export function getBinariesPath(): string {
  if (process.platform === 'darwin') {
    return path.join(__dirname, '../../..', 'static/binaries', 'osx');
  } else if (process.platform === 'win32') {
    return path.join(__dirname, '../../..', 'static/binaries', 'windows');
  } else if (process.platform === 'linux') {
    return path.join(__dirname, '../../..', 'static/binaries', 'linux');
  } else {
    throw new CommandError('PLATFORM_NOT_SUPPORTED', 'Platform not supported.');
  }
}

export async function addToPathAsync(name: string): Promise<void> {
  if (await hasBinaryAsync(name)) {
    return;
  }

  // Users can set {ignoreBundledBinaries: ["watchman"]} to tell us to never use our version
  const ignoreBundledBinaries = await UserSettings.getAsync(
    'ignoreBundledBinaries',
    [] as string[]
  );
  if (ignoreBundledBinaries.includes(name)) {
    return;
  }

  const binariesPath = path.join(getBinariesPath(), name);
  prependToPath(binariesPath);
}

function prependToPath(newPath: string) {
  let currentPath = process.env.PATH ? process.env.PATH : '';
  if (currentPath.length > 0) {
    const delimiter = process.platform === 'win32' ? ';' : ':';
    currentPath = `${delimiter}${currentPath}`;
  }

  process.env.PATH = `${newPath}${currentPath}`;
}

export async function writePathToUserSettingsAsync(): Promise<void> {
  await UserSettings.setAsync('PATH', process.env.PATH);

  // Used in detach app
  const pathFile = path.join(getExpoHomeDirectory(), 'PATH');
  await fs.writeFile(pathFile, process.env.PATH);
}
