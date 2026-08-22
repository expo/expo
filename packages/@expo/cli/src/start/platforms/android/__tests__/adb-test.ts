import spawnAsync from '@expo/spawn-async';
import net from 'node:net';
import path from 'node:path';

import { CommandError } from '../../../../utils/errors';
import type { ADBServer } from '../ADBServer';
import type { Device } from '../adb';
import {
  getAdbNameForDeviceIdAsync,
  getAttachedDevicesAsync,
  getDeviceABIsAsync,
  getPropertyDataForDeviceAsync,
  getServer as getServerBase,
  isBootAnimationCompleteAsync,
  isDeviceBootedAsync,
  isPackageInstalledAsync,
  launchActivityAsync,
  sanitizeAdbDeviceName,
  openUrlAsync,
} from '../adb';
import * as AdbEndpoint from '../adbEndpoint';
import {
  AdbProcessWaitError,
  runAdbHostQueryAsync,
  runBoundedAdbHostQueryAsync,
} from '../adbProcess';

jest.mock('../ADBServer', () => ({
  ADBServer: jest.fn(() => {
    return {
      runDeviceQueryAsync: jest.fn(async () => ''),
      runDeviceMutationAsync: jest.fn(async () => ''),
      runHostQueryAsync: jest.fn(async () => ''),
      getFileOutputAsync: jest.fn(async () => ''),
    };
  }),
}));
jest.mock('../../../../utils/ora', () => ({
  ora: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
}));
jest.unmock('child_process');

const originalEndpointEnvironment = {
  ADB_SERVER_SOCKET: process.env.ADB_SERVER_SOCKET,
  ANDROID_ADB_SERVER_ADDRESS: process.env.ANDROID_ADB_SERVER_ADDRESS,
  ANDROID_ADB_SERVER_PORT: process.env.ANDROID_ADB_SERVER_PORT,
};

beforeEach(() => {
  delete process.env.ADB_SERVER_SOCKET;
  delete process.env.ANDROID_ADB_SERVER_ADDRESS;
  delete process.env.ANDROID_ADB_SERVER_PORT;
});

