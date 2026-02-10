import * as env from '@expo/env';

type EnvOutput = Record<string, string | undefined>;

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

interface LoadEnvFilesOptions {
  force?: boolean;
  silent?: boolean;
  mode?: string;
}

/**
 * Load the dotenv files into the current `process.env` scope.
 * Note, this requires `NODE_ENV` being set through `setNodeEnv`.
 */
export function loadEnvFiles(projectRoot: string, options?: LoadEnvFilesOptions) {
  const isEnabled = env.isEnabled();
  if (isEnabled) {
    const params = {
      ...options,
      force: !!options?.force,
      silent: !!options?.silent,
      mode: process.env.NODE_ENV,
    };

    const envInfo = env.parseProjectEnv(projectRoot, params);
    const envOutput: EnvOutput = {};
    const skipped: string[] = [];
    for (const key in envInfo.env) {
      if (typeof process.env[key] !== 'undefined') {
        skipped.push(key);
      } else {
        process.env[key] = envInfo.env[key];
        envOutput[key] = envInfo.env[key] ?? undefined;
      }
    }

    if (!params.silent) {
      env.logLoadedEnv(
        {
          ...envInfo,
          result: 'loaded',
          loaded: Object.keys(envOutput),
        },
        params
      );
    }
  }

  return process.env;
}
