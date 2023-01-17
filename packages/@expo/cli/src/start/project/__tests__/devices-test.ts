import { fs } from 'memfs';
import path from 'path';

import * as ProjectDevices from '../devices';

describe('devices info', () => {
  let projectRoot: string;

  beforeAll(() => {
    projectRoot = path.join('/', 'tmp', 'xdl-project-settings');
  });

  afterEach(async () => {
    await ProjectDevices.setDevicesInfoAsync(projectRoot, { devices: [] });
  });

  afterAll(() => {
    if (projectRoot) {
      fs.rmdirSync(projectRoot, { recursive: true });
    }
  });

  it('should persist device info to disk', async () => {
    await ProjectDevices.saveDevicesAsync(projectRoot, 'test-device-id');

    const file = path.join(projectRoot, '.expo', 'devices.json');
    expect(fs.existsSync(file)).toBe(true);

    const { devices } = JSON.parse(fs.readFileSync(file, 'utf8').toString());
    expect(devices.length).toBe(1);
    expect(devices[0].installationId).toBe('test-device-id');
  });

  it('should save an array of devices', async () => {
    await ProjectDevices.saveDevicesAsync(projectRoot, ['device-id-1', 'device-id-2']);
    const { devices } = await ProjectDevices.getDevicesInfoAsync(projectRoot);
    expect(devices.length).toBe(2);
    expect(devices.some((device) => device.installationId === 'device-id-1')).toBe(true);
    expect(devices.some((device) => device.installationId === 'device-id-2')).toBe(true);
  });

  it('should save at most 10 devices', async () => {
    const deviceIds = [];
    for (let i = 0; i < 11; i++) {
      deviceIds.push(`device-id-${i}`);
    }
    await ProjectDevices.saveDevicesAsync(projectRoot, deviceIds);
    const { devices } = await ProjectDevices.getDevicesInfoAsync(projectRoot);
    expect(devices.length).toBe(10);
  });

  it('should remove older devices if the total number exceeds 10', async () => {
    const currentTime = new Date().getTime();
    const earlierTime = currentTime - 10;
    const earliestTime = currentTime - 20;

    const devicesInfo = [{ installationId: 'oldest-device', lastUsed: earliestTime }];
    for (let i = 0; i < 9; i++) {
      devicesInfo.push({ installationId: `device-id-${i}`, lastUsed: earlierTime });
    }
    await ProjectDevices.setDevicesInfoAsync(projectRoot, {
      devices: devicesInfo,
    });

    await ProjectDevices.saveDevicesAsync(projectRoot, 'newest-device');
    const { devices } = await ProjectDevices.getDevicesInfoAsync(projectRoot);
    expect(devices.length).toBe(10);
    expect(devices[0].installationId).toBe('newest-device');
    expect(devices.some((device) => device.installationId === 'oldest-device')).toBe(false);
  });

  it('should remove any devices last used before 30 days ago', async () => {
    const currentTime = new Date().getTime();
    const time30DaysAnd1SecondAgo = currentTime - 30 * 24 * 60 * 60 * 1000 - 1000;
    await ProjectDevices.setDevicesInfoAsync(projectRoot, {
      devices: [{ installationId: 'very-old-device-id', lastUsed: time30DaysAnd1SecondAgo }],
    });
    await ProjectDevices.saveDevicesAsync(projectRoot, 'new-device-id');
    const { devices } = await ProjectDevices.getDevicesInfoAsync(projectRoot);
    expect(devices.length).toBe(1);
    expect(devices[0].installationId).toBe('new-device-id');
  });

  it('should remove old devices when reading for the first time from disk', async () => {
    const currentTime = new Date().getTime();
    const time30DaysAnd1SecondAgo = currentTime - 30 * 24 * 60 * 60 * 1000 - 1000;
    await ProjectDevices.setDevicesInfoAsync(projectRoot, {
      devices: [
        { installationId: 'very-old-device-id', lastUsed: time30DaysAnd1SecondAgo },
        { installationId: 'new-device-id', lastUsed: currentTime },
      ],
    });
    // use readDeviceInfoAsync to bypass memoized devices and read from disk
    const { devices } = await ProjectDevices.readDevicesInfoAsync(projectRoot);
    expect(devices.length).toBe(1);
    expect(devices[0].installationId).toBe('new-device-id');
  });
});
