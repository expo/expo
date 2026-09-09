const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const mockCreateProjectHashAsync = jest.fn();

function loadModule({ fingerprintResolvable = true, fingerprintVersionResolvable = true } = {}) {
  jest.resetModules();
  jest.doMock('expo/fingerprint', () => ({
    createProjectHashAsync: mockCreateProjectHashAsync,
  }));
  // Registered in both directions: `doMock` outlives `resetModules`, so omitting it here would
  // leak the null resolver into every later case.
  jest.doMock('@expo/require-utils', () => {
    const actual = jest.requireActual('@expo/require-utils').resolveFrom;
    return {
      resolveFrom: (from, moduleId, params) => {
        if (!fingerprintResolvable) {
          return null;
        }
        if (!fingerprintVersionResolvable && moduleId.endsWith('package.json')) {
          return null;
        }
        return actual(from, moduleId, params);
      },
    };
  });
  return require('../createFingerprintFile');
}

describe(`createFingerprintFileAsync`, () => {
  // The script resolves `expo/fingerprint` from the project root, so this must be a real one.
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
      // The hash travels with the version that produced it; a reader needs both to compare safely.
      expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({
        hash: 'fakehash123',
        fingerprintVersion: expect.stringMatching(/^\d+\.\d+\.\d+/),
      });
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

  // The version is metadata: a project whose package.json cannot be read still gets a usable hash,
  // and the reader treats the missing version as "cannot compare" rather than as a match.
  it(`writes a null version when @expo/fingerprint's package.json cannot be resolved`, async () => {
    mockCreateProjectHashAsync.mockResolvedValue('fakehash123');
    const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = loadModule({
      fingerprintVersionResolvable: false,
    });

    await createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true);

    const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
    expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({
      hash: 'fakehash123',
      fingerprintVersion: null,
    });
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