afterAll(() => {
  for (const [key, value] of Object.entries(originalEndpointEnvironment)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
});

const asDevice = (device: Partial<Device>): Device => device as Device;
const getServer = () => jest.mocked(getServerBase());

const device = asDevice({ name: 'Pixel 5', pid: '123' });

const deviceListResult = (stdout: string) => stdout;

describe(openUrlAsync, () => {
  it(`quotes the url`, async () => {
    await openUrlAsync(device, { url: 'acme://foo?bar=1&baz=2' });
    expect(getServer().runDeviceMutationAsync).toHaveBeenCalledWith(
      [
        '-s',
        '123',
        'shell',
        "'am'",
        "'start'",
        "'-a'",
        "'android.intent.action.VIEW'",
        "'-d'",
        "'acme://foo?bar=1&baz=2'",
      ],
      'URL launch',
      undefined
    );
  });

  it(`neutralizes shell-injection attempts in the url`, async () => {
    await openUrlAsync(device, { url: 'acme://x; reboot' });
    expect(getServer().runDeviceMutationAsync).toHaveBeenCalledWith(
      expect.arrayContaining(["'acme://x; reboot'"]),
      'URL launch',
      undefined
    );
  });
});

describe(launchActivityAsync, () => {
  it(`asserts that the launch activity does not exist`, async () => {
    jest
      .mocked(getServer().runDeviceMutationAsync)
      .mockResolvedValueOnce('Error: Activity class dev.bacon.app/.MainActivity does not exist.');
    await expect(
      launchActivityAsync(device, {
        launchActivity: 'dev.bacon.app/.MainActivity',
      })
    ).rejects.toThrow(CommandError);
  });
  it(`launches activity`, async () => {
    jest.mocked(getServer().runDeviceMutationAsync).mockResolvedValueOnce('...');
    await launchActivityAsync(device, {
      launchActivity: 'dev.bacon.app/.MainActivity',
    });
    expect(getServer().runDeviceMutationAsync).toHaveBeenCalledWith(
      [
        '-s',
        '123',
        'shell',
        "'am'",
        "'start'",
        "'-f'",
        "'0x20000000'",
        "'-n'",
        "'dev.bacon.app/.MainActivity'",
      ],
      'activity launch',
      undefined
    );
  });
  it(`launches activity with url`, async () => {
    jest.mocked(getServer().runDeviceMutationAsync).mockResolvedValueOnce('...');
    await launchActivityAsync(device, {
      launchActivity: 'dev.expo.custom.appid/dev.bacon.app.MainActivity',
      url: 'exp+expo-test://expo-development-client/?url=http%3A%2F%2F192.168.86.186%3A8081',
    });
    expect(getServer().runDeviceMutationAsync).toHaveBeenCalledWith(
      [
        '-s',
        '123',
        'shell',
        "'am'",
        "'start'",
        "'-f'",
        "'0x20000000'",
        "'-n'",
        "'dev.expo.custom.appid/dev.bacon.app.MainActivity'",
        "'-d'",
        "'exp+expo-test://expo-development-client/?url=http%3A%2F%2F192.168.86.186%3A8081'",
      ],
      'activity launch',
      undefined
    );
  });
  it(`neutralizes shell-injection attempts in the launch activity`, async () => {
    jest.mocked(getServer().runDeviceMutationAsync).mockResolvedValueOnce('...');
    await launchActivityAsync(device, {
      launchActivity: 'dev.bacon.app/.MainActivity; reboot',
    });
    expect(getServer().runDeviceMutationAsync).toHaveBeenCalledWith(
      expect.arrayContaining(["'dev.bacon.app/.MainActivity; reboot'"]),
      'activity launch',
      undefined
    );
  });
});

describe(isPackageInstalledAsync, () => {
  it(`returns true when a package is installed`, async () => {
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce(
        [
          'package:com.google.android.networkstack.tethering',
          'package:com.android.cts.priv.ctsshim',
          'package:com.google.android.youtube',
        ].join('\n')
      );
    expect(await isPackageInstalledAsync(device, 'com.google.android.youtube')).toBe(true);
    expect(getServer().runDeviceQueryAsync).toHaveBeenCalledWith(
      [
        '-s',
        '123',
        'shell',
        "'pm'",
        "'list'",
        "'packages'",
        "'--user'",
        "'0'",
        "'com.google.android.youtube'",
      ],
      'package query',
      undefined
    );
  });
  it(`returns false when a package is not isntalled`, async () => {
    jest.mocked(getServer().runDeviceQueryAsync).mockResolvedValueOnce('');
    expect(await isPackageInstalledAsync(device, 'com.google.android.youtube')).toBe(false);
  });
  it(`neutralizes shell-injection attempts in the package name`, async () => {
    jest.mocked(getServer().runDeviceQueryAsync).mockResolvedValueOnce('');
    await isPackageInstalledAsync(device, 'com.google.android.youtube; reboot');
    expect(getServer().runDeviceQueryAsync).toHaveBeenCalledWith(
      expect.arrayContaining(["'com.google.android.youtube; reboot'"]),
      'package query',
      undefined
    );
  });
});

describe(getAdbNameForDeviceIdAsync, () => {
  it(`returns a device name`, async () => {
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce(['Pixel_4_XL_API_30', 'OK'].join('\n'));

    expect(await getAdbNameForDeviceIdAsync(asDevice({ pid: 'emulator-5554' }))).toBe(
      'Pixel_4_XL_API_30'
    );
  });
  it(`asserts when a device is not found`, async () => {
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce('error: could not connect to TCP port 55534: Connection refused');

    await expect(getAdbNameForDeviceIdAsync(asDevice({ pid: 'emulator-5554' }))).rejects.toThrow(
      CommandError
    );
  });
});

describe(isDeviceBootedAsync, () => {
  it(`returns a device when booted`, async () => {
    jest
      .mocked(getServer().runHostQueryAsync)
      .mockResolvedValueOnce(
        deviceListResult(
          [
            'List of devices attached',
            'emulator-5554          device product:sdk_gphone_x86_arm model:sdk_gphone_x86_arm device:generic_x86_arm transport_id:1',
            '',
          ].join('\n')
        )
      );
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce(['Pixel_4_XL_API_30', 'OK'].join('\n'));

    expect(await isDeviceBootedAsync(asDevice({ name: 'Pixel_4_XL_API_30' }))).toMatchObject({
      isAuthorized: true,
      isBooted: true,
      isLaunchable: false,
      name: 'Pixel_4_XL_API_30',
      pid: 'emulator-5554',
      state: 'device',
      transportId: '1',
      type: 'emulator',
    });
  });

  it(`returns null when the device is not booted`, async () => {
    jest.mocked(getServer().runHostQueryAsync).mockResolvedValueOnce(deviceListResult(''));
    expect(await isDeviceBootedAsync(device)).toBe(null);
  });
});

describe(getAttachedDevicesAsync, () => {
  it(`gets devices`, async () => {
    jest.mocked(getServer().runHostQueryAsync).mockResolvedValueOnce(
      deviceListResult(
        [
          'List of devices attached',
          // unauthorized
          'FA8251A00719 unauthorized usb:338690048X transport_id:5',
          // authorized
          'FA8251A00720 device usb:338690048X product:walleye model:Pixel_2 device:walleye transport_id:4',
          // Emulator
          'emulator-5554          device product:sdk_gphone_x86_arm model:sdk_gphone_x86_arm device:generic_x86_arm transport_id:1',
          // Physical device with "emulator" in its metadata
          'FA8251A00721 device usb:338690048X model:emulator_phone transport_id:6',
          '',
        ].join('\n')
      )
    );
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce(['Pixel_4_XL_API_30', 'OK'].join('\n'));

    const devices = await getAttachedDevicesAsync();

    expect(devices).toEqual([
      {
        isAuthorized: false,
        isBooted: false,
        isLaunchable: false,
        name: 'Device FA8251A00719',
        pid: 'FA8251A00719',
        state: 'unauthorized',
        transportId: '5',
        type: 'device',
        connectionType: 'USB',
      },
      {
        isAuthorized: true,
        isBooted: true,
        isLaunchable: false,
        name: 'Pixel_2',
        pid: 'FA8251A00720',
        state: 'device',
        transportId: '4',
        type: 'device',
        connectionType: 'USB',
      },
      {
        isAuthorized: true,
        isBooted: true,
        isLaunchable: false,
        name: 'Pixel_4_XL_API_30',
        pid: 'emulator-5554',
        state: 'device',
        transportId: '1',
        type: 'emulator',
      },
      {
        connectionType: 'USB',
        isAuthorized: true,
        isBooted: true,
        isLaunchable: false,
        name: 'emulator_phone',
        pid: 'FA8251A00721',
        state: 'device',
        transportId: '6',
        type: 'device',
      },
    ]);
  });

  it(`gets network connected devices`, async () => {
    jest.mocked(getServer().runHostQueryAsync).mockResolvedValueOnce(
      deviceListResult(
        [
          'List of devices attached',
          // offline
          'adb-00000XXX000XXX-YzYyyy._adb-tls-connect._tcp. offline transport_id:1',
          // authorized & online
          'adb-00000XXX000XXX-YzXxxx._adb-tls-connect._tcp. device product:cheetah model:Pixel_7_Pro device:cheetah transport_id:2',
          // offline with retained model metadata
          'adb-00000XXX000XXX-YzZzzz._adb-tls-connect._tcp. offline product:cheetah model:Pixel_7_Pro device:cheetah transport_id:2',
          // Emulator
          'emulator-5554          device product:sdk_gphone_x86_arm model:sdk_gphone_x86_arm device:generic_x86_arm transport_id:1',
          '',
        ].join('\n')
      )
    );
    jest
      .mocked(getServer().runDeviceQueryAsync)
      .mockResolvedValueOnce(['Pixel_4_XL_API_30', 'OK'].join('\n'));

    const devices = await getAttachedDevicesAsync();

    expect(devices).toEqual([
      {
        isAuthorized: false,
        isBooted: false,
        isLaunchable: false,
        name: 'Device adb-00000XXX000XXX-YzYyyy._adb-tls-connect._tcp.',
        pid: 'adb-00000XXX000XXX-YzYyyy._adb-tls-connect._tcp.',
        state: 'offline',
        transportId: '1',
        type: 'device',
        connectionType: 'Network',
      },
      {
        isAuthorized: true,
        isBooted: true,
        isLaunchable: false,
        name: 'Pixel_7_Pro',
        pid: 'adb-00000XXX000XXX-YzXxxx._adb-tls-connect._tcp.',
        state: 'device',
        transportId: '2',
        type: 'device',
        connectionType: 'Network',
      },
      {
        isAuthorized: false,
        isBooted: false,
        isLaunchable: false,
        name: 'Device adb-00000XXX000XXX-YzZzzz._adb-tls-connect._tcp.',
        pid: 'adb-00000XXX000XXX-YzZzzz._adb-tls-connect._tcp.',
        state: 'offline',
        transportId: '2',
        type: 'device',
        connectionType: 'Network',
      },
      {
        isAuthorized: true,
        isBooted: true,
        isLaunchable: false,
        name: 'Pixel_4_XL_API_30',
        pid: 'emulator-5554',
        state: 'device',
        transportId: '1',
        type: 'emulator',
      },
    ]);
  });

  it('reports a silent remote endpoint without replacing its owner', async () => {
    process.env.ANDROID_ADB_SERVER_ADDRESS = '192.0.2.10';
    jest.mocked(getServer().runHostQueryAsync).mockRejectedValueOnce(new Error('discovery failed'));
    jest
      .spyOn(AdbEndpoint, 'probeAdbHostVersionAsync')
      .mockResolvedValueOnce({ kind: 'connected-no-reply' });

    await expect(getAttachedDevicesAsync({ probeWaitLimitMs: 5 })).rejects.toThrow(
      /ADB server at tcp:192\.0\.2\.10:5037.*is not responding/
    );
    expect(AdbEndpoint.probeAdbHostVersionAsync).toHaveBeenCalledWith(
      expect.objectContaining({ host: '192.0.2.10', scope: 'remote' }),
      expect.any(AbortSignal)
    );
  });

  it('reports invalid protocol at the custom selected socket', async () => {
    process.env.ADB_SERVER_SOCKET = 'tcp:localhost:5041';
    jest.mocked(getServer().runHostQueryAsync).mockRejectedValueOnce(new Error('protocol failure'));
    jest.spyOn(AdbEndpoint, 'probeAdbHostVersionAsync').mockResolvedValueOnce({
      kind: 'invalid-protocol',
    });

    await expect(getAttachedDevicesAsync({ probeWaitLimitMs: 5 })).rejects.toThrow(
      /endpoint at tcp:localhost:5041.*is not an ADB server/s
    );
  });

  it('does not probe after explicit caller cancellation', async () => {
    const cancellation = new Error('cancelled');
    const controller = new AbortController();
    controller.abort(cancellation);
    jest.mocked(getServer().runHostQueryAsync).mockRejectedValueOnce(cancellation);
    const probe = jest.spyOn(AdbEndpoint, 'probeAdbHostVersionAsync');

    await expect(getAttachedDevicesAsync({ signal: controller.signal })).rejects.toBe(cancellation);
    expect(probe).not.toHaveBeenCalled();
  });

  it('does not probe after a caller timeout', async () => {
    const controller = new AbortController();
    const reason = new DOMException('caller timed out', 'TimeoutError');
    jest.mocked(getServer().runHostQueryAsync).mockImplementationOnce(
      (_args, _operation, signal) =>
        new Promise((_, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
        })
    );
    const probe = jest.spyOn(AdbEndpoint, 'probeAdbHostVersionAsync');

    const result = getAttachedDevicesAsync({ signal: controller.signal });
    controller.abort(reason);

    await expect(result).rejects.toBe(reason);
    expect(probe).not.toHaveBeenCalled();
  });
});

describe(isBootAnimationCompleteAsync, () => {
  it(`returns true if the boot animation is complete for a device`, async () => {
    jest
      .mocked(getServer().getFileOutputAsync)
      .mockResolvedValueOnce(['[init.svc.bootanim]: [stopped]'].join('\n'));

    await expect(isBootAnimationCompleteAsync()).resolves.toBe(true);
  });
  it(`returns false if the boot animation is not complete`, async () => {
    jest
      .mocked(getServer().getFileOutputAsync)
      .mockResolvedValueOnce(['[init.svc.bootanim]: [running]'].join('\n'));
    await expect(isBootAnimationCompleteAsync()).resolves.toBe(false);
  });
  it(`preserves errors when boot properties cannot be read`, async () => {
    jest.mocked(getServer().getFileOutputAsync).mockImplementationOnce(() => {
      throw new Error('File not found');
    });

    await expect(isBootAnimationCompleteAsync()).rejects.toThrow('File not found');
  });
});

describe(getPropertyDataForDeviceAsync, () => {
  it('reports host health after a property wait expires', async () => {
    const operation = 'device property/boot query';
    jest
      .mocked(getServer().getFileOutputAsync)
      .mockRejectedValueOnce(
        new AdbProcessWaitError('property wait expired', operation, 'device-service')
      );
    jest.spyOn(AdbEndpoint, 'probeAdbHostVersionAsync').mockResolvedValueOnce({
      kind: 'version',
    });

    const result = getPropertyDataForDeviceAsync(asDevice({ pid: '123' }));
    await expect(result).rejects.toThrow(
      /ADB server is responding, but device property\/boot query did not finish/
    );
  });

  it(`returns parsed property data`, async () => {
    jest.mocked(getServer().getFileOutputAsync).mockResolvedValueOnce(
      [
        '[wifi.direct.interface]: [p2p-dev-wlan0]',
        '[init.svc.bootanim]: [stopped]',
        '[wifi.interface]: [wlan0]',
        // Should be stripped
        '[invalid]: foobar',
      ].join('\n')
    );

    await expect(getPropertyDataForDeviceAsync(asDevice({ pid: '123' }))).resolves.toStrictEqual({
      'init.svc.bootanim': 'stopped',
      'wifi.direct.interface': 'p2p-dev-wlan0',
      'wifi.interface': 'wlan0',
    });
  });
});

describe(getDeviceABIsAsync, () => {
  it(`returns a list of device ABIs`, async () => {
    jest
      .mocked(getServer().getFileOutputAsync)
      .mockResolvedValueOnce(['x86,armeabi-v7a,armeabi', ''].join('\n'));
    await expect(isBootAnimationCompleteAsync()).resolves.toBe(false);
  });
});

describe(sanitizeAdbDeviceName, () => {
  it(`returns the avd device name from single line`, () => {
    expect(sanitizeAdbDeviceName('Pixel_3_API_28')).toBe('Pixel_3_API_28');
  });

  it(`returns the avd device name from multi line with LF`, () => {
    expect(sanitizeAdbDeviceName(`Pixel_4_API_29\nOK`)).toBe('Pixel_4_API_29');
  });

  it(`returns the avd device name from multi line with CR LF`, () => {
    expect(sanitizeAdbDeviceName(`Pixel_5_API_30\r\nOK`)).toBe('Pixel_5_API_30');
  });

  it(`returns the avd device name from multi line with CR`, () => {
    expect(sanitizeAdbDeviceName(`Pixel_6_API_31\rOK`)).toBe('Pixel_6_API_31');
  });
});

describe('bounded discovery integration', () => {
  jest.setTimeout(10_000);

  it('keeps startup diagnostics on stderr out of the device parser', async () => {
    await expect(
      getAttachedDevicesAsync({
        server: fixtureServer('adb-cold-start.js'),
        waitLimitMs: 1_000,
      })
    ).resolves.toEqual([
      expect.objectContaining({
        pid: 'USB-1',
        name: 'Pixel',
        transportId: '4',
      }),
    ]);
  });

  it('cleans up silent discovery before probing the selected host', async () => {
    const sockets = new Set<net.Socket>();
    const hostServer = net.createServer((socket) => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
      socket.end('OKAY00040029');
    });
    await new Promise<void>((resolve, reject) => {
      hostServer.once('error', reject);
      hostServer.listen(0, '127.0.0.1', resolve);
    });
    const address = hostServer.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP server address.');
    process.env.ADB_SERVER_SOCKET = `tcp:127.0.0.1:${address.port}`;

    try {
      await expect(
        getAttachedDevicesAsync({
          server: fixtureServer('adb-hang.js'),
          waitLimitMs: 100,
          probeWaitLimitMs: 500,
        })
      ).rejects.toThrow(/ADB server is responding, but device discovery did not finish/);
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) =>
        hostServer.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
});

function fixtureServer(name: string): ADBServer {
  return {
    runHostQueryAsync(
      args: string[],
      operation: string,
      signal?: AbortSignal,
      waitLimitMs?: number
    ) {
      jest.mocked(spawnAsync).mockImplementationOnce(jest.requireActual('@expo/spawn-async'));
      const result =
        waitLimitMs == null
          ? runAdbHostQueryAsync(process.execPath, [fixturePath(name), ...args], operation, signal)
          : runBoundedAdbHostQueryAsync(
              process.execPath,
              [fixturePath(name), ...args],
              operation,
              waitLimitMs,
              signal
            );
      return result.then((result) => result.stdout);
    },
  } as ADBServer;
}

function fixturePath(name: string): string {
  return path.join(__dirname, 'fixtures', name);
}
