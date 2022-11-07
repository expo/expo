import spawnAsync from '@expo/spawn-async';
import os from 'os';
import path from 'path';

import { LaunchBrowserTypes, type LaunchBrowserInstance } from './LaunchBrowser.types';
import LaunchBrowserImplLinux from './LaunchBrowserImplLinux';
import LaunchBrowserImplMacOS from './LaunchBrowserImplMacOS';
import LaunchBrowserImplWindows from './LaunchBrowserImplWindows';

const IS_WSL = require('is-wsl') && !require('is-docker')();

export type { LaunchBrowserInstance };

/**
 * Launch a browser for JavaScript inspector
 */
export async function launchBrowserAsync(url: string): Promise<LaunchBrowserInstance> {
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

  for (const browserType of [LaunchBrowserTypes.CHROME, LaunchBrowserTypes.EDGE]) {
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
    return new LaunchBrowserImplMacOS();
  }
  if (os.platform() === 'win32' || IS_WSL) {
    return new LaunchBrowserImplWindows();
  }
  if (os.platform() === 'linux') {
    return new LaunchBrowserImplLinux();
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
