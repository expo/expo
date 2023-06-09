import chalk from 'chalk';
import freeportAsync from 'freeport-async';

import * as Log from '../log';
import { env } from './env';
import { CommandError } from './errors';

/** Get a free port or assert a CLI command error. */
export async function getFreePortAsync(rangeStart: number): Promise<number> {
  const port = await freeportAsync(rangeStart, { hostnames: [null, 'localhost'] });
  if (!port) {
    throw new CommandError('NO_PORT_FOUND', 'No available port found');
  }

  return port;
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
  const [{ getRunningProcess }, { confirmAsync }, isRoot, Log] = await Promise.all([
    import('./getRunningProcess'),
    import('./prompts'),
    import('is-root'),
    import('../log'),
  ]);

  try {
    const port = await freeportAsync(defaultPort, { hostnames: [host ?? null] });
    if (port === defaultPort) {
      return port;
    }

    const isRestricted = process.platform !== 'win32' && defaultPort < 1024 && !isRoot.default();

    let message = isRestricted
      ? `Admin permissions are required to run a server on a port below 1024`
      : `Port ${chalk.bold(defaultPort)} is`;

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
      message += ' being used by another process'
    }

    Log.log(`\u203A ${message}`);
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
