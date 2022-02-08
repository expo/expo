import * as Log from '../log';
import { Device } from '../start/android/AndroidDeviceBridge';
import * as AndroidDeviceBridge from '../start/android/AndroidDeviceBridge';
import * as SimControl from '../start/ios/SimControl';
import { downloadExpoGoAsync } from './downloadExpoGoAsync';
import { logNewSection } from './ora';

const INSTALL_WARNING_TIMEOUT = 60 * 1000;

// url: Optional URL of Exponent.app tarball to download
export async function installExpoOnSimulatorAsync({
  simulator,
  version,
}: {
  simulator: Pick<SimControl.SimulatorDevice, 'name' | 'udid'>;
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

  const dir = await downloadExpoGoAsync('ios');

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

export async function installExpoGoOnAndroidAsync({
  device,
  url,
  version,
}: {
  device: Device;
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
  const binaryPath = await downloadExpoGoAsync('android');

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
