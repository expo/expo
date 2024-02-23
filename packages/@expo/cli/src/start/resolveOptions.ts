import assert from 'assert';
import chalk from 'chalk';

import { canResolveDevClient } from './detectDevClient';
import { Log } from '../log';
import { hasDirectDevClientDependency } from '../utils/analytics/getDevClientProperties';
import { AbortCommandError, CommandError } from '../utils/errors';
import { resolvePortAsync } from '../utils/port';

export type Options = {
  privateKeyPath: string | null;
  android: boolean;
  web: boolean;
  ios: boolean;
  offline: boolean;
  clear: boolean;
  dev: boolean;
  https: boolean;
  maxWorkers: number;
  port: number;
  /** Should instruct the bundler to create minified bundles. */
  minify: boolean;
  devClient: boolean;
  scheme: string | null;
  host: 'localhost' | 'lan' | 'tunnel';
};

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  if (args['--dev-client'] && args['--go']) {
    throw new CommandError('BAD_ARGS', 'Cannot use both --dev-client and --go together.');
  }
  const host = resolveHostType({
    host: args['--host'],
    offline: args['--offline'],
    lan: args['--lan'],
    localhost: args['--localhost'],
    tunnel: args['--tunnel'],
  });

  // User can force the default target by passing either `--dev-client` or `--go`. They can also
  // swap between them during development by pressing `s`.
  const isUserDefinedDevClient =
    !!args['--dev-client'] || (args['--go'] == null ? false : !args['--go']);

  // If the user didn't specify `--dev-client` or `--go` we check if they have the dev client package
  // in their package.json.
  const isAutoDevClient =
    args['--dev-client'] == null &&
    args['--go'] == null &&
    hasDirectDevClientDependency(projectRoot);

  const isDevClient = isAutoDevClient || isUserDefinedDevClient;

  const scheme = await resolveSchemeAsync(projectRoot, {
    scheme: args['--scheme'],
    devClient: isDevClient,
  });

  return {
    privateKeyPath: args['--private-key-path'] ?? null,

    android: !!args['--android'],
    web: !!args['--web'],
    ios: !!args['--ios'],
    offline: !!args['--offline'],

    clear: !!args['--clear'],
    dev: !args['--no-dev'],
    https: !!args['--https'],
    maxWorkers: args['--max-workers'],
    port: args['--port'],
    minify: !!args['--minify'],

    devClient: isDevClient,

    scheme,
    host,
  };
}

export async function resolveSchemeAsync(
  projectRoot: string,
  options: { scheme?: string; devClient?: boolean }
): Promise<string | null> {
  if (typeof options.scheme === 'string') {
    // Use the custom scheme
    return options.scheme ?? null;
  }

  if (options.devClient || canResolveDevClient(projectRoot)) {
    const { getOptionalDevClientSchemeAsync } =
      require('../utils/scheme') as typeof import('../utils/scheme');
    // Attempt to find the scheme or warn the user how to setup a custom scheme
    const resolvedScheme = await getOptionalDevClientSchemeAsync(projectRoot);
    if (!resolvedScheme.scheme) {
      if (resolvedScheme.resolution === 'shared') {
        // This can happen if one of the native projects has no URI schemes defined in it.
        // Normally, this should never happen.
        Log.warn(
          chalk`Could not find a shared URI scheme for the dev client between the local {bold /ios} and {bold /android} directories. App launches (QR code, interstitial, terminal keys) may not work as expected. You can configure a custom scheme using the {bold --scheme} option, or by running {bold npx expo prebuild} to regenerate the native directories with URI schemes.`
        );
      } else if (['ios', 'android'].includes(resolvedScheme.resolution)) {
        Log.warn(
          chalk`The {bold /${resolvedScheme.resolution}} project does not contain any URI schemes. Expo CLI will not be able to use links to launch the project. You can configure a custom URI scheme using the {bold --scheme} option.`
        );
      }
    }
    return resolvedScheme.scheme;
  } else {
    // Ensure this is reset when users don't use `--scheme`, `--dev-client` and don't have the `expo-dev-client` package installed.
    return null;
  }
}

/** Resolve and assert host type options. */
export function resolveHostType(options: {
  host?: string;
  offline?: boolean;
  lan?: boolean;
  localhost?: boolean;
  tunnel?: boolean;
}): 'lan' | 'tunnel' | 'localhost' {
  if (
    [options.offline, options.host, options.lan, options.localhost, options.tunnel].filter((i) => i)
      .length > 1
  ) {
    throw new CommandError(
      'BAD_ARGS',
      'Specify at most one of: --offline, --host, --tunnel, --lan, --localhost'
    );
  }

  if (options.offline) {
    // Force `lan` in offline mode.
    return 'lan';
  } else if (options.host) {
    assert.match(options.host, /^(lan|tunnel|localhost)$/);
    return options.host as 'lan' | 'tunnel' | 'localhost';
  } else if (options.tunnel) {
    return 'tunnel';
  } else if (options.lan) {
    return 'lan';
  } else if (options.localhost) {
    return 'localhost';
  }
  return 'lan';
}

/** Resolve the port options for all supported bundlers. */
export async function resolvePortsAsync(
  projectRoot: string,
  options: Partial<Pick<Options, 'port' | 'devClient'>>,
  settings: { webOnly?: boolean }
) {
  const multiBundlerSettings: { webpackPort?: number; metroPort?: number } = {};

  if (settings.webOnly) {
    const webpackPort = await resolvePortAsync(projectRoot, {
      defaultPort: options.port,
      // Default web port
      fallbackPort: 19006,
    });
    if (!webpackPort) {
      throw new AbortCommandError();
    }
    multiBundlerSettings.webpackPort = webpackPort;
  } else {
    const fallbackPort = process.env.RCT_METRO_PORT
      ? parseInt(process.env.RCT_METRO_PORT, 10)
      : 8081;
    const metroPort = await resolvePortAsync(projectRoot, {
      defaultPort: options.port,
      fallbackPort,
    });
    if (!metroPort) {
      throw new AbortCommandError();
    }
    multiBundlerSettings.metroPort = metroPort;
  }

  return multiBundlerSettings;
}
