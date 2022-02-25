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

  /** Returns the command line reference to ADB. */
  getAdbExecutablePath(): string {
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
    installExitHooks(() => {
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
    if (!this.isRunning) {
      return false;
    }
    try {
      await this.runAsync(['kill-server']);
      return true;
    } catch (e) {
      Log.error('Failed to stop ADB server: ' + e.message);
      return false;
    } finally {
      this.isRunning = false;
    }
  }

  /** Execute an ADB command with given args. */
  async runAsync(args: string[]): Promise<string> {
    // await Binaries.addToPathAsync('adb');
    const adb = this.getAdbExecutablePath();

    await this.startAsync();

    Log.debug([adb, ...args].join(' '));
    const result = await this.resolveAdbPromise(spawnAsync(adb, args));
    return result.output.join('\n');
  }

  /** Get ADB file output. Useful for reading device state/settings. */
  async getFileOutputAsync(args: string[]): Promise<string> {
    // await Binaries.addToPathAsync('adb');
    const adb = this.getAdbExecutablePath();

    await this.startAsync();

    return await this.resolveAdbPromise(
      execFileSync(adb, args, {
        encoding: 'latin1',
        stdio: 'pipe',
      })
    );
  }

  /** Formats error info. */
  async resolveAdbPromise<T>(promise: T | Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (e) {
      // User pressed ctrl+c to cancel the process...
      if (e.signal === 'SIGINT') {
        throw new AbortCommandError();
      }
      // TODO: Support heap corruption for adb 29 (process exits with code -1073740940) (windows and linux)
      let errorMessage = (e.stderr || e.stdout || e.message).trim();
      if (errorMessage.startsWith(BEGINNING_OF_ADB_ERROR_MESSAGE)) {
        errorMessage = errorMessage.substring(BEGINNING_OF_ADB_ERROR_MESSAGE.length);
      }
      e.message = errorMessage;
      throw e;
    }
  }
}
