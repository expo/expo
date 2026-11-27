import { vol } from 'memfs';

import * as Log from '../../log';
import { maybePromptToSyncPodsAsync } from '../cocoapods';

jest.mock('../../log');

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

  it(`skips CocoaPods when the iOS project uses Swift Package Manager`, async () => {
    vol.writeFileSync(marker, '{}');

    await maybePromptToSyncPodsAsync(projectRoot);

    expect(mockInstallAsync).not.toHaveBeenCalled();
    expect(Log.log).toHaveBeenCalledWith(
      'Skipping CocoaPods because the iOS project uses Swift Package Manager.'
    );
  });

  it(`decides by the iOS project, not by ios.useCocoaPods in the app config`, async () => {
    vol.writeFileSync(
      `${projectRoot}/app.json`,
      JSON.stringify({ expo: { ios: { useCocoaPods: true } } })
    );
    vol.writeFileSync(marker, '{}');

    await expect(maybePromptToSyncPodsAsync(projectRoot)).resolves.toBeUndefined();

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
