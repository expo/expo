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

describe('sanitizeTemplateAsync with swiftpm', () => {
  const readAppJson = () => JSON.parse(String(vol.readFileSync('/project/app.json')));

  const createProject = (appJson: object) =>
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'project', version: '0.0.0' }),
      '/project/app.json': JSON.stringify(appJson),
    });

  it('enables experiments.swiftPackageManager in a flat app.json', async () => {
    createProject({ name: 'project' });

    await sanitizeTemplateAsync('/project', { swiftpm: true });

    expect(readAppJson()).toEqual({
      name: 'project',
      slug: 'project',
      experiments: { swiftPackageManager: true },
    });
  });

  it('enables experiments.swiftPackageManager under the expo key', async () => {
    createProject({ expo: { name: 'project' } });

    await sanitizeTemplateAsync('/project', { swiftpm: true });

    expect(readAppJson()).toEqual({
      expo: {
        name: 'project',
        slug: 'project',
        experiments: { swiftPackageManager: true },
      },
    });
  });

  it('keeps existing experiments', async () => {
    createProject({ expo: { experiments: { typedRoutes: true, reactCompiler: true } } });

    await sanitizeTemplateAsync('/project', { swiftpm: true });

    expect(readAppJson().expo.experiments).toEqual({
      typedRoutes: true,
      reactCompiler: true,
      swiftPackageManager: true,
    });
  });

  it('leaves app.json without the setting when swiftpm is off', async () => {
    createProject({ expo: { experiments: { typedRoutes: true } } });

    await sanitizeTemplateAsync('/project', { swiftpm: false });

    expect(readAppJson()).toEqual({
      expo: { name: 'project', slug: 'project', experiments: { typedRoutes: true } },
    });
  });

  it('leaves a flat app.json without the setting when no options are passed', async () => {
    createProject({ name: 'project' });

    await sanitizeTemplateAsync('/project');

    expect(readAppJson()).toEqual({ name: 'project', slug: 'project' });
  });
});
