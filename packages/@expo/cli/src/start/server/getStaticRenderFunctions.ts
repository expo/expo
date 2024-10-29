/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import fs from 'fs';
import path from 'path';
import requireString from 'require-from-string';

import { logMetroError } from './metro/metroErrorInterface';
import { createBundleUrlPath, ExpoMetroOptions } from './middleware/metroOptions';
import { augmentLogs } from './serverLogLikeMetro';
import { delayAsync } from '../../utils/delay';
import { SilentError } from '../../utils/errors';
import { profile } from '../../utils/profile';

/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const cachedSourceMaps: Map<string, { url: string; map: string }> = new Map();

// Support unhandled rejections
// Detect if running in Bun

// @ts-expect-error: This is a global variable that is set by Bun.
if (!process.isBun) {
  require('source-map-support').install({
    retrieveSourceMap(source: string) {
      if (cachedSourceMaps.has(source)) {
        return cachedSourceMaps.get(source);
      }
      return null;
    },
  });
}

async function ensureFileInRootDirectory(projectRoot: string, otherFile: string) {
  // Cannot be accessed using Metro's server API, we need to move the file
  // into the project root and try again.
  if (!path.relative(projectRoot, otherFile).startsWith('..' + path.sep)) {
    return otherFile;
  }

  // Copy the file into the project to ensure it works in monorepos.
  // This means the file cannot have any relative imports.
  const tempDir = path.join(projectRoot, '.expo/static-tmp');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const moduleId = path.join(tempDir, path.basename(otherFile));
  await fs.promises.writeFile(moduleId, await fs.promises.readFile(otherFile, 'utf8'));
  // Sleep to give watchman time to register the file.
  await delayAsync(50);
  return moduleId;
}

export async function createMetroEndpointAsync(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  props: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'bytecode'>
): Promise<string> {
  const root = getMetroServerRoot(projectRoot);
  const safeOtherFile = await ensureFileInRootDirectory(projectRoot, absoluteFilePath);
  const serverPath = path.relative(root, safeOtherFile).replace(/\.[jt]sx?$/, '');

  const urlFragment = createBundleUrlPath({
    mainModuleName: serverPath,
    lazy: false,
    asyncRoutes: false,
    inlineSourceMap: false,
    engine: 'hermes',
    minify: false,
    bytecode: false,
    ...props,
  });

  let url: string;
  if (devServerUrl) {
    url = new URL(urlFragment.replace(/^\//, ''), devServerUrl).toString();
  } else {
    url = '/' + urlFragment.replace(/^\/+/, '');
  }
  return url;
}

export function evalMetroAndWrapFunctions<T = Record<string, any>>(
  projectRoot: string,
  script: string,
  filename: string,
  isExporting: boolean
): T {
  // TODO: Add back stack trace logic that hides traces from metro-runtime and other internal modules.
  const contents = evalMetroNoHandling(projectRoot, script, filename);

  if (!contents) {
    // This can happen if ErrorUtils isn't working correctly on web and failing to throw an error when a module throws.
    // This is unexpected behavior and should not be pretty formatted, therefore we're avoiding CommandError.
    throw new Error(
      '[Expo SSR] Module returned undefined, this could be due to a misconfiguration in Metro error handling'
    );
  }
  // wrap each function with a try/catch that uses Metro's error formatter
  return Object.keys(contents).reduce((acc, key) => {
    const fn = contents[key];
    if (typeof fn !== 'function') {
      return { ...acc, [key]: fn };
    }

    acc[key] = async function (...props: any[]) {
      try {
        return await fn.apply(this, props);
      } catch (error: any) {
        await logMetroError(projectRoot, { error });
        if (isExporting) {
          throw error;
        } else {
          throw new SilentError(error);
        }
      }
    };
    return acc;
  }, {} as any);
}

export function evalMetroNoHandling(projectRoot: string, src: string, filename: string) {
  augmentLogs(projectRoot);

  console.log('src', src);
  return profile(requireString, 'eval-metro-bundle')(src, filename);
}
