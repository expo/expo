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

  it('contains valid SDK, Xcode, and Node version ranges', () => {
    for (const compatibility of sdkCompatibilityData.sdkVersions) {
      expect(semver.valid(compatibility.sdk)).not.toBeNull();
      expect(semver.validRange(compatibility.ios.xcodeVersionRange)).not.toBeNull();
      if ('nodeVersionRange' in compatibility) {
        expect(semver.validRange(compatibility.nodeVersionRange)).not.toBeNull();
      }
    }
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

  it('enforces both boundaries of the legacy SDK 51 range', () => {
    expect(isXcodeVersionSupported('51.0.0', '15.3')).toBe(false);
    expect(isXcodeVersionSupported('51.0.0', '15.4')).toBe(true);
    expect(isXcodeVersionSupported('51.0.0', '16.2')).toBe(true);
    expect(isXcodeVersionSupported('51.0.0', '16.3')).toBe(false);
  });

  it('returns null when it cannot evaluate compatibility', () => {
    expect(isXcodeVersionSupported('58.0.0', '26.4')).toBeNull();
    expect(isXcodeVersionSupported('57.0.0', 'unknown')).toBeNull();
  });
});
