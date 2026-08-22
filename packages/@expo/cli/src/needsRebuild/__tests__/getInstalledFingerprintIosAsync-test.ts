import { vol } from 'memfs';

import { AppleAppIdResolver } from '../../start/platforms/ios/AppleAppIdResolver';
import { getBootedSimulatorsAsync, getContainerPathAsync } from '../../start/platforms/ios/simctl';
import { getInstalledFingerprintIosAsync } from '../getInstalledFingerprintIosAsync';

jest.mock('../../start/platforms/ios/simctl');
jest.mock('../../start/platforms/ios/AppleAppIdResolver');

const projectRoot = '/app';

const simA = { name: 'iPhone 17', udid: 'UDID-A', osType: 'iOS' } as any;
const simB = { name: 'iPhone 17 Pro', udid: 'UDID-B', osType: 'iOS' } as any;

const containerA = '/containers/A/app.app';
const containerB = '/containers/B/app.app';

beforeEach(() => {
  vol.reset();
  jest.mocked(getBootedSimulatorsAsync).mockResolvedValue([simA]);
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
});
