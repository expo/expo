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
      `"\`ios.deploymentTarget\` needs to be at least version 13.4."`
    );
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

  it('should validate ios.extraPods', () => {
    expect(() => {
      validateConfig({ ios: { extraPods: [{ name: 'Protobuf' }] } });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { extraPods: [{ name: 'Protobuf', version: '~> 0.1.2' }] } });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { extraPods: [{}] } });
    }).toThrow();
  });
});
