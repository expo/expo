import path from 'path';

import { ensureDeviceIsCodeSignedForDeploymentAsync } from '../developmentCodeSigning';
import {
  extractEnvVariableFromBuild,
  getProcessOptions,
  getXcodeBuildArgsAsync,
} from '../XcodeBuild';

jest.mock('../developmentCodeSigning');

const fs = jest.requireActual('fs') as typeof import('fs');

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

describe(getXcodeBuildArgsAsync, () => {
  it(`returns fully qualified arguments for a build`, async () => {
    asMock(ensureDeviceIsCodeSignedForDeploymentAsync).mockResolvedValueOnce('my-dev-team');
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
      '/AppleInternal/Library',
      '/AppleInternal/Library',
      '/AppleInternal/Library',
      '/AppleInternal/Library',
      '/AppleInternal/Library',
      '/AppleInternal/Library',
    ]);
    expect(extractEnvVariableFromBuild(fixture, 'AVAILABLE_PLATFORMS')[0]).toEqual(
      'appletvos\\ appletvsimulator\\ driverkit\\ iphoneos\\ iphonesimulator\\ macosx\\ watchos\\ watchsimulator'
    );
    expect(
      extractEnvVariableFromBuild(fixture, 'CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING')[0]
    ).toEqual('YES');
    expect(extractEnvVariableFromBuild(fixture, 'CONFIGURATION_BUILD_DIR')[0]).toEqual(
      '/Users/evanbacon/Library/Developer/Xcode/DerivedData/basicexpoapp-bhxfzfgdguosemfinvpzbtpjpnji/Build/Products/Debug-iphonesimulator/expo-dev-menu-interface'
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
