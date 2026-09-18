// @ts-check
/**
 * Node.js CommonJS require hook for the React Native ecosystem.
 *
 * Vitest runs test files and workspace sources through Vite's module runner, but leaves
 * `node_modules` to Node.js. React Native (and `@react-native/*`) ship untranspiled Flow source
 * and use `require()` extensively, and `require()` calls always leave the module runner and go
 * straight to Node. So instead of transforming React Native with Vite, this hook teaches Node to:
 *
 * 1. transform Flow/JSX source from React Native packages with `@react-native/babel-preset`
 *    (cached on disk),
 * 2. resolve Metro-style platform extensions (`Foo.ios.js`, `Foo.native.js`) for `require()`,
 * 3. redirect the React Native native boundary (`NativeModules`, `UIManager`, `View`, ...) to the
 *    mocks that ship with `@react-native/jest-preset`, and serve small virtual mock modules,
 * 4. stub asset files (`.png`, `.ttf`, ...) the way Metro's asset registry mocks do in Jest.
 *
 * The result is a single React Native instance living in Node's module cache, shared by
 * everything Vite inlines (workspace packages, tests) and everything it externalizes.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const ownRequire = createRequire(import.meta.url);

/** Node's CommonJS loader internals (`_resolveFilename`, `_extensions`, ...) are not typed. */
const NodeModule = /** @type {any} */ (Module);

/**
 * Packages whose source must be run through Babel before Node can execute it (they ship Flow
 * and/or JSX). Same list as `expo-module-scripts/createJestPreset`. Tooling packages such as
 * `@react-native/babel-preset` ship plain JavaScript and must not be transformed.
 */
const TRANSFORM_PACKAGE_PATTERN = new RegExp(
  `[\\\\/]node_modules[\\\\/](?:${[
    'react-native',
    '@react-native/assets-registry',
    '@react-native/js-polyfills',
    '@react-native/normalize-colors',
    '@react-native/virtualized-lists',
    '@react-native/jest-preset',
    '@react-native-masked-view/masked-view',
  ]
    .map((name) => name.replace(/[/]/g, '[\\\\/]'))
    .join('|')})[\\\\/]`
);

/** Mock files from React Native's own Jest preset reference a `jest` global. */
const RN_JEST_PRESET_PATTERN = /[\\/]node_modules[\\/]@react-native[\\/]jest-preset[\\/]/;

const VIRTUAL_DIR = '/__expo_vitest_virtual__/';

/** @type {string[]} */
const LANGUAGE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'json'];

/**
 * @typedef {object} RequireHookOptions
 * @property {string} platform `ios`, `android`, `web` or `node`.
 * @property {string[]} platformExtensions e.g. `['ios', 'native']`.
 * @property {string} projectRoot Directory to resolve `react-native` from.
 * @property {Record<string, string>} [mocks] Map of module request (e.g.
 *   `react-native/Libraries/Components/View/View`) to the absolute path of its replacement.
 * @property {Record<string, string>} [virtualModules] Map of module request to CommonJS source.
 * @property {string[]} [assetExtensions] Extensions to stub with `module.exports = 1`.
 * @property {boolean} [aliasReactNativeWeb] Resolve `react-native` to `react-native-web`.
 *   Defaults to true for the `web` and `node` platforms.
 */

/** @type {{ options: RequireHookOptions } | null} */
let installed = null;

/** @type {(file: string) => boolean} */
const fileExists = (() => {
  /** @type {Map<string, boolean>} */
  const cache = new Map();
  return (file) => {
    let result = cache.get(file);
    if (result == null) {
      try {
        result = fs.statSync(file).isFile();
      } catch {
        result = false;
      }
      cache.set(file, result);
    }
    return result;
  };
})();

/**
 * Resolve a package root from the project, or null when the package is not installed.
 * @param {string} name
 * @param {string[]} paths
 * @returns {string | null}
 */
function tryResolvePackageRoot(name, paths) {
  try {
    return path.dirname(ownRequire.resolve(`${name}/package.json`, { paths }));
  } catch {
    return null;
  }
}

/**
 * Install the hook. Idempotent per process: the first call wins.
 * @param {RequireHookOptions} options
 */
