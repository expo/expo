import fs from 'node:fs/promises';
import path from 'path';

import { Errors } from '../constants';

export const inferAndroidLibrary = async (): Promise<string> => {
  const files = ['ReactNativeFragment.kt', 'ReactNativeHostManager.kt'];

  try {
    const androidPath = path.join(process.cwd(), 'android');
    await fs.access(androidPath);

    const android = await fs.readdir(androidPath, { withFileTypes: true });
    const directories = android.filter((item) => item.isDirectory());
    if (directories.length === 0) {
      throw new Error('No directories found in android/ folder');
    }

    for (const directory of directories) {
      const libraryPath = path.join(androidPath, directory.name);
      try {
        const contents = await fs.readdir(libraryPath, {
          recursive: true,
        });
        const hasAllFiles = files.every((file) => contents.some((item) => item.includes(file)));
        if (hasAllFiles) {
          return directory.name;
        }
      } catch (readError) {
        continue;
      }
    }

    throw new Error('');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.inference('Android library name: ' + message);
  }
};

export const inferXCWorkspace = async (): Promise<string> => {
  try {
    const iosPath = path.join(process.cwd(), 'ios');
    await fs.access(iosPath);

    const xcworkspace = (await fs.readdir(iosPath, { withFileTypes: true })).find((item) =>
      item.name.endsWith('.xcworkspace')
    );
    if (xcworkspace) {
      return path.join(iosPath, xcworkspace.name);
    }

    throw new Error();
  } catch (error) {
    return Errors.inference('iOS Workspace (.xcworkspace)');
  }
};

export const inferScheme = async (): Promise<string> => {
  try {
    const iosPath = path.join(process.cwd(), 'ios');
    await fs.access(iosPath);

    const subDirs = (await fs.readdir(iosPath, { withFileTypes: true })).filter((item) =>
      item.isDirectory()
    );

    for (const subDir of subDirs) {
      try {
        const subDirPath = path.join(iosPath, subDir.name);
        const contents = await fs.readdir(subDirPath);
        if (contents.includes('ReactNativeHostManager.swift')) {
          return subDir.name;
        }
      } catch (readError) {
        continue;
      }
    }

    throw new Error();
  } catch (error) {
    return Errors.inference('iOS Scheme');
  }
};
