import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import * as osascript from '@expo/osascript';
import plist from '@expo/plist';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs-extra';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { profile } from '../../utils/profile';
import { constructDeepLink, constructLoadingUrl } from '../serverUrl';
import { isDevClientPackageInstalled } from '../startAsync';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import * as BundleIdentifier from './configureBundleIdentifierAsync';
import {
  getBestBootedSimulatorAsync,
  getBestUnbootedSimulatorAsync,
  getSelectableSimulatorsAsync,
} from './getBestSimulator';
import { ensureExpoClientInstalledAsync } from './installIosExpoGoAsync';
import { isSimulatorInstalledAsync } from './isSimulatorInstalledAsync';
import { promptIosDeviceAsync } from './promptIosDeviceAsync';
import * as SimControl from './SimControl';
import { ensureSimulatorAppRunningAsync } from './utils/ensureSimulatorAppRunningAsync';
import { TimeoutError } from './utils/waitForActionAsync';

const EXPO_GO_BUNDLE_IDENTIFIER = 'host.exp.Exponent';

/**
 * Ensure a simulator is booted and the Simulator app is opened.
 * This is where any timeout related error handling should live.
 */
async function ensureSimulatorOpenAsync(
  { udid, osType }: { udid?: string; osType?: string } = {},
  tryAgain: boolean = true
): Promise<SimControl.SimulatorDevice> {
  // Use a default simulator if none was specified
  if (!udid) {
    // If a simulator is open, side step the entire booting sequence.
    const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });
    if (simulatorOpenedByApp) {
      return simulatorOpenedByApp;
    }

    // Otherwise, find the best possible simulator from user defaults and continue
    udid = await getBestUnbootedSimulatorAsync({ osType });
  }

  const bootedDevice = await profile(SimControl.waitForDeviceToBootAsync)({ udid });

  if (!bootedDevice) {
    // Give it a second chance, this might not be needed but it could potentially lead to a better UX on slower devices.
    if (tryAgain) {
      return await ensureSimulatorOpenAsync({ udid, osType }, false);
    }
    // TODO: We should eliminate all needs for a timeout error, it's bad UX to get an error about the simulator not starting while the user can clearly see it starting on their slow computer.
    throw new TimeoutError(
      `Simulator didn't boot fast enough. Try opening Simulator first, then running your app.`
    );
  }
  return bootedDevice;
}

async function activateSimulatorWindowAsync() {
  // TODO: Focus the individual window
  return await osascript.execAsync(`tell application "Simulator" to activate`);
}

async function openUrlAndBringToFrontAsync(simulator: SimControl.SimulatorDevice, url: string) {
  try {
    await Promise.all([
      // Open the Simulator.app app, and bring it to the front
      profile(async () => {
        await ensureSimulatorAppRunningAsync({ udid: simulator?.udid });
        activateSimulatorWindowAsync();
      }, 'parallel: ensureSimulatorAppRunningAsync')(),
      // Launch the project in the simulator, this can be parallelized for some reason.
      profile(SimControl.openURLAsync, 'parallel: openURLAsync')({ udid: simulator.udid, url }),
    ]);
  } catch (e) {
    if (e.status === 194) {
      // An error was encountered processing the command (domain=NSOSStatusErrorDomain, code=-10814):
      // The operation couldn’t be completed. (OSStatus error -10814.)
      //
      // This can be thrown when no app conforms to the URI scheme that we attempted to open.
      throw new CommandError(
        'SIMULATOR_CONFORMANCE',
        `Device ${simulator.name} (${simulator.udid}) has no app to handle the URI: ${url}`
      );
    }
    throw e;
  }
}

async function assertDevClientInstalledAsync(
  simulator: Pick<SimControl.SimulatorDevice, 'udid' | 'name'>,
  bundleIdentifier: string
): Promise<void> {
  if (!(await SimControl.getContainerPathAsync({ udid: simulator.udid, bundleIdentifier }))) {
    throw new Error(
      `The development client (${bundleIdentifier}) for this project is not installed. ` +
        `Please build and install the client on the simulator first.\n${learnMore(
          'https://docs.expo.dev/clients/distribution-for-ios/#building-for-ios'
        )}`
    );
  }
}

async function resolveApplicationIdAsync(projectRoot: string) {
  // Check xcode project
  try {
    const bundleId = await IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(projectRoot);
    if (bundleId) {
      return bundleId;
    }
  } catch {}

  // Check Info.plist
  try {
    const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(projectRoot);
    const data = await plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
    if (data.CFBundleIdentifier && !data.CFBundleIdentifier.startsWith('$(')) {
      return data.CFBundleIdentifier;
    }
  } catch {}

  // Check Expo config
  return getConfig(projectRoot).exp.ios?.bundleIdentifier;
}

function _constructDeepLink(
  projectRoot: string,
  scheme?: string,
  devClient?: boolean
): string | null {
  if (
    process.env['EXPO_ENABLE_INTERSTITIAL_PAGE'] &&
    !devClient &&
    isDevClientPackageInstalled(projectRoot)
  ) {
    return constructLoadingUrl('ios', 'localhost');
  } else {
    try {
      return constructDeepLink({
        // Don't pass a `hostType` or ngrok will break.
        scheme,
      });
    } catch (e) {
      if (devClient) {
        return null;
      }
      throw e;
    }
  }
}

