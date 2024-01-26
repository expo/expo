import spawnAsync from '@expo/spawn-async';
import { type ChildProcess } from 'child_process';
import open from 'open';
import path from 'path';

import {
  LaunchBrowserTypes,
  type LaunchBrowser,
  type LaunchBrowserInstance,
  LaunchBrowserTypesEnum,
} from './LaunchBrowser.types';

/**
 * Browser implementation for Linux
 */
export default class LaunchBrowserImplLinux implements LaunchBrowser, LaunchBrowserInstance {
  private _appId: string | undefined;
  private _process: ChildProcess | undefined;

  MAP = {
    [LaunchBrowserTypesEnum.CHROME]: ['google-chrome', 'google-chrome-stable', 'chromium'],
    [LaunchBrowserTypesEnum.EDGE]: ['microsoft-edge', 'microsoft-edge-dev'],
    [LaunchBrowserTypesEnum.BRAVE]: ['brave'],
  };

  /**
   * On Linux, the supported appId is an array, this function finds the available appId and caches it
   */
  private async getAppId(browserType: LaunchBrowserTypes): Promise<string> {
    if (this._appId == null || !this.MAP[browserType].includes(this._appId)) {
      for (const appId of this.MAP[browserType]) {
        try {
          const { status } = await spawnAsync('which', [appId], { stdio: 'ignore' });
          if (status === 0) {
            this._appId = appId;
            break;
          }
        } catch {}
      }
    }

    if (this._appId == null) {
      throw new Error(
        `Unable to find supported browser - tried[${this.MAP[browserType].join(', ')}]`
      );
    }

    return this._appId;
  }

  async isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean> {
    let result = false;
    try {
      await this.getAppId(browserType);
      result = true;
    } catch {
      result = false;
    }
    return result;
  }

  async createTempBrowserDir(baseDirName: string) {
    return path.join(require('temp-dir'), baseDirName);
  }

  async launchAsync(
    browserType: LaunchBrowserTypes,
    args: string[]
  ): Promise<LaunchBrowserInstance> {
    const appId = await this.getAppId(browserType);
    this._process = await open.openApp(appId, { arguments: args });
    return this;
  }

  async close(): Promise<void> {
    this._process?.kill();
    this._process = undefined;
    this._appId = undefined;
  }
}
