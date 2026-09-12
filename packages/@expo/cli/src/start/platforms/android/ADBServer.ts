import { Log } from '../../../log';
import { env } from '../../../utils/env';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import { event } from '../events';
import { assertSdkRoot } from './AndroidSdk';
import {
  AdbProcessWaitError,
  runAdbDeviceMutationAsync,
  runAdbHostQueryAsync,
  runBoundedAdbDeviceQueryAsync,
  runBoundedAdbDeviceMutationAsync,
  runBoundedAdbHostQueryAsync,
} from './adbProcess';

const BEGINNING_OF_ADB_ERROR_MESSAGE = 'error: ';
const PROPERTY_QUERY_WAIT_LIMIT_MS = 10_000;
const DEVICE_QUERY_WAIT_LIMIT_MS = 10_000;

export class ADBServer {
  /** Returns the command line reference to ADB. */
  getAdbExecutablePath(): string {
    try {
      const sdkRoot = assertSdkRoot();
      if (sdkRoot) {
        return `${sdkRoot}/platform-tools/adb`;
      }
    } catch (error: any) {
      Log.warn(error.message);
    }

    Log.debug('Failed to resolve the Android SDK path, falling back to global adb executable');
    return 'adb';
  }

  /** Execute an ADB command with given args. */
  async runDeviceQueryAsync(
    args: string[],
    operation: string,
    signal?: AbortSignal,
    waitLimitMs: number = DEVICE_QUERY_WAIT_LIMIT_MS
  ): Promise<string> {
    const adb = this.getAdbExecutablePath();

    // NOTE(@kitten): We removed start-server/stop-server calls,
    // because each command already negotiates the server automatically

    event('adb_server_run', { command: [adb, ...args].join(' ') });
    const result = await this.resolveAdbPromise(
      runBoundedAdbDeviceQueryAsync(adb, args, operation, waitLimitMs, signal)
    );
    assertValidAdbUserOutput(result);
    return result.stdout;
  }

  async runDeviceMutationAsync(
    args: string[],
    operation: string,
    signal?: AbortSignal,
    waitLimitMs?: number
  ): Promise<string> {
    const adb = this.getAdbExecutablePath();
    event('adb_server_run', { command: [adb, ...args].join(' ') });
    const result = await this.resolveAdbPromise(
      waitLimitMs == null
        ? runAdbDeviceMutationAsync(adb, args, operation, signal)
        : runBoundedAdbDeviceMutationAsync(adb, args, operation, waitLimitMs, signal)
    );
    assertValidAdbUserOutput(result);
    return result.stdout;
  }

  async runHostQueryAsync(
    args: string[],
    operation: string,
    signal?: AbortSignal,
    waitLimitMs?: number
  ): Promise<string> {
    const adb = this.getAdbExecutablePath();
    const result = await this.resolveAdbPromise(
      waitLimitMs == null
        ? runAdbHostQueryAsync(adb, args, operation, signal)
        : runBoundedAdbHostQueryAsync(adb, args, operation, waitLimitMs, signal)
    );
    return result.stdout;
  }

  /** Get ADB file output. Useful for reading device state/settings. */
  async getFileOutputAsync(
    args: string[],
    { signal, waitLimitMs }: { signal?: AbortSignal; waitLimitMs?: number } = {}
  ): Promise<string> {
    // TODO: Add a global package that installs adb to the path.
    const adb = this.getAdbExecutablePath();

    const result = await this.resolveAdbPromise(
      runBoundedAdbDeviceQueryAsync(
        adb,
        args,
        'device property/boot query',
        waitLimitMs ?? PROPERTY_QUERY_WAIT_LIMIT_MS,
        signal
      )
    );
    assertValidAdbUserOutput(result);
    event('adb_file_output', { output: result.stdout });
    return result.stdout;
  }

  /** Formats error info. */
  async resolveAdbPromise<T>(promise: T | Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error: any) {
      if (error instanceof AdbProcessWaitError) {
        throw error;
      }
      // User pressed ctrl+c to cancel the process...
      if (error.signal === 'SIGINT') {
        throw new AbortCommandError();
      }
      const processOutput = [error.stdout, error.stderr].filter(Boolean).join('\n');
      if (error.status === 255 && processOutput.includes('Bad user number')) {
        const userNumber = processOutput.match(/Bad user number: (.+)/)?.[1] ?? env.EXPO_ADB_USER;
        throw new CommandError(
          'EXPO_ADB_USER',
          `Invalid ADB user number "${userNumber}" set with environment variable EXPO_ADB_USER. Run "adb shell pm list users" to see valid user numbers.`
        );
      }
      // TODO: Support heap corruption for adb 29 (process exits with code -1073740940) (windows and linux)
      let errorMessage = (error.stderr || error.stdout || error.message).trim();
      if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
        errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
      }

      error.message = errorMessage;
      throw error;
    }
  }
}

function assertValidAdbUserOutput(result: { stdout: string; stderr: string }): void {
  if (!env.EXPO_ADB_USER) return;
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  if (/Bad user number|(?:user .* does not exist|no user with id)/i.test(output)) {
    throw new CommandError(
      'EXPO_ADB_USER',
      `Invalid ADB user number "${env.EXPO_ADB_USER}" set with environment variable EXPO_ADB_USER. Run "adb shell pm list users" to see valid user numbers.`
    );
  }
}
