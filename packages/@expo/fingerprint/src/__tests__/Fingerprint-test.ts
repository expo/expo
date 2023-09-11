import { vol } from 'memfs';

import { createFingerprintAsync, diffFingerprintChangesAsync } from '../Fingerprint';
import type { Fingerprint } from '../Fingerprint.types';
import { normalizeOptionsAsync } from '../Options';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('resolve-from');

describe(diffFingerprintChangesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return empty array when fingerprint matched', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint = await createFingerprintAsync('/app', await normalizeOptionsAsync('/app'));
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(diff.length).toBe(0);
  });

  it('should return diff from new item', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint: Fingerprint = {
      sources: [],
      hash: '',
    };

    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "contents": "{"android":{"adaptiveIcon":{"backgroundColor":"#FFFFFF","foregroundImage":"./assets/adaptive-icon.png"}},"assetBundlePatterns":["**/*"],"icon":"./assets/icon.png","ios":{"supportsTablet":true},"name":"sdk47","orientation":"portrait","platforms":["android","ios","web"],"slug":"sdk47","splash":{"backgroundColor":"#ffffff","image":"./assets/splash.png","resizeMode":"contain"},"updates":{"fallbackToCacheTimeout":0},"userInterfaceStyle":"light","version":"1.0.0","web":{"favicon":"./assets/favicon.png"}}",
          "hash": "33b2b95de3b0b474810630e51527a2c0a6e5de9c",
          "id": "expoConfig",
          "reasons": [
            "expoConfig",
          ],
          "type": "contents",
        },
      ]
    `);
  });

  it('should return diff from contents changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const packageJson = JSON.parse(vol.readFileSync('/app/package.json', 'utf8').toString());
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    const fingerprint = await createFingerprintAsync('/app', await normalizeOptionsAsync('/app'));

    // first round for bumping package version which should not cause changes
    packageJson.version = '111.111.111';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    let diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(diff.length).toBe(0);

    // second round to update scripts section and it should cause changes
    packageJson.scripts ||= {};
    packageJson.scripts.postinstall = 'echo "hello"';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    jest.dontMock('/app/package.json');
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "contents": "{"start":"expo start","android":"expo start --android","ios":"expo start --ios","web":"expo start --web","postinstall":"echo \\"hello\\""}",
          "hash": "47f4d7bae018eb17440153f09977113501eace30",
          "id": "packageJson:scripts",
          "reasons": [
            "packageJson:scripts",
          ],
          "type": "contents",
        },
      ]
    `);
  });

  it('should return diff from file changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint = await createFingerprintAsync('/app', await normalizeOptionsAsync('/app'));
    const config = JSON.parse(vol.readFileSync('/app/app.json', 'utf8').toString());
    config.expo.jsEngine = 'jsc';
    vol.writeFileSync('/app/app.json', JSON.stringify(config, null, 2));
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "contents": "{"android":{"adaptiveIcon":{"backgroundColor":"#FFFFFF","foregroundImage":"./assets/adaptive-icon.png"}},"assetBundlePatterns":["**/*"],"icon":"./assets/icon.png","ios":{"supportsTablet":true},"jsEngine":"jsc","name":"sdk47","orientation":"portrait","platforms":["android","ios","web"],"slug":"sdk47","splash":{"backgroundColor":"#ffffff","image":"./assets/splash.png","resizeMode":"contain"},"updates":{"fallbackToCacheTimeout":0},"userInterfaceStyle":"light","version":"1.0.0","web":{"favicon":"./assets/favicon.png"}}",
          "hash": "7068a4234e7312c6ac54b776ea4dfad0ac789b2a",
          "id": "expoConfig",
          "reasons": [
            "expoConfig",
          ],
          "type": "contents",
        },
      ]
    `);
  });

  it('should return diff from dir changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/BareReactNative70Project.json'));
    const fingerprint = await createFingerprintAsync('/app', await normalizeOptionsAsync('/app'));
    vol.writeFileSync('/app/ios/README.md', '# Adding new file in ios dir');
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app')
    );
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "filePath": "ios",
          "hash": "a1d299fe057e87bb79dfd0eb6e33cee98d626aa1",
          "reasons": [
            "bareNativeDir",
          ],
          "type": "dir",
        },
      ]
    `);
  });
});
