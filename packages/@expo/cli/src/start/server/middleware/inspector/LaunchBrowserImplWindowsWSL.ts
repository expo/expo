import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import open from 'open';

import {
  LaunchBrowserTypes,
  type LaunchBrowser,
  type LaunchBrowserInstance,
  LaunchBrowserTypesEnum,
} from './LaunchBrowser.types';

/**
 * Browser implementation for Windows WSL 2
 *
 * In WSL, the Expo CLI is running in Linux, but the browser is running in Windows, and we want to launch the devtools browser in Windows.
 */
export default class LaunchBrowserImplWSL implements LaunchBrowser, LaunchBrowserInstance {
  private _appId: string | undefined;
  private _powershellEnv: { [key: string]: string } | undefined;

  MAP = {
    [LaunchBrowserTypesEnum.CHROME]: {
      appId: 'chrome',
    },
    [LaunchBrowserTypesEnum.EDGE]: {
      appId: 'msedge',
    },
    [LaunchBrowserTypesEnum.BRAVE]: {
      appId: undefined,
    },
  };

  PATHS = {
    chrome: [
      '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ],
    msedge: ['/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
  };

  async isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean> {
    if (!this.MAP[browserType].appId) {
      return false;
    }
    let result = false;
    try {
      const { status } = await spawnAsync(
        'powershell.exe',
        ['-c', `Get-Package -Name '${browserType}'`],
        {
          stdio: 'ignore',
        }
      );
      result = status === 0;
    } catch {
      result = false;
    }
    return result;
  }

  async createTempBrowserDir(baseDirName: string) {
    // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
    // We should get the temp path through the `$TEMP` windows environment variable.
    const tmpDir = (await spawnAsync('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
    return `${tmpDir}\\${baseDirName}`;
  }

  async launchAsync(
    browserType: LaunchBrowserTypes,
    args: string[]
  ): Promise<LaunchBrowserInstance> {
    const appId = this.MAP[browserType].appId;
    if (!appId) {
      throw new Error(`Browser type '${browserType}' is not supported on WSL`);
    }
    await this.openBrowser(appId, { arguments: args });
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
        await spawnAsync(
          'powershell.exe',
          [
            '-c',
            `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`,
          ],
          {
            stdio: 'ignore',
          }
        );
      } catch {}
      this._appId = undefined;
    }
  }

  async openBrowser(
    appId: string | readonly string[],
    options?: open.OpenAppOptions
  ): Promise<import('child_process').ChildProcess> {
    const eligablePaths = this.PATHS[appId as keyof typeof this.PATHS];
    for (const path of eligablePaths) {
      if (fs.existsSync(path)) {
        return await spawnAsync(path, options?.arguments, {
          stdio: 'ignore',
        }).child;
      }
    }

    throw new Error(`Unable to find supported browser - tried[${eligablePaths.join(', ')}]`);
  }
}
