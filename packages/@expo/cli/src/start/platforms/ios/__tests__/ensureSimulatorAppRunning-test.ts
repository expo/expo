import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../../log';
import { ensureSimulatorAppRunningAsync } from '../ensureSimulatorAppRunning';

jest.mock(`../../../../log`);

const PGREP_ARGS = ['-x', 'Simulator|DeviceHub'];

function notRunning() {
  return Object.assign(new Error('pgrep exited with non-zero code: 1'), { status: 1 });
}

/** Mock `pgrep` as "not running" for the first `misses` probes, then "running"; `open` always succeeds. */
function mockProbes(misses: number, openImplementation?: () => Promise<any>) {
  let probes = 0;
  jest.mocked(spawnAsync).mockImplementation((async (command: string) => {
    if (command === 'pgrep') {
      probes += 1;
      if (probes <= misses) {
        throw notRunning();
      }
      return { stdout: '422\n' };
    }
    return openImplementation ? openImplementation() : {};
  }) as any);
}

function openCalls() {
  return jest.mocked(spawnAsync).mock.calls.filter(([command]) => command === 'open');
}

it('should do nothing when the Simulator.app is running', async () => {
  mockProbes(0);

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(spawnAsync).toHaveBeenCalledWith('pgrep', PGREP_ARGS);
  expect(openCalls()).toEqual([]);
  expect(Log.log).not.toHaveBeenCalled();
});

it('should activate the window when Simulator.app is not running', async () => {
  mockProbes(1);

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(Log.log).toHaveBeenCalledWith(expect.stringMatching(/Opening the iOS simulator/));
  expect(openCalls()).toEqual([
    ['open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', '123']],
  ]);
});

it('should open DeviceHub focused on the device via deep link when Simulator.app is unavailable', async () => {
  // Xcode 27+ ships DeviceHub instead of Simulator.app, so `open -a Simulator` fails.
  let opens = 0;
  mockProbes(1, async () => {
    opens += 1;
    if (opens === 1) {
      throw new Error("Unable to find application named 'Simulator'");
    }
    return {};
  });

  await ensureSimulatorAppRunningAsync({ udid: '123' });

  expect(openCalls()).toEqual([
    ['open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', '123']],
    ['open', ['devices://device/open?id=123']],
  ]);
});

it('should fall back to opening DeviceHub without a device when no udid is provided', async () => {
  let opens = 0;
  mockProbes(1, async () => {
    opens += 1;
    if (opens === 1) {
      throw new Error("Unable to find application named 'Simulator'");
    }
    return {};
  });

  await ensureSimulatorAppRunningAsync({});

  expect(openCalls()).toEqual([
    ['open', ['-a', 'Simulator']],
    ['open', ['-a', 'DeviceHub']],
  ]);
});

it('should throw a timeout warning when Simulator.app takes too long to start', async () => {
  mockProbes(Number.POSITIVE_INFINITY);

  await expect(
    ensureSimulatorAppRunningAsync({ udid: '123' }, { maxWaitTime: 100 })
  ).rejects.toThrow(/Simulator app did not open fast enough/);

  // initial probe (1) + interval / timeout (2)
  const probes = jest.mocked(spawnAsync).mock.calls.filter(([command]) => command === 'pgrep');
  expect(probes.length).toBeGreaterThanOrEqual(3);
  expect(openCalls()).toHaveLength(1);
});

it('should rethrow a pgrep failure that is not "no match"', async () => {
  jest
    .mocked(spawnAsync)
    .mockRejectedValueOnce(Object.assign(new Error('spawn pgrep ENOENT'), { status: null }));

  await expect(ensureSimulatorAppRunningAsync({ udid: '123' })).rejects.toThrow(/ENOENT/);
});
