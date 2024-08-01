import * as osascript from '@expo/osascript';
import { spawn, type ChildProcess } from 'child_process';
import { sync as globSync } from 'glob';
import path from 'path';

import {
  LaunchBrowserTypes,
  type LaunchBrowser,
  type LaunchBrowserInstance,
  LaunchBrowserTypesEnum,
} from './LaunchBrowser.types';

/**
 * Browser implementation for macOS
 */
export default class LaunchBrowserImplMacOS implements LaunchBrowser, LaunchBrowserInstance {
  private _process: ChildProcess | undefined;

  MAP = {
    [LaunchBrowserTypesEnum.CHROME]: 'google chrome',
    [LaunchBrowserTypesEnum.EDGE]: 'microsoft edge',
    [LaunchBrowserTypesEnum.BRAVE]: 'brave browser',
  };

  async isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean> {
    let result = false;
    try {
      await osascript.execAsync(`id of application "${this.MAP[browserType]}"`);
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
    const appDirectory = await osascript.execAsync(
      `POSIX path of (path to application "${this.MAP[browserType]}")`
    );
    const appPath = globSync('Contents/MacOS/*', { cwd: appDirectory.trim(), absolute: true })?.[0];
    if (!appPath) {
      throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
    }
    this._process = spawn(appPath, args, { stdio: 'ignore' });

    return this;
  }

  async close(): Promise<void> {
    this._process?.kill();
    this._process = undefined;
  }
}
