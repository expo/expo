import { configureCodeSigning } from '../configureCodeSigning';
import { resolveRuntimeVersion } from '../resolveRuntimeVersion';
import { syncConfigurationToNative } from '../syncConfigurationToNative';
import { syncConfigurationToNativeAsync } from '../syncConfigurationToNativeAsync';

const mockConfigureCodeSigningAsync = jest.fn();
const mockResolveRuntimeVersionAsync = jest.fn();

jest.mock(
  '../configureCodeSigningAsync.js',
  () => ({ configureCodeSigningAsync: mockConfigureCodeSigningAsync }),
  { virtual: true }
);
jest.mock('../syncConfigurationToNativeAsync');
jest.mock(
  '../../../utils/build/resolveRuntimeVersionAsync.js',
  () => ({ resolveRuntimeVersionAsync: mockResolveRuntimeVersionAsync }),
  { virtual: true }
);

describe.each([
  { parentMode: undefined, expectedMode: 'production' },
  { parentMode: 'development', expectedMode: 'development' },
])('command modes with parent mode $parentMode', ({ parentMode, expectedMode }) => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.__EXPO_CONFIG_MODE;
    if (parentMode) {
      process.env.__EXPO_CONFIG_MODE = parentMode;
    }
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

  it('passes the mode to code signing', async () => {
    await configureCodeSigning([
      '--certificate-input-directory',
      'certificates',
      '--key-input-directory',
      'keys',
    ]);

    expect(mockConfigureCodeSigningAsync).toHaveBeenCalledWith(expect.any(String), {
      certificateInput: 'certificates',
      keyInput: 'keys',
      keyid: undefined,
      mode: expectedMode,
    });
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('passes the mode to runtime version resolution', async () => {
    await resolveRuntimeVersion(['--platform', 'ios']);

    expect(mockResolveRuntimeVersionAsync).toHaveBeenCalledWith(
      expect.any(String),
      'ios',
      { debug: undefined, silent: true },
      { mode: expectedMode, workflowOverride: undefined }
    );
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });

  it('passes the mode to native configuration sync', async () => {
    await syncConfigurationToNative(['--platform', 'android', '--workflow', 'generic']);

    expect(syncConfigurationToNativeAsync).toHaveBeenCalledWith({
      projectRoot: expect.any(String),
      platform: 'android',
      workflow: 'generic',
      mode: expectedMode,
    });
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });
});
