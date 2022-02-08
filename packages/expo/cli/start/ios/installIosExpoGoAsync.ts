import semver from 'semver';
import { getVersionsAsync } from '../../api/getVersions';

import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { downloadExpoGoAsync } from '../../utils/downloadExpoGoAsync';
import { logNewSection } from '../../utils/ora';
import { profile } from '../../utils/profile';
import { confirmAsync } from '../../utils/prompts';

import * as SimControl from './SimControl';

export const EXPO_GO_BUNDLE_IDENTIFIER = 'host.exp.Exponent';
const INSTALL_WARNING_TIMEOUT = 60 * 1000;

async function isExpoClientInstalledOnSimulatorAsync({ udid }: { udid: string }): Promise<boolean> {
  return !!(await SimControl.getContainerPathAsync({
    udid,
    bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER,
  }));
}

async function waitForExpoClientInstalledOnSimulatorAsync({
  udid,
}: {
  udid: string;
}): Promise<boolean> {
  if (await isExpoClientInstalledOnSimulatorAsync({ udid })) {
    return true;
  } else {
    await delayAsync(100);
    return await waitForExpoClientInstalledOnSimulatorAsync({ udid });
  }
}

async function expoVersionOnSimulatorAsync({ udid }: { udid: string }): Promise<string | null> {
  const localPath = await SimControl.getContainerPathAsync({
    udid,
    bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER,
  });
  if (!localPath) {
    return null;
  }

  const regex = /Exponent-([0-9.]+).*\.app$/;
  const regexMatch = regex.exec(localPath);
  if (!regexMatch) {
    return null;
  }

  let matched = regexMatch[1];
  // If the value is matched like 1.0.0. then remove the trailing dot.
  if (matched.endsWith('.')) {
    matched = matched.substr(0, matched.length - 1);
  }
  return matched;
}

async function doesExpoClientNeedUpdatedAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid'>,
  sdkVersion?: string
): Promise<boolean> {
  // Test that upgrading works by returning true
  // return true;
  const versions = await profile(getVersionsAsync)();
  const clientForSdk = await profile(getClientForSDK)(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.iosVersion;

  const installedVersion = await expoVersionOnSimulatorAsync(simulator);
  if (installedVersion && semver.lt(installedVersion, latestVersionForSdk)) {
    return true;
  }
  return false;
}

// url: Optional URL of Exponent.app tarball to download
async function installExpoOnSimulatorAsync({
  simulator,
  version,
  url,
}: {
  simulator: Pick<SimControl.SimulatorDevice, 'name' | 'udid'>;
  version?: string;
  url?: string;
}) {
  let warningTimer: NodeJS.Timeout;
  const setWarningTimer = () => {
    if (warningTimer) {
      clearTimeout(warningTimer);
    }
    return setTimeout(() => {
      Log.log('');
      Log.log(
        'This download is taking longer than expected. You can also try downloading the clients from the website at https://expo.dev/tools'
      );
    }, INSTALL_WARNING_TIMEOUT);
  };
  warningTimer = setWarningTimer();

  const dir = await downloadExpoGoAsync('ios', { url });

  const message = version
    ? `Installing Expo Go ${version} on ${simulator.name}`
    : `Installing Expo Go on ${simulator.name}`;

  const ora = logNewSection(message);
  warningTimer = setWarningTimer();
  const result = await SimControl.installAsync({ udid: simulator.udid, dir });
  ora.stop();

  clearTimeout(warningTimer);
  return result;
}

// Keep a list of simulator UDIDs so we can prevent asking multiple times if a user wants to upgrade.
// This can prevent annoying interactions when they don't want to upgrade for whatever reason.
const hasPromptedToUpgrade: Record<string, boolean> = {};

export async function ensureExpoClientInstalledAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid' | 'name'>,
  sdkVersion?: string
) {
  let isInstalled = await isExpoClientInstalledOnSimulatorAsync(simulator);

  if (isInstalled && !hasPromptedToUpgrade[simulator.udid]) {
    // Only prompt/check for updates once per simulator in a single run.
    hasPromptedToUpgrade[simulator.udid] = true;
    if (await profile(doesExpoClientNeedUpdatedAsync)(simulator, sdkVersion)) {
      const confirm = await confirmAsync({
        initial: true,
        message: `Expo Go on ${simulator.name} is outdated, would you like to upgrade?`,
      });
      if (confirm) {
        isInstalled = false;
      }
    }
  }
  // If it's still "not installed" then install it (again).
  if (!isInstalled) {
    const iosClient = await getClientForSDK(sdkVersion);
    await installExpoOnSimulatorAsync({ simulator, ...iosClient });
    await waitForExpoClientInstalledOnSimulatorAsync(simulator);
  }
}

async function getClientForSDK(sdkVersionString?: string) {
  if (!sdkVersionString) {
    return null;
  }

  const sdkVersion = (await getVersionsAsync())[sdkVersionString];
  if (!sdkVersion) {
    return null;
  }

  return {
    url: sdkVersion.iosClientUrl,
    version: sdkVersion.iosClientVersion,
  };
}
