import { vol } from 'memfs';

import { AppleAppIdResolver } from '../../start/platforms/ios/AppleAppIdResolver';
import { getConnectedAppleDevicesAsync } from '../../start/platforms/ios/devicectl';
import { getBootedSimulatorsAsync, getContainerPathAsync } from '../../start/platforms/ios/simctl';
import { getInstalledFingerprintIosAsync } from '../getInstalledFingerprintIosAsync';
import { getInstalledFingerprintIosDeviceAsync } from '../getInstalledFingerprintIosDeviceAsync';

jest.mock('../../start/platforms/ios/simctl');
jest.mock('../../start/platforms/ios/AppleAppIdResolver');
jest.mock('../../start/platforms/ios/devicectl');
jest.mock('../getInstalledFingerprintIosDeviceAsync');

const projectRoot = '/app';

const simA = { name: 'iPhone 17', udid: 'UDID-A', osType: 'iOS' } as any;
const simB = { name: 'iPhone 17 Pro', udid: 'UDID-B', osType: 'iOS' } as any;

const containerA = '/containers/A/app.app';
const containerB = '/containers/B/app.app';

function physicalDevice(
  overrides: Partial<{ udid: string; name: string; developerModeStatus: string }> = {}
) {
  const {
    udid = 'UDID-PHONE',
    name = "Vojta's iPhone",
    developerModeStatus = 'enabled',
  } = overrides;
  return {
    hardwareProperties: { udid, platform: 'iOS' },
    deviceProperties: { name, developerModeStatus },
    connectionProperties: { pairingState: 'paired', tunnelState: 'connected' },
  } as any;
}

beforeEach(() => {
  vol.reset();
  jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([simA]);
  jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([]);
  jest.mocked(AppleAppIdResolver).mockImplementation(
    () =>
      ({
        getAppIdAsync: jest.fn(async () => 'dev.expo.app'),
      }) as any
  );
  jest
    .mocked(getContainerPathAsync)
    .mockImplementation(async (device: any) =>
      device.udid === 'UDID-A' ? containerA : containerB
    );
});

