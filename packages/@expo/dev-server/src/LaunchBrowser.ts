import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import { spawn, type ChildProcess } from 'child_process';
import { sync as globSync } from 'glob';
import open from 'open';
import os from 'os';
import path from 'path';

const IS_WSL = require('is-wsl') && !require('is-docker')();

export interface BrowserInstance {
  close: () => Promise<void>;
}

/**
 * Supported browser types
 */
enum BrowserTypes {
  CHROME,
  EDGE,
}

/**
 * Internal browser implementation constraints
 */
interface BrowserImpl {
  /**
   * Return whether the given `browserType` is supported
   */
  isSupportedBrowser: (browserType: BrowserTypes) => Promise<boolean>;

  /**
   * Launch the browser
   */
  launchAsync: (browserType: BrowserTypes, args: string[]) => Promise<BrowserInstance>;

  /**
   * Close current browser instance
   */
  close: () => Promise<void>;
}

/**
 * Launch a browser for JavaScript inspector
 */
export async function launchBrowserAsync(url: string): Promise<BrowserInstance> {
  // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
  // with insecure-content (https page send xhr for http resource).
  // Adding `--allow-running-insecure-content` to overcome this limitation
  // without users manually allow insecure-content in site settings.
  // However, if there is existing chromium browser process, the argument will not take effect.
  // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
  const tempBrowserDir = await createTempBrowserDir();
  const launchArgs = [
    `--app=${url}`,
    '--allow-running-insecure-content',
    `--user-data-dir=${tempBrowserDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const browser = createBrowser();

  for (const browserType of [BrowserTypes.CHROME, BrowserTypes.EDGE]) {
    const isSupported = await browser.isSupportedBrowser(browserType);
    if (isSupported) {
      return browser.launchAsync(browserType, launchArgs);
    }
  }

  throw new Error(
    '[LaunchBrowser] Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge'
  );
}

function createBrowser() {
  if (os.platform() === 'darwin') {
    return new BrowserImplMacOS();
  }
  if (os.platform() === 'win32' || IS_WSL) {
    return new BrowserImplWindows();
  }
  if (os.platform() === 'linux') {
    return new BrowserImplLinux();
  }
  throw new Error('[LaunchBrowser] Unsupported host platform');
}

/**
 * Create a temp folder for chromium user profile
 */
async function createTempBrowserDir() {
  const suffix = 'expo-inspector';
  let tmpDir;
  if (IS_WSL) {
    // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
    // We should get the temp path through the `$TEMP` windows environment variable.
    tmpDir = (await spawnAsync('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
    return `${tmpDir}\\${suffix}`;
  } else {
    tmpDir = require('temp-dir');
    return path.join(tmpDir, suffix);
  }
}

/**
 * Browser implementation for macOS
 */
class BrowserImplMacOS implements BrowserImpl, BrowserInstance {
  private _process: ChildProcess | undefined;

  MAP = {
    [BrowserTypes.CHROME]: 'google chrome',
    [BrowserTypes.EDGE]: 'microsoft edge',
  };

  async isSupportedBrowser(browserType: BrowserTypes): Promise<boolean> {
    let result = false;
    try {
      await osascript.execAsync(`id of application "${this.MAP[browserType]}"`);
      result = true;
    } catch {
      result = false;
    }
    return result;
  }

  async launchAsync(browserType: BrowserTypes, args: string[]): Promise<BrowserInstance> {
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
    if (this._process != null) {
      this._process.kill();
      this._process = undefined;
    }
  }
}

/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
class BrowserImplWindows implements BrowserImpl, BrowserInstance {
  private _appId: string | undefined;

  MAP = {
    [BrowserTypes.CHROME]: {
      appId: 'chrome',
      fullName: 'Google Chrome',
    },
    [BrowserTypes.EDGE]: {
      appId: 'msedge',
      fullName: 'Microsoft Edge',
    },
  };

  async isSupportedBrowser(browserType: BrowserTypes): Promise<boolean> {
    let result = false;
    try {
      const { status } = await spawnAsync(
        'powershell.exe',
        ['-c', `Get-Package -Name '${this.MAP[browserType].fullName}'`],
        { stdio: 'ignore' }
      );
      result = status === 0;
    } catch {
      result = false;
    }
    return result;
  }

  async launchAsync(browserType: BrowserTypes, args: string[]): Promise<BrowserInstance> {
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
        await spawnAsync(
          'powershell.exe',
          [
            '-c',
            `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`,
          ],
          { stdio: 'ignore' }
        );
      } catch {}
      this._appId = undefined;
    }
  }
}

/**
 * Browser implementation for Linux
 */
class BrowserImplLinux implements BrowserImpl, BrowserInstance {
  private _appId: string | undefined;
  private _process: ChildProcess | undefined;

  MAP = {
    [BrowserTypes.CHROME]: ['google-chrome', 'google-chrome-stable', 'chromium'],
    [BrowserTypes.EDGE]: ['microsoft-edge', 'microsoft-edge-dev'],
  };

  /**
   * On Linux, the supported appId is an array, this function finds the available appId and caches it
   */
  private async getAppId(browserType: BrowserTypes): Promise<string> {
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

  async isSupportedBrowser(browserType: BrowserTypes): Promise<boolean> {
    let result = false;
    try {
      await this.getAppId(browserType);
      result = true;
    } catch {
      result = false;
    }
    return result;
  }

  async launchAsync(browserType: BrowserTypes, args: string[]): Promise<BrowserInstance> {
    const appId = await this.getAppId(browserType);
    this._process = await open.openApp(appId, { arguments: args });
    return this;
  }

  async close(): Promise<void> {
    if (this._process != null) {
      this._process.kill();
      this._process = undefined;
    }
    if (this._appId != null) {
      this._appId = undefined;
    }
  }
}
