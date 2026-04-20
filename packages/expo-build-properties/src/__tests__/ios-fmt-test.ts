jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withDangerousMod: jest.fn().mockImplementation((config) => config),
  };
});

import { addFmtConstevalFix } from '../ios';

const PODFILE_WITH_POST_INSTALL = `\
platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'

# ... other pods ...

post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false,
  )
end
`;

const PODFILE_WITHOUT_POST_INSTALL = `\
platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'

# no post_install block
`;

describe(addFmtConstevalFix, () => {
  it('injects FMT_USE_CONSTEVAL=0 flag inside post_install block', () => {
    const result = addFmtConstevalFix(PODFILE_WITH_POST_INSTALL);
    expect(result).toContain('FMT_USE_CONSTEVAL=0');
    expect(result).toContain("t.name == 'fmt'");
    expect(result).toContain('OTHER_CPLUSPLUSFLAGS');
  });

  it('places the fix inside the post_install block (before closing end)', () => {
    const result = addFmtConstevalFix(PODFILE_WITH_POST_INSTALL);
    const postInstallIdx = result.indexOf('post_install do |installer|');
    const fmtFixIdx = result.indexOf('FMT_USE_CONSTEVAL=0');
    const closingEndIdx = result.lastIndexOf('\nend\n');
    expect(fmtFixIdx).toBeGreaterThan(postInstallIdx);
    expect(fmtFixIdx).toBeLessThan(closingEndIdx);
  });

  it('is idempotent — does not inject twice', () => {
    const once = addFmtConstevalFix(PODFILE_WITH_POST_INSTALL);
    const twice = addFmtConstevalFix(once);
    expect(once).toEqual(twice);
    const count = (twice.match(/FMT_USE_CONSTEVAL=0/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('returns the original podfile unchanged when post_install block is absent', () => {
    const result = addFmtConstevalFix(PODFILE_WITHOUT_POST_INSTALL);
    expect(result).toEqual(PODFILE_WITHOUT_POST_INSTALL);
  });
});
