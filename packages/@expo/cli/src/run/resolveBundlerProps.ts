import { CommandError } from '../utils/errors';
import { resolvePortAsync } from '../utils/port';

export interface BundlerProps {
  port: number;
  shouldStartBundler: boolean;
}

export async function resolveBundlerPropsAsync(
  projectRoot: string,
  options: {
    port?: number;
    bundler?: boolean;
  }
): Promise<BundlerProps> {
  const skipBundler = options.bundler === false;

  if (
    // If the user disables the bundler then they should not pass in the port property.
    skipBundler &&
    options.port
  ) {
    throw new CommandError('BAD_ARGS', '--port and --no-bundler are mutually exclusive arguments');
  }

  // Resolve the port if the bundler is used.
  let port = skipBundler
    ? null
    : await resolvePortAsync(projectRoot, { reuseExistingPort: true, defaultPort: options.port });

  // Skip bundling if the port is null
  options.bundler = !!port;
  if (!port) {
    // any random number
    port = 8081;
  }

  return {
    shouldStartBundler: !skipBundler,
    port,
  };
}
