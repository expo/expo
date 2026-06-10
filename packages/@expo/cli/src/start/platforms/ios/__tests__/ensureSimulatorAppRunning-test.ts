import { spawnAsync as spawnAppleScriptAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../../log';
import { ensureSimulatorAppRunningAsync } from '../ensureSimulatorAppRunning';

jest.mock(`../../../../log`);
jest.mock('@expo/osascript');

it('should do nothing when the Simulator.app is running', async () => {
  jest.mocked(spawnAppleScriptAsync).mockResolvedValueOnce({ stdout: '1\n' } as any);

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(spawnAsync).not.toHaveBeenCalled();
  expect(Log.log).not.toHaveBeenCalled();
});

it('should activate the window when Simulator.app is not running', async () => {
  jest.mocked(spawnAppleScriptAsync).mockResolvedValueOnce({ stdout: '0\n' } as any).mockResolvedValueOnce({ stdout: '1\n' } as any);

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening the iOS simulator/));
  expect(spawnAsync).toHaveBeenCalledWith('open', [
    '-a',
    'Simulator',
    '--args',
    '-CurrentDeviceUDID',
    '123',
  ]);
});

it('should throw a timeout warning when Simulator.app takes too long to start', async () => {
  jest.mocked(spawnAppleScriptAsync).mockRejectedValue(new Error('Application isn’t running'));

  await expect(
    ensureSimulatorAppRunningAsync({ udid: '123' }, { maxWaitTime: 100 })
  ).rejects.toThrow(/Simulator app did not open fast enough/);

  // initial call (1) + interval / timeout (2)
  expect(jest.mocked(spawnAppleScriptAsync).mock.calls.length).toBeGreaterThanOrEqual(3);
  expect(spawnAsync).toHaveBeenCalledTimes(1);
});
