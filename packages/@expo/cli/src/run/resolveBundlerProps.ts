import { Log } from '../log';
import { CommandError } from '../utils/errors';
import { resolvePortAsync } from '../utils/port';

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

  // Resolve the port if the bundler is used.
  let port = options.bundler
    ? await resolvePortAsync(projectRoot, { reuseExistingPort: true, defaultPort: options.port })
    : null;

  // Skip bundling if the port is null -- meaning skip the bundler if the port is already running the app.
  options.bundler = !!port;
  if (!port) {
    // any random number
    port = 8081;
  }
  Log.debug(`Resolved port: ${port}, start dev server: ${options.bundler}`);

  return {
    shouldStartBundler: !!options.bundler,
    port,
  };
}
