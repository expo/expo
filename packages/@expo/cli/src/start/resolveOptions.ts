import assert from 'assert';

import { AbortCommandError, CommandError } from '../utils/errors';
import { resolvePortAsync } from '../utils/port';
import type { ProjectState } from './project/projectState';

export type Options = {
  forceManifestType: 'classic' | 'expo-updates';
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
  appLaunchMode: string | undefined;
  /** @deprecated Use `appLaunchMode` instead. */
  devClient: boolean;
  scheme: string | null;
  host: 'localhost' | 'lan' | 'tunnel';
};

export async function resolveOptionsAsync(
  projectRoot: string,
  projectState: ProjectState,
  args: any
): Promise<Options> {
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

  const scheme = await resolveSchemeAsync(projectRoot, projectState, {
    scheme: args['--scheme'],
    devClient: args['--dev-client'],
  });

  return {
    forceManifestType,
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

    appLaunchMode: args['--app-launch-mode'],
    devClient: !!args['--dev-client'],

    scheme,
    host,
  };
}

export async function resolveSchemeAsync(
  projectRoot: string,
  projectState: ProjectState,
  options: { scheme?: string; devClient?: boolean }
): Promise<string | null> {
  // Use the custom scheme
  if (typeof options.scheme === 'string') {
    return options.scheme;
  }

  // Attempt to find the scheme or warn the user how to setup a custom scheme
  const { getSchemeAsync } = await import('../utils/scheme');
  return getSchemeAsync(projectRoot, projectState);
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
    const devClientDefaultPort = process.env.RCT_METRO_PORT
      ? parseInt(process.env.RCT_METRO_PORT, 10)
      : 8081;
    const expoGoDefaultPort = 8081;
    const metroPort = await resolvePortAsync(projectRoot, {
      defaultPort: options.port,
      fallbackPort: options.devClient ? devClientDefaultPort : expoGoDefaultPort,
    });
    if (!metroPort) {
      throw new AbortCommandError();
    }
    multiBundlerSettings.metroPort = metroPort;
  }

  return multiBundlerSettings;
}
