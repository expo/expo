// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { ExpoConfig, getConfig } from '@expo/config';
import { resolveEntryPoint, getMetroServerRoot } from '@expo/config/paths';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const debug = require('debug')('expo:metro:config:rewriteRequestUrl');

function directoryExistsSync(file: string): boolean {
  try {
    return fs.statSync(file)?.isDirectory() ?? false;
  } catch {
    return false;
  }
}

function isEnableHermesManaged(
  expoConfig: Partial<Pick<ExpoConfig, 'ios' | 'android' | 'jsEngine'>>,
  platform: string
): boolean {
  switch (platform) {
    case 'android': {
      return (expoConfig.android?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    case 'ios': {
      return (expoConfig.ios?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
    }
    default:
      return false;
  }
}

function getRouterDirectoryModuleIdWithManifest(projectRoot: string, exp: ExpoConfig): string {
  return exp.extra?.router?.root ?? getRouterDirectory(projectRoot);
}

export function getRouterDirectory(projectRoot: string): string {
  // more specific directories first
  if (directoryExistsSync(path.join(projectRoot, 'src/app'))) {
    debug('Using src/app as the root directory for Expo Router.');
    return 'src/app';
  }

  debug('Using app as the root directory for Expo Router.');
  return 'app';
}

export function getRewriteRequestUrl(projectRoot: string) {
  function rewriteExpoRequestUrl(url: string): string {
    // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
      const { pkg, exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
      const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
      // TODO: Maybe this function could be memoized in some capacity?
      const { searchParams } = ensured;

      const platform = searchParams.get('platform') ?? 'web';

      debug('Rewriting magic request url to entry point', { url, platform });

      const entry = resolveEntryPoint(projectRoot, {
        platform,
        pkg,
      });

      if (!entry) {
        throw new Error(
          chalk`The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`
        );
      }

      // Infer the missing transform properties to attempt to match the manifest request.
      // NOTE: Keep in sync with metroOptions.ts
      if (!ensured.searchParams.has('transform.routerRoot')) {
        ensured.searchParams.set(
          'transform.routerRoot',
          getRouterDirectoryModuleIdWithManifest(projectRoot, exp)
        );
      }
      if (!ensured.searchParams.has('transform.reactCompiler') && exp.experiments?.reactCompiler) {
        ensured.searchParams.set(
          'transform.reactCompiler',
          String(!!exp.experiments?.reactCompiler)
        );
      }

      if (!ensured.searchParams.has('transform.engine')) {
        const isHermesEnabled = isEnableHermesManaged(exp, platform);
        if (isHermesEnabled) {
          debug('Enabling Hermes for managed project');
          ensured.searchParams.set('transform.engine', 'hermes');
          ensured.searchParams.set('transform.bytecode', '1');
          ensured.searchParams.set('unstable_transformProfile', 'hermes-stable');
        }
      }

      const serverRoot = getMetroServerRoot(projectRoot);
      const relativeEntry = path.relative(serverRoot, entry).replace(/\.[tj]sx?$/, '');
      debug('Resolved entry point', { entry, relativeEntry, serverRoot });

      // Only return the pathname when url is relative
      if (url.startsWith('/')) {
        // Like: `/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        return '/' + relativeEntry + '.bundle?' + searchParams.toString();
      }

      // Modify the pathname within the URL and return the full URL
      ensured.pathname = '/' + relativeEntry + '.bundle';

      const outputUrl = ensured.toString();
      debug('Redirected:', outputUrl);
      // Like: `http://localhost:19001/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
      return outputUrl;
    }

    return url;
  }
  return rewriteExpoRequestUrl;
}
