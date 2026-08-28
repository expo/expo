import { AppleAppIdResolver } from '../../start/platforms/ios/AppleAppIdResolver';
import {
  getConnectedAppleDevicesAsync,
  launchAppWithPayloadUrlAsync,
  openUrlWithDeviceCtlAsync,
} from '../../start/platforms/ios/devicectl';
import { getSchemesForIosAsync } from '../../utils/scheme';
import { getInstalledFingerprintIosDeviceAsync } from '../getInstalledFingerprintIosDeviceAsync';

// The launch/openURL/device-list helpers are mocked; `classifyDevicectlLaunchError` stays real
// so these tests exercise its actual string matching against realistic devicectl error messages.
jest.mock('../../start/platforms/ios/devicectl', () => ({
  ...jest.requireActual('../../start/platforms/ios/devicectl'),
  getConnectedAppleDevicesAsync: jest.fn(),
  launchAppWithPayloadUrlAsync: jest.fn(),
  openUrlWithDeviceCtlAsync: jest.fn(),
}));
jest.mock('../../start/platforms/ios/AppleAppIdResolver');
jest.mock('../../utils/scheme');

// The callback server needs a real, non-loopback-looking LAN address to start listening;
// the mocked launch helpers rewrite it to loopback before making the real HTTP request below.
jest.mock('../../utils/ip', () => ({
  getGatewayAsync: jest.fn(async () => ({
    address: '192.168.1.50',
    iname: 'en0',
    gateway: '192.168.1.1',
    internal: false,
  })),
}));

const projectRoot = '/app';

function device(
  overrides: Partial<{
    udid: string;
    name: string;
    platform: string;
    developerModeStatus: string;
    pairingState: string;
    tunnelState: string;
  }> = {}
) {
  const {
    udid = 'UDID-A',
    name = 'Evan’s iPhone',
    platform = 'iOS',
    developerModeStatus = 'enabled',
    pairingState = 'paired',
    tunnelState = 'connected',
  } = overrides;
  return {
    hardwareProperties: { udid, platform },
    deviceProperties: { name, osVersionNumber: '17.4.1', developerModeStatus },
    connectionProperties: { transportType: 'localNetwork', pairingState, tunnelState },
  } as any;
}

/** Parse nonce/callback out of the payload URL and POST the response, like a real device would. */
function respondingLaunch(fingerprint: string | null, { badNonce = false } = {}) {
  return jest.fn(async (_deviceId: string, _bundleId: string, payloadUrl: string) => {
    const url = new URL(payloadUrl);
    const nonce = badNonce ? 'wrong-nonce' : url.searchParams.get('nonce');
    const callback = url.searchParams.get('callback')!;
    // The advertised host is a fake LAN address; route the test's request over loopback.
    const loopback = callback.replace(
      new URL(callback).host,
      new URL(callback).host.replace(/^[^:]+/, '127.0.0.1')
    );
    await fetch(loopback, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, fingerprint }),
    });
  });
}

beforeEach(() => {
  jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([device()]);
  jest.mocked(AppleAppIdResolver).mockImplementation(
    () =>
      ({
        getAppIdAsync: jest.fn(async () => 'dev.expo.app'),
      }) as any
  );
  jest.mocked(getSchemesForIosAsync).mockResolvedValue(['exp+app']);
  jest.mocked(launchAppWithPayloadUrlAsync).mockResolvedValue(undefined);
  jest.mocked(openUrlWithDeviceCtlAsync).mockResolvedValue(undefined);
});

