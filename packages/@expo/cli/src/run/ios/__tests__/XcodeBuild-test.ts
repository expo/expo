import { ExpoRunFormatter } from '@expo/xcpretty';
import path from 'path';

import {
  extractEnvVariableFromBuild,
  getProcessOptions,
  getXcodeBuildArgsAsync,
  _assertXcodeBuildResults,
  _extractXcodeBuildErrorLines,
  _formatXcodeBuildFailure,
  _hasXcodeBuildErrorDetails,
  matchEstimatedBinaryPath,
  getAppBinaryPath,
} from '../XcodeBuild';
import { ensureDeviceIsCodeSignedForDeploymentAsync } from '../codeSigning/configureCodeSigning';

jest.mock('../codeSigning/configureCodeSigning');

const fs = jest.requireActual('fs') as typeof import('fs');

describe(getXcodeBuildArgsAsync, () => {
  it(`returns fully qualified arguments for a build`, async () => {
    jest.mocked(ensureDeviceIsCodeSignedForDeploymentAsync).mockResolvedValueOnce('my-dev-team');
    await expect(
      getXcodeBuildArgsAsync({
        projectRoot: '/path/to/project',
        buildCache: false,
        configuration: 'Debug',
        isSimulator: false,
        scheme: 'project-with-build-configurations',
        device: { udid: 'demo-udid', name: 'foobar', osType: 'iOS' },
        osType: 'iOS',
        xcodeProject: {
          isWorkspace: true,
          name: 'demo-project',
        },
      })
    ).resolves.toEqual([
      '-workspace',
      'demo-project',
      '-configuration',
      'Debug',
      '-scheme',
      'project-with-build-configurations',
      '-destination',
      'id=demo-udid',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
      'DEVELOPMENT_TEAM=my-dev-team',
      '-allowProvisioningUpdates',
      '-allowProvisioningDeviceRegistration',
      'clean',
      'build',
    ]);
  });
  it(`returns standard simulator arguments`, async () => {
    await expect(
      getXcodeBuildArgsAsync({
        projectRoot: '/path/to/project',
        buildCache: true,
        configuration: 'Release',
        isSimulator: true,
        scheme: 'project-with-build-configurations',
        device: { udid: 'demo-udid', name: 'foobar', osType: 'iOS' },
        osType: 'iOS',
        xcodeProject: {
          isWorkspace: false,
          name: 'demo-project',
        },
      })
    ).resolves.toEqual([
      '-project',
      'demo-project',
      '-configuration',
      'Release',
      '-scheme',
      'project-with-build-configurations',
      '-destination',
      'id=demo-udid',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
    ]);
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).toHaveBeenCalledTimes(0);
  });
  it(`returns generic simulator destination when device is null`, async () => {
    await expect(
      getXcodeBuildArgsAsync({
        projectRoot: '/path/to/project',
        buildCache: true,
        configuration: 'Release',
        isSimulator: true,
        scheme: 'my-app',
        device: null,
        osType: 'iOS',
        xcodeProject: {
          isWorkspace: true,
          name: 'my-app.xcworkspace',
        },
      })
    ).resolves.toEqual([
      '-workspace',
      'my-app.xcworkspace',
      '-configuration',
      'Release',
      '-scheme',
      'my-app',
      '-destination',
      'generic/platform=iOS Simulator',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
    ]);
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).toHaveBeenCalledTimes(0);
  });
  it(`returns generic tvOS simulator destination when osType is tvOS`, async () => {
    await expect(
      getXcodeBuildArgsAsync({
        projectRoot: '/path/to/project',
        buildCache: true,
        configuration: 'Release',
        isSimulator: true,
        scheme: 'my-tv-app',
        device: null,
        osType: 'tvOS',
        xcodeProject: {
          isWorkspace: true,
          name: 'my-tv-app.xcworkspace',
        },
      })
    ).resolves.toEqual([
      '-workspace',
      'my-tv-app.xcworkspace',
      '-configuration',
      'Release',
      '-scheme',
      'my-tv-app',
      '-destination',
      'generic/platform=tvOS Simulator',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
    ]);
  });
});