export function installNodeRequireHook(options) {
  if (installed) {
    return installed;
  }
  installed = { options };

  const {
    platform,
    platformExtensions,
    projectRoot,
    mocks = {},
    virtualModules = {},
    assetExtensions = [],
    aliasReactNativeWeb = platform === 'web' || platform === 'node',
  } = options;

  const resolvePaths = [projectRoot, path.dirname(new URL(import.meta.url).pathname)];
  loadBabel(resolvePaths);
  // Node-only packages (CLI tools, config plugins) may not depend on React Native at all.
  const reactNativeRoot = tryResolvePackageRoot('react-native', resolvePaths);
  const reactNativeWebRoot = aliasReactNativeWeb
    ? tryResolvePackageRoot('react-native-web', resolvePaths)
    : null;

  /**
   * Try `<base>.<platform>.<lang>` for every platform extension, then `<base>.<lang>`, then the
   * same for `<base>/index`. Returns null when nothing matches.
   * @param {string} base absolute path without extension
   * @returns {string | null}
   */
  function resolvePlatformFile(base) {
    for (const candidateBase of [base, path.join(base, 'index')]) {
      for (const platformExtension of [...platformExtensions, '']) {
        for (const lang of LANGUAGE_EXTENSIONS) {
          const candidate = [candidateBase, platformExtension, lang].filter(Boolean).join('.');
          if (fileExists(candidate)) {
            return candidate;
          }
        }
      }
    }
    return null;
  }

  /**
   * Resolve a `react-native/...` deep import directly against the package directory, bypassing
   * the `exports` map (which only maps `./Libraries/*` to `./Libraries/*.js` and knows nothing
   * about platform extensions). Mirrors `@react-native/jest-preset/jest/resolver.js`.
   * @param {string} request
   * @returns {string | null}
   */
  function resolveReactNativeRequest(request) {
    if (!reactNativeRoot) {
      return null;
    }
    if (request === 'react-native') {
      return path.join(reactNativeRoot, 'index.js');
    }
    if (!request.startsWith('react-native/')) {
      return null;
    }
    const subpath = request.slice('react-native/'.length);
    const base = path.join(reactNativeRoot, subpath);
    if (fileExists(base)) {
      return base;
    }
    const withoutExt = base.replace(/\.[cm]?jsx?$/, '');
    return resolvePlatformFile(withoutExt);
  }

  /**
   * pnpm can install several copies of `react-native` (one per peer-dependency variant), and
   * workspace packages may link to different ones. Jest unified them with a
   * `moduleNameMapper` for `^react-native($|/.*)`; do the same here so there is exactly one React
   * Native instance and the mocks below apply to it.
   * @param {string} file
   */
  function normalizeReactNativePath(file) {
    if (!reactNativeRoot) {
      return file;
    }
    const marker = `${path.sep}node_modules${path.sep}react-native${path.sep}`;
    const index = file.lastIndexOf(marker);
    if (index === -1) {
      return file;
    }
    return path.join(reactNativeRoot, file.slice(index + marker.length));
  }

  /** @type {Map<string, string>} actual resolved path -> replacement path */
  const redirects = new Map();
  /** @type {Map<string, string>} virtual path -> source */
  const virtualSources = new Map();

  /**
   * Resolve a mock key like `react-native/Libraries/Components/View/View` to the file Node would
   * load for it, so redirects match whatever path a `require()` ends up resolving to.
   * @param {string} request
   */
  function resolveMockKey(request) {
    const rn = resolveReactNativeRequest(request);
    if (rn) {
      return rn;
    }
    try {
      return ownRequire.resolve(request, { paths: resolvePaths });
    } catch {
      return null;
    }
  }

  for (const [request, replacement] of Object.entries(mocks)) {
    const actual = resolveMockKey(request);
    if (actual) {
      redirects.set(actual, replacement);
    }
  }
  for (const [request, source] of Object.entries(virtualModules)) {
    const actual = resolveMockKey(request);
    const virtualPath = `${VIRTUAL_DIR}${request.replace(/[^\w.-]+/g, '_')}.js`;
    virtualSources.set(virtualPath, source);
    if (actual) {
      redirects.set(actual, virtualPath);
    }
  }

  const originalResolveFilename = NodeModule._resolveFilename;
  /**
   * @this {any}
   * @param {string} request
   * @param {NodeJS.Module | undefined} parent
   * @param {boolean} isMain
   * @param {any} [resolveOptions]
   */
  NodeModule._resolveFilename = function expoVitestResolveFilename(
    request,
    parent,
    isMain,
    resolveOptions
  ) {
    const bypassRedirects = resolveOptions?.__expoVitestActual === true;

    if (virtualSources.has(request)) {
      return request;
    }

    // Web and Node projects alias React Native to React Native for Web, like Metro does for
    // `expo start --web` and like `jest-expo/web` did with `moduleNameMapper`.
    if (reactNativeWebRoot && request === 'react-native') {
      request = 'react-native-web';
    }

    let resolved = resolveReactNativeRequest(request);

    // Metro-style platform extensions for relative requires inside `node_modules`, e.g.
    // `require('./Platform')` -> `Platform.ios.js`.
    if (
      !resolved &&
      parent?.filename &&
      parent.filename.includes('node_modules') &&
      (request.startsWith('./') || request.startsWith('../'))
    ) {
      const base = path.resolve(path.dirname(parent.filename), request);
      if (!path.extname(base)) {
        resolved = resolvePlatformFile(base);
      }
    }

    // Workspace sources are TypeScript. Vite handles `import`, but a `require('./Foo')` inside
    // an inlined module is executed by Node, which does not try `.ts`/`.tsx` (nor platform
    // extensions). Resolve those here; `NodeModule._extensions` below transforms them.
    if (
      !resolved &&
      parent?.filename &&
      !parent.filename.includes('node_modules') &&
      (request.startsWith('./') || request.startsWith('../'))
    ) {
      const base = path.resolve(path.dirname(parent.filename), request);
      if (!path.extname(base) || /\.[cm]?js$/.test(base)) {
        resolved = resolvePlatformFile(base.replace(/\.[cm]?js$/, ''));
      }
    }

    if (!resolved) {
      resolved = /** @type {string} */ (
        originalResolveFilename.call(this, request, parent, isMain, resolveOptions)
      );
    }
    resolved = normalizeReactNativePath(resolved);

    if (!bypassRedirects) {
      const redirect = redirects.get(resolved);
      if (redirect) {
        return redirect;
      }
    }
    return resolved;
  };

  const originalJsExtension = NodeModule._extensions['.js'];
  /**
   * @param {NodeJS.Module} module
   * @param {string} filename
   */
  NodeModule._extensions['.js'] = function expoVitestLoadJs(module, filename) {
    const virtualSource = virtualSources.get(filename);
    if (virtualSource != null) {
      /** @type {any} */ (module)._compile(virtualSource, filename);
      return;
    }
    if (TRANSFORM_PACKAGE_PATTERN.test(filename)) {
      /** @type {any} */ (module)._compile(
        transformReactNativeSource(filename, platform),
        filename
      );
      return;
    }
    originalJsExtension(module, filename);
  };

  for (const extension of ['.ts', '.tsx', '.jsx', '.mts', '.cts']) {
    /**
     * @param {NodeJS.Module} module
     * @param {string} filename
     */
    NodeModule._extensions[extension] = function expoVitestLoadTypeScript(module, filename) {
      /** @type {any} */ (module)._compile(
        transformReactNativeSource(filename, platform),
        filename
      );
    };
  }

  for (const extension of assetExtensions) {
    /** @param {NodeJS.Module} module */
    NodeModule._extensions[`.${extension}`] = function expoVitestLoadAsset(module) {
      module.exports = 1;
    };
  }

  return installed;
}

