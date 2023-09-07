import chalk from 'chalk';
import freeportAsync from 'freeport-async';

import { env } from './env';
import { CommandError } from './errors';
import * as Log from '../log';

/** Get a free port or assert a CLI command error. */
export async function getFreePortAsync(rangeStart: number): Promise<number> {
  const port = await freeportAsync(rangeStart, { hostnames: [null, 'localhost'] });
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
  const freePort = await freeportAsync(port, { hostnames: [null] });
  // Check if port has become busy during the build.
  if (freePort === port) {
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

  const runningProcess = isRestrictedPort(port) ? null : getRunningProcess(port);
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
  }: {
    defaultPort: number;
    host?: string;
    reuseExistingPort?: boolean;
  }
): Promise<number | null> {
  try {
    const port = await freeportAsync(defaultPort, { hostnames: [host ?? null] });
    if (port === defaultPort) {
      return port;
    }

    const isRestricted = isRestrictedPort(port);

    let message = isRestricted
      ? `Admin permissions are required to run a server on a port below 1024`
      : `Port ${chalk.bold(defaultPort)} is`;

    const { getRunningProcess } =
      require('./getRunningProcess') as typeof import('./getRunningProcess');
    const runningProcess = isRestricted ? null : getRunningProcess(defaultPort);

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
export async function resolvePortAsync(
  projectRoot: string,
  {
    /** Should opt to reuse a port that is running the same project in another window. */
    reuseExistingPort,
    /** Preferred port. */
    defaultPort,
    /** Backup port for when the default isn't available. */
    fallbackPort,
  }: {
    reuseExistingPort?: boolean;
    defaultPort?: string | number;
    fallbackPort?: number;
  } = {}
): Promise<number | null> {
  let port: number;
  if (typeof defaultPort === 'string') {
    port = parseInt(defaultPort, 10);
  } else if (typeof defaultPort === 'number') {
    port = defaultPort;
  } else {
    port = env.RCT_METRO_PORT || fallbackPort || 8081;
  }

  // Only check the port when the bundler is running.
  const resolvedPort = await choosePortAsync(projectRoot, {
    defaultPort: port,
    reuseExistingPort,
  });
  if (resolvedPort == null) {
    Log.log('\u203A Skipping dev server');
    // Skip bundling if the port is null
  } else {
    // Use the new or resolved port
    process.env.RCT_METRO_PORT = String(resolvedPort);
  }

  return resolvedPort;
}
