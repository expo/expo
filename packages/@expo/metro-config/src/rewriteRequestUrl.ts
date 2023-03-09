// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import { getPackageJson } from '@expo/config';
import { resolveEntryPoint } from '@expo/config/paths';
import chalk from 'chalk';
import path from 'path';

import { getServerRoot } from './getModulesPaths';

const debug = require('debug')('expo:metro:config:rewriteRequestUrl');

export function getRewriteRequestUrl(projectRoot: string) {
  function rewriteExpoRequestUrl(url: string): string {
    // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
    if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
      const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
      // TODO: Maybe this function could be memoized in some capacity?
      const { search, searchParams } = ensured;

      const platform = searchParams.get('platform') ?? 'web';

      debug('Rewriting magic request url to entry point', { url, platform });

      const entry = resolveEntryPoint(projectRoot, {
        platform,
        // @ts-ignore
        projectConfig: {
          pkg: getPackageJson(projectRoot),
        },
      });

      if (!entry) {
        throw new Error(
          chalk`The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`
        );
      }

      const serverRoot = getServerRoot(projectRoot);
      const relativeEntry = path.relative(serverRoot, entry);
      debug('Resolved entry point', { entry, relativeEntry, serverRoot });

      // Like: `/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
      return '/' + relativeEntry + '.bundle' + search;
    }

    return url;
  }
  return rewriteExpoRequestUrl;
}
