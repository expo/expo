import fs from 'node:fs/promises';
import path from 'node:path';

import { Defaults, Errors } from '../constants';

export const inferAndroidLibrary = async (): Promise<string> => {
  const files = ['ReactNativeFragment.kt', 'ReactNativeHostManager.kt'];

  try {
    const android = await fs.readdir('android', { withFileTypes: true });
    const directories = android.filter((item) => item.isDirectory());
    for (const directory of directories) {
      const contents = await fs.readdir(`android/${directory.name}`, {
        recursive: true,
      });

      const hasAllFiles = files.every((file) => contents.find((item) => item.includes(file)));

      if (hasAllFiles) {
        return directory.name;
      }
    }

    throw new Error();
  } catch (error) {
    return Errors.inference('Android library name');
  }
};

export const inferXCWorkspace = async (): Promise<string> => {
  try {
    const xcworkspace = (await fs.readdir('ios', { withFileTypes: true })).find((item) =>
      item.name.endsWith('.xcworkspace')
    );
    if (xcworkspace) {
      return path.join(xcworkspace.parentPath, xcworkspace.name);
    }

    throw new Error();
  } catch (error) {
    return Errors.inference('iOS Workspace (.xcworkspace)');
  }
};

export const inferScheme = async (): Promise<string> => {
  try {
    const subDirs = (await fs.readdir('ios', { withFileTypes: true })).filter((item) =>
      item.isDirectory()
    );
    let scheme: string | undefined = undefined;
    for (const subDir of subDirs) {
      if ((await fs.readdir(`ios/${subDir.name}`)).includes('ReactNativeHostManager.swift')) {
        scheme = subDir.name;
      }
    }

    if (scheme) {
      return scheme;
    }

    throw new Error();
  } catch (error) {
    return Errors.inference('iOS Scheme');
  }
};
