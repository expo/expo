// @ts-check
/**
 * Vitest equivalent of `expo-module-scripts/jest-preset` (universal modules) and
 * `createCompositeJestPreset` (universal modules with `plugin`/`cli`/`utils` sub-targets).
 *
 * One Vitest project per platform, like the Jest presets: `ios`, `android`, `web`, `node`.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPlatformExtensions, getViteExtensions } from './extensions.js';
import { NODE_TEST_EXCLUDE, defineNodeConfig, getTurboWorkerOptions } from './node.js';

/** @typedef {'ios' | 'android' | 'web' | 'node'} Platform */

/**
 * Packages that must always be loaded by Node (through the require hook in `./hooks`) rather than
 * inlined by Vite. Vitest inlines `node_modules` files it thinks Node cannot load, which is exactly
 * what React Native's Flow source looks like, so make the decision explicit.
 */
export const NODE_EXTERNAL_PACKAGES = [
  /[\\/]node_modules[\\/]react-native[\\/]/,
  /[\\/]node_modules[\\/]@react-native[\\/]/,
  /[\\/]node_modules[\\/]@react-native-community[\\/]/,
  /[\\/]node_modules[\\/]react-native-web[\\/]/,
];

/** @type {Platform[]} */
export const ALL_PLATFORMS = ['ios', 'android', 'web', 'node'];

const SETUP_DIR = fileURLToPath(new URL('./setup/', import.meta.url));
const ownRequire = createRequire(import.meta.url);

/**
 * Absolute path of the `react-native-web` package, so the alias resolves even when the package
 * under test does not depend on it directly (it is a dependency of `@expo/vitest`).
 * @param {string} root
 */
function resolveReactNativeWeb(root) {
  return path.dirname(
    ownRequire.resolve('react-native-web/package.json', { paths: [root, SETUP_DIR] })
  );
}

/**
 * Test file globs for a platform. Mirrors `jest-expo/config/getPlatformPreset`: a project runs
 * `Foo-test.ts`, `Foo-test.<platform>.ts` and `Foo-test.<fallback>.ts` (e.g. `.native`).
 * @param {string[]} platformExtensions
 * @param {{ rsc?: boolean }} [options]
 */
export function getPlatformTestInclude(platformExtensions, { rsc = false } = {}) {
  const testDir = rsc ? '__rsc_tests__' : '__tests__';
  return ['', ...platformExtensions].flatMap((extension) => {
    const suffix = extension ? `.${extension}` : '';
    return [
      `**/${testDir}/**/*{test,spec}${suffix}.{js,jsx,ts,tsx}`,
      `**/*.{test,spec}${suffix}.{js,jsx,ts,tsx}`,
    ];
  });
}

/**
 * Export conditions per platform. `expo-source` redirects workspace packages to TypeScript
 * source. The tail entries are Vite's own defaults so package resolution keeps working.
 *
 * Vitest forwards `ssr.resolve.conditions` to the worker process as Node `--conditions`, so these
 * also apply to everything Node loads. That is why `browser` is not included for web: Node-side
 * packages such as jsdom's `ws` would pick their browser builds. Use `getClientConditions` for
 * the Vite client resolver.
 * @param {Platform} platform
 */
export function getPlatformConditions(platform) {
  switch (platform) {
    case 'ios':
    case 'android':
      return ['react-native', 'expo-source', 'module', 'node', 'development|production'];
    case 'web':
    case 'node':
      return ['expo-source', 'module', 'node', 'development|production'];
  }
}

/**
 * Conditions for Vite's client resolver (only used by inlined modules in the jsdom environment).
 * @param {Platform} platform
 */
export function getClientConditions(platform) {
  return platform === 'web'
    ? ['browser', 'expo-source', 'module', 'development|production']
    : getPlatformConditions(platform);
}

/**
 * @typedef {object} PlatformProjectOptions
 * @property {string} root Package root.
 * @property {string} [dir] Directory to scan for tests. Defaults to `<root>/src`.
 * @property {string[]} [setupFiles] Extra setup files, run after the preset's own.
 * @property {string} [name] Project name. Defaults to the platform.
 */

/**
 * Build the inline Vitest project for one platform.
 * @param {Platform} platform
 * @param {PlatformProjectOptions} options
 * @returns {import('vitest/config').ViteUserConfig}
 */
