/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ConfigT } from 'metro-config';
import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:metro:withMetroNodePolyfills') as typeof console.log;

// NOTE(EvanBacon): Closely resembles the results of Webpack because
// a number of web packages depend on these modules.
// Any of these can be overridden by the project's metro.config.js.
const DEFAULT_POLYFILLS = {
  // `path-browserify` is installed in `expo-asset`.
  path: 'path-browserify',

  // NOTE(EvanBacon): These don't need to be polyfilled because the name of the
  // polyfill matches the name of the Node.js builtin. If the polyfill package is not installed
  // then the polyfill wouldn't be applied anyway.

  // The ending slash prevents Metro from resolving the module to the Node.js builtins.
  // assert: 'assert/',
  // buffer: "buffer/",
  // url: 'url/',
  // events: "events/",
  // punycode: "punycode/",
  // util: "util/",
  // process: "process/",
};

/**
 * Apply conditional mocks/polyfills for a subset of
 * Node.js builtin modules.
 *
 * Modules will only be polyfilled if they meet the following conditions:
 * - The module ID (e.g. `path`) cannot be resolved as an installed node module.
 * - The required polyfill is installed in the project.
 * - The polyfill hasn't been overwritten in the project `metro.config.js` via the `resolver.extraNodeModules` option.
 */
export function withMetroNodePolyfills(config: ConfigT, projectRoot: string): ConfigT {
  // Our mocks need to be universal so we can't use the Webpack mocks verbatim.
  const mocks: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(DEFAULT_POLYFILLS).map(([key, value]) => [
      key,
      resolveFrom.silent(projectRoot, value),
    ])
  );

  debug('Default Node.js polyfills:', mocks);

  // Remove mocks that cannot be resolved in the project.
  const nodeMocks = Object.fromEntries(
    Object.entries(mocks).filter(([, value]) => value !== undefined)
  ) as Record<string, string>;

  // Apply the node mocks statically for performance.
  return {
    ...config,
    resolver: {
      ...config.resolver,
      extraNodeModules: {
        ...nodeMocks,
        ...config.resolver.extraNodeModules,
      },
    },
  };
}