export async function openProjectInDevClientAsync(
  projectRoot: string,
  {
    shouldPrompt,
    devClient,
    udid,
    scheme,
    skipNativeLogs,
    applicationId,
  }: {
    shouldPrompt?: boolean;
    scheme?: string;
    udid?: string;
    skipNativeLogs?: boolean;
    applicationId?: string;
  } = {}
): Promise<{ url: string; udid: string; bundleIdentifier: string }> {
  assert(
    await profile(isSimulatorInstalledAsync)(),
    'Unable to verify Xcode and Simulator installation.'
  );

  const projectUrl = _constructDeepLink(projectRoot, scheme, true);
  Log.debug(`iOS project url: ${projectUrl}`);

  let device: SimControl.SimulatorDevice | null = null;
  if (shouldPrompt) {
    const devices = await getSelectableSimulatorsAsync();
    device = await promptIosDeviceAsync(devices);
  } else {
    device = await ensureSimulatorOpenAsync({ udid });
  }

  const { exp } = getConfig(projectRoot);

  // No URL, and is devClient
  if (!projectUrl) {
    applicationId = applicationId ?? (await resolveApplicationIdAsync(projectRoot));
    Log.debug(`Open iOS project from app id: ${applicationId}`);
    assert(
      applicationId,
      'Cannot resolve bundle identifier or URI scheme to open the native iOS app.\nBuild the native app with `expo run:ios` or `eas build -p ios`'
    );

    logOpening(applicationId, device.name);

    const result = await SimControl.openBundleIdAsync({
      udid: device.udid,
      bundleIdentifier: applicationId,
    }).catch((error) => {
      if ('status' in error) {
        return error;
      }
      throw error;
    });
    if (result.status === 0) {
      await ensureSimulatorAppRunningAsync({ udid: device?.udid });
      activateSimulatorWindowAsync();
    } else {
      let errorMessage = `Couldn't open iOS app with ID "${applicationId}" on device "${device.name}".`;
      if (result.status === 4) {
        errorMessage += `\nThe app might not be installed, try installing it with: ${chalk.bold(
          `expo run:ios -d ${device.udid}`
        )}`;
      }
      errorMessage += chalk.gray(`\n${result.stderr}`);
      throw new CommandError(errorMessage);
    }
    return {
      udid: device.udid,
      bundleIdentifier: applicationId,
      // TODO: Remove this hack
      url: '',
    };
  }

  const simulator = await profile(ensureSimulatorOpenAsync)(device);
  logOpening(projectUrl, simulator.name);

  const bundleIdentifier = await profile(BundleIdentifier.configureBundleIdentifierAsync)(
    projectRoot,
    exp
  );
  await profile(assertDevClientInstalledAsync)(simulator, bundleIdentifier);
  if (!skipNativeLogs) {
    // stream logs before opening the client.
    // TODO: Bring with run commands
    // await streamLogsAsync({ udid: simulator.udid, bundleIdentifier });
  }

  await openUrlAndBringToFrontAsync(simulator, projectUrl);

  logEvent('Open Url on Device', {
    platform: 'ios',
  });

  return { url: projectUrl, udid: simulator.udid, bundleIdentifier: bundleIdentifier };
}

export async function openProjectInExpoGoAsync(
  projectRoot: string,
  {
    shouldPrompt,
  }: {
    shouldPrompt?: boolean;
  } = {}
): Promise<{ url: string; udid: string; bundleIdentifier: string }> {
  assert(
    await profile(isSimulatorInstalledAsync)(),
    'Unable to verify Xcode and Simulator installation.'
  );

  const projectUrl = _constructDeepLink(projectRoot);
  Log.debug(`iOS project url: ${projectUrl}`);

  const simulator = await resolveDeviceAsync(shouldPrompt);

  logOpening(projectUrl, simulator.name);

  await profile(ensureExpoClientInstalledAsync)(simulator, getConfig(projectRoot).exp.sdkVersion);

  await openUrlAndBringToFrontAsync(simulator, projectUrl);

  return {
    url: projectUrl,
    udid: simulator.udid,
    bundleIdentifier: EXPO_GO_BUNDLE_IDENTIFIER,
  };
}

async function resolveDeviceAsync(shouldPrompt?: boolean) {
  const device = shouldPrompt
    ? await promptIosDeviceAsync(await getSelectableSimulatorsAsync())
    : null;

  return await profile(ensureSimulatorOpenAsync)(device ?? {});
}

/** Open the current web project (Webpack) in a simulator. */
export async function openWebProjectAsync(
  projectRoot: string,
  {
    shouldPrompt,
  }: {
    /** Should prompt the user to select an Apple device. */
    shouldPrompt?: boolean;
  } = {}
): Promise<{ url: string }> {
  const url = WebpackDevServer.getDevServerUrl();
  assert(url, `The web project has not been started yet`);
  assert(await isSimulatorInstalledAsync(), 'Unable to verify Xcode and Simulator installation');

  const simulator = await resolveDeviceAsync(shouldPrompt);

  logOpening(url, simulator.name);

  await openUrlAndBringToFrontAsync(simulator, url);

  return { url };
}

function logOpening(url: string, deviceName: string) {
  Log.log(`\u203A Opening ${chalk.underline(url)} on ${chalk.bold(deviceName)}`);
}
