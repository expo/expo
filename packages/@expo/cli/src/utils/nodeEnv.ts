import * as env from '@expo/env';

// TODO(@kitten): We assign this here to run server-side code bundled by metro
// It's not isolated into a worker thread yet
declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

/**
 * Set the environment to production or development
 * lots of tools use this to determine if they should run in a dev mode.
 */
export function setNodeEnv(mode: 'development' | 'production') {
  process.env.NODE_ENV = process.env.NODE_ENV || mode;
  process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
  globalThis.__DEV__ = process.env.NODE_ENV !== 'production';
}

/**
 * Load the dotenv files into the current `process.env` scope.
 * Note, this requires `NODE_ENV` being set through `setNodeEnv`.
 */
export function loadEnvFiles(projectRoot: string, options?: Parameters<typeof env.load>[1]) {
  return env.load(projectRoot, options);
}
