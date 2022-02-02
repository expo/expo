import * as Log from '../../log';
import { downloadExpoGoForPlatformAsync } from '../../utils/downloadAppAsync';
import { logNewSection } from '../../utils/ora';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';

const INSTALL_WARNING_TIMEOUT = 60 * 1000;

// Expo installed
export async function isAndroidExpoGoInstalledAsync(device: AndroidDeviceBridge.Device) {
  return await AndroidDeviceBridge.isPackageInstalledAsync(device, 'host.exp.exponent');
}

export async function uninstallExpoAsync(
  device: AndroidDeviceBridge.Device
): Promise<string | undefined> {
  Log.log('Uninstalling Expo Go from Android device.');

  // we need to check if its installed, else we might bump into "Failure [DELETE_FAILED_INTERNAL_ERROR]"
  const isInstalled = await isAndroidExpoGoInstalledAsync(device);
  if (!isInstalled) {
    return;
  }

  try {
    return await AndroidDeviceBridge.uninstallPackageAsync(device, {
      packageName: 'host.exp.exponent',
    });
  } catch (e) {
    Log.error(
      'Could not uninstall Expo Go from your device, please uninstall Expo Go manually and try again.'
    );
    throw e;
  }
}

export async function installExpoAsync({
  device,
  url,
  version,
}: {
  device: AndroidDeviceBridge.Device;
  url?: string;
  version?: string;
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
  const binaryPath = await downloadExpoGoForPlatformAsync('android');

  const message = version
    ? `Installing Expo Go ${version} on ${device.name}`
    : `Installing Expo Go on ${device.name}`;

  const ora = logNewSection(message);

  warningTimer = setWarningTimer();
  const result = await AndroidDeviceBridge.installOnDeviceAsync(device, { binaryPath });
  ora.stop();

  clearTimeout(warningTimer);
  return result;
}
