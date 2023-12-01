import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { getBestUnbootedSimulatorAsync } from '../getBestSimulator';

beforeEach(() => {
  jest.mocked(spawnAsync).mockResolvedValueOnce({
    stdout: JSON.stringify(require('./fixtures/xcrun-simctl-list-devices.json')),
  } as any);
});

describe(getBestUnbootedSimulatorAsync, () => {
  it(`returns the default simulator`, async () => {
    jest.mocked(execSync).mockReturnValueOnce(`foobar`);
    await expect(getBestUnbootedSimulatorAsync()).resolves.toBe('foobar');
  });

  it(`returns the first simulator when osType is provided and doesn't match default`, async () => {
    jest.mocked(execSync).mockReturnValueOnce(`foobar`);
    await expect(getBestUnbootedSimulatorAsync({ osType: 'watchOS' })).resolves.toBe(
      // This is a watch.
      'BE99E61A-37C2-4DE2-91DB-D5508C8FD1C8'
    );
  });

  it(`returns the default simulator when osType is provided`, async () => {
    const defaultUdid = `E3F2EAAD-5A58-4003-A029-5C642E00C9F4`;
    jest.mocked(execSync).mockReturnValueOnce(defaultUdid);
    await expect(getBestUnbootedSimulatorAsync({ osType: 'iOS' })).resolves.toBe(defaultUdid);
  });

  it(`returns the first simulator when no preferences are available`, async () => {
    jest.mocked(execSync).mockReturnValueOnce('');
    await expect(getBestUnbootedSimulatorAsync()).resolves.toBe(
      // First udid.
      `0288B8DC-5EC9-43EB-A8E9-A3E3AA43352E`
    );
  });
});
