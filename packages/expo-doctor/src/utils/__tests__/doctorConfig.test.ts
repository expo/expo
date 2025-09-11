import {
  getReactNativeDirectoryCheckExcludes,
  getReactNativeDirectoryCheckEnabled,
  getReactNativeDirectoryCheckListUnknownPackagesEnabled,
  getAppConfigFieldsNotSyncedCheckStatus,
} from '../doctorConfig';

const exp = {
  name: 'App',
  slug: 'app',
  sdkVersion: '51.0.0',
};

describe('getReactNativeDirectoryCheckExcludes', () => {
  it('returns an empty array if no config is present', () => {
    expect(getReactNativeDirectoryCheckExcludes({})).toEqual([]);
  });

  it('returns an empty array if the config is empty', () => {
    expect(getReactNativeDirectoryCheckExcludes({ expo: { doctor: {} } })).toEqual([]);
  });

  it('returns an empty array if the config has no excludes', () => {
    expect(
      getReactNativeDirectoryCheckExcludes({ expo: { doctor: { reactNativeDirectoryCheck: {} } } })
    ).toEqual([]);
  });

  it('parses strings that begin and end with / as regexes', () => {
    expect(
      getReactNativeDirectoryCheckExcludes({
        expo: { doctor: { reactNativeDirectoryCheck: { exclude: ['/foo/', 'bar'] } } },
      })
    ).toEqual([/foo/, 'bar']);
  });

  it('returns an array of strings', () => {
    expect(
      getReactNativeDirectoryCheckExcludes({
        expo: { doctor: { reactNativeDirectoryCheck: { exclude: ['foo', 'bar'] } } },
      })
    ).toEqual(['foo', 'bar']);
  });
});

describe('getReactNativeDirectoryCheckEnabled', () => {
  it('returns false if the config is empty', () => {
    expect(getReactNativeDirectoryCheckEnabled(exp, { expo: { doctor: {} } })).toBe(false);
  });

  it('returns true if the config is enabled', () => {
    expect(
      getReactNativeDirectoryCheckEnabled(exp, {
        expo: { doctor: { reactNativeDirectoryCheck: { enabled: true } } },
      })
    ).toBe(true);
  });

  it('reads from env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK', () => {
    process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK = '1';
    expect(getReactNativeDirectoryCheckEnabled(exp, { expo: { doctor: {} } })).toBe(true);
    delete process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;
  });

  it('gives precedence to env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and warns', () => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK = '0';
    expect(
      getReactNativeDirectoryCheckEnabled(exp, {
        expo: { doctor: { reactNativeDirectoryCheck: { enabled: true } } },
      })
    ).toBe(false);
    delete process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;

    expect(console.warn).toHaveBeenCalledWith(
      'Both EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and config.reactNativeDirectoryCheck.enabled are set. Using EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK.'
    );

    console.warn = originalConsoleWarn;
  });

  it('defaults to disabled if sdk version is < 52.0.0', () => {
    expect(
      getReactNativeDirectoryCheckEnabled(
        {
          ...exp,
          sdkVersion: '51.0.0',
        },
        { expo: { doctor: {} } }
      )
    ).toBe(false);
  });

  it('defaults to enabled if sdk version is >= 52.0.0', () => {
    expect(
      getReactNativeDirectoryCheckEnabled(
        {
          ...exp,
          sdkVersion: '52.0.0',
        },
        { expo: { doctor: {} } }
      )
    ).toBe(true);

    expect(
      getReactNativeDirectoryCheckEnabled(
        {
          ...exp,
          sdkVersion: 'UNVERSIONED',
        },
        { expo: { doctor: {} } }
      )
    ).toBe(true);
  });
});

describe('getReactNativeDirectoryCheckListUnknownPackagesEnabled', () => {
  it('returns true if the config is empty', () => {
    expect(getReactNativeDirectoryCheckListUnknownPackagesEnabled({ expo: { doctor: {} } })).toBe(
      null
    );
  });

  it('returns true if the config is enabled', () => {
    expect(
      getReactNativeDirectoryCheckListUnknownPackagesEnabled({
        expo: { doctor: { reactNativeDirectoryCheck: { listUnknownPackages: true } } },
      })
    ).toBe(true);
  });

  it('returns false if the config is disabled', () => {
    expect(
      getReactNativeDirectoryCheckListUnknownPackagesEnabled({
        expo: { doctor: { reactNativeDirectoryCheck: { listUnknownPackages: false } } },
      })
    ).toBe(false);
  });
});

describe('appConfigFieldsNotSyncedCheck', () => {
  const mockPackageJson = {
    expo: {
      doctor: {
        appConfigFieldsNotSyncedCheck: {
          enabled: false,
        },
      },
    },
  };

  it('returns true if appConfigFieldsNotSyncedCheckEnabled is not set', () => {
    expect(getAppConfigFieldsNotSyncedCheckStatus({ ...mockPackageJson, expo: {} })).toBe(true);
  });

  it('returns false if appConfigFieldsNotSyncedCheckEnabled is set to false', () => {
    expect(getAppConfigFieldsNotSyncedCheckStatus(mockPackageJson)).toBe(false);
  });

  it('returns true if appConfigFieldsNotSyncedCheckEnabled is set to true', () => {
    expect(
      getAppConfigFieldsNotSyncedCheckStatus({
        ...mockPackageJson,
        expo: { doctor: { appConfigFieldsNotSyncedCheck: { enabled: true } } },
      })
    ).toBe(true);
  });
});
