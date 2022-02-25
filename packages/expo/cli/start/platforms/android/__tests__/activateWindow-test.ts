// activateWindowAsync
import { execAsync } from '@expo/osascript';
import { execFileSync } from 'child_process';

import { activateWindowAsync } from '../activateWindow';

jest.mock('child_process');
jest.mock('@expo/osascript');
const platform = process.platform;

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', {
    value,
  });
}
afterEach(() => {
  mockPlatform(platform);
});

beforeEach(() => {
  asMock(execFileSync).mockClear();
  asMock(execAsync).mockClear();
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
  asMock(execFileSync).mockReturnValueOnce('36420' as any);
  await activateWindowAsync({ type: 'emulator', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledWith(expect.stringMatching(/36420/));
});

it(`skips if the pid cannot be found`, async () => {
  mockPlatform('darwin');
  asMock(execFileSync).mockReturnValueOnce('' as any);
  await activateWindowAsync({ type: 'emulator', pid: 'emulator-5554' });
  expect(execFileSync).toBeCalledTimes(1);
  expect(execAsync).toBeCalledTimes(0);
});