describe(extractEnvVariableFromBuild, () => {
  const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/xcodebuild.log'), 'utf8');
  it(`gets env variables from build results`, async () => {
    expect(extractEnvVariableFromBuild(fixture, 'APPLE_INTERNAL_LIBRARY_DIR')).toEqual([
      '/AppleInternal/Library',
    ]);
    expect(extractEnvVariableFromBuild(fixture, 'AVAILABLE_PLATFORMS')[0]).toEqual(
      'appletvos\\ appletvsimulator\\ driverkit\\ iphoneos\\ iphonesimulator\\ macosx\\ watchos\\ watchsimulator'
    );
    expect(
      extractEnvVariableFromBuild(fixture, 'CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING')[0]
    ).toEqual('YES');
    expect(extractEnvVariableFromBuild(fixture, 'CONFIGURATION_BUILD_DIR')[0]).toEqual(
      '/Users/evanbacon/Library/Developer/Xcode/DerivedData/basicexpoapp-bhxfzfgdguosemfinvpzbtpjpnji/Build/Products/Debug-iphonesimulator/expo-dev-launcher'
    );
    expect(extractEnvVariableFromBuild(fixture, 'UNLOCALIZED_RESOURCES_FOLDER_PATH')[0]).toEqual(
      'basicexpoapp.app'
    );
  });
});

xdescribe(getProcessOptions, () => {
  it(`gets process option when a packager is enabled`, async () => {
    expect(
      getProcessOptions({
        packager: true,
        shouldSkipInitialBundling: true,
        terminal: 'foobar',
        port: 3000,
        mode: 'development',
      })
    ).toEqual({
      env: {},
    });
  });
});

describe(getProcessOptions, () => {
  it.each([
    { mode: 'development' as const, packager: true },
    { mode: 'production' as const, packager: false },
  ])('passes $mode mode to Xcode when packager is $packager', ({ mode, packager }) => {
    expect(
      getProcessOptions({
        packager,
        terminal: undefined,
        port: 8081,
        mode,
      }).env
    ).toMatchObject({ __EXPO_CONFIG_MODE: mode });
  });
});

describe(_assertXcodeBuildResults, () => {
  it(`asserts invalid Xcode version`, () => {
    expect(() =>
      _assertXcodeBuildResults(
        70,
        'foobar',
        fs.readFileSync(path.resolve(__dirname, './fixtures/outdated-xcode-error.log'), 'utf8'),
        { name: 'name' },
        './output.log'
      )
    ).toThrow(
      'This operation can fail if the version of the OS on the device is newer than the version of Xcode that is running.'
    );
  });

  it(`shows the log path and compile error before the full build output`, () => {
    let message = '';
    try {
      _assertXcodeBuildResults(
        65,
        fs.readFileSync(path.resolve(__dirname, './fixtures/unhandled-compile-error.log'), 'utf8'),
        '',
        { name: 'BareExpo' },
        './output.log'
      );
    } catch (error: any) {
      message = error.message;
    }
    expect(message).toContain(
      "call to undeclared function 'RCTBundleURLProviderAllowPackagerServerAccess'"
    );
    expect(message).toContain('./output.log');
    expect(message.indexOf('./output.log')).toBeLessThan(
      message.indexOf('ComputeTargetDependencyGraph')
    );
    expect(message.indexOf('call to undeclared function')).toBeLessThan(
      message.indexOf('ComputeTargetDependencyGraph')
    );
  });

  it(`surfaces an error line that only appeared on stderr`, () => {
    let message = '';
    try {
      _assertXcodeBuildResults(
        65,
        'ComputeTargetDependencyGraph\nnote: Building targets in dependency order\n** BUILD FAILED **',
        '/path/Script-ABC123.sh: error: config generation failed\n',
        { name: 'BareExpo' },
        './output.log'
      );
    } catch (error: any) {
      message = error.message;
    }
    expect(message).toContain('error: config generation failed');
  });
});

describe(_formatXcodeBuildFailure, () => {
  it(`includes the build log path`, () => {
    expect(_formatXcodeBuildFailure(65, '/app/.expo/xcodebuild.log')).toContain(
      '/app/.expo/xcodebuild.log'
    );
  });
});

describe(_hasXcodeBuildErrorDetails, () => {
  it(`returns false for Xcode's no-output message`, () => {
    const formatter = ExpoRunFormatter.create('/', {
      xcodeProject: { name: 'BareExpo' },
      isDebug: false,
    });
    formatter.pipe(
      'error: the following command failed with exit code 1 but produced no further output\n'
    );

    expect(formatter.errors).toHaveLength(1);
    expect(_hasXcodeBuildErrorDetails(formatter.errors)).toBe(false);
  });

  it(`returns true for other errors`, () => {
    expect(_hasXcodeBuildErrorDetails(['error: config generation failed'])).toBe(true);
  });
});

