import spawnAsync from '@expo/spawn-async';

import { listDevicesAsync } from '../xctrace';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const listDevicesFixture = `== Devices ==
Evan’s MacBook Pro (5665437B-E3BC-5508-9FC6-FA6798C4F90D)
Evan's phone (15.1) (00008101-001964A22629003A)

== Simulators ==
iPad (9th generation) Simulator (15.0) (6581D3B3-CF1C-4D3E-B04A-D77DAF38B109)
iPad mini (6th generation) Simulator (15.0) (194894B4-129F-4986-A7C5-720AB6157526)
iPhone 13 Simulator (15.0) (FEC3899E-5DC9-4A2C-8F17-E126E3FCD0F8)
iPhone SE (2nd generation) Simulator (15.0) (0288B8DC-5EC9-43EB-A8E9-A3E3AA43352E)`;

describe(listDevicesAsync, () => {
  it(`lists devices`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: listDevicesFixture,
    } as any);

    await expect(listDevicesAsync()).resolves.toEqual([
      {
        deviceType: 'catalyst',
        name: 'Evan’s MacBook Pro',
        osVersion: '??',
        udid: '5665437B-E3BC-5508-9FC6-FA6798C4F90D',
      },
      {
        deviceType: 'device',
        name: "Evan's phone",
        osVersion: '15.1',
        udid: '00008101-001964A22629003A',
      },
    ]);
  });
});
