// @ts-check
/**
 * Vitest port of `jest-expo/src/preset/setup-web.js` plus the pieces of the Jest presets that
 * applied to the web and node projects.
 */
import path from 'node:path';
import { vi } from 'vitest';

import { ASSET_EXTENSIONS, getPlatformExtensions } from '../extensions.js';
import { installNodeRequireHook } from '../hooks/node-require-hook.js';

const platform = /** @type {'web' | 'node'} */ (process.env.EXPO_VITEST_PLATFORM);
const projectRoot = process.env.EXPO_VITEST_PROJECT_ROOT ?? process.cwd();

const global = /** @type {any} */ (globalThis);

global.__DEV__ = true;
// Workaround undefined ShadowRoot in react-native-web
if (typeof global.ShadowRoot === 'undefined') {
  global.ShadowRoot = function ShadowRoot() {};
}
// Temporary workaround for `react-test-renderer@19+` (see `expo-module-scripts/jest-setup-react-19`).
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// Expo's default async require messaging socket expects a running dev server.
vi.mock('expo/src/async-require/messageSocket', () => ({ default: undefined }));

// Alias `react-native` to `react-native-web` for anything Node loads, and stub asset files.
installNodeRequireHook({
  platform,
  platformExtensions: getPlatformExtensions(platform),
  projectRoot: path.resolve(projectRoot),
  assetExtensions: ASSET_EXTENSIONS,
});
