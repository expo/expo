import { execSync } from 'child_process';

import { CommandError } from '../../../utils/errors';
import * as SimControl from './simctl';

function getDefaultSimulatorDeviceUDID() {
  try {
    const defaultDeviceUDID = execSync(
      `defaults read com.apple.iphonesimulator CurrentDeviceUDID`,
      { stdio: 'pipe' }
    ).toString();
    return defaultDeviceUDID.trim();
  } catch (e) {
    return null;
  }
}

export async function getBestBootedSimulatorAsync({ osType }: { osType?: string }) {
  const simulatorDeviceInfo = await SimControl.listAsync('devices');
  const devices = Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
    return prev.concat(runtime.filter((device) => device.state === 'Booted'));
  }, []);
  const simulatorOpenedByApp = devices[0];

  // This should prevent opening a second simulator in the chance that default
  // simulator doesn't match what the Simulator app would open by default.
  if (
    simulatorOpenedByApp?.udid &&
    (!osType || (osType && simulatorOpenedByApp.osType === osType))
  ) {
    return simulatorOpenedByApp;
  }

  return null;
}

export async function getBestUnbootedSimulatorAsync({
  osType,
}: {
  osType?: string;
}): Promise<string> {
  const defaultId = getDefaultSimulatorDeviceUDID();

  if (defaultId && !osType) {
    return defaultId;
  }

  const simulators = await getSelectableSimulatorsAsync({ osType });

  if (!simulators.length) {
    // TODO: Prompt to install the simulators
    throw new CommandError(
      'UNSUPPORTED_OS_TYPE',
      `No ${osType || 'iOS'} devices available in Simulator.app`
    );
  }

  // If the default udid is defined, then check to ensure its osType matches the required os.
  if (defaultId) {
    const defaultSimulator = simulators.find((device) => device.udid === defaultId);
    if (defaultSimulator?.osType === osType) {
      return defaultId;
    }
  }

  // Return first selectable device.
  return simulators[0].udid;
}

/**
 * Get all simulators supported by Expo (iOS only).
 */
export async function getSelectableSimulatorsAsync({
  osType = 'iOS',
}: { osType?: string } = {}): Promise<SimControl.Device[]> {
  const simulators = await SimControl.listSimulatorDevicesAsync();
  return simulators.filter((device) => device.isAvailable && device.osType === osType);
}

/**
 * Get 'best' simulator for the user based on:
 * 1. Currently booted simulator.
 * 2. Last simulator that was opened.
 * 3. First simulator that was opened.
 */
export async function getBestSimulatorAsync({ osType }: { osType?: string }): Promise<string> {
  const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });

  if (simulatorOpenedByApp) {
    return simulatorOpenedByApp.udid;
  }

  return await getBestUnbootedSimulatorAsync({ osType });
}