/**
 * Load the real module behind a mocked path. Used by the `jest.requireActual` shim that React
 * Native's own mock files rely on (e.g. `mocks/View.js` wraps the actual `View`).
 *
 * @param {string} request
 * @param {NodeJS.Module} parent
 */
export function requireActual(request, parent) {
  const filename = NodeModule._resolveFilename(request, parent, false, {
    __expoVitestActual: true,
  });
  const cached = NodeModule._cache[filename];
  if (cached) {
    return cached.exports;
  }
  const module = /** @type {any} */ (new Module(filename, parent));
  module.filename = filename;
  module.paths = NodeModule._nodeModulePaths(path.dirname(filename));
  NodeModule._cache[filename] = module;
  try {
    module.load(filename);
  } catch (error) {
    delete NodeModule._cache[filename];
    throw error;
  }
  return module.exports;
}

/**
 * Create the minimal `jest` object React Native's Jest mocks use (`jest.fn`, `jest.requireActual`).
 * Installed on `globalThis.__EXPO_VITEST_JEST__` by the setup file; the require hook prepends
 * `const jest = globalThis.__EXPO_VITEST_JEST__.forModule(module)` to those files.
 *
 * @param {{ fn: (...args: any[]) => any }} vi
 */
export function createJestShim(vi) {
  return {
    /** @param {NodeJS.Module} module */
    forModule(module) {
      return {
        fn: vi.fn,
        /** @param {string} request */
        requireActual: (request) => requireActual(request, module),
        now: () => Date.now(),
      };
    },
  };
}

