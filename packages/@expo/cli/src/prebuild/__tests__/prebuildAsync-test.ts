import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import { Log } from '../../log';
import { clearNativeFolder, getExistingNativePlatformsAsync } from '../clearNativeFolder';
import { configureProjectAsync } from '../configureProjectAsync';
import { prebuildAsync } from '../prebuildAsync';
import { setupSwiftPMAsync } from '../setupSwiftPM';

jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(),
}));
jest.mock('@expo/inline-modules', () => ({ updateXcodeProject: jest.fn() }));
jest.mock('../../log');
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

  const mockSwiftPMSetting = (swiftPackageManager: boolean) =>
    jest
      .mocked(getConfig)
      .mockReturnValue({ exp: { experiments: { swiftPackageManager } } } as unknown as ReturnType<
        typeof getConfig
      >);

  beforeEach(() => {
    mockSwiftPMSetting(false);
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/ios/App.xcodeproj/project.pbxproj`]: '',
    });
  });

  afterEach(() => {
    vol.reset();
  });

  describe('when experiments.swiftPackageManager is enabled', () => {
    beforeEach(() => {
      mockSwiftPMSetting(true);
    });

    it(`sets up Swift Package Manager after config sync instead of installing CocoaPods`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(installCocoaPodsAsync).not.toHaveBeenCalled();
      expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
      expect(jest.mocked(configureProjectAsync).mock.invocationCallOrder[0]).toBeLessThan(
        jest.mocked(setupSwiftPMAsync).mock.invocationCallOrder[0]!
      );
    });

    it(`uses the setting when called with the ensureNativeProject options`, async () => {
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

    it(`reads the setting before --clean deletes the ios directory`, async () => {
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
  });

  describe('when experiments.swiftPackageManager is not enabled', () => {
    it(`installs CocoaPods when the project has no marker`, async () => {
      await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
      expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    });

    it(`throws before generating the project when the existing iOS project uses Swift Package Manager`, async () => {
      vol.writeFileSync(marker, '{}');

      const result = prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

      await expect(result).rejects.toMatchObject({ name: 'CommandError' });
      await expect(result).rejects.toThrow(/ios\/App\.xcodeproj\/\.spm-injected\.json/);
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
