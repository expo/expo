import { loadProjectEnv } from '@expo/env';

import { resolveRuntimeVersion } from '../resolveRuntimeVersion';
import { syncConfigurationToNative } from '../syncConfigurationToNative';
import { syncConfigurationToNativeAsync } from '../syncConfigurationToNativeAsync';

const mockResolveRuntimeVersionAsync = jest.fn();

jest.mock('@expo/env', () => ({
  ...jest.requireActual('@expo/env'),
  loadProjectEnv: jest.fn(),
}));
jest.mock('../syncConfigurationToNativeAsync');
jest.mock(
  '../../../utils/build/resolveRuntimeVersionAsync.js',
  () => ({ resolveRuntimeVersionAsync: mockResolveRuntimeVersionAsync }),
  { virtual: true }
);

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  mockResolveRuntimeVersionAsync.mockResolvedValue({
    runtimeVersion: '1',
    fingerprintSources: null,
    workflow: 'managed',
  });
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

it.each([
  { parentMode: undefined, mode: 'production' },
  { parentMode: 'development', mode: 'development' },
])('loads $mode env files before resolving the runtime version', async ({ parentMode, mode }) => {
  if (parentMode) {
    process.env.__EXPO_CONFIG_MODE = parentMode;
  }

  await resolveRuntimeVersion(['--platform', 'ios']);

  expect(loadProjectEnv).toHaveBeenCalledWith(expect.any(String), { mode });
  expect(jest.mocked(loadProjectEnv).mock.invocationCallOrder[0]).toBeLessThan(
    mockResolveRuntimeVersionAsync.mock.invocationCallOrder[0]!
  );
});

it('loads production env files before syncing native configuration', async () => {
  await syncConfigurationToNative(['--platform', 'android', '--workflow', 'generic']);

  expect(loadProjectEnv).toHaveBeenCalledWith(expect.any(String), { mode: 'production' });
  expect(jest.mocked(loadProjectEnv).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(syncConfigurationToNativeAsync).mock.invocationCallOrder[0]!
  );
});
