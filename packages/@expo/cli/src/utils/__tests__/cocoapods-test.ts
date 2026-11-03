import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import * as Log from '../../log';
import { maybePromptToSyncPodsAsync } from '../cocoapods';

jest.mock('../../log');
jest.mock('@expo/config', () => {
  const actual = jest.requireActual('@expo/config');
  return { ...actual, getConfig: jest.fn(actual.getConfig) };
});

const mockInstallAsync = jest.fn(async () => {});
jest.mock('@expo/package-manager', () => ({
  CocoaPodsPackageManager: jest.fn(() => ({
    isCLIInstalledAsync: jest.fn(async () => true),
    installAsync: mockInstallAsync,
  })),
}));

const projectRoot = '/app';

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;

beforeEach(() => {
  Object.defineProperty(process, 'platform', { ...originalPlatform, value: 'darwin' });
  vol.fromJSON({
    [`${projectRoot}/package.json`]: '{}',
    [`${projectRoot}/app.json`]: '{ "expo": {} }',
    [`${projectRoot}/ios/Podfile`]: '',
    [`${projectRoot}/ios/App.xcodeproj/project.pbxproj`]: '',
  });
});

afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform);
  vol.reset();
});

describe(maybePromptToSyncPodsAsync, () => {
  const marker = `${projectRoot}/ios/App.xcodeproj/.spm-injected.json`;
  const writeAppConfig = (experiments: object) =>
    vol.writeFileSync(`${projectRoot}/app.json`, JSON.stringify({ expo: { experiments } }));

  it(`skips CocoaPods when experiments.swiftPackageManager is enabled and the iOS project uses Swift Package Manager`, async () => {
    writeAppConfig({ swiftPackageManager: true });
    vol.writeFileSync(marker, '{}');

    await maybePromptToSyncPodsAsync(projectRoot);

    expect(mockInstallAsync).not.toHaveBeenCalled();
    expect(Log.log).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Skipping CocoaPods because .*experiments\.swiftPackageManager.* is enabled in the app config\.$/
      )
    );
  });

  it(`tells the user to run prebuild when experiments.swiftPackageManager is enabled but the iOS project still uses CocoaPods`, async () => {
    writeAppConfig({ swiftPackageManager: true });

    await maybePromptToSyncPodsAsync(projectRoot);

    expect(mockInstallAsync).not.toHaveBeenCalled();
    expect(Log.log).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Skipping CocoaPods because .*experiments\.swiftPackageManager.* is enabled in the app config\. .*npx expo prebuild.* to switch it to Swift Package Manager\.$/
      )
    );
  });

  it(`reads the app config with plugins applied, like expo prebuild`, async () => {
    await maybePromptToSyncPodsAsync(projectRoot);

    expect(getConfig).toHaveBeenCalledWith(projectRoot, { skipSDKVersionRequirement: true });
  });

  it(`throws when the iOS project uses Swift Package Manager but the setting is not enabled`, async () => {
    vol.writeFileSync(marker, '{}');

    const result = maybePromptToSyncPodsAsync(projectRoot);

    await expect(result).rejects.toMatchObject({ name: 'CommandError' });
    await expect(result).rejects.toThrow(/ios\/App\.xcodeproj\/\.spm-injected\.json/);
    await expect(result).rejects.toThrow(/npx expo prebuild --clean/);
    expect(mockInstallAsync).not.toHaveBeenCalled();
  });

  it(`installs CocoaPods when the Pods folder is missing and there is no marker`, async () => {
    await maybePromptToSyncPodsAsync(projectRoot);

    expect(mockInstallAsync).toHaveBeenCalledTimes(1);
  });

  it(`ignores a marker inside the Pods folder`, async () => {
    vol.fromJSON({
      [`${projectRoot}/ios/Pods/Pods.xcodeproj/.spm-injected.json`]: '{}',
    });

    await maybePromptToSyncPodsAsync(projectRoot);

    expect(mockInstallAsync).toHaveBeenCalledTimes(1);
  });
});
