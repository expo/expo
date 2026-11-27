import { vol } from 'memfs';

import { downloadAndExtractExampleAsync } from '../Examples';
import { extractAndPrepareTemplateAppAsync, sanitizeTemplateAsync } from '../Template';
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

describe('React Native support for Swift Package Manager', () => {
  it.each(['0.87.4', '^0.85.0', '~0.76.9', '>=0.80.0 <0.90.0'])(
    'keeps React Native %s on CocoaPods',
    async (reactNative) => {
      writeProject({ 'react-native': reactNative });

      await expect(sanitizeTemplateAsync(projectRoot)).resolves.toEqual({ useCocoaPods: true });
      expect(readAppJson().expo.ios).toEqual({ useCocoaPods: true });
    }
  );

  it.each(['0.88.0', '^0.88.0-rc.3', '0.89.1', '0.0.0-20261001-abc', 'workspace:*', 'latest'])(
    'uses Swift Package Manager with React Native %s',
    async (reactNative) => {
      writeProject({ 'react-native': reactNative });

      await expect(sanitizeTemplateAsync(projectRoot)).resolves.toEqual({ useCocoaPods: false });
      expect(readAppJson().expo.ios).toBeUndefined();
    }
  );

  it('uses Swift Package Manager without a react-native dependency', async () => {
    writeProject({ expo: '^57.0.0' });

    await expect(sanitizeTemplateAsync(projectRoot)).resolves.toEqual({ useCocoaPods: false });
  });

  it('uses Swift Package Manager without dependencies', async () => {
    writeProject();

    await expect(sanitizeTemplateAsync(projectRoot)).resolves.toEqual({ useCocoaPods: false });
  });
});

describe(extractAndPrepareTemplateAppAsync, () => {
  const extractTemplate = (reactNative: string) =>
    jest.mocked(downloadAndExtractNpmModuleAsync).mockImplementationOnce(async () => {
      writeProject({ 'react-native': reactNative });
      return 'template';
    });

  it('keeps a template with an old React Native on CocoaPods without an error', async () => {
    extractTemplate('0.83.2');

    await expect(
      extractAndPrepareTemplateAppAsync(projectRoot, { npmPackage: 'expo-template-blank@sdk-55' })
    ).resolves.toEqual({ useCocoaPods: true });

    expect(readAppJson().expo).toEqual({
      name: 'my-app',
      slug: 'my-app',
      ios: { useCocoaPods: true },
    });
  });

  it('writes no iOS setting for a supported React Native by default', async () => {
    extractTemplate('0.88.1');

    await expect(
      extractAndPrepareTemplateAppAsync(projectRoot, { npmPackage: 'expo-template-default' })
    ).resolves.toEqual({ useCocoaPods: false });

    expect(readAppJson().expo).toEqual({ name: 'my-app', slug: 'my-app' });
  });

  it('writes ios.useCocoaPods with cocoapods', async () => {
    extractTemplate('0.88.1');

    await expect(
      extractAndPrepareTemplateAppAsync(projectRoot, {
        npmPackage: 'expo-template-default',
        cocoapods: true,
      })
    ).resolves.toEqual({ useCocoaPods: true });

    expect(readAppJson().expo.ios).toEqual({ useCocoaPods: true });
  });
});

describe(downloadAndExtractExampleAsync, () => {
  const extractExample = (reactNative: string) =>
    jest.mocked(extractNpmTarballAsync).mockImplementationOnce(async () => {
      writeProject({ 'react-native': reactNative });
      return 'example';
    });

  it('keeps an example with an old React Native on CocoaPods without an error', async () => {
    extractExample('~0.81.4');

    await expect(downloadAndExtractExampleAsync(projectRoot, 'with-router')).resolves.toEqual({
      useCocoaPods: true,
    });

    expect(readAppJson().expo.ios).toEqual({ useCocoaPods: true });
  });

  it('writes ios.useCocoaPods with cocoapods', async () => {
    extractExample('0.88.1');

    await expect(
      downloadAndExtractExampleAsync(projectRoot, 'with-router', { cocoapods: true })
    ).resolves.toEqual({ useCocoaPods: true });

    expect(readAppJson().expo.ios).toEqual({ useCocoaPods: true });
  });
});
