import { execSync } from 'child_process';

import * as SimControl from './simctl';
import { CommandError } from '../../../utils/errors';

const debug = require('debug')('expo:start:platforms:ios:getBestSimulator') as typeof console.log;

type DeviceContext = Partial<Pick<SimControl.Device, 'osType'>>;

/**
 * Returns the default device stored in the Simulator.app settings.
 * This helps us to get the device that the user opened most recently regardless of which tool they used.
 */
function getDefaultSimulatorDeviceUDID() {
  try {
    const defaultDeviceUDID = execSync(
      `defaults read com.apple.iphonesimulator CurrentDeviceUDID`,
      { stdio: 'pipe' }
    ).toString();
    return defaultDeviceUDID.trim();
  } catch {
    return null;
  }
}

export async function getBestBootedSimulatorAsync({
  osType,
}: DeviceContext = {}): Promise<SimControl.Device | null> {
  const [simulatorOpenedByApp] = await SimControl.getBootedSimulatorsAsync();
  // This should prevent opening a second simulator in the chance that default
  // simulator doesn't match what the Simulator app would open by default.
  if (
    simulatorOpenedByApp?.udid &&
    (!osType || (osType && simulatorOpenedByApp.osType === osType))
  ) {
    debug(`First booted simulator: ${simulatorOpenedByApp?.windowName}`);
    return simulatorOpenedByApp;
  }

  debug(`No booted simulator matching requirements (osType: ${osType}).`);
  return null;
}

/**
 * Returns the most preferred simulator UDID without booting anything.
 *
 * 1. If the simulator app defines a default simulator and the osType is not defined.
 * 2. If the osType is defined, then check if the default udid matches the osType.
 * 3. If all else fails, return the first found simulator.
 */
export async function getBestUnbootedSimulatorAsync({ osType }: DeviceContext = {}): Promise<
  string | null
> {
  const defaultId = getDefaultSimulatorDeviceUDID();
  debug(`Default simulator ID: ${defaultId}`);

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
  return simulators[0]?.udid ?? null;
}

/**
 * Get all simulators supported by Expo Go (iOS only).
 */
export async function getSelectableSimulatorsAsync({ osType = 'iOS' }: DeviceContext = {}): Promise<
  SimControl.Device[]
> {
  const simulators = await SimControl.getDevicesAsync();
  return simulators.filter((device) => device.isAvailable && device.osType === osType);
}

/**
 * Get 'best' simulator for the user based on:
 * 1. Currently booted simulator.
 * 2. Last simulator that was opened.
 * 3. First simulator that was opened.
 */
export async function getBestSimulatorAsync({ osType }: DeviceContext): Promise<string | null> {
  const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });

  if (simulatorOpenedByApp) {
    return simulatorOpenedByApp.udid;
  }

  return await getBestUnbootedSimulatorAsync({ osType });
}
