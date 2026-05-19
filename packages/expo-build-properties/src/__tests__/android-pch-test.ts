import { updateBuildGradleForPCH, withAndroidPrecompiledHeaders } from '../android';

const mockWithAppBuildGradle = jest.fn().mockImplementation((config) => config);

jest.mock('@expo/config-plugins/build/plugins/android-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/android-plugins');
  return {
    ...plugins,
    withAppBuildGradle: mockWithAppBuildGradle,
  };
});

jest.mock('@expo/config-plugins/build/plugins/withDangerousMod', () => {
  const mod = jest.requireActual('@expo/config-plugins/build/plugins/withDangerousMod');
  return {
    ...mod,
    withDangerousMod: jest.fn().mockImplementation((config) => config),
  };
});

const TEMPLATE_BUILD_GRADLE = `\
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion

    namespace "com.helloworld"
    defaultConfig {
        applicationId "com.helloworld"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
    androidResources {
        ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~'
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;

describe(withAndroidPrecompiledHeaders, () => {
  const mockConfig = { name: 'test', slug: 'test' } as any;

  afterEach(() => {
    delete process.env.EXPO_USE_PRECOMPILED_HEADERS;
    mockWithAppBuildGradle.mockClear();
  });

  it('should skip when neither config nor env var is set', () => {
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(mockWithAppBuildGradle).not.toHaveBeenCalled();
  });

  it('should apply when usePrecompiledHeaders is true in config', () => {
    withAndroidPrecompiledHeaders(mockConfig, {
      android: { usePrecompiledHeaders: true },
    });
    expect(mockWithAppBuildGradle).toHaveBeenCalled();
  });

  it('should apply when EXPO_USE_PRECOMPILED_HEADERS env var is set to 1', () => {
    process.env.EXPO_USE_PRECOMPILED_HEADERS = '1';
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(mockWithAppBuildGradle).toHaveBeenCalled();
  });

  it('should skip when EXPO_USE_PRECOMPILED_HEADERS env var is not 1', () => {
    process.env.EXPO_USE_PRECOMPILED_HEADERS = '0';
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(mockWithAppBuildGradle).not.toHaveBeenCalled();
  });
});

describe(updateBuildGradleForPCH, () => {
  it('should add externalNativeBuild block inside android section', () => {
    const result = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    expect(result).toContain('externalNativeBuild');
    expect(result).toContain('path "src/main/jni/CMakeLists.txt"');
  });

  it('should not duplicate externalNativeBuild if already present', () => {
    const result = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    const secondResult = updateBuildGradleForPCH(result);
    const count = (secondResult.match(/externalNativeBuild/g) || []).length;
    expect(count).toBe(1);
  });

  it('should add stub PCH task with generated section markers', () => {
    const result = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    expect(result).toContain('// @generated begin expo-build-properties-pch');
    expect(result).toContain('// @generated end expo-build-properties-pch');
    expect(result).toContain('generateStubPCH');
    expect(result).toContain('prepareKotlinBuildScriptModel');
  });

  it('should be idempotent', () => {
    const result1 = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    const result2 = updateBuildGradleForPCH(result1);
    expect(result1).toEqual(result2);
  });

  it('should place externalNativeBuild inside the android block', () => {
    const result = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    const androidBlockStart = result.indexOf('android {');
    const externalNativeBuildPos = result.indexOf('externalNativeBuild');
    const dependenciesPos = result.indexOf('dependencies {');
    expect(externalNativeBuildPos).toBeGreaterThan(androidBlockStart);
    expect(externalNativeBuildPos).toBeLessThan(dependenciesPos);
  });

  it('should place stub PCH task after the android block', () => {
    const result = updateBuildGradleForPCH(TEMPLATE_BUILD_GRADLE);
    const generatedSectionPos = result.indexOf('// @generated begin expo-build-properties-pch');
    const dependenciesPos = result.indexOf('dependencies {');
    expect(generatedSectionPos).toBeGreaterThan(dependenciesPos);
  });
});
