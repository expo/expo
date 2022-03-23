import { xcrunAsync } from './xcrun';

export type XCTraceDevice = {
  /**
   * '00E55DC0-0364-49DF-9EC6-77BE587137D4'
   */
  udid: string;
  /**
   * 'Apple TV'
   */
  name: string;

  deviceType: 'device' | 'catalyst';
  /**
   * '13.4'
   */
  osVersion: string;
};

/**
 * Get a list of all connected devices.
 */
export async function listDevicesAsync(): Promise<XCTraceDevice[]> {
  const { stdout: text } = await xcrunAsync(['xctrace', 'list', 'devices']);

  const devices: XCTraceDevice[] = [];
  if (!text.includes('== Simulators ==')) {
    return [];
  }

  const lines = text.split('\n');
  for (const line of lines) {
    if (line === '== Simulators ==') {
      break;
    }
    const device = line.match(/(.*?) (\(([0-9.]+)\) )?\(([0-9A-F-]+)\)/i);
    if (device) {
      const [, name, , osVersion, udid] = device;
      const metadata: XCTraceDevice = {
        name,
        udid,
        osVersion: osVersion ?? '??',
        deviceType: osVersion ? 'device' : 'catalyst',
      };

      devices.push(metadata);
    }
  }

  return devices;
}
