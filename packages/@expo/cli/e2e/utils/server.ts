import spawn from 'cross-spawn';
import assert from 'node:assert';
import type { SpawnOptions, ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { env } from 'node:process';
import treeKill from 'tree-kill';

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
   * When starting the server, the promise won't resolve before the host is resolved.
   * When passing a URL, the port will be overriden using the configured port.
   */
  host(output: string | Uint8Array): URL | string | null;
};

export type BackgroundServer = {
  process: ChildProcess;
  url: URL;
  /** Fetch using URL pathnames from the server, the full URL of the server will be added */
  fetchAsync(url: string | URL, init?: RequestInit): Promise<Response>;
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
  host: resolveUrl,
  port: resolvePort = findFreePortAsync,
  ...spawnOptions
}: BackgroundServerOptions): BackgroundServer {
  let child: ChildProcess | null = null;
  let url: URL | null = null;
  let exitHandler: ((code: number | null, signal: number | null) => void) | null = null;

  return {
    get process() {
      assert(child, 'Server process is unavailable, likely not fully started');
      return child;
    },
    get url() {
      assert(url, 'Server URL is unavailable, likely not fully started');
      return url;
    },
    fetchAsync(url, init) {
      return fetch(new URL(url, this.url), init);
    },
    async startAsync(flags = []) {
      if (child) {
        throw new Error('Server was already started, unable to start the server');
      }

      const port = typeof resolvePort === 'number' ? resolvePort : await resolvePort();
      const [bin, ...commandOrFlags] = Array.isArray(command)
        ? command.concat(flags)
        : command(port).concat(flags);

      exitHandler = (code, signal) => {
        console.error(
          [bin, ...commandOrFlags].join(' '),
          'exited unexpectedly with:',
          code || signal || 'unknown exit signal'
        );
      };

      child = spawn(bin, commandOrFlags, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...spawnOptions,
        env: {
          // Attempt to define the `NODE_ENV` environment variable
          NODE_ENV: spawnOptions.env?.NODE_ENV ?? '',
          // Define the `PATH` environment variable, to allow `command: ['yarn', 'expo']`
          PATH: spawnOptions.env?.PATH ?? env.PATH,
          // Define the port the command should bind to
          PORT: String(port),
          ...spawnOptions.env,
        },
      });

      child.on('exit', exitHandler);

      // Wait until the server URL is resolved, or spawn errors occurred
      const result = await Promise.race([
        once(child, 'error').then(([error]) => ({ error })),
        waitForOutputAsync(child, resolveUrl).then((url) => ({ url })),
      ]);

      if ('error' in result) {
        child.off('exit', exitHandler);
        child = null;
        throw createSpawnError(result.error);
      }

      url = new URL(result.url, 'http://localhost');
      url.port = String(port);
    },
    async stopAsync(force = false) {
      if (!child && !force) {
        throw new Error('Server was not started, unable to stop server process');
      }

      if (exitHandler) child?.off('exit', exitHandler);
      await killProcessAsync(child ?? undefined);

      exitHandler = null;
      child = null;
      url = null;
    },
  };
}

/**
 * Hydrate the spawn error into an actual error that shows all information.
 * Errors thrown through `child.on('error')` are not actual Error instances,
 * and obfuscates the command executed.
 */
function createSpawnError(spawn: any): Error {
  if (spawn instanceof Error) return spawn;

  const cause = new Error(
    'syscall' in spawn && 'spawnargs' in spawn
      ? `${spawn.code} ${spawn.syscall} ${spawn.spawnargs}`
      : `${spawn.code} ${spawn.message}`
  );

  Object.defineProperty(cause, 'code', {
    value: spawn.code,
  });

  return new Error('Server command failed to spawn', { cause });
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

/**
 * Stop or kill a running the child process, and possible sub-processes it started.
 * This uses `tree-kill` to stop all processes on Linux, macOS, and Windows.
 */
export async function killProcessAsync(child?: ChildProcess, signal: NodeJS.Signals = 'SIGKILL') {
  if (!child) return;

  const killed = once(child, 'close');
  await new Promise<void>((resolve, reject) => {
    assert(child.pid, 'Child process has no process ID, unable to kill process');
    treeKill(child.pid, signal, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  await killed;
}

/**
 * Wait for a specific output value from a child process.
 * This binds to both `child.stderr` and `child.stdout`, and waits until the resolver returns a value
 */
export async function waitForOutputAsync<T>(
  child: ChildProcess,
  resolver: (output: string | Uint8Array) => T | null | undefined
) {
  assert(child.stderr, 'Process has no available stderr stream, unable to wait for output');
  assert(child.stdout, 'Process has no available stdout stream, unable to wait for output');

  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  function onChildOutput(chunk: string | Uint8Array) {
    const result = resolver(chunk);
    if (result) resolve(result);
  }

  try {
    child.stderr.on('data', onChildOutput);
    child.stdout.on('data', onChildOutput);
    return await promise;
  } finally {
    child.stderr.off('data', onChildOutput);
    child.stdout.off('data', onChildOutput);
  }
}
