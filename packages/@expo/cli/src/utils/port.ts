import chalk from 'chalk';

import * as Log from '../log';
import { env } from './env';
import { CommandError } from './errors';
import { testPortAsync, freePortAsync } from './freeport';
import { isInteractive } from './interactive';

/** Get a free port or assert a CLI command error. */
async function getFreePortAsync(rangeStart: number): Promise<number> {
  const port = await freePortAsync(rangeStart, [null, 'localhost']);
  if (!port) {
    throw new CommandError('NO_PORT_FOUND', 'No available port found');
  }

  return port;
}

/** @return `true` if the port can still be used to start the dev server, `false` if the dev server should be skipped, and asserts if the port is now taken. */
export async function ensurePortAvailabilityAsync(
  projectRoot: string,
  { port }: { port: number }
): Promise<boolean> {
  const isFreePort = await testPortAsync(port, [null]);
  // Check if port has become busy during the build.
  if (isFreePort) {
    return true;
  }

  const isBusy = await isBusyPortRunningSameProcessAsync(projectRoot, { port });
  if (!isBusy) {
    throw new CommandError(
      `Port "${port}" became busy running another process while the app was compiling. Re-run command to use a new port.`
    );
  }

  // Log that the dev server will not be started and that the logs will appear in another window.
  Log.log(
    '› The dev server for this app is already running in another window. Logs will appear there.'
  );
  return false;
}

function isRestrictedPort(port: number) {
  if (process.platform !== 'win32' && port < 1024) {
    const isRoot = process.getuid && process.getuid() === 0;
    return !isRoot;
  }
  return false;
}

async function isBusyPortRunningSameProcessAsync(projectRoot: string, { port }: { port: number }) {
  const { getRunningProcess } =
    require('./getRunningProcess') as typeof import('./getRunningProcess');
  const runningProcess = isRestrictedPort(port) ? null : await getRunningProcess(port);
  if (runningProcess) {
    if (runningProcess.directory === projectRoot) {
      return true;
    } else {
      return false;
    }
  }

  return null;
}

// TODO(Bacon): Revisit after all start and run code is merged.
export async function choosePortAsync(
  projectRoot: string,
  {
    defaultPort,
    host,
    reuseExistingPort,
    explicitPort,
  }: {
    defaultPort: number;
    host?: string;
    reuseExistingPort?: boolean;
    /** Whether the port was explicitly requested (e.g. via `--port`) rather than a default. */
    explicitPort?: boolean;
  }
): Promise<number | null> {
  try {
    const port = await freePortAsync(defaultPort, [host ?? null]);
    if (port === defaultPort || defaultPort === 0) {
      return port;
    }

    const isRestricted = port && isRestrictedPort(port);

    let message = isRestricted
      ? `Admin permissions are required to run a server on a port below 1024`
      : `Port ${chalk.bold(defaultPort)} is`;

    const { getRunningProcess } =
      require('./getRunningProcess') as typeof import('./getRunningProcess');
    const runningProcess = isRestricted ? null : await getRunningProcess(defaultPort);

    if (runningProcess) {
      const pidTag = chalk.gray(`(pid ${runningProcess.pid})`);
      if (runningProcess.directory === projectRoot) {
        message += ` running this app in another window`;
        if (reuseExistingPort) {
          return null;
        }
      } else {
        message += ` running ${chalk.cyan(runningProcess.command)} in another window`;
      }
      message += '\n' + chalk.gray(`  ${runningProcess.directory} ${pidTag}`);
    } else {
      message += ' being used by another process';
    }

    Log.log(`\u203A ${message}`);

    if (!isInteractive()) {
      // An explicitly requested port is a hard requirement
      if (explicitPort) {
        throw new CommandError(
          'PORT_IN_USE',
          `Port ${defaultPort} is unavailable and 'npx expo' is running in non-interactive mode, so it can't prompt to use another port. Free port ${defaultPort} by stopping the process using it, or re-run with an available '--port'.`
        );
      } else {
        Log.log(`\u203A Using port ${port} instead`);
        return port;
      }
    }

    const { confirmAsync } = require('./prompts') as typeof import('./prompts');
    const change = await confirmAsync({
      message: `Use port ${port} instead?`,
      initial: true,
    });
    return change ? port : null;
  } catch (error: any) {
    if (error.code === 'ABORTED') {
      throw error;
    } else if (error.code === 'NON_INTERACTIVE') {
      Log.warn(chalk.yellow(error.message));
      return null;
    }
    throw error;
  }
}

// TODO(Bacon): Revisit after all start and run code is merged.
/** Picks a port without reading the environment. `resolveMetroPortAsync` is the entry point every command uses. */
export async function _resolvePortAsync(
  projectRoot: string,
  {
    /** Should opt to reuse a port that is running the same project in another window. */
    reuseExistingPort,
    /** Requested port, e.g. from `--port`. */
    defaultPort,
    /** Port to use when none is requested, and the port to scan from when `--port 0` is used. */
    preferredPort,
    /** Whether the preferred port was requested rather than defaulted, making it a hard requirement. */
    isPreferredPortExplicit,
  }: {
    reuseExistingPort?: boolean;
    defaultPort?: string | number;
    preferredPort: number;
    isPreferredPortExplicit?: boolean;
  }
): Promise<number | null> {
  let port: number;
  if (typeof defaultPort === 'string') {
    port = parseInt(defaultPort, 10);
  } else if (typeof defaultPort === 'number') {
    port = defaultPort;
  } else {
    port = preferredPort;
  }

  // Port 0 means "pick any available port"
  if (port === 0) {
    return getFreePortAsync(preferredPort);
  }

  // Only check the port when the bundler is running.
  const resolvedPort = await choosePortAsync(projectRoot, {
    defaultPort: port,
    reuseExistingPort,
    explicitPort: defaultPort != null || !!isPreferredPortExplicit,
  });
  if (resolvedPort == null) {
    Log.log('\u203A Skipping dev server');
  }

  return resolvedPort;
}

/**
 * Resolve the Metro port, honoring `RCT_METRO_PORT` and writing the result back to it.
 * The write-back matters: react-native's build scripts read `RCT_METRO_PORT`, and native
 * builds started later in the command inherit it from this process.
 */
export async function resolveMetroPortAsync(
  projectRoot: string,
  {
    reuseExistingPort,
    defaultPort,
    /** Backup port for when neither `--port` nor `RCT_METRO_PORT` is set. */
    fallbackPort,
  }: {
    reuseExistingPort?: boolean;
    defaultPort?: string | number;
    fallbackPort?: number;
  } = {}
): Promise<number | null> {
  // NOTE(@kitten): We treat `--port` and `RCT_METRO_PORT` as the fixed preferred ports
  const requestedMetroPort = env.RCT_METRO_PORT;
  const resolvedPort = await _resolvePortAsync(projectRoot, {
    reuseExistingPort,
    defaultPort,
    preferredPort: requestedMetroPort || fallbackPort || 8081,
    isPreferredPortExplicit: !!requestedMetroPort,
  });

  if (resolvedPort != null) {
    process.env.RCT_METRO_PORT = String(resolvedPort);
  }

  return resolvedPort;
}
