import { events } from '2g';
import * as env from '@expo/env';
import path from 'node:path';

import { env as cliEnv } from './env';
import { CommandError } from './errors';
import { shouldReduceLogs } from './interactive';

type EnvOutput = Record<string, string | undefined>;

export type EnvironmentMode = env.EnvMode;

// TODO(@kitten): We assign this here to run server-side code bundled by metro
// It's not isolated into a worker thread yet
declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

declare module '2g' {
  interface EventRegistry {
    'env:mode': {
      nodeEnv: EnvironmentMode;
      babelEnv: string;
      mode: EnvironmentMode;
    };
    'env:load': {
      mode: EnvironmentMode;
      files: string[];
      keys: string[];
    };
  }
}

export const event = events('env');

/** Defer relativizing a list of paths until the event is written. */
function relativeFiles(files: string[]) {
  return { toJSON: () => files.map((file) => event.path(file).toJSON()) };
}

export function setNodeEnv(mode: EnvironmentMode) {
  env.setNodeEnv(mode);
  process.env.BABEL_ENV = process.env.BABEL_ENV || mode;
  globalThis.__DEV__ = mode === 'development';

  event('mode', {
    nodeEnv: mode,
    babelEnv: process.env.BABEL_ENV,
    mode,
  });
}

export function getConfigEnvMode(): EnvironmentMode {
  const mode = cliEnv.EXPO_CONFIG_MODE;
  delete process.env.EXPO_CONFIG_MODE;

  if (!mode) {
    return 'development';
  }
  if (mode !== 'development' && mode !== 'production') {
    throw new CommandError(
      'BAD_ARGS',
      `Invalid EXPO_CONFIG_MODE value: "${mode}". Use "development" or "production".`
    );
  }
  return mode;
}

interface LoadEnvFilesOptions {
  force?: boolean;
  silent?: boolean;
  mode: EnvironmentMode;
}

let prevEnvKeys: Set<string> | undefined;

/** Set the mode before loading env files. */
export function loadEnvFiles(projectRoot: string, options: LoadEnvFilesOptions) {
  setNodeEnv(options.mode);

  const params = {
    ...options,
    silent: !!options.silent || shouldReduceLogs(),
    force: !!options.force,
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
      keys: Object.keys(envOutput),
    });
  }

  if (!params.silent) {
    env.logLoadedEnv(envInfo, params);
  }
  return process.env;
}

export function getEnvFiles(projectRoot: string, mode: EnvironmentMode) {
  return env.getEnvFiles({ mode }).map((fileName) => path.join(projectRoot, fileName));
}

export function reloadEnvFiles(projectRoot: string, mode: EnvironmentMode) {
  setNodeEnv(mode);

  try {
    const isEnabled = env.isEnabled();
    if (isEnabled) {
      const params = {
        force: true,
        silent: true,
        mode,
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
        keys: Object.keys(envOutput),
      });
    }
  } finally {
    delete process.env.EXPO_CONFIG_MODE;
  }
}
