import {
  getReactNativeDirectoryCheckExcludes,
  getReactNativeDirectoryCheckEnabled,
  getReactNativeDirectoryCheckListUnknownPackagesEnabled,
  isCheckEnabled,
  getDisabledChecks,
  getDoctorConfig,
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
      true
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

describe('doctorConfig', () => {
  const mockPackageJson = {
    expo: {
      doctor: {
        checks: {
          ExpoConfigCommonIssueCheck: { enabled: false },
          StoreCompatibilityCheck: { enabled: false },
          ProjectSetupCheck: { enabled: true },
        },
      },
    },
  };

  describe('getDoctorConfig', () => {
    it('returns the doctor config from package.json', () => {
      const config = getDoctorConfig(mockPackageJson);
      expect(config).toEqual(mockPackageJson.expo.doctor);
    });

    it('returns an empty object if no doctor config is present', () => {
      const config = getDoctorConfig({});
      expect(config).toEqual({});
    });
  });

  describe('isCheckEnabled', () => {
    it('returns false for disabled checks', () => {
      expect(isCheckEnabled(mockPackageJson, 'ExpoConfigCommonIssueCheck')).toBe(false);
      expect(isCheckEnabled(mockPackageJson, 'StoreCompatibilityCheck')).toBe(false);
    });

    it('returns true for enabled checks', () => {
      expect(isCheckEnabled(mockPackageJson, 'ProjectSetupCheck')).toBe(true);
    });

    it('returns true for checks not specified in the config', () => {
      expect(isCheckEnabled(mockPackageJson, 'UnspecifiedCheck')).toBe(true);
    });
  });

  describe('getDisabledChecks', () => {
    it('returns an array of disabled check names', () => {
      const disabledChecks = getDisabledChecks(mockPackageJson);
      expect(disabledChecks).toEqual(['ExpoConfigCommonIssueCheck', 'StoreCompatibilityCheck']);
    });

    it('returns an empty array if no checks are disabled', () => {
      const packageJsonWithNoDisabledChecks = {
        expo: {
          doctor: {
            checks: {
              SomeCheck: { enabled: true },
              AnotherCheck: { enabled: true },
            },
          },
        },
      };
      const disabledChecks = getDisabledChecks(packageJsonWithNoDisabledChecks);
      expect(disabledChecks).toEqual([]);
    });

    it('returns an empty array if no checks are specified', () => {
      const packageJsonWithNoChecks = {
        expo: {
          doctor: {},
        },
      };
      const disabledChecks = getDisabledChecks(packageJsonWithNoChecks);
      expect(disabledChecks).toEqual([]);
    });
  });
});
