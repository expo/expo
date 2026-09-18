// @ts-check
import { fileURLToPath } from 'node:url';

const NODE_SETUP_FILE = fileURLToPath(new URL('./setup/node.js', import.meta.url));

/**
 * Vitest equivalent of `expo-module-scripts/jest-preset-cli` (also used for the identical
 * `plugin`, `utils` and `scripts` presets): a Node-only test project for CLI tools, config
 * plugins and other packages that never import `react-native`.
 *
 * Differences from the Jest preset:
 * - TypeScript is transformed by Vite (esbuild/oxc), so the `@swc/jest` transform is gone.
 * - `testRegex` becomes an `include` glob with the same shape.
 * - `jest-watch-typeahead` and `prettierPath` have no equivalent; Vitest's watch mode and inline
 *   snapshot formatting are built in.
 * - Export conditions live in Vite's `resolve.conditions`. The `expo-source` condition makes
 *   workspace packages resolve to their TypeScript source, like `customExportConditions` did.
 */

/**
 * The Jest preset used `testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$'`.
 * This is the same shape as a glob.
 */
export const NODE_TEST_INCLUDE = ['**/__tests__/**/*{test,spec}.{js,jsx,ts,tsx}'];

/**
 * Paths that never contain runnable tests. Vitest's default `exclude` already covers
 * `node_modules`, `dist` and friends, but the monorepo compiles into `build/`.
 */
export const NODE_TEST_EXCLUDE = ['**/node_modules/**', '**/build/**', '**/dist/**', '**/.expo/**'];

/**
 * Export conditions used when resolving `exports` maps for inlined modules.
 * `expo-source` redirects workspace packages to their TypeScript source.
 * The remaining entries are Vite's defaults for the SSR (Node) environment.
 */
export const NODE_RESOLVE_CONDITIONS = ['expo-source', 'module', 'node', 'development|production'];

/**
 * Turborepo owns the parallelism when a `test` task runs inside `turbo run`.
 * Mirrors `jest-expo/config/maxWorkers`.
 * @returns {{ maxWorkers?: number }}
 */
export function getTurboWorkerOptions() {
  return process.env.TURBO_HASH ? { maxWorkers: 1 } : {};
}

/**
 * @typedef {object} NodeConfigOptions
 * @property {string} [root] Package root. Defaults to the directory of the config file when
 *   omitted, which is what Vitest does on its own.
 * @property {string} [name] Project name shown in the reporter. Defaults to the package name
 *   read from `<root>/package.json` when `root` is provided.
 * @property {string[]} [include] Override for the test file globs.
 * @property {string[]} [setupFiles] Files to run before each test file.
 */

/**
 * Create a Vitest config for a Node-only package.
 *
 * @param {NodeConfigOptions} [options]
 * @returns {import('vitest/config').ViteUserConfig}
 */
export function defineNodeConfig(options = {}) {
  const { root, name, include = NODE_TEST_INCLUDE, setupFiles = [] } = options;

  return {
    root,
    resolve: {
      conditions: NODE_RESOLVE_CONDITIONS,
    },
    ssr: {
      resolve: {
        conditions: NODE_RESOLVE_CONDITIONS,
      },
    },
    test: {
      name,
      environment: 'node',
      // Tests in this repository were written against Jest's globals (`describe`, `it`, `expect`).
      globals: true,
      // Vitest 5 clears mocks before every test by default; the Jest CLI preset did not, and tests
      // in this repository record calls in `beforeAll` and assert on them later.
      clearMocks: false,
      // A package that ships the preset but has no test files yet should not fail.
      passWithNoTests: true,
      include,
      exclude: NODE_TEST_EXCLUDE,
      setupFiles: [NODE_SETUP_FILE, ...setupFiles],
      // Let the require hook (see `./setup/node.js`) load TypeScript that Node would otherwise try
      // to parse as ESM based on its syntax.
      execArgv: ['--no-experimental-detect-module'],
      env: root ? { EXPO_VITEST_PROJECT_ROOT: root } : {},
      ...getTurboWorkerOptions(),
    },
  };
}
