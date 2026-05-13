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
