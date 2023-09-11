import { vol } from 'memfs';

import { getConfig, getWebOutputPath } from '../Config';

jest.mock('fs');

describe(getWebOutputPath, () => {
  beforeAll(() => {
    const packageJson = JSON.stringify(
      {
        name: 'testing123',
        version: '0.1.0',
        main: 'index.js',
      },
      null,
      2
    );

    const appJson = {
      name: 'testing 123',
      version: '0.1.0',
      slug: 'testing-123',
      sdkVersion: '100.0.0',
    };

    vol.fromJSON({
      '/standard/package.json': JSON.stringify(packageJson),
      '/standard/app.json': JSON.stringify({ expo: appJson }),
      '/custom/package.json': JSON.stringify(packageJson),
      '/custom/app.json': JSON.stringify({
        expo: { ...appJson, web: { build: { output: 'defined-in-config' } } },
      }),
    });
  });
  afterAll(() => vol.reset());

  it('uses the default output build path for web', () => {
    const { exp } = getConfig('/standard');
    const outputPath = getWebOutputPath(exp);
    expect(outputPath).toBe('web-build');
  });

  it('uses a custom output build path from the config', () => {
    const { exp } = getConfig('/custom');
    const outputPath = getWebOutputPath(exp);
    expect(outputPath).toBe('defined-in-config');
  });

  beforeEach(() => {
    delete process.env.WEBPACK_BUILD_OUTPUT_PATH;
  });
  it('uses an env variable for the web build path', () => {
    process.env.WEBPACK_BUILD_OUTPUT_PATH = 'custom-env-path';

    for (const project of ['/custom', '/standard']) {
      const { exp } = getConfig(project);
      const outputPath = getWebOutputPath(exp);
      expect(outputPath).toBe('custom-env-path');
    }
  });
});
