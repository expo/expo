import { vol } from 'memfs';

import { downloadAndExtractExampleAsync } from '../Examples';
import { assertSwiftPMSupportedAsync, extractAndPrepareTemplateAppAsync } from '../Template';
import { ExitError, SwiftPMUnsupportedError } from '../error';
import { downloadAndExtractNpmModuleAsync, extractNpmTarballAsync } from '../utils/npm';

jest.mock('fs');
jest.mock('../utils/fetch', () => ({
  fetch: jest.fn(async () => ({ ok: true, status: 200, body: {} })),
}));
jest.mock('../utils/npm', () => ({
  ...jest.requireActual('../utils/npm'),
  downloadAndExtractNpmModuleAsync: jest.fn(),
  extractNpmTarballAsync: jest.fn(),
}));

const projectRoot = '/projects/my-app';

const writeProject = (dependencies?: Record<string, string>) =>
  vol.fromJSON({
    [`${projectRoot}/package.json`]: JSON.stringify({ name: 'template', dependencies }),
    [`${projectRoot}/app.json`]: JSON.stringify({ expo: { name: 'template' } }),
  });

const readAppJson = () => JSON.parse(String(vol.readFileSync(`${projectRoot}/app.json`)));

afterEach(() => {
  vol.reset();
  jest.clearAllMocks();
});

describe(assertSwiftPMSupportedAsync, () => {
  it.each(['0.87.4', '^0.85.0', '~0.76.9', '>=0.80.0 <0.90.0'])(
    'rejects React Native %s',
    async (reactNative) => {
      writeProject({ 'react-native': reactNative });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).rejects.toThrow(
        SwiftPMUnsupportedError
      );
    }
  );

  it.each(['0.88.0', '^0.88.0-rc.3', '0.89.1', '0.0.0-20261001-abc', 'workspace:*', 'latest'])(
    'allows React Native %s',
    async (reactNative) => {
      writeProject({ 'react-native': reactNative });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).resolves.toBeUndefined();
    }
  );

  it('allows a project without a react-native dependency', async () => {
    writeProject({ expo: '^57.0.0' });

    await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).resolves.toBeUndefined();
  });

  it('allows a project without dependencies', async () => {
    writeProject();

    await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).resolves.toBeUndefined();
  });

  it('allows a project without a package.json', async () => {
    vol.fromJSON({ [`${projectRoot}/app.json`]: '{}' });

    await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).resolves.toBeUndefined();
  });

  describe('error message', () => {
    const setCwd = (cwd: string) => jest.spyOn(process, 'cwd').mockReturnValue(cwd);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('explains what failed, why, and what to do for a template', async () => {
      setCwd('/projects');
      writeProject({ 'react-native': '^0.85.0' });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).rejects.toThrow(
        'Could not create the project with --swiftpm because the template uses React Native ^0.85.0. ' +
          'Swift Package Manager for iOS requires React Native 0.88 or later. ' +
          'Delete the my-app directory, then choose a template for a newer Expo SDK, or run the command again without --swiftpm to use CocoaPods.'
      );
    });

    it('names the example instead of the template for an example', async () => {
      setCwd('/projects');
      writeProject({ 'react-native': '0.79.5' });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'example')).rejects.toThrow(
        'Could not create the project with --swiftpm because the example uses React Native 0.79.5. ' +
          'Swift Package Manager for iOS requires React Native 0.88 or later. ' +
          'Delete the my-app directory, then choose an example for a newer Expo SDK, or run the command again without --swiftpm to use CocoaPods.'
      );
    });

    it('names the directory relative to the working directory', async () => {
      setCwd('/');
      writeProject({ 'react-native': '0.79.5' });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).rejects.toThrow(
        'Delete the projects/my-app directory, then'
      );
    });

    it('names the directory by its name when it is the working directory', async () => {
      setCwd(projectRoot);
      writeProject({ 'react-native': '0.79.5' });

      await expect(assertSwiftPMSupportedAsync(projectRoot, 'template')).rejects.toThrow(
        'Delete the my-app directory, then'
      );
    });
  });

  it('exits non-zero without being logged a second time', async () => {
    writeProject({ 'react-native': '0.87.0' });

    const error = await assertSwiftPMSupportedAsync(projectRoot, 'template').catch((e) => e);

    expect(error).toBeInstanceOf(ExitError);
    expect(error.code).toBe(1);
  });
});

describe(extractAndPrepareTemplateAppAsync, () => {
  const extractTemplate = (reactNative: string) =>
    jest.mocked(downloadAndExtractNpmModuleAsync).mockImplementationOnce(async () => {
      writeProject({ 'react-native': reactNative });
      return 'template';
    });

  it('stops before app.json is written when the template React Native is too old', async () => {
    extractTemplate('0.83.2');

    await expect(
      extractAndPrepareTemplateAppAsync(projectRoot, {
        npmPackage: 'expo-template-blank@sdk-55',
        swiftpm: true,
      })
    ).rejects.toThrow(SwiftPMUnsupportedError);

    expect(readAppJson()).toEqual({ expo: { name: 'template' } });
    expect(vol.existsSync(`${projectRoot}/package.json`)).toBe(true);
  });

  it('does not check React Native without swiftpm', async () => {
    extractTemplate('0.83.2');

    await extractAndPrepareTemplateAppAsync(projectRoot, {
      npmPackage: 'expo-template-blank@sdk-55',
      swiftpm: false,
    });

    expect(readAppJson().expo).toMatchObject({ name: 'my-app', slug: 'my-app' });
  });

  it('enables SwiftPM when the template React Native is supported', async () => {
    extractTemplate('0.88.1');

    await extractAndPrepareTemplateAppAsync(projectRoot, {
      npmPackage: 'expo-template-default',
      swiftpm: true,
    });

    expect(readAppJson().expo.experiments).toEqual({ swiftPackageManager: true });
  });
});

describe(downloadAndExtractExampleAsync, () => {
  const extractExample = (reactNative: string) =>
    jest.mocked(extractNpmTarballAsync).mockImplementationOnce(async () => {
      writeProject({ 'react-native': reactNative });
      return 'example';
    });

  it('stops before app.json is written when the example React Native is too old', async () => {
    extractExample('~0.81.4');

    const error = await downloadAndExtractExampleAsync(projectRoot, 'with-router', {
      swiftpm: true,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(SwiftPMUnsupportedError);
    expect(error.message).toMatch(/the example uses React Native ~0\.81\.4/);
    expect(readAppJson()).toEqual({ expo: { name: 'template' } });
  });

  it('does not check React Native without swiftpm', async () => {
    extractExample('~0.81.4');

    await downloadAndExtractExampleAsync(projectRoot, 'with-router', { swiftpm: false });

    expect(readAppJson().expo).toMatchObject({ name: 'my-app', slug: 'my-app' });
  });
});
