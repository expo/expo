import { isAdbDeviceStateUsable, parseAdbDeviceList } from '../adbDeviceList';

describe(parseAdbDeviceList, () => {
  it.each([
    ['tabs', 'emulator-5554\tdevice product:sdk model:Pixel transport_id:1'],
    ['runs of whitespace', 'emulator-5554          offline transport_id:1'],
    ['CRLF', 'emulator-5554\tdevice transport_id:1\r\n'],
  ])('parses records separated with %s', (_, record) => {
    expect(parseAdbDeviceList(`List of devices attached\r\n${record}`)).toEqual([
      expect.objectContaining({
        serial: 'emulator-5554',
        transportId: '1',
      }),
    ]);
  });

  it('parses USB and network device metadata', () => {
    expect(
      parseAdbDeviceList(
        [
          'List of devices attached',
          'FA8251A00720 device usb:338690048X product:walleye model:Pixel_2 transport_id:4',
          '192.0.2.1:5555 device product:cheetah model:Pixel_7 transport_id:7',
        ].join('\n')
      )
    ).toEqual([
      {
        serial: 'FA8251A00720',
        state: 'device',
        metadata: ['usb:338690048X', 'product:walleye', 'model:Pixel_2', 'transport_id:4'],
        transportId: '4',
      },
      {
        serial: '192.0.2.1:5555',
        state: 'device',
        metadata: ['product:cheetah', 'model:Pixel_7', 'transport_id:7'],
        transportId: '7',
      },
    ]);
  });

  it.each(['offline', 'unauthorized', 'authorizing', 'connecting'])(
    'retains the transitional state %s',
    (state) => {
      expect(parseAdbDeviceList(`List of devices attached\nserial-1 ${state}`)).toEqual([
        { serial: 'serial-1', state, metadata: [] },
      ]);
    }
  );

  it('retains multi-word no permissions diagnostics', () => {
    expect(
      parseAdbDeviceList(
        'List of devices attached\nserial-1 no permissions (user is in the plugdev group); see [http://developer.android.com/tools/device.html]'
      )
    ).toEqual([
      {
        serial: 'serial-1',
        state: 'no permissions',
        metadata: [
          '(user',
          'is',
          'in',
          'the',
          'plugdev',
          'group);',
          'see',
          '[http://developer.android.com/tools/device.html]',
        ],
      },
    ]);
  });

  it('ignores ADB trace lines written alongside the device list', () => {
    expect(
      parseAdbDeviceList(
        [
          'List of devices attached',
          'adb D adb_client.cpp:393] adb_query: host:devices-l',
          'emulator-5554 device transport_id:1',
        ].join('\n')
      )
    ).toEqual([
      {
        serial: 'emulator-5554',
        state: 'device',
        metadata: ['transport_id:1'],
        transportId: '1',
      },
    ]);
  });
});

describe('ADB device state predicates', () => {
  it('recognizes only the states Expo acts on without losing unknown values', () => {
    expect(isAdbDeviceStateUsable('device')).toBe(true);
    expect(isAdbDeviceStateUsable('authorizing')).toBe(false);
    expect(isAdbDeviceStateUsable('future-adb-state')).toBe(false);
  });
});
