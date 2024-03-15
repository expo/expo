/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import requireString from 'require-from-string';
import resolveFrom from 'resolve-from';

import { logMetroError, logMetroErrorAsync } from './metro/metroErrorInterface';
import { getMetroServerRoot } from './middleware/ManifestMiddleware';
import { createBundleUrlPath, ExpoMetroOptions } from './middleware/metroOptions';
import { augmentLogs } from './serverLogLikeMetro';
import { stripAnsi } from '../../utils/ansi';
import { delayAsync } from '../../utils/delay';
import { SilentError } from '../../utils/errors';
import { memoize } from '../../utils/fn';
import { profile } from '../../utils/profile';

/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

class MetroNodeError extends Error {
  constructor(
    message: string,
    public rawObject: any
  ) {
    super(message);
  }
}

const debug = require('debug')('expo:start:server:node-renderer') as typeof console.log;

const cachedSourceMaps: Map<string, { url: string; map: string }> = new Map();

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

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  // Use gm to apply to the last require line. This is needed when the bundle has side-effects.
  return str.replace(/^(__r\(.*\);)$/gm, 'module.exports = $1');
}

// TODO(EvanBacon): Group all the code together and version.
const getRenderModuleId = (
  projectRoot: string,
  entry: string = 'expo-router/node/render.js'
): string => {
  const moduleId = resolveFrom.silent(projectRoot, entry);
  if (!moduleId) {
    throw new Error(
      `A version of expo-router with Node.js support is not installed in the project.`
    );
  }

  return moduleId;
};

const moveStaticRenderFunction = memoize(async (projectRoot: string, requiredModuleId: string) => {
  // Copy the file into the project to ensure it works in monorepos.
  // This means the file cannot have any relative imports.
  const tempDir = path.join(projectRoot, '.expo/static');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const moduleId = path.join(tempDir, 'render.js');
  await fs.promises.writeFile(moduleId, await fs.promises.readFile(requiredModuleId, 'utf8'));
  // Sleep to give watchman time to register the file.
  await delayAsync(50);
  return moduleId;
});

/** @returns the js file contents required to generate the static generation function. */
async function getStaticRenderFunctionsContentAsync(
  projectRoot: string,
  devServerUrl: string,
  props: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'bytecode'>,
  entry?: string
): Promise<{ src: string; filename: string }> {
  const root = getMetroServerRoot(projectRoot);
  const requiredModuleId = getRenderModuleId(root, entry);
  let moduleId = requiredModuleId;

  // Cannot be accessed using Metro's server API, we need to move the file
  // into the project root and try again.
  if (path.relative(root, moduleId).startsWith('..')) {
    moduleId = await moveStaticRenderFunction(projectRoot, requiredModuleId);
  }

  return requireFileContentsWithMetro(root, devServerUrl, moduleId, props);
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

export async function requireFileContentsWithMetro(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  props: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'bytecode'>
): Promise<{ src: string; filename: string }> {
  const url = await createMetroEndpointAsync(projectRoot, devServerUrl, absoluteFilePath, props);
  return await metroFetchAsync(projectRoot, url);
}

async function metroFetchAsync(
  projectRoot: string,
  url: string
): Promise<{ src: string; filename: string }> {
  debug('Fetching from Metro:', url);
  // TODO: Skip the dev server and use the Metro instance directly for better results, faster.
  const res = await fetch(url);

  // TODO: Improve error handling
  if (res.status === 500) {
    const text = await res.text();
    if (text.startsWith('{"originModulePath"') || text.startsWith('{"type":"TransformError"')) {
      const errorObject = JSON.parse(text);

      throw new MetroNodeError(stripAnsi(errorObject.message) ?? errorObject.message, errorObject);
    }
    throw new Error(`[${res.status}]: ${res.statusText}\n${text}`);
  }

  if (!res.ok) {
    throw new Error(`Error fetching bundle for static rendering: ${res.status} ${res.statusText}`);
  }

  const content = await res.text();

  const map = await fetch(url.replace('.bundle?', '.map?')).then((r) => r.json());
  cachedSourceMaps.set(url, { url: projectRoot, map });

  return { src: wrapBundle(content), filename: url };
}

export async function getStaticRenderFunctionsForEntry<T = any>(
  projectRoot: string,
  devServerUrl: string,
  options: PickPartial<ExpoMetroOptions, 'mainModuleName' | 'bytecode'>,
  entry: string
) {
  const { src: scriptContents, filename } = await getStaticRenderFunctionsContentAsync(
    projectRoot,
    devServerUrl,
    options,
    entry
  );

  return {
    filename,
    fn: await evalMetroAndWrapFunctions<T>(projectRoot, scriptContents, filename),
  };
}

function evalMetroAndWrapFunctions<T = Record<string, any>>(
  projectRoot: string,
  script: string,
  filename: string
): Promise<T> {
  const contents = evalMetro(projectRoot, script, filename);
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
        throw new SilentError(error);
      }
    };
    return acc;
  }, {} as any);
}

export function evalMetro(projectRoot: string, src: string, filename: string) {
  try {
    return evalMetroNoHandling(projectRoot, src, filename);
  } catch (error: any) {
    // Format any errors that were thrown in the global scope of the evaluation.
    if (error instanceof Error) {
      logMetroErrorAsync({ projectRoot, error }).catch((internalError) => {
        debug('Failed to log metro error:', internalError);
        throw error;
      });
    } else {
      throw error;
    }
  }
}

export function evalMetroNoHandling(projectRoot: string, src: string, filename: string) {
  augmentLogs(projectRoot);

  return profile(requireString, 'eval-metro-bundle')(src, filename);
}
