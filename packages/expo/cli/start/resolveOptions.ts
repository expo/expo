import assert from 'assert';

import { WEB_PORT } from '../utils/env';
import { AbortCommandError, CommandError } from '../utils/errors';
import { resolvePortAsync } from '../utils/port';
import { ProcessSettings } from './ProcessSettings';

export type Options = {
  forceManifestType: 'classic' | 'expo-updates';
  android: boolean;
  web: boolean;
  ios: boolean;
  offline: boolean;
  clear: boolean;
  dev: boolean;
  https: boolean;
  maxWorkers: number;
  port: number;
  minify: boolean;
  devClient: boolean;
  scheme: string;
  host: 'localhost' | 'lan' | 'tunnel';
};

export async function persistOptionsAsync(options: Options) {
  ProcessSettings.isOffline = options.offline;

  const { setPersistedOptions } = await import('./server/startDevServers');
  setPersistedOptions({
    devClient: options.devClient,
    forceManifestType: options.forceManifestType,
    https: options.https,
    maxWorkers: options.maxWorkers,
    mode: options.dev ? 'development' : 'production',
    resetDevServer: options.clear,
    location: {
      hostType: options.host,
      minify: options.minify,
      scheme: options.scheme,
      isOffline: options.offline,
      mode: options.dev ? 'development' : 'production',
    },
  });
}

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const forceManifestType = args['--force-manifest-type'];
  if (forceManifestType) {
    assert.match(forceManifestType, /^(classic|expo-updates)$/);
  }
  const host = resolveHostType({
    host: args['--host'],
    offline: args['--offline'],
    lan: args['--lan'],
    localhost: args['--localhost'],
    tunnel: args['--tunnel'],
  });

  const scheme = await resolveSchemeAsync(projectRoot, {
    scheme: args['--scheme'],
    devClient: args['--dev-client'],
  });

  return {
    forceManifestType,

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

    //
    devClient: !!args['--dev-client'],

    scheme,
    host,
  };
}

export async function resolveSchemeAsync(
  projectRoot: string,
  options: { scheme?: string; devClient?: boolean }
): Promise<string | null> {
  const resolveFrom = await import('resolve-from').then((m) => m.default);

  const isDevClientPackageInstalled = (() => {
    try {
      // we check if `expo-dev-launcher` is installed instead of `expo-dev-client`
      // because someone could install only launcher.
      resolveFrom(projectRoot, 'expo-dev-launcher');
      return true;
    } catch {
      return false;
    }
  })();

  if (typeof options.scheme === 'string') {
    // Use the custom scheme
    return options.scheme ?? null;
  } else if (options.devClient || isDevClientPackageInstalled) {
    const { getOptionalDevClientSchemeAsync } = await import('../utils/scheme');
    // Attempt to find the scheme or warn the user how to setup a custom scheme
    return await getOptionalDevClientSchemeAsync(projectRoot);
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
  if ([options.host, options.lan, options.localhost, options.tunnel].filter((i) => i).length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      'Specify at most one of --host, --tunnel, --lan, and --localhost'
    );
  }

  if (options.host) {
    assert.match(options.host, /^(lan|tunnel|localhost)$/);
    return options.host as 'lan' | 'tunnel' | 'localhost';
  } else if (options.tunnel) {
    return 'tunnel';
  } else if (options.lan) {
    return 'lan';
  } else if (options.localhost || options.offline) {
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
      fallbackPort: WEB_PORT,
    });
    if (!webpackPort) {
      throw new AbortCommandError();
    }
    multiBundlerSettings.webpackPort = webpackPort;
  } else {
    const metroPort = await resolvePortAsync(projectRoot, {
      defaultPort: options.port,
      fallbackPort: options.devClient ? 8081 : 19000,
    });
    if (!metroPort) {
      throw new AbortCommandError();
    }
    multiBundlerSettings.metroPort = metroPort;
  }

  return multiBundlerSettings;
}
