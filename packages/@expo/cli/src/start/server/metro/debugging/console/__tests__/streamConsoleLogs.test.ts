import type { ConnectedDevice } from '../ConsoleTargetWatcher';
import { watchConsoleTargets } from '../ConsoleTargetWatcher';
import { streamConsoleLogs } from '../streamConsoleLogs';
import type { ConsoleTarget } from '../types';

jest.mock('../ConsoleTargetWatcher');
jest.useFakeTimers();

const devices = new Map<string, ConnectedDevice>();
const targets = new Map<string, ConsoleTarget>();
const reporter = {
  logDeviceConsole: jest.fn(),
  update: jest.fn(),
};
let notifyChange: () => void;

function connectDevice() {
  devices.set('device', { name: 'iPhone', connectedAt: Date.now() });
  notifyChange();
}

function openSession() {
  targets.set('device-1', { logicalDeviceId: 'device' } as ConsoleTarget);
  notifyChange();
}

beforeEach(() => {
  devices.clear();
  targets.clear();
  jest.clearAllMocks();
  jest.mocked(watchConsoleTargets).mockImplementation(({ onChange }) => {
    notifyChange = onChange!;
    return { devices, targets, close() {} };
  });
  streamConsoleLogs({
    serverBaseUrl: 'http://127.0.0.1:8081',
    deviceSocketServer: {} as any,
    reporter,
    sessionGraceMs: 3000,
  });
});

test('warns once when a connected device has no session in time', () => {
  connectDevice();
  jest.advanceTimersByTime(3000);

  expect(reporter.update).toHaveBeenCalledTimes(1);
  expect(reporter.update.mock.calls[0][0].data[0]).toContain(
    'No CDP console session opened with iPhone within 3 seconds'
  );
});

test('prints no warning for a device whose session opens in time', () => {
  connectDevice();
  openSession();
  jest.advanceTimersByTime(3000);

  expect(reporter.update).not.toHaveBeenCalled();
});

test('prints no warning for a device that disconnects before its session is due', () => {
  connectDevice();
  devices.clear();
  notifyChange();
  jest.advanceTimersByTime(3000);

  expect(reporter.update).not.toHaveBeenCalled();
});