describe(getInstalledFingerprintIosAsync, () => {
  it(`returns no-device without a booted simulator`, async () => {
    jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
    await expect(
      getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({
      status: 'no-device',
    });
  });

  it(`ignores booted non-iOS simulators`, async () => {
    jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([{ ...simA, osType: 'tvOS' }]);
    await expect(
      getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({
      status: 'no-device',
    });
  });

  it(`returns app-not-installed when the container is missing`, async () => {
    jest.mocked(getContainerPathAsync).mockResolvedValue(null);
    await expect(
      getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({
      status: 'app-not-installed',
      appId: 'dev.expo.app',
      device: { name: 'iPhone 17', identifier: 'UDID-A' },
    });
  });

  it.each([
    ['the app bundle root', 'EXConstants.bundle/app.fingerprint'],
    [
      'the use_frameworks location',
      'Frameworks/EXConstants.framework/EXConstants.bundle/app.fingerprint',
    ],
  ])(`reads the fingerprint from %s`, async (_description, relativePath) => {
    vol.fromJSON({
      [`${containerA}/${relativePath}`]: 'embedded-hash\n',
    });
    await expect(
      getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'embedded-hash' })
    ).resolves.toEqual({
      status: 'ok',
      hash: 'embedded-hash',
      appId: 'dev.expo.app',
      device: { name: 'iPhone 17', identifier: 'UDID-A' },
    });
  });

  it(`returns no-embedded-fingerprint when the file is absent`, async () => {
    vol.fromJSON({ [`${containerA}/Info.plist`]: 'x' });
    await expect(
      getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toMatchObject({
      status: 'no-embedded-fingerprint',
    });
  });

  describe('targeting options', () => {
    it.each([
      ['UDID', 'UDID-B'],
      ['name', 'iPhone 17 Pro'],
      // Case-insensitive, like `expo run:ios --device` — UDIDs are often copied lowercased.
      ['lowercase UDID', 'udid-b'],
      ['differently cased name', 'IPHONE 17 pro'],
    ])(`checks only the simulator matching --device by %s`, async (_kind, deviceFilter) => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([simB, simA]);
      vol.fromJSON({
        [`${containerB}/EXConstants.bundle/app.fingerprint`]: 'pro-hash',
        [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'plain-hash',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x', device: deviceFilter })
      ).resolves.toMatchObject({
        status: 'ok',
        hash: 'pro-hash',
        device: { identifier: 'UDID-B' },
      });
    });

    it(`returns no-device when --device matches no booted simulator`, async () => {
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x', device: 'iPhone 99' })
      ).resolves.toEqual({ status: 'no-device' });
    });

    it(`uses --app-id instead of resolving the bundle identifier`, async () => {
      vol.fromJSON({
        [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'flavor-hash',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, {
          expectedHash: 'x',
          appId: 'dev.expo.flavor',
        })
      ).resolves.toMatchObject({ status: 'ok', appId: 'dev.expo.flavor' });
      expect(AppleAppIdResolver).not.toHaveBeenCalled();
      expect(getContainerPathAsync).toHaveBeenCalledWith(expect.anything(), {
        appId: 'dev.expo.flavor',
      });
    });
  });

  describe('with several booted simulators', () => {
    beforeEach(() => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([simB, simA]);
    });

    it(`prefers the simulator whose app matches the expected hash`, async () => {
      vol.fromJSON({
        [`${containerB}/EXConstants.bundle/app.fingerprint`]: 'stale-hash',
        [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'expected-hash',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'expected-hash' })
      ).resolves.toEqual({
        status: 'ok',
        hash: 'expected-hash',
        appId: 'dev.expo.app',
        device: { name: 'iPhone 17', identifier: 'UDID-A' },
      });
    });

    it(`prefers an embedded fingerprint over an app without one`, async () => {
      vol.fromJSON({
        [`${containerB}/Info.plist`]: 'installed but no fingerprint',
        [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'some-hash',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'other' })
      ).resolves.toMatchObject({
        status: 'ok',
        hash: 'some-hash',
        device: { name: 'iPhone 17', identifier: 'UDID-A' },
      });
    });

    it(`prefers an installed app over a simulator without the app`, async () => {
      jest
        .mocked(getContainerPathAsync)
        .mockImplementation(async (device: any) => (device.udid === 'UDID-A' ? containerA : null));
      vol.fromJSON({ [`${containerA}/Info.plist`]: 'x' });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).resolves.toMatchObject({
        status: 'no-embedded-fingerprint',
        device: { name: 'iPhone 17', identifier: 'UDID-A' },
      });
    });

    it(`skips a simulator that fails to read (e.g. mid-shutdown) when another one succeeds`, async () => {
      jest.mocked(getContainerPathAsync).mockImplementation(async (device: any) => {
        if (device.udid === 'UDID-B') {
          throw new Error('Invalid device state');
        }
        return containerA;
      });
      vol.fromJSON({
        [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'expected-hash',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'expected-hash' })
      ).resolves.toMatchObject({
        status: 'ok',
        hash: 'expected-hash',
        device: { name: 'iPhone 17', identifier: 'UDID-A' },
      });
    });

    it(`throws only when every simulator fails to read`, async () => {
      jest.mocked(getContainerPathAsync).mockRejectedValue(new Error('Invalid device state'));
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).rejects.toThrow('Invalid device state');
    });
  });

  describe('physical devices', () => {
    it(`delegates to the physical-device reader when --device matches a connected phone`, async () => {
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      jest.mocked(getInstalledFingerprintIosDeviceAsync).mockResolvedValue({
        status: 'ok',
        hash: 'phone-hash',
        appId: 'dev.expo.app',
        device: { name: "Vojta's iPhone", identifier: 'UDID-PHONE' },
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, {
          expectedHash: 'phone-hash',
          device: "Vojta's iPhone",
        })
      ).resolves.toMatchObject({ status: 'ok', hash: 'phone-hash' });
      expect(getInstalledFingerprintIosDeviceAsync).toHaveBeenCalledWith(projectRoot, {
        expectedHash: 'phone-hash',
        device: "Vojta's iPhone",
        appId: undefined,
        // The list is passed along, so the reader doesn't run devicectl a second time.
        devices: [
          expect.objectContaining({ hardwareProperties: { udid: 'UDID-PHONE', platform: 'iOS' } }),
        ],
        timeoutMs: undefined,
      });
      // The simulator reader never ran — the filter matched a phone, not the booted simulator.
      expect(getContainerPathAsync).not.toHaveBeenCalled();
    });

    it(`matches a physical device by UDID, case-insensitively`, async () => {
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      jest
        .mocked(getInstalledFingerprintIosDeviceAsync)
        .mockResolvedValue({
          status: 'no-embedded-fingerprint',
          appId: 'dev.expo.app',
          device: { name: "Vojta's iPhone", identifier: 'UDID-PHONE' },
        });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x', device: 'udid-phone' })
      ).resolves.toMatchObject({ status: 'no-embedded-fingerprint' });
    });

    it(`probes physical devices when no simulator is booted and a phone is connected`, async () => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      jest.mocked(getInstalledFingerprintIosDeviceAsync).mockResolvedValue({
        status: 'ok',
        hash: 'phone-hash',
        appId: 'dev.expo.app',
        device: { name: "Vojta's iPhone", identifier: 'UDID-PHONE' },
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'phone-hash' })
      ).resolves.toMatchObject({ status: 'ok', hash: 'phone-hash' });
      expect(getInstalledFingerprintIosDeviceAsync).toHaveBeenCalledWith(projectRoot, {
        expectedHash: 'phone-hash',
        appId: undefined,
        devices: [
          expect.objectContaining({ hardwareProperties: { udid: 'UDID-PHONE', platform: 'iOS' } }),
        ],
        timeoutMs: undefined,
      });
    });

    it(`does not probe when several phones are connected and no --device was given`, async () => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      jest
        .mocked(getConnectedAppleDevicesAsync)
        .mockResolvedValue([
          physicalDevice(),
          physicalDevice({ udid: 'UDID-PHONE-2', name: 'Second Phone' }),
        ]);
      const result = await getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' });
      expect(result).toMatchObject({ status: 'no-device' });
      expect(result.hint).toContain("Vojta's iPhone");
      expect(result.hint).toContain('Second Phone');
      expect(getInstalledFingerprintIosDeviceAsync).not.toHaveBeenCalled();
    });

    it(`returns no-device when no simulator is booted and no phone is connected`, async () => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).resolves.toEqual({ status: 'no-device' });
      expect(getInstalledFingerprintIosDeviceAsync).not.toHaveBeenCalled();
    });

    it(`delegates a phone with Developer Mode disabled to the reader, which explains the fix`, async () => {
      // Developer Mode is deliberately not filtered here: the reader turns it into an
      // actionable hint instead of a silent "no device".
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      jest
        .mocked(getConnectedAppleDevicesAsync)
        .mockResolvedValue([physicalDevice({ developerModeStatus: 'disabled' })]);
      jest.mocked(getInstalledFingerprintIosDeviceAsync).mockResolvedValue({
        status: 'no-device',
        hint: 'Developer Mode is off.',
      });
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).resolves.toEqual({ status: 'no-device', hint: 'Developer Mode is off.' });
      expect(getInstalledFingerprintIosDeviceAsync).toHaveBeenCalledTimes(1);
    });

    it(`ignores paired phones that are not reachable`, async () => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      const unreachable = physicalDevice();
      unreachable.connectionProperties.tunnelState = 'unavailable';
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([unreachable]);
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).resolves.toEqual({ status: 'no-device' });
      expect(getInstalledFingerprintIosDeviceAsync).not.toHaveBeenCalled();
    });

    it(`adds a hint when the booted simulator is inconclusive and a phone is also connected`, async () => {
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      vol.fromJSON({ [`${containerA}/Info.plist`]: 'installed but no fingerprint' });
      const result = await getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' });
      expect(result).toMatchObject({ status: 'no-embedded-fingerprint' });
      expect((result as any).hint).toContain('--device');
      expect((result as any).hint).toContain("Vojta's iPhone");
      // The physical-device reader is never invoked automatically — only its result is hinted at.
      expect(getInstalledFingerprintIosDeviceAsync).not.toHaveBeenCalled();
    });

    it(`does not add a hint when the simulator already matches`, async () => {
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      vol.fromJSON({ [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'expected-hash' });
      const result = await getInstalledFingerprintIosAsync(projectRoot, {
        expectedHash: 'expected-hash',
      });
      expect(result).toMatchObject({ status: 'ok', hash: 'expected-hash' });
      expect((result as any).hint).toBeUndefined();
    });

    it(`does not add a hint when --device was explicit`, async () => {
      jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([physicalDevice()]);
      vol.fromJSON({ [`${containerA}/Info.plist`]: 'installed but no fingerprint' });
      const result = await getInstalledFingerprintIosAsync(projectRoot, {
        expectedHash: 'x',
        device: 'iPhone 17',
      });
      expect(result).toMatchObject({ status: 'no-embedded-fingerprint' });
      expect((result as any).hint).toBeUndefined();
    });

    it(`never runs devicectl when a booted simulator matches — enumeration is slow`, async () => {
      vol.fromJSON({ [`${containerA}/EXConstants.bundle/app.fingerprint`]: 'expected-hash' });
      const result = await getInstalledFingerprintIosAsync(projectRoot, {
        expectedHash: 'expected-hash',
      });
      expect(result).toMatchObject({ status: 'ok', hash: 'expected-hash' });
      expect(getConnectedAppleDevicesAsync).not.toHaveBeenCalled();
    });

    it(`treats a devicectl failure as "no physical devices" instead of throwing`, async () => {
      jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([]);
      jest
        .mocked(getConnectedAppleDevicesAsync)
        .mockRejectedValue(new Error('devicectl is not available'));
      await expect(
        getInstalledFingerprintIosAsync(projectRoot, { expectedHash: 'x' })
      ).resolves.toEqual({ status: 'no-device' });
    });
  });
});
