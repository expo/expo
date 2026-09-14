const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const mockCreateFingerprintAsync = jest.fn();

/** Shape of what `createFingerprintAsync` returns, trimmed to two entries. */
const SOURCES = [
  { type: 'file', filePath: 'app.json', reasons: ['expoConfig'], hash: 'aaa' },
  { type: 'dir', filePath: 'android', reasons: ['bareNativeDir'], hash: 'bbb' },
];

function loadModule({ fingerprintResolvable = true, fingerprintVersionResolvable = true } = {}) {
  jest.resetModules();
  jest.doMock('expo/fingerprint', () => ({
    createFingerprintAsync: mockCreateFingerprintAsync,
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
    mockCreateFingerprintAsync.mockReset();
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
      mockCreateFingerprintAsync.mockResolvedValue({
        hash: 'fakehash123',
        sources: SOURCES,
      });
      const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = loadModule();

      const result = await createFingerprintFileAsync(projectRoot, destinationDir, platform, true);

      expect(mockCreateFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
        platforms: [platform],
        silent: true,
      });
      const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
      expect(result).toBe(filePath);
      expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({
        hash: 'fakehash123',
        sources: SOURCES,
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
    expect(mockCreateFingerprintAsync).not.toHaveBeenCalled();
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it(`writes a null version when @expo/fingerprint's package.json cannot be resolved`, async () => {
    mockCreateFingerprintAsync.mockResolvedValue({
      hash: 'fakehash123',
      sources: SOURCES,
    });
    const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = loadModule({
      fingerprintVersionResolvable: false,
    });

    await createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true);

    const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
    expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({
      hash: 'fakehash123',
      sources: SOURCES,
      fingerprintVersion: null,
    });
  });

  it(`still embeds when EXPO_SKIP_FINGERPRINT_EMBED=0 — "0" must not enable the skip`, async () => {
    process.env.EXPO_SKIP_FINGERPRINT_EMBED = '0';
    mockCreateFingerprintAsync.mockResolvedValue({
      hash: 'somehash',
      sources: SOURCES,
    });
    const { createFingerprintFileAsync } = loadModule();

    const result = await createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true);

    expect(result).not.toBeNull();
    expect(mockCreateFingerprintAsync).toHaveBeenCalled();
  });

  // The fingerprint is optional metadata, so the function owns that policy: every caller would
  // otherwise have to remember to catch, and one that forgot would fail the build over it.
  it(`warns instead of rejecting when fingerprint computation fails`, async () => {
    mockCreateFingerprintAsync.mockRejectedValue(new Error('boom'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { createFingerprintFileAsync, FINGERPRINT_FILE_NAME } = loadModule();

    await expect(
      createFingerprintFileAsync(projectRoot, destinationDir, 'ios', true)
    ).resolves.toBeNull();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(fs.existsSync(path.join(destinationDir, FINGERPRINT_FILE_NAME))).toBe(false);
    warn.mockRestore();
  });
});
