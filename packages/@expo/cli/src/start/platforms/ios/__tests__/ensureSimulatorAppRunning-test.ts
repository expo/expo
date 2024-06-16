import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../../log';
import { ensureSimulatorAppRunningAsync } from '../ensureSimulatorAppRunning';

jest.mock(`../../../../log`);

it('should do nothing when the Simulator.app is running', async () => {
  jest.mocked(execAsync).mockResolvedValueOnce('1');

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(spawnAsync).not.toBeCalled();
  expect(Log.log).not.toBeCalled();
});

it('should activate the window when Simulator.app is not running', async () => {
  jest.mocked(execAsync).mockResolvedValueOnce('0').mockResolvedValueOnce('1');

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(Log.log).toBeCalledWith(expect.stringMatching(/Opening the iOS simulator/));
  expect(spawnAsync).toBeCalledWith('open', [
    '-a',
    'Simulator',
    '--args',
    '-CurrentDeviceUDID',
    '123',
  ]);
});

it('should throw a timeout warning when Simulator.app takes too long to start', async () => {
  jest.mocked(execAsync).mockRejectedValue(new Error('Application isn’t running'));

  await expect(
    ensureSimulatorAppRunningAsync({ udid: '123' }, { maxWaitTime: 100 })
  ).rejects.toThrow(/Simulator app did not open fast enough/);

  // initial call (1) + interval / timeout (2)
  expect(jest.mocked(execAsync).mock.calls.length).toBeGreaterThanOrEqual(3);
  expect(spawnAsync).toBeCalledTimes(1);
});
