import os from 'os';

import {
  LaunchBrowserTypesEnum,
  type LaunchBrowser,
  type LaunchBrowserInstance,
  type LaunchBrowserTypes,
} from './LaunchBrowser.types';
import LaunchBrowserImplLinux from './LaunchBrowserImplLinux';
import LaunchBrowserImplMacOS from './LaunchBrowserImplMacOS';
import LaunchBrowserImplWindows from './LaunchBrowserImplWindows';

export type { LaunchBrowserInstance };

const IS_WSL = require('is-wsl') && !require('is-docker')();

/**
 * A factory to create a LaunchBrowser instance based on the host platform
 */
export function createLaunchBrowser(): LaunchBrowser {
  let launchBrowser: LaunchBrowser;
  if (os.platform() === 'darwin') {
    launchBrowser = new LaunchBrowserImplMacOS();
  } else if (os.platform() === 'win32' || IS_WSL) {
    launchBrowser = new LaunchBrowserImplWindows();
  } else if (os.platform() === 'linux') {
    launchBrowser = new LaunchBrowserImplLinux();
  } else {
    throw new Error('[createLaunchBrowser] Unsupported host platform');
  }
  return launchBrowser;
}

/**
 * Find a supported browser type on the host
 */
export async function findSupportedBrowserTypeAsync(
  launchBrowser: LaunchBrowser
): Promise<LaunchBrowserTypes> {
  const supportedBrowsers = Object.values(LaunchBrowserTypesEnum);
  for (const browserType of supportedBrowsers) {
    if (await launchBrowser.isSupportedBrowser(browserType)) {
      return browserType;
    }
  }

  throw new Error(
    `[findSupportedBrowserTypeAsync] Unable to find a browser on the host to open the inspector. Supported browsers: ${supportedBrowsers.join(
      ', '
    )}`
  );
}

/**
 * Launch a browser for inspector
 */
export async function launchInspectorBrowserAsync(
  url: string,
  browser?: LaunchBrowser,
  browserType?: LaunchBrowserTypes
): Promise<LaunchBrowserInstance> {
  const launchBrowser = browser ?? createLaunchBrowser();
  const launchBrowserType = browserType ?? (await findSupportedBrowserTypeAsync(launchBrowser));

  const tempBrowserDir = await launchBrowser.createTempBrowserDir('expo-inspector');

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

  return launchBrowser.launchAsync(launchBrowserType, launchArgs);
}
