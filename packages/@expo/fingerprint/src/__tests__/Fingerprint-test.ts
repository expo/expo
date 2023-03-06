import { vol } from 'memfs';

import { createFingerprintAsync, diffFingerprintChangesAsync } from '../Fingerprint';
import type { Fingerprint } from '../Fingerprint.types';
import { normalizeOptions } from '../Options';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('resolve-from');

describe(diffFingerprintChangesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return empty array when fingerprint matched', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint = await createFingerprintAsync('/app', normalizeOptions());
    const diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
    expect(diff.length).toBe(0);
  });

  it('should return diff from new item', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint: Fingerprint = {
      sources: [],
      hash: '',
    };

    const diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "filePath": "app.json",
          "hash": "1fd2d92d50dc1da96b41795046b9ea4e30dd2b48",
          "reasons": [
            "expoConfig",
          ],
          "type": "file",
        },
      ]
    `);
  });

  it('should return diff from contents changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const packageJson = JSON.parse(vol.readFileSync('/app/package.json', 'utf8').toString());
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    const fingerprint = await createFingerprintAsync('/app', normalizeOptions());

    // first round for bumping package version which should not cause changes
    packageJson.version = '111.111.111';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    let diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
    expect(diff.length).toBe(0);

    // second round to update scripts section and it should cause changes
    packageJson.scripts ||= {};
    packageJson.scripts.postinstall = 'echo "hello"';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
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
    const fingerprint = await createFingerprintAsync('/app', normalizeOptions());
    const config = JSON.parse(vol.readFileSync('/app/app.json', 'utf8').toString());
    config.expo.jsEngine = 'jsc';
    vol.writeFileSync('/app/app.json', JSON.stringify(config, null, 2));
    const diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "filePath": "app.json",
          "hash": "9ff1b51ca9b9435e8b849bcc82e3900d70f0feee",
          "reasons": [
            "expoConfig",
          ],
          "type": "file",
        },
      ]
    `);
  });

  it('should return diff from dir changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/BareReactNative70Project.json'));
    const fingerprint = await createFingerprintAsync('/app', normalizeOptions());
    vol.writeFileSync('/app/ios/README.md', '# Adding new file in ios dir');
    const diff = await diffFingerprintChangesAsync(fingerprint, '/app', normalizeOptions());
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "filePath": "ios",
          "hash": "e4190c0af9142fe4add4842777d9aec713213cd4",
          "reasons": [
            "bareNativeDir",
          ],
          "type": "dir",
        },
      ]
    `);
  });
});