describe(_extractXcodeBuildErrorLines, () => {
  it(`extracts and dedupes compiler error lines`, () => {
    const output = [
      'CompileC Foo.o Foo.m normal arm64',
      '/path/Foo.m:1:2: error: use of undeclared identifier',
      '/path/Foo.m:1:2: error: use of undeclared identifier',
      '› 0 error(s), and 3 warning(s)',
      "note: expanded from macro 'BAR'",
    ].join('\n');
    expect(_extractXcodeBuildErrorLines(output)).toEqual([
      '/path/Foo.m:1:2: error: use of undeclared identifier',
    ]);
  });

  it(`returns nothing when no error lines are present`, () => {
    expect(_extractXcodeBuildErrorLines('** BUILD SUCCEEDED **\n› 0 error(s)')).toEqual([]);
  });

  it(`keeps Xcode's no-output message when it is the only error`, () => {
    const message =
      'error: the following command failed with exit code 1 but produced no further output';

    expect(_extractXcodeBuildErrorLines(message)).toEqual([message]);
  });

  it(`keeps Xcode's no-output message with another error`, () => {
    const output = [
      'script.sh: error: config generation failed',
      'error: the following command failed with exit code 1 but produced no further output',
    ].join('\n');

    expect(_extractXcodeBuildErrorLines(output)).toEqual([
      'script.sh: error: config generation failed',
      'error: the following command failed with exit code 1 but produced no further output',
    ]);
  });
});

describe(matchEstimatedBinaryPath, () => {
  const fixture = `Command line invocation:
    /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -workspace /Users/evanbacon/Documents/GitHub/lab/dec3-52blank/ios/dec352blank.xcworkspace -configuration Debug -scheme dec352blank -destination id=7A29311A-FD92-4013-BF22-7003D5B915D9

User defaults from command line:
    IDEPackageSupportUseBuiltinSCM = YES

Prepare packages

ComputeTargetDependencyGraph
note: Building targets in dependency order
note: Target dependency graph (2 targets)
    Target 'dec352blank' in project 'dec352blank'
        ➜ Implicit dependency on target 'Pods-dec352blank' in project 'Pods' via file 'libPods-dec352blank.a' in build phase 'Link Binary'
    Target 'Pods-dec352blank' in project 'Pods' (no dependencies)

GatherProvisioningInputs

CreateBuildDescription

ClangStatCache /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang-stat-cache /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.1.sdk /Users/evanbacon/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex/iphonesimulator18.1-22B74-3d93aac3a03ebac1dd8474c5def773dc.sdkstatcache
    cd /Users/evanbacon/Documents/GitHub/lab/dec3-52blank/ios
    /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang-stat-cache /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator18.1.sdk -o /Users/evanbacon/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex/iphonesimulator18.1-22B74-3d93aac3a03ebac1dd8474c5def773dc.sdkstatcache

ProcessInfoPlistFile /Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Products/Debug-iphonesimulator/dec352blank.app/Info.plist /Users/evanbacon/Documents/GitHub/lab/dec3-52blank/ios/dec352blank/Info.plist (in target 'dec352blank' from project 'dec352blank')
    cd /Users/evanbacon/Documents/GitHub/lab/dec3-52blank/ios
    builtin-infoPlistUtility /Users/evanbacon/Documents/GitHub/lab/dec3-52blank/ios/dec352blank/Info.plist -producttype com.apple.product-type.application -genpkginfo /Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Products/Debug-iphonesimulator/dec352blank.app/PkgInfo -expandbuildsettings -format binary -platform iphonesimulator -additionalcontentfile /Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Intermediates.noindex/dec352blank.build/Debug-iphonesimulator/dec352blank.build/SplashScreen-SBPartialInfo.plist -additionalcontentfile /Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Intermediates.noindex/dec352blank.build/Debug-iphonesimulator/dec352blank.build/assetcatalog_generated_info.plist -o /Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Products/Debug-iphonesimulator/dec352blank.app/Info.plist

** BUILD SUCCEEDED **
`;
  it(`matches binary path`, () => {
    expect(matchEstimatedBinaryPath(fixture)).toBe(
      '/Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Products/Debug-iphonesimulator/dec352blank.app'
    );
  });
  it(`matches binary path as a fallback`, () => {
    expect(getAppBinaryPath(fixture)).toBe(
      '/Users/evanbacon/Library/Developer/Xcode/DerivedData/dec352blank-atotwaonfbrdkmgspyclhglnaagn/Build/Products/Debug-iphonesimulator/dec352blank.app'
    );
  });
});
