import { Log } from '../log';
import { isValidPort, resolveMetroPortAsync } from '../utils/port';

export interface BundlerProps {
  /** Port to start the dev server on, or to connect the app to when the bundler is skipped. */
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

  // Resolve the port if the bundler is used.
  let port = options.bundler
    ? await resolveMetroPortAsync(projectRoot, {
        reuseExistingPort: true,
        defaultPort: options.port,
      })
    : null;

  // Skip bundling if the port is null -- meaning skip the bundler if the port is already running the app.
  options.bundler = !!port;
  if (!port) {
    if (isValidPort(options.port)) {
      port = options.port;
      // The native build compiles the dev server port from `RCT_METRO_PORT`.
      process.env.RCT_METRO_PORT = String(port);
    } else {
      port = 8081;
    }
  }
  Log.debug(`Resolved port: ${port}, start dev server: ${options.bundler}`);

  return {
    shouldStartBundler: !!options.bundler,
    port,
  };
}
