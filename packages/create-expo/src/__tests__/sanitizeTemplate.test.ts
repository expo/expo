import { vol } from 'memfs';

import { sanitizeTemplateAsync } from '../Template';

jest.mock('fs');

beforeEach(() => {
  vol.reset();
});

describe(sanitizeTemplateAsync, () => {
  it('adds default scripts for unmanaged apps', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'project',
        version: '0.0.0',
      }),
      '/project/app.json': '{}',
      '/project/ios/test': '',
    });

    await sanitizeTemplateAsync('/project');

    const packageJson = JSON.parse(String(vol.readFileSync('/project/package.json')));

    expect(packageJson.scripts).toMatchObject({
      android: 'expo run:android',
      ios: 'expo run:ios',
    });
  });

  it('adds default scripts for managed apps', async () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({
        name: 'project',
        version: '0.0.0',
      }),
      '/project/app.json': '{}',
      '/project/.gitignore': '/ios\n/android\n',
    });

    await sanitizeTemplateAsync('/project');

    const packageJson = JSON.parse(String(vol.readFileSync('/project/package.json')));

    expect(packageJson.scripts).toMatchObject({
      android: 'expo start --android',
      ios: 'expo start --ios',
    });
  });
});

describe('sanitizeTemplateAsync with cocoapods', () => {
  const readAppJson = () => JSON.parse(String(vol.readFileSync('/project/app.json')));

  const createProject = (appJson: object) =>
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'project', version: '0.0.0' }),
      '/project/app.json': JSON.stringify(appJson),
    });

  it('sets ios.useCocoaPods in a flat app.json', async () => {
    createProject({ name: 'project' });

    await expect(sanitizeTemplateAsync('/project', { cocoapods: true })).resolves.toEqual({
      useCocoaPods: true,
    });

    expect(readAppJson()).toEqual({
      name: 'project',
      slug: 'project',
      ios: { useCocoaPods: true },
    });
  });

  it('sets ios.useCocoaPods under the expo key and keeps the other iOS fields', async () => {
    createProject({
      expo: { name: 'project', ios: { supportsTablet: true, bundleIdentifier: 'com.project' } },
    });

    await sanitizeTemplateAsync('/project', { cocoapods: true });

    expect(readAppJson()).toEqual({
      expo: {
        name: 'project',
        slug: 'project',
        ios: { supportsTablet: true, bundleIdentifier: 'com.project', useCocoaPods: true },
      },
    });
  });

  it('writes no Swift Package Manager setting without cocoapods', async () => {
    createProject({ expo: { ios: { supportsTablet: true } } });

    await expect(sanitizeTemplateAsync('/project')).resolves.toEqual({ useCocoaPods: false });

    expect(readAppJson()).toEqual({
      expo: { name: 'project', slug: 'project', ios: { supportsTablet: true } },
    });
  });

  it('keeps ios.useCocoaPods when the template already sets it', async () => {
    createProject({ expo: { ios: { useCocoaPods: true } } });

    await expect(sanitizeTemplateAsync('/project')).resolves.toEqual({ useCocoaPods: true });
  });
});
