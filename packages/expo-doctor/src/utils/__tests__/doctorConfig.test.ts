import {
  getDirectoryCheckExcludes,
  getDirectoryCheckEnabled,
  getDirectoryCheckListUnknownPackagesEnabled,
} from '../doctorConfig';

describe('getDirectoryCheckExcludes', () => {
  it('returns an empty array if no config is present', () => {
    expect(getDirectoryCheckExcludes({})).toEqual([]);
  });

  it('returns an empty array if the config is empty', () => {
    expect(getDirectoryCheckExcludes({ expo: { doctor: {} } })).toEqual([]);
  });

  it('returns an empty array if the config has no excludes', () => {
    expect(getDirectoryCheckExcludes({ expo: { doctor: { directoryCheck: {} } } })).toEqual([]);
  });

  it('parses strings that begin and end with / as regexes', () => {
    expect(
      getDirectoryCheckExcludes({
        expo: { doctor: { directoryCheck: { exclude: ['/foo/', 'bar'] } } },
      })
    ).toEqual([/foo/, 'bar']);
  });

  it('returns an array of strings', () => {
    expect(
      getDirectoryCheckExcludes({
        expo: { doctor: { directoryCheck: { exclude: ['foo', 'bar'] } } },
      })
    ).toEqual(['foo', 'bar']);
  });
});

describe('getDirectoryCheckEnabled', () => {
  it('returns false if the config is empty', () => {
    expect(getDirectoryCheckEnabled({ expo: { doctor: {} } })).toBe(false);
  });

  it('returns true if the config is enabled', () => {
    expect(
      getDirectoryCheckEnabled({ expo: { doctor: { directoryCheck: { enabled: true } } } })
    ).toBe(true);
  });

  it('reads from env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK', () => {
    process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK = '1';
    expect(getDirectoryCheckEnabled({ expo: { doctor: {} } })).toBe(true);
    delete process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;
  });

  it('gives precedence to env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and warns', () => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK = '0';
    expect(
      getDirectoryCheckEnabled({ expo: { doctor: { directoryCheck: { enabled: true } } } })
    ).toBe(false);
    delete process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;

    expect(console.warn).toHaveBeenCalledWith(
      'Both EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and config.directoryCheck.enabled are set. Using EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK.'
    );

    console.warn = originalConsoleWarn;
  });
});

describe('getDirectoryCheckListUnknownPackagesEnabled', () => {
  it('returns true if the config is empty', () => {
    expect(getDirectoryCheckListUnknownPackagesEnabled({ expo: { doctor: {} } })).toBe(true);
  });

  it('returns true if the config is enabled', () => {
    expect(
      getDirectoryCheckListUnknownPackagesEnabled({
        expo: { doctor: { directoryCheck: { listUnknownPackages: true } } },
      })
    ).toBe(true);
  });

  it('returns false if the config is disabled', () => {
    expect(
      getDirectoryCheckListUnknownPackagesEnabled({
        expo: { doctor: { directoryCheck: { listUnknownPackages: false } } },
      })
    ).toBe(false);
  });
});
