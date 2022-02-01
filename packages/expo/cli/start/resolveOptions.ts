import assert from 'assert';

import { AbortCommandError, CommandError } from '../utils/errors';

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
  // Set process settings...
  const ProcessSettings = await import('./api/ProcessSettings').then((m) => m.default);
  ProcessSettings.isOffline = options.offline;
  ProcessSettings.devClient = options.devClient;
  ProcessSettings.https = options.https;
  ProcessSettings.isDevMode = !!options.dev;
  ProcessSettings.resetDevServer = !!options.clear;
  ProcessSettings.forceManifestType = options.forceManifestType;
  ProcessSettings.hostType = options.host;
  ProcessSettings.scheme = options.scheme;
  ProcessSettings.minify = options.minify;
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
  const { getOptionalDevClientSchemeAsync } = await import('../utils/scheme');
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
  } else if (options.devClient) {
    // Attempt to find the scheme or warn the user how to setup a custom scheme
    return await getOptionalDevClientSchemeAsync(projectRoot);
  } else if (!options.devClient && isDevClientPackageInstalled) {
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
  options: Pick<Options, 'port' | 'devClient'>,
  settings: { webOnly?: boolean }
) {
  const { resolvePortAsync } = await import('../utils/port');
  const Webpack = await import('./webpack/Webpack');

  const multiBundlerSettings: { webpackPort?: number; metroPort?: number } = {};
  if (settings.webOnly) {
    const webpackPort = await resolvePortAsync(projectRoot, {
      defaultPort: options.port,
      fallbackPort: Webpack.WEB_PORT,
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