/** @type {any} */
let babel;
/** @type {any} */
let reactNativeBabelPreset;
/** @type {any} */
let expoBabelPreset;
/** @type {string} */
let cacheSalt = '';
/** @type {string[]} */
let babelResolvePaths = [];

/**
 * Load Babel and the presets once, before the hook is installed, so their own `require()` calls
 * are not intercepted half-way through.
 * @param {string[]} [paths] Locations to resolve `babel-preset-expo` from (project first).
 */
function loadBabel(paths = babelResolvePaths) {
  if (babel) {
    return;
  }
  babelResolvePaths = paths;
  babel = ownRequire('@babel/core');
  reactNativeBabelPreset = ownRequire('@react-native/babel-preset');
  // Prefer the project's `babel-preset-expo` (through `expo`), like `jest-expo/src/resolveBabelOptions`.
  let expoPresetPath;
  for (const candidate of ['expo/internal/babel-preset', 'babel-preset-expo']) {
    try {
      expoPresetPath = ownRequire.resolve(candidate, { paths });
      break;
    } catch {
      // Try the next candidate.
    }
  }
  expoBabelPreset = expoPresetPath ? ownRequire(expoPresetPath) : reactNativeBabelPreset;
  cacheSalt = [
    'v2',
    ownRequire('@babel/core/package.json').version,
    ownRequire('@react-native/babel-preset/package.json').version,
    expoPresetPath ?? 'no-expo-preset',
  ].join('|');
}

/**
 * Transform a source file to CommonJS for Node: React Native ecosystem packages with
 * `@react-native/babel-preset`, everything else (workspace TypeScript reached through `require()`)
 * with `babel-preset-expo`, like Jest did. Results are cached in the OS temp directory, keyed by
 * file content and platform.
 *
 * @param {string} filename
 * @param {string} platform
 * @returns {string}
 */
function transformReactNativeSource(filename, platform) {
  loadBabel();
  const isReactNativePackage = TRANSFORM_PACKAGE_PATTERN.test(filename);

  const source = fs.readFileSync(filename, 'utf8');
  const isRnJestMock = RN_JEST_PRESET_PATTERN.test(filename);
  const hash = createHash('sha1')
    .update(cacheSalt)
    .update(platform)
    .update(filename)
    .update(source)
    .digest('hex');
  const cacheDir = path.join(os.tmpdir(), 'expo-vitest', 'babel');
  const cachePath = path.join(cacheDir, `${hash}.js`);

  try {
    return fs.readFileSync(cachePath, 'utf8');
  } catch {
    // Cache miss.
  }

  const result = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    compact: false,
    sourceMaps: 'inline',
    presets: isReactNativePackage
      ? [[reactNativeBabelPreset, { enableBabelRuntime: true }]]
      : [expoBabelPreset],
    caller: {
      name: 'metro',
      bundler: 'metro',
      platform: platform === 'node' ? 'web' : platform,
      isServer: platform === 'node',
      // Emit CommonJS; `require()` inside these files runs in Node's loader.
      supportsStaticESM: false,
    },
  });
  if (!result?.code) {
    throw new Error(`Babel produced no output for ${filename}`);
  }

  let code = result.code;
  if (isRnJestMock) {
    code = `const jest = globalThis.__EXPO_VITEST_JEST__.forModule(module);\n${code}`;
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, code);
  return code;
}
