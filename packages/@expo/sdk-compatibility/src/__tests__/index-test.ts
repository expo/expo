import semver from 'semver';

import {
  getSdkCompatibility,
  isXcodeVersionSupported,
  sdkCompatibilityData,
  validateSdkCompatibilityData,
} from '..';

describe('SDK compatibility data', () => {
  it('conforms to the package schema', () => {
    expect(validateSdkCompatibilityData(sdkCompatibilityData)).toEqual([]);
  });

  it('contains valid SDK versions, Xcode ranges, and Node minimum versions', () => {
    for (const compatibility of sdkCompatibilityData.sdkVersions) {
      expect(semver.valid(compatibility.sdk)).not.toBeNull();
      expect(semver.validRange(compatibility.ios.xcodeVersionRange)).not.toBeNull();
      if (compatibility.ios.xcodeVersionCheckRange) {
        expect(semver.validRange(compatibility.ios.xcodeVersionCheckRange)).not.toBeNull();
      }
      if (compatibility.node) {
        expect(semver.valid(compatibility.node.minimumVersion)).not.toBeNull();
      }
    }
  });

  it('models the SDK 57 Node value as a minimum rather than a patch-line range', () => {
    const minimumVersion = getSdkCompatibility('57.0.0')?.node?.minimumVersion;

    expect(minimumVersion).toBe('22.13.0');
    expect(semver.gte('22.14.0', minimumVersion!)).toBe(true);
    expect(semver.gte('24.3.0', minimumVersion!)).toBe(true);
    expect(semver.gte('22.12.0', minimumVersion!)).toBe(false);
  });
});

describe(getSdkCompatibility, () => {
  it('matches an SDK by major version', () => {
    expect(getSdkCompatibility('57.0.12')?.sdk).toBe('57.0.0');
    expect(getSdkCompatibility('v56.0.3')?.sdk).toBe('56.0.0');
  });

  it('returns null for unknown or invalid SDK versions', () => {
    expect(getSdkCompatibility('58.0.0')).toBeNull();
    expect(getSdkCompatibility('latest')).toBeNull();
  });
});

describe(isXcodeVersionSupported, () => {
  it('catches the unsupported environment reported in issue #48802', () => {
    expect(isXcodeVersionSupported('57.0.12', '26.3')).toBe(false);
    expect(isXcodeVersionSupported('57.0.12', '26.4')).toBe(true);
  });

  it('preserves the legacy SDK 51 upper-bound check', () => {
    expect(isXcodeVersionSupported('51.0.0', '15.3')).toBe(true);
    expect(isXcodeVersionSupported('51.0.0', '15.4')).toBe(true);
    expect(isXcodeVersionSupported('51.0.0', '16.2')).toBe(true);
    expect(isXcodeVersionSupported('51.0.0', '16.3')).toBe(false);
  });

  it('preserves the legacy SDK 55 lower-bound check', () => {
    expect(isXcodeVersionSupported('55.0.0', '25.4')).toBe(false);
    expect(isXcodeVersionSupported('55.0.0', '26.0')).toBe(true);
  });

  it('does not enforce documented ranges without a known incompatibility', () => {
    expect(isXcodeVersionSupported('52.0.0', '15.4')).toBeNull();
    expect(isXcodeVersionSupported('56.0.0', '26.3')).toBeNull();
  });

  it('returns null when it cannot evaluate compatibility', () => {
    expect(isXcodeVersionSupported('58.0.0', '26.4')).toBeNull();
    expect(isXcodeVersionSupported('57.0.0', 'unknown')).toBeNull();
  });
});
