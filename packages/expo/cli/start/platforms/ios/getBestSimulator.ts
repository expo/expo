import { execSync } from 'child_process';

import * as SimControl from './SimControl';

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
  let simulatorOpenedByApp: SimControl.SimulatorDevice | null;

  const simulatorDeviceInfo = await SimControl.listAsync('devices');
  const devices = Object.values(simulatorDeviceInfo.devices).reduce((prev, runtime) => {
    return prev.concat(runtime.filter((device) => device.state === 'Booted'));
  }, []);
  simulatorOpenedByApp = devices[0];

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
  const defaultUdid = getDefaultSimulatorDeviceUDID();

  if (defaultUdid && !osType) {
    return defaultUdid;
  }

  const simulators = await getSelectableSimulatorsAsync({ osType });

  if (!simulators.length) {
    // TODO: Prompt to install the simulators
    throw new Error(`No ${osType || 'iOS'} devices available in Simulator.app`);
  }

  // If the default udid is defined, then check to ensure its osType matches the required os.
  if (defaultUdid) {
    const defaultSimulator = simulators.find((device) => device.udid === defaultUdid);
    if (defaultSimulator?.osType === osType) {
      return defaultUdid;
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
}: { osType?: string } = {}): Promise<SimControl.SimulatorDevice[]> {
  const simulators = await SimControl.listSimulatorDevicesAsync();
  return simulators.filter((device) => device.isAvailable && device.osType === osType);
}
