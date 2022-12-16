import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import { ensureConfigExistsAsync } from '../ensureConfigAsync';

describe(ensureConfigExistsAsync, () => {
  const projectRoot = '/alpha';
  const projectRootBeta = '/beta';

  beforeAll(() => {
    const expoPackageJson = JSON.stringify({
      name: 'expo',
      version: '40.0.0',
    });

    vol.fromJSON(
      {
        // No app.json, the config should be automatically created using the Expo SDK version in the installed package.
        'index.js': '',
        'src/index.js': '',
        'package.json': JSON.stringify({ name: 'my-app' }),
        'node_modules/expo/package.json': expoPackageJson,
      },
      projectRoot
    );
    vol.fromJSON(
      {
        'App.js': '',
      },
      projectRootBeta
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`automatically writes an Expo config when one is missing`, async () => {
    await ensureConfigExistsAsync(projectRoot);
    const config = getConfig(projectRoot);

    // Writes a static config
    expect(config.staticConfigPath).toBe('/alpha/app.json');
    expect(config.dynamicConfigPath).toBe(null);

    expect(config.exp.sdkVersion).toBe('40.0.0');
    expect(config.exp.name).toBe('my-app');
    // Ensure the internal object isn't written
    expect(config.rootConfig._internal).not.toBeDefined();
  });
});
