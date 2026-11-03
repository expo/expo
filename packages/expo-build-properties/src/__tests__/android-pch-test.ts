import fs from 'fs';
import os from 'os';
import path from 'path';

import { updateBuildGradleForPCH, withAndroidPrecompiledHeaders } from '../android';
import { PCH_CCACHE_CMAKE_CONTENTS, PCH_CMAKE_CONTENTS } from '../androidPCHTemplates';

jest.mock('expo/config-plugins', () => {
  return {
    __esModule: true,
    AndroidConfig: {
      BuildProperties: {
        createBuildGradlePropsConfigPlugin: () => jest.fn((config) => config),
      },
    },
    History: {},
    withAndroidManifest: jest.fn((config) => config),
    withAndroidStyles: jest.fn((config) => config),
    withAppBuildGradle: jest.fn((config) => config),
    withDangerousMod: jest.fn((config) => config),
    withSettingsGradle: jest.fn((config) => config),
  };
});

const getMockWithAppBuildGradle = () =>
  jest.requireMock('expo/config-plugins').withAppBuildGradle as jest.Mock;
const getMockWithDangerousMod = () =>
  jest.requireMock('expo/config-plugins').withDangerousMod as jest.Mock;

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
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
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
    delete process.env.EXPO_USE_ANDROID_PRECOMPILED_HEADERS;
    getMockWithAppBuildGradle().mockClear();
  });

  it('should skip when neither config nor env var is set', () => {
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(getMockWithAppBuildGradle()).not.toHaveBeenCalled();
  });

  it('should apply when usePrecompiledHeaders is true in config', () => {
    withAndroidPrecompiledHeaders(mockConfig, {
      android: { usePrecompiledHeaders: true },
    });
    expect(getMockWithAppBuildGradle()).toHaveBeenCalled();
  });

  it('should apply when EXPO_USE_ANDROID_PRECOMPILED_HEADERS env var is set to 1', () => {
    process.env.EXPO_USE_ANDROID_PRECOMPILED_HEADERS = '1';
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(getMockWithAppBuildGradle()).toHaveBeenCalled();
  });

  it('should skip when EXPO_USE_ANDROID_PRECOMPILED_HEADERS env var is not 1', () => {
    process.env.EXPO_USE_ANDROID_PRECOMPILED_HEADERS = '0';
    withAndroidPrecompiledHeaders(mockConfig, { android: {} });
    expect(getMockWithAppBuildGradle()).not.toHaveBeenCalled();
  });
});

describe('PCH_CMAKE_CONTENTS', () => {
  it('includes the PCH header without its absolute path', () => {
    // CMake writes the header path into the cmake_pch.hxx that ccache hashes for every user of the PCH.
    expect(PCH_CMAKE_CONTENTS).toContain('<pch.h>');
    expect(PCH_CMAKE_CONTENTS).not.toContain('${CMAKE_CURRENT_SOURCE_DIR}/pch.h');
  });

  it('lets the consumers of the PCH find the header', () => {
    // When ccache runs the preprocessor for a consumer, the preprocessor reads cmake_pch.hxx and must find <pch.h>.
    const consumerFunction = PCH_CMAKE_CONTENTS.slice(
      PCH_CMAKE_CONTENTS.indexOf('function(add_pch_if_eligible')
    );
    expect(consumerFunction).toContain('${PCH_INCLUDE_OPTION}');
    expect(PCH_CMAKE_CONTENTS).toContain('-idirafter${CMAKE_CURRENT_SOURCE_DIR}');
  });

  it('writes the ccache checksum of the PCH before its consumers are compiled', () => {
    expect(PCH_CMAKE_CONTENTS).toContain('include("${CMAKE_CURRENT_SOURCE_DIR}/pch-ccache.cmake")');
    expect(PCH_CMAKE_CONTENTS).not.toContain('OPTIONAL');
    expect(PCH_CMAKE_CONTENTS).toContain('pch_ccache_owner(appmodules_pch)');
    expect(PCH_CMAKE_CONTENTS).toContain('pch_ccache_consumer(${target} appmodules_pch)');
  });
});

describe('PCH_CCACHE_CMAKE_CONTENTS', () => {
  it('defines the functions that CMakeLists.txt calls', () => {
    expect(PCH_CCACHE_CMAKE_CONTENTS).toContain('function(pch_ccache_owner owner)');
    expect(PCH_CCACHE_CMAKE_CONTENTS).toContain('function(pch_ccache_consumer consumer owner)');
  });

  it('writes the .sum without the ccache checks when EXPO_FORCE_PCH_CCACHE_SUM is set', () => {
    expect(PCH_CCACHE_CMAKE_CONTENTS).toContain('$ENV{EXPO_FORCE_PCH_CCACHE_SUM}');
  });

  it('writes the .sum when CMake runs it as a script', () => {
    expect(PCH_CCACHE_CMAKE_CONTENTS).toContain('if(CMAKE_SCRIPT_MODE_FILE)');
    expect(PCH_CCACHE_CMAKE_CONTENTS).toContain('-module-file-info');
  });
});

describe('withAndroidPrecompiledHeaders native files', () => {
  let platformProjectRoot: string;

  beforeEach(async () => {
    platformProjectRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expo-pch-test-'));
  });

  afterEach(async () => {
    await fs.promises.rm(platformProjectRoot, { recursive: true, force: true });
    getMockWithDangerousMod().mockClear();
  });

  it('writes its own pch-ccache.cmake next to CMakeLists.txt', async () => {
    withAndroidPrecompiledHeaders({ name: 'test', slug: 'test' } as any, {
      android: { usePrecompiledHeaders: true },
    });
    const [, [, writeNativeFiles]] = getMockWithDangerousMod().mock.calls[0];
    // A project root in which no package is resolvable.
    const projectRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expo-pch-project-'));
    try {
      await writeNativeFiles({ modRequest: { platformProjectRoot, projectRoot } });
    } finally {
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }

    const jniDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'jni');
    expect(await fs.promises.readFile(path.join(jniDir, 'pch-ccache.cmake'), 'utf8')).toBe(
      PCH_CCACHE_CMAKE_CONTENTS
    );
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
