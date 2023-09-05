import os from 'os';

import { LaunchBrowserTypes, type LaunchBrowserInstance } from './LaunchBrowser.types';
import LaunchBrowserImplLinux from './LaunchBrowserImplLinux';
import LaunchBrowserImplMacOS from './LaunchBrowserImplMacOS';
import LaunchBrowserImplWindows from './LaunchBrowserImplWindows';

export type { LaunchBrowserInstance };

const IS_WSL = require('is-wsl') && !require('is-docker')();

/**
 * Launch a browser for JavaScript inspector
 */
export async function launchBrowserAsync(url: string): Promise<LaunchBrowserInstance> {
  const browser = createBrowser();
  const tempBrowserDir = await browser.createTempBrowserDir('expo-inspector');

  // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
  // with insecure-content (https page send xhr for http resource).
  // Adding `--allow-running-insecure-content` to overcome this limitation
  // without users manually allow insecure-content in site settings.
  // However, if there is existing chromium browser process, the argument will not take effect.
  // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
  const launchArgs = [
    `--app=${url}`,
    '--allow-running-insecure-content',
    `--user-data-dir=${tempBrowserDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

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
