import spawnAsync from '@expo/spawn-async';
import { execFileSync } from 'child_process';

import * as Log from '../../../log';
import { AbortCommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';

const BEGINNING_OF_ADB_ERROR_MESSAGE = 'error: ';

// This is a tricky class since it controls a system state (side-effects).
// A more ideal solution would be to implement ADB in JS.
// The main reason this is a class is to control the flow of testing.

export class ADBServer {
  isRunning: boolean = false;
  removeExitHook: () => void = () => {};

  /** Returns the command line reference to ADB. */
  getAdbExecutablePath(): string {
    // https://developer.android.com/studio/command-line/variables
    // TODO: Add ANDROID_SDK_ROOT support as well https://github.com/expo/expo/pull/16516#discussion_r820037917
    if (process.env.ANDROID_HOME) {
      return `${process.env.ANDROID_HOME}/platform-tools/adb`;
    }
    return 'adb';
  }

  /** Start the ADB server. */
  async startAsync(): Promise<boolean> {
    if (this.isRunning) {
      return false;
    }
    // clean up
    this.removeExitHook = installExitHooks(() => {
      if (this.isRunning) {
        this.stopAsync();
      }
    });
    const adb = this.getAdbExecutablePath();
    const result = await this.resolveAdbPromise(spawnAsync(adb, ['start-server']));
    const lines = result.stderr.trim().split(/\r?\n/);
    const isStarted = lines.includes('* daemon started successfully');
    this.isRunning = isStarted;
    return isStarted;
  }

  /** Kill the ADB server. */
  async stopAsync(): Promise<boolean> {
    Log.debug('Stopping ADB server');

    if (!this.isRunning) {
      Log.debug('ADB server is not running');
      return false;
    }
    this.removeExitHook();
    try {
      await this.runAsync(['kill-server']);
      return true;
    } catch (error: any) {
      Log.error('Failed to stop ADB server: ' + error.message);
      return false;
    } finally {
      Log.debug('Stopped ADB server');
      this.isRunning = false;
    }
  }

  /** Execute an ADB command with given args. */
  async runAsync(args: string[]): Promise<string> {
    // TODO: Add a global package that installs adb to the path.
    const adb = this.getAdbExecutablePath();

    await this.startAsync();

    Log.debug([adb, ...args].join(' '));
    const result = await this.resolveAdbPromise(spawnAsync(adb, args));
    return result.output.join('\n');
  }

  /** Get ADB file output. Useful for reading device state/settings. */
  async getFileOutputAsync(args: string[]): Promise<string> {
    // TODO: Add a global package that installs adb to the path.
    const adb = this.getAdbExecutablePath();

    await this.startAsync();

    const results = await this.resolveAdbPromise(
      execFileSync(adb, args, {
        encoding: 'latin1',
        stdio: 'pipe',
      })
    );
    Log.debug('[ADB] File output:\n', results);
    return results;
  }

  /** Formats error info. */
  async resolveAdbPromise<T>(promise: T | Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error: any) {
      // User pressed ctrl+c to cancel the process...
      if (error.signal === 'SIGINT') {
        throw new AbortCommandError();
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
