import { validateConfig } from '../pluginConfig';

describe(validateConfig, () => {
  it('should throw error from invalid config type', () => {
    expect(() => {
      validateConfig(undefined);
    }).toThrow();
    expect(() => {
      validateConfig(null);
    }).toThrow();
    expect(() => {
      validateConfig('foo');
    }).toThrow();
    expect(() => {
      validateConfig({ android: { compileSdkVersion: 'aString' } });
    }).toThrow();
  });

  it('should throw error from unsupported android versions', () => {
    expect(() =>
      validateConfig({ android: { minSdkVersion: 14 } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`android.minSdkVersion\` needs to be at least version 21."`
    );
    expect(() =>
      validateConfig({ android: { compileSdkVersion: 14 } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`android.compileSdkVersion\` needs to be at least version 31."`
    );
    expect(() =>
      validateConfig({ android: { targetSdkVersion: 14 } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`android.targetSdkVersion\` needs to be at least version 31."`
    );
    expect(() =>
      validateConfig({ android: { kotlinVersion: '1.3.0' } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`android.kotlinVersion\` needs to be at least version 1.6.10."`
    );
    expect(() =>
      validateConfig({ ios: { deploymentTarget: '9.0' } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`ios.deploymentTarget\` needs to be at least version 13.0."`
    );
  });

  it('should not allow ios.flipper=true and ios.useFrameworks at the same time', () => {
    expect(() =>
      validateConfig({ ios: { flipper: true, useFrameworks: 'static' } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`ios.flipper\` cannot be enabled when \`ios.useFrameworks\` is set."`
    );
  });

  it(`should not allow ios.flipper='0.999.0' and ios.useFrameworks at the same time`, () => {
    expect(() =>
      validateConfig({ ios: { flipper: '0.999.0', useFrameworks: 'static' } })
    ).toThrowErrorMatchingInlineSnapshot(
      `"\`ios.flipper\` cannot be enabled when \`ios.useFrameworks\` is set."`
    );
  });

  it('should allow ios.flipper=false and ios.useFrameworks at the same time', () => {
    expect(() =>
      validateConfig({ ios: { flipper: false, useFrameworks: 'static' } })
    ).not.toThrow();
  });

  it('should use `enableShrinkResourcesInReleaseBuilds` with `enableProguardInReleaseBuilds`', () => {
    expect(() =>
      validateConfig({ android: { enableShrinkResourcesInReleaseBuilds: true } })
    ).toThrow();

    expect(() =>
      validateConfig({
        android: {
          enableShrinkResourcesInReleaseBuilds: true,
          enableProguardInReleaseBuilds: true,
        },
      })
    ).not.toThrow();

    expect(() =>
      validateConfig({
        android: {
          enableShrinkResourcesInReleaseBuilds: true,
          enableProguardInReleaseBuilds: false,
        },
      })
    ).toThrow();
  });
});
