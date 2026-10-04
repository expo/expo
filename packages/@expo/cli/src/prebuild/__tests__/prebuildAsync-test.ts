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

  const loggedOutput = () =>
    jest
      .mocked(Log.log)
      .mock.calls.map((args) => args.join(' '))
      .join('\n');

  beforeEach(() => {
    jest.mocked(getConfig).mockReturnValue({ exp: {} } as ReturnType<typeof getConfig>);
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/ios/App.xcodeproj/project.pbxproj`]: '',
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it(`sets up Swift Package Manager after config sync instead of installing CocoaPods`, async () => {
    await prebuildAsync(projectRoot, { platforms: ['ios'], install: true, swiftpm: true });

    expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
    expect(jest.mocked(configureProjectAsync).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(setupSwiftPMAsync).mock.invocationCallOrder[0]!
    );
  });

  it(`passes --no-install through so the command is printed instead of run`, async () => {
    await prebuildAsync(projectRoot, { platforms: ['ios'], install: false, swiftpm: true });

    expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: false });
    expect(installCocoaPodsAsync).not.toHaveBeenCalled();
  });

  it(`uses Swift Package Manager when the project has the marker`, async () => {
    vol.writeFileSync(marker, '{}');

    await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

    expect(installCocoaPodsAsync).not.toHaveBeenCalled();
    expect(setupSwiftPMAsync).toHaveBeenCalledWith(projectRoot, { install: true });
    expect(loggedOutput()).toContain('ios/App.xcodeproj/.spm-injected.json');
    expect(loggedOutput()).toMatch(/CocoaPods/);
  });

  it(`does not print the marker notice when --swiftpm is passed`, async () => {
    vol.writeFileSync(marker, '{}');

    await prebuildAsync(projectRoot, { platforms: ['ios'], install: true, swiftpm: true });

    expect(loggedOutput()).not.toContain('.spm-injected.json');
  });

  it(`detects the marker before --clean deletes the ios directory`, async () => {
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

  it(`installs CocoaPods when the project has no marker and --swiftpm is not passed`, async () => {
    await prebuildAsync(projectRoot, { platforms: ['ios'], install: true });

    expect(installCocoaPodsAsync).toHaveBeenCalledWith(projectRoot);
    expect(setupSwiftPMAsync).not.toHaveBeenCalled();
  });

  it(`ignores the marker when iOS is not prebuilt`, async () => {
    vol.writeFileSync(marker, '{}');

    await prebuildAsync(projectRoot, { platforms: ['android'], install: true, swiftpm: true });

    expect(setupSwiftPMAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).not.toContain('.spm-injected.json');
  });

  it(`skips Swift Package Manager on Windows, where iOS is dropped from the platforms`, async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    try {
      await prebuildAsync(projectRoot, {
        platforms: ['ios', 'android'],
        install: true,
        swiftpm: true,
      });
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
      prebuildAsync(projectRoot, { platforms: ['ios'], install: true, swiftpm: true })
    ).rejects.toThrow('setup failed');
  });
});
