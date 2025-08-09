import spawn from 'cross-spawn';
import assert from 'node:assert';
import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { createServer } from 'node:net';
import { env } from 'node:process';

import { createVerboseLogger } from './log';
import {
  killProcessAsync,
  processCollectOutput,
  processExitToError,
  processFindPrefixedValue,
  waitForProcessOutput,
  waitForProcessReady,
} from './process';

export type BackgroundServerOptions = SpawnOptions & {
  /**
   * The command to spawn as background process.
   * You can also provide a function that receives the configured port.
   *
   * @example command: ['yarn', 'expo', 'start']
   * @example command: (port) => ['yarn', 'expo', 'start', '--port', port]
   */
  command: string[] | ((port: number) => string[]);
  /**
   * The port where the server should bind to, passed as PORT environment variable to the command.
   * Either set this to a number, or provide a method returning a number-promise.
   * By default, a random available port is used.
   *
   * @example port: 1337
   * @example port: freePortAsync
   */
  port?: number | (() => Promise<number>);
  /**
   * The host derrived from the child process output chunks (stdout or stderr).
   * `server.startAsync` will not be resolved, until this method returns the host.
   * This method also functions as the ready-check to determine if the server fully started.
   * When passing a URL, the port will be overriden using the configured port.
   */
  host(chunk: any): URL | string | null;
  /** Fully show the child process output, enabled when re-running GitHub Actions with debug mode */
  verbose?: boolean;
};

export type BackgroundServer = {
  options: SpawnOptions;
  readonly process: ChildProcess;
  readonly url: URL;
  /** Fetch using URL pathnames from the server, the full URL of the server will be added */
  fetchAsync(url: string | URL, init?: RequestInit, opts?: { attempts: number }): Promise<Response>;
  /** Start the background server, and wait until the server URL is resolved */
  startAsync(flags?: string[]): Promise<void>;
  /** Stop the background server, when passing `true` will ensure the server is killed - even when not started */
  stopAsync(force?: boolean): Promise<void>;
};

/**
 * Create a managed (backgrounded) process for long-running commands, like servers.
 * When running servers in Jest, we need to ensure the process started and closed to avoid test leaking.
 */
export function createBackgroundServer({
  command,
  host: resolveHost,
  port: resolvePort = findFreePortAsync,
  verbose,
  ...spawnOptions
}: BackgroundServerOptions): BackgroundServer {
  let child: ChildProcess | null = null;
  let url: URL | null = null;
  let exitHandler: ((code: number | null, signal: NodeJS.Signals | null) => void) | null = null;
  let log: ReturnType<typeof createVerboseLogger> | null = null;

  return {
    options: spawnOptions,
    get process() {
      assert(child, 'Server process is unavailable, likely not fully started');
      return child;
    },
    get url() {
      assert(url, 'Server URL is unavailable, likely not fully started');
      return url;
    },
    async fetchAsync(url, init, { attempts } = { attempts: 1 }) {
      let lastError: unknown;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          return await fetch(new URL(url, this.url), init);
        } catch (error) {
          lastError = error;
          // Wait a little longer between each retry
          if (attempt < attempts - 1) {
            await wait(10);
          }
        }
      }
      // If all attempts fail, throw the last error
      throw lastError ?? new Error('Failed to fetch after multiple attempts');
    },
    async startAsync(flags = []) {
      if (child) {
        throw new Error('Server was already started, unable to start the server');
      }

      const port = typeof resolvePort === 'number' ? resolvePort : await resolvePort();
      const [bin, ...commandOrFlags] = Array.isArray(command)
        ? command.concat(flags)
        : command(port).concat(flags);

      // Define the port through the environment variable, setting this here outputs the port in verbose mode
      spawnOptions.env ??= {};
      spawnOptions.env.PORT = String(port);

      child = spawn(bin, commandOrFlags, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...spawnOptions,
        env: {
          ...env, // Pipe through all environment variables from the host by default
          ...spawnOptions.env,
        },
      });

      log = createVerboseLogger({ verbose, prefix: 'server' });
      log('startAsync()', bin, ...commandOrFlags, this.options);
      processCollectOutput(child, log.tag);

      try {
        // Wait until the host is resolved based on the process output
        const host = await waitForProcessReady(child, () =>
          waitForProcessOutput(child!, resolveHost)
        );

        // Store the host and set the resolved port
        url = new URL(host, 'http://127.0.0.1');
        url.port = String(port);

        // Attach an exit handler to monitor if the process closes before intentionally closing
        exitHandler = (code, signal) => {
          const error = processExitToError(code ?? signal, '[server] exited unexpectedly with:');
          log?.error(error);
          throw error;
        };
        child.once('exit', exitHandler);
      } catch (error) {
        log.error(error);
        // When an error occurred, ensure the process is closed
        await this.stopAsync(true);
        throw error;
      }
    },
    async stopAsync(force = false) {
      if (!child && !force) {
        throw new Error('Server was not started, unable to stop server process');
      }

      if (exitHandler) child?.off('exit', exitHandler);
      log?.('stopAsync()', force ? 'by force' : '');

      try {
        await killProcessAsync(child ?? undefined, 'SIGKILL', force);
      } catch (error) {
        log?.error(error);
        throw new Error('Server could not be stopped', { cause: error });
      } finally {
        log?.exit();

        child = null;
        url = null;
        exitHandler = null;
        log = null;
      }
    },
  };
}

/**
 * Find a random available port through Node's own `net.createServer`.
 * This highly increases the randomness compared to `freeport-async`,
 * and avoids overlapping ports in parallel tests.
 */
export async function findFreePortAsync() {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: number) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<number>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const server = createServer();
  server.once('error', reject!);
  server.listen(0, () => {
    const address = server.address();
    const url = typeof address === 'string' ? new URL(address) : address;
    server.close(() => {
      if (!url) {
        reject(new Error('Could not find the address of a temporary server'));
      } else {
        resolve(Number(url.port));
      }
    });
  });

  try {
    return await promise;
  } finally {
    server.off('error', reject!);
  }
}

/** Create a managed background server running `npx serve` */
export function createStaticServe(options: Partial<BackgroundServerOptions> = {}) {
  return createBackgroundServer({
    command: ['npx', 'serve'], // Port is defined through the PORT environment variable
    host: (chunk) => processFindPrefixedValue(chunk, 'Accepting connections at'),
    ...options,
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
