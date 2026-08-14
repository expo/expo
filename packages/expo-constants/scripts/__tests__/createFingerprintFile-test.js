const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const mockCreateProjectHashAsync = jest.fn();

function loadModule({ fingerprintResolvable = true } = {}) {
  jest.resetModules();
  if (fingerprintResolvable) {
    jest.doMock('expo/fingerprint', () => ({
      createProjectHashAsync: mockCreateProjectHashAsync,
    }));
  } else {
    jest.doMock('expo/fingerprint', () => {
      throw new Error("Cannot find module 'expo/fingerprint'");
    });
  }
  return require('../createFingerprintFile');
}

describe(`createFingerprintFileAsync`, () => {
  // The script resolves `expo/fingerprint` from the project root (the same anchor as the check
  // side in `@expo/cli`), so the root must be a real directory that can resolve the module.
  const projectRoot = path.join(__dirname, '..', '..');
  let destinationDir;

  beforeEach(() => {
    mockCreateProjectHashAsync.mockReset();
    destinationDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-constants-test-'));
    delete process.env.EXPO_SKIP_FINGERPRINT_EMBED;
  });

  afterEach(() => {
    fs.rmSync(destinationDir, { recursive: true, force: true });
    delete process.env.EXPO_SKIP_FINGERPRINT_EMBED;
  });

  it.each(['ios', 'android'])(
    `writes app.fingerprint with the %s project hash`,
    async (platform) => {
      mockCreateProjectHashAsync.mockResolvedValue('fakehash123');
      const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = loadModule();

      const result = await createFingerprintFileAsync(projectRoot, destinationDir, platform, true);

      expect(mockCreateProjectHashAsync).toHaveBeenCalledWith(projectRoot, {
        platforms: [platform],
        silent: true,
      });
      const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
      expect(result).toBe(filePath);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('fakehash123');
    }
  );

  it.each([
    [
      'EXPO_SKIP_FINGERPRINT_EMBED is set',
      () => {
        process.env.EXPO_SKIP_FINGERPRINT_EMBED = '1';
        return { module: loadModule(), platform: 'ios', enabled: true };
      },
    ],
    [
      'the build script disables embedding (non-debug build)',
      () => ({ module: loadModule(), platform: 'ios', enabled: false }),
    ],
    ['the platform is unknown', () => ({ module: loadModule(), platform: 'web', enabled: true })],
    [
      'expo/fingerprint is not installed',
      () => ({
        module: loadModule({ fingerprintResolvable: false }),
        platform: 'ios',
        enabled: true,
      }),
    ],
  ])(`skips and removes a stale fingerprint when %s`, async (_description, setup) => {
    const { module, platform, enabled } = setup();
    const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = module;
    const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
    fs.writeFileSync(filePath, 'stale-hash');

    const result = await createFingerprintFileAsync(projectRoot, destinationDir, platform, enabled);

    expect(result).toBeNull();
    expect(mockCreateProjectHashAsync).not.toHaveBeenCalled();
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it(`still embeds when EXPO_SKIP_FINGERPRINT_EMBED=0 — "0" must not enable the skip`, async () => {
    process.env.EXPO_SKIP_FINGERPRINT_EMBED = '0';
    mockCreateProjectHashAsync.mockResolvedValue('somehash');
    const { createFingerprintFileAsync } = loadModule();

    const result = await createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true);

    expect(result).not.toBeNull();
    expect(mockCreateProjectHashAsync).toHaveBeenCalled();
  });

  it(`rejects when fingerprint computation fails`, async () => {
    mockCreateProjectHashAsync.mockRejectedValue(new Error('boom'));
    const { createFingerprintFileAsync } = loadModule();

    await expect(
      createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true)
    ).rejects.toThrow('boom');
  });
});
