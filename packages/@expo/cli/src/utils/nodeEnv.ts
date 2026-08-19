import { events } from '2g';
import * as env from '@expo/env';
import path from 'node:path';

import { shouldReduceLogs } from './interactive';

type EnvOutput = Record<string, string | undefined>;

// TODO(@kitten): We assign this here to run server-side code bundled by metro
// It's not isolated into a worker thread yet
declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

declare module '2g' {
  interface EventRegistry {
    'env:mode': {
      nodeEnv: string;
      babelEnv: string;
      mode: 'development' | 'production';
    };
    'env:load': {
      mode: string | undefined;
      files: string[];
      env: Record<string, string | undefined>;
    };
  }
}

export const event = events('env');

/** Defer relativizing a list of paths until the event is written. */
function relativeFiles(files: string[]) {
  return { toJSON: () => files.map((file) => event.path(file).toJSON()) };
}

/**
 * Set the environment to production or development
 * lots of tools use this to determine if they should run in a dev mode.
 */
export function setNodeEnv(mode: 'development' | 'production') {
  process.env.NODE_ENV = process.env.NODE_ENV || mode;
  process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
  globalThis.__DEV__ = process.env.NODE_ENV !== 'production';

  event('mode', {
    nodeEnv: process.env.NODE_ENV,
    babelEnv: process.env.BABEL_ENV,
    mode,
  });
}

interface LoadEnvFilesOptions {
  force?: boolean;
  silent?: boolean;
  mode?: string;
}

let prevEnvKeys: Set<string> | undefined;

/**
 * Load the dotenv files into the current `process.env` scope.
 * Note, this requires `NODE_ENV` being set through `setNodeEnv`.
 */
export function loadEnvFiles(projectRoot: string, options?: LoadEnvFilesOptions) {
  const params = {
    ...options,
    silent: !!options?.silent || shouldReduceLogs(),
    force: !!options?.force,
    mode: process.env.NODE_ENV,
    systemEnv: process.env,
  };

  const envInfo = env.loadProjectEnv(projectRoot, params);
  const envOutput: EnvOutput = {};
  if (envInfo.result === 'loaded') {
    prevEnvKeys = new Set();
    for (const key of envInfo.loaded) {
      envOutput[key] = envInfo.env[key] ?? undefined;
      prevEnvKeys.add(key);
    }
  }

  if (envInfo.result === 'loaded') {
    event('load', {
      mode: params.mode,
      files: relativeFiles(envInfo.files),
      env: envOutput,
    });
  }

  if (!params.silent) {
    env.logLoadedEnv(envInfo, params);
  }
  return process.env;
}

export function getEnvFiles(projectRoot: string) {
  return env
    .getEnvFiles({ mode: process.env.NODE_ENV })
    .map((fileName) => path.join(projectRoot, fileName));
}

export function reloadEnvFiles(projectRoot: string) {
  const isEnabled = env.isEnabled();
  if (isEnabled) {
    const params = {
      force: true,
      silent: true,
      mode: process.env.NODE_ENV,
      systemEnv: process.env,
    };

    // We use a global tracker to allow overwrites of env vars we set ourselves
    const envInfo = env.parseProjectEnv(projectRoot, params);
    const envOutput: EnvOutput = {};
    for (const key in envInfo.env) {
      const value = envInfo.env[key];
      if (process.env[key] !== value) {
        if (
          typeof process.env[key] === 'undefined' ||
          ((!prevEnvKeys || prevEnvKeys.has(key)) && process.env[key] !== value)
        ) {
          (prevEnvKeys ||= new Set()).add(key);
          process.env[key] = envInfo.env[key];
          envOutput[key] = value ?? undefined;
        }
      }
    }

    event('load', {
      mode: params.mode,
      files: relativeFiles(envInfo.files),
      env: envOutput,
    });
  }
}
