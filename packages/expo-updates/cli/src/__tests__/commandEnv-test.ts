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

describe('direct command modes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.__EXPO_CONFIG_MODE;
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

  it('uses development mode for code signing', async () => {
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
      mode: 'development',
    });
  });

  it('uses production mode for runtime version resolution', async () => {
    await resolveRuntimeVersion(['--platform', 'ios']);

    expect(mockResolveRuntimeVersionAsync).toHaveBeenCalledWith(
      expect.any(String),
      'ios',
      { debug: undefined, silent: true },
      { mode: 'production', workflowOverride: undefined }
    );
  });

  it('uses production mode for native configuration sync', async () => {
    await syncConfigurationToNative(['--platform', 'android', '--workflow', 'generic']);

    expect(syncConfigurationToNativeAsync).toHaveBeenCalledWith({
      projectRoot: expect.any(String),
      platform: 'android',
      workflow: 'generic',
      mode: 'production',
    });
  });
});
