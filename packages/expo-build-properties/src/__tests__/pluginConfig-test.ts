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
      `"\`ios.deploymentTarget\` needs to be at least version 15.1."`
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

  it('should use `enableShrinkResourcesInReleaseBuilds` with `enableMinifyInReleaseBuilds`', () => {
    expect(() =>
      validateConfig({ android: { enableShrinkResourcesInReleaseBuilds: true } })
    ).toThrow();

    expect(() =>
      validateConfig({
        android: {
          enableShrinkResourcesInReleaseBuilds: true,
          enableMinifyInReleaseBuilds: true,
        },
      })
    ).not.toThrow();

    expect(() =>
      validateConfig({
        android: {
          enableShrinkResourcesInReleaseBuilds: true,
          enableMinifyInReleaseBuilds: false,
        },
      })
    ).toThrow();
  });

  it('should validate android.enablePngCrunchInReleaseBuilds', () => {
    expect(() =>
      validateConfig({
        android: {
          enablePngCrunchInReleaseBuilds: true,
        },
      })
    ).not.toThrow();

    expect(() =>
      validateConfig({
        android: {
          enablePngCrunchInReleaseBuilds: false,
        },
      })
    ).not.toThrow();
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

  it('should validate android.extraMavenRepos', () => {
    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: [
            {
              url: 'https://foo.com/maven-repos',
              credentials: { username: 'user', password: 'password' },
              authentication: 'basic',
            },
          ],
        },
      });
    }).not.toThrow();

    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: [
            {
              url: 'https://foo.com/maven-repos',
              credentials: { username: 'user', password: 'password' },
              authentication: 'basic',
            },
            {
              url: 'https://bar.com/maven-repos',
              credentials: { username: 'user', password: 'password' },
              authentication: 'basic',
            },
          ],
        },
      });
    }).not.toThrow();

    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: [
            {
              url: 'https://foo.com/maven-repos',
              credentials: { username: 'user' },
              authentication: 'basic',
            },
          ],
        },
      });
    }).toThrow();

    // Maintain backwards compatibility
    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: ['https://foo.com/maven-repos'],
        },
      });
    }).not.toThrow();

    // Allow mix and match of old and new format
    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: ['https://foo.com/maven-repos', { url: 'https://bar.com/maven-repos' }],
        },
      });
    }).not.toThrow();

    // Empty array is allowed
    expect(() => {
      validateConfig({
        android: {
          extraMavenRepos: [],
        },
      });
    }).not.toThrow();
  });
});
