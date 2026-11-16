import { formatAdbDeviceError, formatAdbDiscoveryError } from '../adbDiagnostics';
import type { AdbEndpoint } from '../adbEndpoint';
import { AdbProcessError } from '../adbProcess';

const localEndpoint: AdbEndpoint = {
  type: 'tcp',
  host: '127.0.0.1',
  port: 5037,
  scope: 'local',
  source: 'default',
};

describe('ADB diagnostics', () => {
  it('reports spawn failures with concise advice', () => {
    const message = formatAdbDiscoveryError(
      new AdbProcessError('spawn adb ENOENT', 'device discovery', 'host-request', undefined, true),
      localEndpoint,
      { kind: 'connection-refused' }
    );

    expect(message).toContain('spawn adb ENOENT');
    expect(message).toContain('Android SDK Platform-Tools');
    expect(message).not.toContain('tcp:127.0.0.1:5037');
  });

  it('does not infer a cause from a successful post-failure host probe', () => {
    const message = formatAdbDiscoveryError(
      new AdbProcessError('device discovery failed', 'device discovery', 'host-request'),
      localEndpoint,
      { kind: 'version' }
    );

    expect(message).toBe('device discovery failed');
  });

  it('identifies remote, unsupported, device-state, and discovery/use-race contexts', () => {
    const message = formatAdbDeviceError(new Error('error: device not found'), {
      pid: 'serial-1',
      state: 'offline',
    });
    expect(message).toContain('Reconnect device serial-1 and try again.');
    expect(message).not.toContain('disappeared after discovery');
    expect(message).not.toMatch(/kill-server|USB|driver/i);

    expect(
      formatAdbDiscoveryError(
        new Error('unsupported socket'),
        {
          type: 'unsupported',
          specification: 'localabstract:adb',
          source: 'ADB_SERVER_SOCKET',
        },
        { kind: 'unsupported' }
      )
    ).toContain('Check ADB_SERVER_SOCKET and try again');
  });

  it('uses boot advice instead of USB reconnect advice for offline emulators', () => {
    const message = formatAdbDeviceError(new Error('emulator is offline'), {
      pid: 'emulator-5554',
      state: 'offline',
      type: 'emulator',
    });

    expect(message).toContain('Wait until ADB reports the emulator as ready');
    expect(message).not.toContain('Reconnect device emulator-5554');
  });

  it.each([
    ['unauthorized', 'https://expo.fyi/authorize-android-device'],
    ['no permissions', 'configure the appropriate udev rules'],
    ['authorizing', 'Wait until ADB reports the device as ready'],
    ['future-state', 'Wait until ADB reports the device as ready'],
  ])('preserves %s state in actionable diagnostics', (state, expected) => {
    expect(formatAdbDeviceError(new Error('transport unavailable'), { state })).toContain(expected);
  });

  it('reports unknown remote completion for a cancelled side effect', () => {
    const cancellation = Object.assign(new Error('cancelled'), { remoteCompletionUnknown: true });
    const message = formatAdbDeviceError(cancellation, {});

    expect(message).toContain('may have completed on the device');
    expect(message).toContain('Check before trying again');
  });

  it('reports a device that is still authorizing as disconnected without a known state', () => {
    const message = formatAdbDeviceError(new Error('error: device still authorizing'), {});

    expect(message).toContain('The device disconnected. Reconnect it and try again.');
  });
});
