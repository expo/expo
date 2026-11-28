import { getConfig } from '@expo/config';
import { vol } from 'memfs';
import Module from 'module';

import { Log } from '../../log';
import { clearNativeFolder, getExistingNativePlatformsAsync } from '../clearNativeFolder';
import { configureProjectAsync } from '../configureProjectAsync';
import { prebuildAsync } from '../prebuildAsync';
import { setupSwiftPMAsync } from '../setupSwiftPM';
import { updateFromTemplateAsync } from '../updateFromTemplate';

jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(),
}));
jest.mock('@expo/inline-modules', () => ({ updateXcodeProject: jest.fn() }));
jest.mock('../../log');
jest.mock('../../utils/interactive', () => ({ isInteractive: () => false }));
jest.mock('../clearNativeFolder', () => ({
  clearNativeFolder: jest.fn(),
  getExistingNativePlatformsAsync: jest.fn(async () => []),
  promptToClearMalformedNativeProjectsAsync: jest.fn(),
  maybeBailOnNativeModuleAsync: jest.fn(async () => false),
}));
jest.mock('../ensureConfigAsync', () => ({
  ensureConfigAsync: jest.fn(async () => ({ exp: { name: 'App', slug: 'app' }, pkg: {} })),
}));
jest.mock('../updateFromTemplate', () => ({
  updateFromTemplateAsync: jest.fn(async () => ({
    hasNewProjectFiles: true,
    needsPodInstall: true,
    templateChecksum: 'checksum',
    changedDependencies: [],
  })),
}));
jest.mock('../configureProjectAsync', () => ({ configureProjectAsync: jest.fn() }));
jest.mock('../setupSwiftPM', () => ({
  ...jest.requireActual('../setupSwiftPM'),
  setupSwiftPMAsync: jest.fn(),
}));
jest.mock(
  '../../utils/cocoapods.js',
  () => ({ installCocoaPodsAsync: jest.fn(async () => true) }),
  { virtual: true }
);
jest.mock('../../utils/git.js', () => ({ maybeBailOnGitStatusAsync: jest.fn(async () => false) }), {
  virtual: true,
});

const { installCocoaPodsAsync } = require('../../utils/cocoapods.js') as {
  installCocoaPodsAsync: jest.Mock;
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
  };
  jest.mocked(getConfig).mockImplementation(() => {
    throw new Error('stop');
  });
});

afterAll(() => {
  process.env = originalEnv;
});

it('keeps NODE_ENV when called internally', async () => {
  await expect(prebuildAsync('/', { platforms: ['android'] })).rejects.toThrow('stop');

  expect(process.env.NODE_ENV).toBe('production');
});

