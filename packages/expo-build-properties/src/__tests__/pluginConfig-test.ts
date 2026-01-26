import { validateConfig, resolveConfigValue, PluginConfigType } from '../pluginConfig';

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

  it('should validate ios.forceStaticLinking', () => {
    expect(() => {
      validateConfig({ ios: {} });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { forceStaticLinking: ['SomePod'] } });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { forceStaticLinking: [] } });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { forceStaticLinking: ['SomePod', 'AnotherPod'] } });
    }).not.toThrow();

    expect(() => {
      validateConfig({ ios: { forceStaticLinking: [123] as any } });
    }).toThrow();

    expect(() => {
      validateConfig({ ios: { forceStaticLinking: 'SomePod' as any } });
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

describe('shared config resolution', () => {
  it('should throw when useHermesV1 is true without buildReactNativeFromSource', () => {
    expect(() => validateConfig({ useHermesV1: true })).toThrow(
      '`useHermesV1` requires `buildReactNativeFromSource` to be `true`'
    );
  });

  it('should validate useHermesV1 with buildReactNativeFromSource', () => {
    expect(() =>
      validateConfig({ useHermesV1: true, buildReactNativeFromSource: true })
    ).not.toThrow();
  });

  it('should throw for android-specific useHermesV1 without buildReactNativeFromSource', () => {
    expect(() => validateConfig({ android: { useHermesV1: true } })).toThrow(
      '`useHermesV1` requires `buildReactNativeFromSource` to be `true` for Android.'
    );
  });

  it('should throw for ios-specific useHermesV1 without buildReactNativeFromSource', () => {
    expect(() => validateConfig({ ios: { useHermesV1: true } })).toThrow(
      '`useHermesV1` requires `buildReactNativeFromSource` to be `true` for iOS.'
    );
  });

  it('should validate top-level buildReactNativeFromSource', () => {
    expect(() => validateConfig({ buildReactNativeFromSource: true })).not.toThrow();
  });

  it('should validate top-level reactNativeReleaseLevel', () => {
    expect(() => validateConfig({ reactNativeReleaseLevel: 'canary' })).not.toThrow();
  });

  it('should validate combined top-level and platform-specific config', () => {
    expect(() =>
      validateConfig({
        buildReactNativeFromSource: true,
        useHermesV1: true,
        reactNativeReleaseLevel: 'experimental',
        android: {
          minSdkVersion: 24,
        },
        ios: {
          deploymentTarget: '15.1',
          useHermesV1: false,
        },
      })
    ).not.toThrow();
  });

  it('should allow platform-specific buildReactNativeFromSource to satisfy useHermesV1', () => {
    expect(() =>
      validateConfig({
        useHermesV1: true,
        android: { buildReactNativeFromSource: true },
        ios: { buildReactNativeFromSource: true },
      })
    ).not.toThrow();
  });
});

describe(resolveConfigValue, () => {
  describe('useHermesV1 resolution', () => {
    it('returns undefined when not set anywhere', () => {
      const config: PluginConfigType = {};
      expect(resolveConfigValue(config, 'android', 'useHermesV1')).toBeUndefined();
      expect(resolveConfigValue(config, 'ios', 'useHermesV1')).toBeUndefined();
    });

    it('returns top-level value when platform-specific not set', () => {
      const config: PluginConfigType = { useHermesV1: true };
      expect(resolveConfigValue(config, 'android', 'useHermesV1')).toBe(true);
      expect(resolveConfigValue(config, 'ios', 'useHermesV1')).toBe(true);
    });

    it('returns platform-specific value when set (overrides top-level)', () => {
      const config: PluginConfigType = {
        useHermesV1: true,
        android: { useHermesV1: false },
      };
      expect(resolveConfigValue(config, 'android', 'useHermesV1')).toBe(false);
      expect(resolveConfigValue(config, 'ios', 'useHermesV1')).toBe(true);
    });

    it('returns platform-specific false even when top-level is true', () => {
      const config: PluginConfigType = {
        useHermesV1: true,
        ios: { useHermesV1: false },
      };
      expect(resolveConfigValue(config, 'ios', 'useHermesV1')).toBe(false);
    });

    it('returns platform-specific value when only platform-specific is set', () => {
      const config: PluginConfigType = {
        android: { useHermesV1: true },
      };
      expect(resolveConfigValue(config, 'android', 'useHermesV1')).toBe(true);
      expect(resolveConfigValue(config, 'ios', 'useHermesV1')).toBeUndefined();
    });
  });

  describe('buildReactNativeFromSource resolution', () => {
    it('returns top-level value when platform-specific not set', () => {
      const config: PluginConfigType = { buildReactNativeFromSource: true };
      expect(resolveConfigValue(config, 'android', 'buildReactNativeFromSource')).toBe(true);
      expect(resolveConfigValue(config, 'ios', 'buildReactNativeFromSource')).toBe(true);
    });

    it('allows per-platform override', () => {
      const config: PluginConfigType = {
        buildReactNativeFromSource: true,
        ios: { buildReactNativeFromSource: false },
      };
      expect(resolveConfigValue(config, 'android', 'buildReactNativeFromSource')).toBe(true);
      expect(resolveConfigValue(config, 'ios', 'buildReactNativeFromSource')).toBe(false);
    });
  });

  describe('reactNativeReleaseLevel resolution', () => {
    it('returns top-level value when platform-specific not set', () => {
      const config: PluginConfigType = { reactNativeReleaseLevel: 'canary' };
      expect(resolveConfigValue(config, 'android', 'reactNativeReleaseLevel')).toBe('canary');
      expect(resolveConfigValue(config, 'ios', 'reactNativeReleaseLevel')).toBe('canary');
    });

    it('allows per-platform override', () => {
      const config: PluginConfigType = {
        reactNativeReleaseLevel: 'stable',
        android: { reactNativeReleaseLevel: 'experimental' },
      };
      expect(resolveConfigValue(config, 'android', 'reactNativeReleaseLevel')).toBe('experimental');
      expect(resolveConfigValue(config, 'ios', 'reactNativeReleaseLevel')).toBe('stable');
    });
  });
});