describe(getInstalledFingerprintIosDeviceAsync, () => {
  it(`returns no-device without a connected device`, async () => {
    jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([]);
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 100 })
    ).resolves.toEqual({ status: 'no-device' });
  });

  it(`ignores non-iOS devices`, async () => {
    jest.mocked(getConnectedAppleDevicesAsync).mockResolvedValue([device({ platform: 'xrOS' })]);
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 100 })
    ).resolves.toEqual({ status: 'no-device' });
  });

  it(`reports Developer Mode with a hint instead of probing when it is off on the matched device`, async () => {
    jest
      .mocked(getConnectedAppleDevicesAsync)
      .mockResolvedValue([device({ developerModeStatus: 'disabled' })]);
    const result = await getInstalledFingerprintIosDeviceAsync(projectRoot, {
      expectedHash: 'x',
      device: 'Evan’s iPhone',
      timeoutMs: 100,
    });
    expect(result).toMatchObject({ status: 'no-device' });
    expect(result.hint).toContain('Developer Mode');
    expect(result.hint).toContain('Evan’s iPhone');
    expect(launchAppWithPayloadUrlAsync).not.toHaveBeenCalled();
  });

  it(`ignores paired devices that are not reachable`, async () => {
    jest
      .mocked(getConnectedAppleDevicesAsync)
      .mockResolvedValue([device({ tunnelState: 'unavailable' })]);
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 100 })
    ).resolves.toEqual({ status: 'no-device' });
    expect(launchAppWithPayloadUrlAsync).not.toHaveBeenCalled();
  });

  it(`uses a pre-enumerated device list without running devicectl again`, async () => {
    jest.mocked(launchAppWithPayloadUrlAsync).mockImplementation(respondingLaunch('the-hash'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, {
        expectedHash: 'the-hash',
        devices: [device()],
        timeoutMs: 2000,
      })
    ).resolves.toMatchObject({ status: 'ok', hash: 'the-hash' });
    expect(getConnectedAppleDevicesAsync).not.toHaveBeenCalled();
  });

  describe('targeting options', () => {
    it.each([
      ['UDID', 'UDID-B'],
      ['name', 'Second Phone'],
      ['lowercase UDID', 'udid-b'],
      ['differently cased name', 'SECOND PHONE'],
    ])(`checks only the device matching --device by %s`, async (_kind, deviceFilter) => {
      jest
        .mocked(getConnectedAppleDevicesAsync)
        .mockResolvedValue([
          device({ udid: 'UDID-A' }),
          device({ udid: 'UDID-B', name: 'Second Phone' }),
        ]);
      jest.mocked(launchAppWithPayloadUrlAsync).mockImplementation(respondingLaunch('the-hash'));

      await expect(
        getInstalledFingerprintIosDeviceAsync(projectRoot, {
          expectedHash: 'the-hash',
          device: deviceFilter,
          timeoutMs: 2000,
        })
      ).resolves.toMatchObject({
        status: 'ok',
        hash: 'the-hash',
        device: { identifier: 'UDID-B' },
      });
      expect(launchAppWithPayloadUrlAsync).toHaveBeenCalledTimes(1);
    });
  });

  it(`returns ok with the reported hash when the app responds`, async () => {
    jest.mocked(launchAppWithPayloadUrlAsync).mockImplementation(respondingLaunch('the-hash'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, {
        expectedHash: 'the-hash',
        timeoutMs: 2000,
      })
    ).resolves.toMatchObject({
      status: 'ok',
      hash: 'the-hash',
      appId: 'dev.expo.app',
      device: { identifier: 'UDID-A' },
    });
  });

  it(`stops probing once a device reports the expected hash`, async () => {
    jest
      .mocked(getConnectedAppleDevicesAsync)
      .mockResolvedValue([
        device({ udid: 'UDID-A' }),
        device({ udid: 'UDID-B', name: 'Second Phone' }),
      ]);
    jest.mocked(launchAppWithPayloadUrlAsync).mockImplementation(respondingLaunch('expected-hash'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, {
        expectedHash: 'expected-hash',
        timeoutMs: 2000,
      })
    ).resolves.toMatchObject({
      status: 'ok',
      hash: 'expected-hash',
      device: { identifier: 'UDID-A' },
    });
    expect(launchAppWithPayloadUrlAsync).toHaveBeenCalledTimes(1);
  });

  it(`returns no-embedded-fingerprint when the app reports a null fingerprint`, async () => {
    jest.mocked(launchAppWithPayloadUrlAsync).mockImplementation(respondingLaunch(null));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 2000 })
    ).resolves.toMatchObject({
      status: 'no-embedded-fingerprint',
      device: { identifier: 'UDID-A' },
    });
  });

  it(`returns no-response when the app never answers with the right nonce before the timeout`, async () => {
    jest
      .mocked(launchAppWithPayloadUrlAsync)
      .mockImplementation(respondingLaunch('x', { badNonce: true }));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 200 })
    ).resolves.toMatchObject({ status: 'no-response', device: { identifier: 'UDID-A' } });
  });

  it(`returns app-not-installed when the launch error is classified as such`, async () => {
    jest
      .mocked(launchAppWithPayloadUrlAsync)
      .mockRejectedValue(new Error('The application is not installed on this device.'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 200 })
    ).resolves.toMatchObject({ status: 'app-not-installed', appId: 'dev.expo.app' });
    expect(openUrlWithDeviceCtlAsync).not.toHaveBeenCalled();
  });

  it(`falls back to openURL when the app is already running, and the response flows normally`, async () => {
    jest
      .mocked(launchAppWithPayloadUrlAsync)
      .mockRejectedValue(new Error('Application already running.'));
    jest
      .mocked(openUrlWithDeviceCtlAsync)
      .mockImplementation(async (_deviceId: string, url: string) => {
        const parsed = new URL(url);
        const nonce = parsed.searchParams.get('nonce');
        const callback = parsed.searchParams.get('callback')!;
        const loopback = callback.replace(
          new URL(callback).host,
          new URL(callback).host.replace(/^[^:]+/, '127.0.0.1')
        );
        await fetch(loopback, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nonce, fingerprint: 'reopened-hash' }),
        });
      });
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, {
        expectedHash: 'reopened-hash',
        timeoutMs: 2000,
      })
    ).resolves.toMatchObject({ status: 'ok', hash: 'reopened-hash' });
    expect(openUrlWithDeviceCtlAsync).toHaveBeenCalledTimes(1);
  });

  it(`returns no-response when already-running and the project has no registered scheme`, async () => {
    jest.mocked(getSchemesForIosAsync).mockResolvedValue([]);
    jest
      .mocked(launchAppWithPayloadUrlAsync)
      .mockRejectedValue(new Error('Application already running.'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 200 })
    ).resolves.toMatchObject({ status: 'no-response' });
    expect(openUrlWithDeviceCtlAsync).not.toHaveBeenCalled();
  });

  it(`falls back to openURL on an unrecognized launch error — devicectl's wording is unverified`, async () => {
    jest
      .mocked(launchAppWithPayloadUrlAsync)
      .mockRejectedValue(new Error('Some future devicectl phrasing.'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 200 })
    ).resolves.toMatchObject({ status: 'no-response' });
    expect(openUrlWithDeviceCtlAsync).toHaveBeenCalledTimes(1);
  });

  it(`rethrows the launch error when the openURL fallback also fails`, async () => {
    const launchError = new Error('Some future devicectl phrasing.');
    jest.mocked(launchAppWithPayloadUrlAsync).mockRejectedValue(launchError);
    jest.mocked(openUrlWithDeviceCtlAsync).mockRejectedValue(new Error('openURL failed too.'));
    await expect(
      getInstalledFingerprintIosDeviceAsync(projectRoot, { expectedHash: 'x', timeoutMs: 200 })
    ).rejects.toBe(launchError);
  });
});
