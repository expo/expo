import path from 'path';

import {
  extractEnvVariableFromBuild,
  getProcessOptions,
  getXcodeBuildArgsAsync,
  _assertXcodeBuildResults,
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
        device: { udid: 'demo-udid', name: 'foobar' },
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
        device: { udid: 'demo-udid', name: 'foobar' },
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
    ]);
    expect(ensureDeviceIsCodeSignedForDeploymentAsync).toBeCalledTimes(0);
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
      })
    ).toEqual({
      env: {},
    });
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
