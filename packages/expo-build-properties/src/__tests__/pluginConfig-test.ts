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

  it('should throw error from unsupported android.compileSdkVersion', () => {
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
      `"\`ios.deploymentTarget\` needs to be at least version 12.0."`
    );
  });
});
