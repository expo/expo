import spawnAsync from '@expo/spawn-async';
import open from 'open';
import path from 'path';

import {
  LaunchBrowserTypes,
  type LaunchBrowserImpl,
  type LaunchBrowserInstance,
} from './LaunchBrowser.types';

const IS_WSL = require('is-wsl') && !require('is-docker')();

/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
export default class LaunchBrowserImplWindows implements LaunchBrowserImpl, LaunchBrowserInstance {
  private _appId: string | undefined;
  private _powershellEnv: { [key: string]: string } | undefined;

  MAP = {
    [LaunchBrowserTypes.CHROME]: {
      appId: 'chrome',
      fullName: 'Google Chrome',
    },
    [LaunchBrowserTypes.EDGE]: {
      appId: 'msedge',
      fullName: 'Microsoft Edge',
    },
  };

  async isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean> {
    let result = false;
    try {
      const env = await this.getPowershellEnv();
      const { status } = await spawnAsync(
        'powershell.exe',
        ['-c', `Get-Package -Name '${this.MAP[browserType].fullName}'`],
        { env, stdio: 'ignore' }
      );
      result = status === 0;
    } catch {
      result = false;
    }
    return result;
  }

  async createTempBrowserDir(baseDirName: string) {
    let tmpDir;
    if (IS_WSL) {
      // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
      // We should get the temp path through the `$TEMP` windows environment variable.
      tmpDir = (await spawnAsync('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
      return `${tmpDir}\\${baseDirName}`;
    } else {
      tmpDir = require('temp-dir');
      return path.join(tmpDir, baseDirName);
    }
  }

  async launchAsync(
    browserType: LaunchBrowserTypes,
    args: string[]
  ): Promise<LaunchBrowserInstance> {
    const appId = this.MAP[browserType].appId;
    await open.openApp(appId, { arguments: args });
    this._appId = appId;
    return this;
  }

  async close(): Promise<void> {
    if (this._appId != null) {
      try {
        // Since we wrap all spawn calls through powershell as well as from `open.openApp`, the returned ChildProcess is not the browser process.
        // And we cannot just call `process.kill()` kill it.
        // The implementation tries to find the pid of target chromium browser process (with --app=https://chrome-devtools-frontend.appspot.com in command arguments),
        // and uses taskkill to terminate the process.
        const env = await this.getPowershellEnv();
        await spawnAsync(
          'powershell.exe',
          [
            '-c',
            `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`,
          ],
          { env, stdio: 'ignore' }
        );
      } catch {}
      this._appId = undefined;
    }
  }

  /**
   * This method is used to get the powershell environment variables for `Get-Package` command.
   * Especially for powershell 7, its default `PSModulePath` is different from powershell 5 and `Get-Package` command is not available.
   * We need to set the PSModulePath to include the default value of powershell 5.
   */
  private async getPowershellEnv(): Promise<{ [key: string]: string }> {
    if (this._powershellEnv) {
      return this._powershellEnv;
    }
    const PSModulePath = (
      await spawnAsync('powershell.exe', ['-c', 'echo "$PSHOME\\Modules"'])
    ).stdout.trim();
    this._powershellEnv = {
      PSModulePath,
    };
    return this._powershellEnv;
  }
}
