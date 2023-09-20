import { ExpoConfig, getConfig, ProjectConfig } from '@expo/config';
import assert from 'assert';
import util from 'util';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { setNodeEnv } from '../utils/nodeEnv';
import { profile } from '../utils/profile';

type Options = {
  type?: string;
  full?: boolean;
  json?: boolean;
};

export function logConfig(config: ExpoConfig | ProjectConfig) {
  const isObjStr = (str: string): boolean => /^\w+: {/g.test(str);
  Log.log(
    util.inspect(config, {
      colors: true,
      compact: false,
      // Sort objects to the end so that smaller values aren't hidden between large objects.
      sorted(a: string, b: string) {
        if (isObjStr(a)) return 1;
        if (isObjStr(b)) return -1;
        return 0;
      },
      showHidden: false,
      depth: null,
    })
  );
}

export async function configAsync(projectRoot: string, options: Options) {
  const loggingFunctions = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  // Disable logging for this command if the user wants to get JSON output.
  // This will ensure that only the JSON is printed to stdout.
  if (options.json) {
    console.log = function () {};
    console.warn = function () {};
    console.error = function () {};
  }
  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  if (options.type) {
    assert.match(options.type, /^(public|prebuild|introspect)$/);
  }

  let config: ProjectConfig;

  if (options.type === 'prebuild') {
    const { getPrebuildConfigAsync } = await import('@expo/prebuild-config');

    config = await profile(getPrebuildConfigAsync)(projectRoot, {
      platforms: ['ios', 'android'],
    });
  } else if (options.type === 'introspect') {
    const { getPrebuildConfigAsync } = await import('@expo/prebuild-config');
    const { compileModsAsync } = await import('@expo/config-plugins/build/plugins/mod-compiler.js');

    config = await profile(getPrebuildConfigAsync)(projectRoot, {
      platforms: ['ios', 'android'],
    });

    await compileModsAsync(config.exp, {
      projectRoot,
      introspect: true,
      platforms: ['ios', 'android'],
      assertMissingModProviders: false,
    });
    // @ts-ignore
    delete config.modRequest;
    // @ts-ignore
    delete config.modResults;
  } else if (options.type === 'public') {
    config = profile(getConfig)(projectRoot, {
      skipSDKVersionRequirement: true,
      isPublicConfig: true,
    });
  } else if (options.type) {
    throw new CommandError(
      `Invalid option: --type ${options.type}. Valid options are: public, prebuild`
    );
  } else {
    config = profile(getConfig)(projectRoot, {
      skipSDKVersionRequirement: true,
    });
  }

  const configOutput = options.full ? config : config.exp;

  if (!options.json) {
    Log.log();
    logConfig(configOutput);
    Log.log();
  } else {
    process.stdout.write(JSON.stringify(configOutput));

    // Re-enable logging functions for testing.
    console.log = loggingFunctions.log;
    console.warn = loggingFunctions.warn;
    console.error = loggingFunctions.error;
  }
}
