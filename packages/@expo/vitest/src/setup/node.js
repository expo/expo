// @ts-check
/**
 * Setup for Node-only projects (CLI tools, config plugins).
 *
 * Vitest forwards the `expo-source` export condition to the worker as a Node `--conditions` flag,
 * so a `require('@expo/some-package')` executed by Node (for example from a CommonJS shim such as
 * `expo/config-plugins.js`) resolves to that package's TypeScript source. Install the require hook
 * so Node can load those files.
 */
import path from 'node:path';

import { ASSET_EXTENSIONS } from '../extensions.js';
import { installNodeRequireHook } from '../hooks/node-require-hook.js';

installNodeRequireHook({
  platform: 'node',
  platformExtensions: [],
  projectRoot: path.resolve(process.env.EXPO_VITEST_PROJECT_ROOT ?? process.cwd()),
  assetExtensions: ASSET_EXTENSIONS,
  aliasReactNativeWeb: false,
});