export function getPlatformProject(platform, options) {
  const { root, dir = path.join(root, 'src'), setupFiles = [], name = platform } = options;
  const platformExtensions = getPlatformExtensions(platform);
  const conditions = getPlatformConditions(platform);
  const isNative = platform === 'ios' || platform === 'android';

  const presetSetupFiles = isNative
    ? [path.join(SETUP_DIR, 'react-native.js'), path.join(SETUP_DIR, 'expo.js')]
    : [path.join(SETUP_DIR, 'web.js')];

  return {
    root,
    resolve: {
      extensions: getViteExtensions(platformExtensions),
      conditions: getClientConditions(platform),
      // Externalized packages are loaded by Node, so the resolved entry must be something Node can
      // execute: prefer the `react-native` entry (handled by the require hook) and `main` (CommonJS).
      mainFields: isNative ? ['react-native', 'main', 'module'] : ['main', 'module'],
      alias: isNative
        ? []
        : [
            // Web and Node projects run against React Native for Web, like Metro does for web.
            { find: /^react-native$/, replacement: resolveReactNativeWeb(root) },
          ],
    },
    ssr: {
      resolve: {
        conditions,
      },
    },
    test: {
      name,
      environment: platform === 'web' ? 'jsdom' : 'node',
      globals: true,
      clearMocks: true,
      passWithNoTests: true,
      dir,
      include: getPlatformTestInclude(platformExtensions),
      exclude: [...NODE_TEST_EXCLUDE, '**/__rsc_tests__/**'],
      setupFiles: [...presetSetupFiles, ...setupFiles],
      // React Native ships Flow source in a CommonJS package. Node's module-syntax detection would
      // otherwise parse files containing `import` as ESM before the require hook can transform them.
      execArgv: ['--no-experimental-detect-module'],
      server: {
        deps: {
          external: NODE_EXTERNAL_PACKAGES,
        },
      },
      env: {
        // `babel-preset-expo` inlines these in Metro and Jest; here they are read at runtime.
        EXPO_OS: platform === 'node' ? 'web' : platform,
        EXPO_VITEST_PLATFORM: platform,
        EXPO_VITEST_PROJECT_ROOT: root,
      },
    },
  };
}

/**
 * Platform-suffixed snapshot files, matching `jest-expo/src/snapshot/createPlatformResolver.js`:
 * `src/__tests__/Foo-test.tsx` -> `src/__tests__/__snapshots__/Foo-test.tsx.snap.ios`.
 *
 * Projects whose name is not a platform (e.g. `plugin`) keep Vitest's default layout, which is
 * also Jest's default: `__snapshots__/Foo-test.ts.snap` next to the test file.
 *
 * @type {import('vitest/node').ResolveSnapshotPathHandler}
 */
export function resolveSnapshotPath(testPath, snapshotExtension, context) {
  const projectName = context.config.name ?? '';
  const platform = projectName.replace(/^rsc\//, '');
  const testDirectory = projectName.startsWith('rsc/') ? '__rsc_tests__' : '__tests__';
  if (!ALL_PLATFORMS.includes(/** @type {Platform} */ (platform))) {
    return path.join(
      path.dirname(testPath),
      '__snapshots__',
      `${path.basename(testPath)}${snapshotExtension}`
    );
  }
  return (
    testPath.replace(testDirectory, path.join(testDirectory, '__snapshots__')) +
    `${snapshotExtension}.${platform}`
  );
}

/**
 * @typedef {object} UniversalConfigOptions
 * @property {string} root Package root (use `import.meta.dirname`).
 * @property {Platform[]} [platforms] Defaults to all four.
 * @property {string[]} [subprojects] Sub-target directories with their own Node-only tests,
 *   e.g. `['plugin']`. Mirrors `createCompositeJestPreset(__dirname, ['plugin'])`.
 * @property {string[]} [setupFiles] Extra setup files for the platform projects.
 */

/**
 * Create the root Vitest config for a universal Expo module.
 *
 * @param {UniversalConfigOptions} options
 * @returns {import('vitest/config').ViteUserConfig}
 */
export function defineUniversalConfig(options) {
  const { root, platforms = ALL_PLATFORMS, subprojects = [], setupFiles = [] } = options;

  const projects = [
    ...platforms.map((platform) => getPlatformProject(platform, { root, setupFiles })),
    ...subprojects.map((subdir) => {
      const config = defineNodeConfig({ root: path.join(root, subdir), name: subdir });
      return config;
    }),
  ];

  return {
    test: {
      passWithNoTests: true,
      ...getTurboWorkerOptions(),
      resolveSnapshotPath,
      projects,
    },
  };
}
