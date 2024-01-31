// activateWindowAsync
import { execAsync } from '@expo/osascript';
import { execFileSync } from 'child_process';

import { activateWindowAsync } from '../activateWindow';

const platform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', {
    value,
  });
}

afterEach(() => {
  mockPlatform(platform);
});

it(`skips on windows`, async () => {
  mockPlatform('win32');
  await activateWindowAsync({ type: 'emulator', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(0);
});

it(`skips for devices`, async () => {
  mockPlatform('darwin');
  await activateWindowAsync({ type: 'device', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(0);
});

it(`brings window to the front`, async () => {
  mockPlatform('darwin');
  jest.mocked(execFileSync).mockReturnValueOnce('36420' as any);
  await activateWindowAsync({ type: 'emulator', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledWith(expect.stringMatching(/36420/));
});

it(`skips if the pid cannot be found`, async () => {
  mockPlatform('darwin');
  jest.mocked(execFileSync).mockReturnValueOnce('' as any);
  await activateWindowAsync({ type: 'emulator', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledTimes(0);
});
