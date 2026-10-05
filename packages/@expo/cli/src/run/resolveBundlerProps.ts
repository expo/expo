import { Log } from '../log';
import { CommandError } from '../utils/errors';
import { createPortInUseError, isValidPort, resolveMetroPortAsync } from '../utils/port';

export interface BundlerProps {
  /** Port to start the dev server on. */
  port: number;
  /** Skip opening the bundler from the native script. */
  shouldStartBundler: boolean;
}

export async function resolveBundlerPropsAsync(
  projectRoot: string,
  options: {
    port?: number;
    bundler?: boolean;
  }
): Promise<BundlerProps> {
  options.bundler = options.bundler ?? true;

  if (
    // If the user disables the bundler then they should not pass in the port property.
    !options.bundler &&
    options.port
  ) {
    throw new CommandError('BAD_ARGS', '--port and --no-bundler are mutually exclusive arguments');
  }

  if (!options.bundler) {
    return {
      shouldStartBundler: false,
      port: isValidPort(options.port) ? options.port : 8081,
    };
  }

  const choice = await resolveMetroPortAsync(projectRoot, {
    reuseExistingPort: true,
    defaultPort: options.port,
  });
  if (choice.kind === 'declined') {
    throw createPortInUseError(choice.busyPort, 'you chose not to use another port');
  }
  // Skip the bundler when this app already serves the port.
  const shouldStartBundler = choice.kind === 'port';
  const port =
    choice.kind === 'port' ? choice.port : isValidPort(options.port) ? options.port : 8081;
  Log.debug(`Resolved port: ${port}, start dev server: ${shouldStartBundler}`);

  return { shouldStartBundler, port };
}