describe('Swift Package Manager', () => {
  const projectRoot = '/app';
  const marker = `${projectRoot}/ios/App.xcodeproj/.spm-injected.json`;
  const reactNativeDir = `${projectRoot}/node_modules/react-native`;
  const setupScript = `${reactNativeDir}/scripts/setup-apple-spm.js`;

  const mockAppConfig = (exp: object) =>
    jest.mocked(getConfig).mockReturnValue({ exp } as unknown as ReturnType<typeof getConfig>);

  const warnings = () => jest.mocked(Log.warn).mock.calls.map((args) => args.join(' '));

  let createRequire: jest.SpyInstance;

  beforeEach(() => {
    mockAppConfig({});
    createRequire = jest.spyOn(Module, 'createRequire').mockReturnValue({
      resolve: (id: string) => {
        if (id === 'react-native/package.json') return `${reactNativeDir}/package.json`;
        throw new Error(`Cannot find module '${id}'`);
      },
    } as unknown as NodeJS.Require);
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/ios/App.xcodeproj/project.pbxproj`]: '',
      [setupScript]: '',
    });
  });

  afterEach(() => {
    createRequire.mockRestore();
    vol.reset();
  });

  describe('when ios.useCocoaPods is not set', () => {
    it(`sets up Swift Package Manager after config sync instead of installing CocoaPods`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
      expect(jest.mocked(configureProjectAsync).mock.invocationCallOrder[0]).toBeLessThan(
        jest.mocked(setupSwiftPMAsync).mock.invocationCallOrder[0]!
      );
      expect(Log.warn).not.toHaveBeenCalled();
    });

    it(`uses Swift Package Manager when there is no ios directory yet`, async () => {
      vol.rmSync(`${projectRoot}/ios`, { recursive: true, force: true });

      await prebuildAsync(projectRoot, { install: true, platforms: ['ios'] });

      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
    });

    it(`passes --no-install through so the command is printed instead of run`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['ios'], install: false });

      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: false });
      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    });

    it(`keeps using Swift Package Manager when the project has the marker`, async () => {
      vol.writeFileSync(marker, '{}');

      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
      expect(Log.log).not.toHaveBeenCalledWith(expect.stringContaining('.spm-injected.json'));
    });

    it.each([
      ['Podfile.lock', () => vol.writeFileSync(`${projectRoot}/ios/Podfile.lock`, '')],
      ['Pods', () => vol.mkdirSync(`${projectRoot}/ios/Pods`)],
    ])(
      `stops before changing an iOS project where CocoaPods is installed (%s)`,
      async (_, install) => {
        vol.writeFileSync(`${projectRoot}/ios/Podfile`, '');
        install();

        const result = prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

        await expect(result).rejects.toMatchObject({
          name: 'CommandError',
          code: 'SWIFTPM_DEFAULT_COCOAPODS_PROJECT',
          message:
            'Prebuild stopped because CocoaPods is installed in the iOS project (ios/Podfile.lock or ios/Pods exists), and prebuild sets up iOS with Swift Package Manager unless the app config sets ios.useCocoaPods. Prebuild does not convert an installed CocoaPods project in place. To switch to Swift Package Manager, run `npx expo prebuild --clean` to regenerate the iOS project. To keep CocoaPods, add "ios": { "useCocoaPods": true } to the app config.',
        });
        expect(configureProjectAsync).not.toHaveBeenCalled();
        expect(setupSwiftPMAsync).not.toHaveBeenCalled();
        expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      }
    );

    it(`converts an iOS project with a Podfile where CocoaPods was never installed`, async () => {
      vol.writeFileSync(`${projectRoot}/ios/Podfile`, '');

      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    });

    it(`sets up Swift Package Manager again after --clean deletes a Swift Package Manager project`, async () => {
      vol.writeFileSync(marker, '{}');
      jest.mocked(getExistingNativePlatformsAsync).mockResolvedValueOnce(['ios']);
      jest.mocked(clearNativeFolder).mockImplementationOnce(async () => {
        vol.rmSync(`${projectRoot}/ios`, { recursive: true, force: true });
      });

      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true, clean: true });

      expect(clearNativeFolder).toHaveBeenCalled();
      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
    });

    it(`does not set up Swift Package Manager when iOS is not prebuilt`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['android'], install: true });

      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    });

    it(`skips Swift Package Manager on Windows, where iOS is dropped from the platforms`, async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      try {
        await prebuildAsync(projectRoot, { platforms: ['ios', 'android'], install: true });
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }

      expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('Skipping generating the iOS'));
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    });

    it(`fails prebuild when Swift Package Manager setup fails`, async () => {
      jest.mocked(setupSwiftPMAsync).mockRejectedValueOnce(new Error('setup failed'));

      await expect(
        prebuildAsync(projectRoot, { platforms: ['ios'], install: true })
      ).rejects.toThrow('setup failed');
    });

    describe('when React Native does not ship setup-apple-spm.js', () => {
      beforeEach(() => {
        vol.unlinkSync(setupScript);
      });

      it(`falls back to CocoaPods and warns how to fix or silence it`, async () => {
        await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

        expect(setupSwiftPMAsync).not.toHaveBeenCalled();
        expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
        expect(warnings()).toEqual([
          'Could not set up Swift Package Manager for iOS because the installed react-native does not include scripts/setup-apple-spm.js, so prebuild uses CocoaPods. Swift Package Manager requires React Native 0.88 or later. If package.json already requires it, install dependencies and run prebuild again. To keep CocoaPods without this warning, add "ios": { "useCocoaPods": true } to the app config.',
        ]);
      });

      it(`keeps Swift Package Manager when the iOS project already uses it`, async () => {
        vol.writeFileSync(marker, '{}');

        await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

        expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
        expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('when experiments.swiftPackageManager is set', () => {
    it.each([true, false])(
      `warns once that the setting was removed and still uses Swift Package Manager (%s)`,
      async (swiftPackageManager) => {
        mockAppConfig({ experiments: { swiftPackageManager } });

        await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

        expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
        expect(installCocoaPodsAsync).not.toHaveBeenCalled();
        expect(warnings()).toEqual([
          'The app config sets experiments.swiftPackageManager, which was removed and has no effect. Swift Package Manager is the default for iOS. Remove experiments.swiftPackageManager from the app config. To use CocoaPods, add "ios": { "useCocoaPods": true } to the app config.',
        ]);
      }
    );

    it(`does not change ios.useCocoaPods or ask to add it again`, async () => {
      mockAppConfig({ experiments: { swiftPackageManager: true }, ios: { useCocoaPods: true } });

      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
      expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
      expect(warnings()).toEqual([
        'The app config sets experiments.swiftPackageManager, which was removed. Remove experiments.swiftPackageManager from the app config. ios.useCocoaPods keeps this project on CocoaPods.',
      ]);
    });
  });

  describe('when ios.useCocoaPods is true', () => {
    beforeEach(() => {
      mockAppConfig({ ios: { useCocoaPods: true } });
    });

    it(`installs CocoaPods when the project has no marker`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
      expect(Log.warn).not.toHaveBeenCalled();
    });

    it(`throws before generating the project when the existing iOS project uses Swift Package Manager`, async () => {
      vol.writeFileSync(marker, '{}');

      const result = prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      await expect(result).rejects.toMatchObject({ name: 'CommandError' });
      await expect(result).rejects.toThrow(/ios\/App\.xcodeproj\/\.spm-injected\.json/);
      await expect(result).rejects.toThrow(/ios\.useCocoaPods/);
      await expect(result).rejects.toThrow(/npx expo prebuild --clean/);
      expect(configureProjectAsync).not.toHaveBeenCalled();
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    });

    it(`regenerates the iOS project with CocoaPods on --clean when it used Swift Package Manager`, async () => {
      vol.writeFileSync(marker, '{}');
      jest.mocked(getExistingNativePlatformsAsync).mockResolvedValueOnce(['ios']);
      jest.mocked(clearNativeFolder).mockImplementationOnce(async () => {
        vol.rmSync(`${projectRoot}/ios`, { recursive: true, force: true });
      });

      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true, clean: true });

      expect(clearNativeFolder).toHaveBeenCalled();
      expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    });

    it(`ignores the marker when iOS is not prebuilt`, async () => {
      vol.writeFileSync(marker, '{}');

      await prebuildAsync(projectRoot, { platforms: ['android'], install: true });

      expect(configureProjectAsync).toHaveBeenCalled();
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    });

    it(`ignores the marker on Windows, where iOS is dropped from the platforms`, async () => {
      vol.writeFileSync(marker, '{}');
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      try {
        await prebuildAsync(projectRoot, { platforms: ['ios', 'android'], install: true });
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }

      expect(configureProjectAsync).toHaveBeenCalled();
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    });
  });
});

it('names the --no-install flag in non-interactive mode', async () => {
  jest.mocked(getConfig).mockReturnValue({ exp: {} } as unknown as ReturnType<typeof getConfig>);
  jest.mocked(updateFromTemplateAsync).mockResolvedValueOnce({
    hasNewProjectFiles: true,
    needsPodInstall: false,
    templateChecksum: 'checksum',
    changedDependencies: ['react', 'react-native'],
  } as Awaited<ReturnType<typeof updateFromTemplateAsync>>);

  await expect(prebuildAsync('/app', { platforms: ['android'], install: true })).rejects.toThrow(
    '--no-install: flag must be provided in non-interactive mode.'
  );
});
