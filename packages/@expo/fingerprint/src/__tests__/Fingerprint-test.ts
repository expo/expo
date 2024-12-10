import { vol } from 'memfs';

import {
  createFingerprintAsync,
  diffFingerprints,
  diffFingerprintChangesAsync,
} from '../Fingerprint';
import type { Fingerprint, FingerprintDiffItem } from '../Fingerprint.types';
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
    const fingerprint = await createFingerprintAsync(
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
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
      await normalizeOptionsAsync('/app', { debug: true })
    );

    // Because our resolve-from mock will pull package from expo/expo monorepo.
    // As long as we bumping package versions like react-native, we will break the snapshot.
    // Removing packages from the diff will make the test stable.

    function isPackage(item: FingerprintDiffItem): boolean {
      switch (item.op) {
        case 'added':
          return item.addedSource.type === 'contents' && item.addedSource.id.startsWith('package:');
        case 'removed':
          return (
            item.removedSource.type === 'contents' && item.removedSource.id.startsWith('package:')
          );
        case 'changed':
          return (
            (item.beforeSource.type === 'contents' &&
              item.beforeSource.id.startsWith('package:')) ||
            (item.afterSource.type === 'contents' && item.afterSource.id.startsWith('package:'))
          );
      }
    }

    const normalizedDiff = diff.filter((item) => !isPackage(item));

    expect(normalizedDiff).toMatchInlineSnapshot(`
      [
        {
          "addedSource": {
            "contents": "{"android":{"adaptiveIcon":{"backgroundColor":"#FFFFFF","foregroundImage":"./assets/adaptive-icon.png"}},"assetBundlePatterns":["**/*"],"icon":"./assets/icon.png","ios":{"supportsTablet":true},"name":"sdk47","orientation":"portrait","platforms":["android","ios","web"],"slug":"sdk47","splash":{"backgroundColor":"#ffffff","image":"./assets/splash.png","resizeMode":"contain"},"updates":{"fallbackToCacheTimeout":0},"userInterfaceStyle":"light","version":"1.0.0","web":{"favicon":"./assets/favicon.png"}}",
            "debugInfo": {
              "hash": "33b2b95de3b0b474810630e51527a2c0a6e5de9c",
            },
            "hash": "33b2b95de3b0b474810630e51527a2c0a6e5de9c",
            "id": "expoConfig",
            "reasons": [
              "expoConfig",
            ],
            "type": "contents",
          },
          "op": "added",
        },
      ]
    `);
  });

  it('should return diff from contents changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const packageJson = JSON.parse(vol.readFileSync('/app/package.json', 'utf8').toString());
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    const fingerprint = await createFingerprintAsync(
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );

    // first round for bumping package version which should not cause changes
    packageJson.version = '111.111.111';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    let diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    expect(diff.length).toBe(0);

    // second round to update scripts section and it should cause changes
    packageJson.scripts ||= {};
    packageJson.scripts.postinstall = 'echo "hello"';
    jest.doMock('/app/package.json', () => packageJson, { virtual: true });
    diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    jest.dontMock('/app/package.json');
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "afterSource": {
            "contents": "{"start":"expo start","web":"expo start --web","postinstall":"echo \\"hello\\""}",
            "debugInfo": {
              "hash": "fa4e572415a69f7f5bf749b54d5e3fafb416975a",
            },
            "hash": "fa4e572415a69f7f5bf749b54d5e3fafb416975a",
            "id": "packageJson:scripts",
            "reasons": [
              "packageJson:scripts",
            ],
            "type": "contents",
          },
          "beforeSource": {
            "contents": "{"start":"expo start","web":"expo start --web"}",
            "debugInfo": {
              "hash": "f46b716d2e56b50fe5f1ee37ce11bb8c1c0ff23c",
            },
            "hash": "f46b716d2e56b50fe5f1ee37ce11bb8c1c0ff23c",
            "id": "packageJson:scripts",
            "reasons": [
              "packageJson:scripts",
            ],
            "type": "contents",
          },
          "op": "changed",
        },
      ]
    `);
  });

  it('should return diff from file changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const fingerprint = await createFingerprintAsync(
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    const config = JSON.parse(vol.readFileSync('/app/app.json', 'utf8').toString());
    config.expo.jsEngine = 'jsc';
    vol.writeFileSync('/app/app.json', JSON.stringify(config, null, 2));
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "afterSource": {
            "contents": "{"android":{"adaptiveIcon":{"backgroundColor":"#FFFFFF","foregroundImage":"./assets/adaptive-icon.png"}},"assetBundlePatterns":["**/*"],"icon":"./assets/icon.png","ios":{"supportsTablet":true},"jsEngine":"jsc","name":"sdk47","orientation":"portrait","platforms":["android","ios","web"],"slug":"sdk47","splash":{"backgroundColor":"#ffffff","image":"./assets/splash.png","resizeMode":"contain"},"updates":{"fallbackToCacheTimeout":0},"userInterfaceStyle":"light","version":"1.0.0","web":{"favicon":"./assets/favicon.png"}}",
            "debugInfo": {
              "hash": "7068a4234e7312c6ac54b776ea4dfad0ac789b2a",
            },
            "hash": "7068a4234e7312c6ac54b776ea4dfad0ac789b2a",
            "id": "expoConfig",
            "reasons": [
              "expoConfig",
            ],
            "type": "contents",
          },
          "beforeSource": {
            "contents": "{"android":{"adaptiveIcon":{"backgroundColor":"#FFFFFF","foregroundImage":"./assets/adaptive-icon.png"}},"assetBundlePatterns":["**/*"],"icon":"./assets/icon.png","ios":{"supportsTablet":true},"name":"sdk47","orientation":"portrait","platforms":["android","ios","web"],"slug":"sdk47","splash":{"backgroundColor":"#ffffff","image":"./assets/splash.png","resizeMode":"contain"},"updates":{"fallbackToCacheTimeout":0},"userInterfaceStyle":"light","version":"1.0.0","web":{"favicon":"./assets/favicon.png"}}",
            "debugInfo": {
              "hash": "33b2b95de3b0b474810630e51527a2c0a6e5de9c",
            },
            "hash": "33b2b95de3b0b474810630e51527a2c0a6e5de9c",
            "id": "expoConfig",
            "reasons": [
              "expoConfig",
            ],
            "type": "contents",
          },
          "op": "changed",
        },
      ]
    `);
  });

  it('should return diff from dir changes', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/BareReactNative70Project.json'));
    const fingerprint = await createFingerprintAsync(
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    vol.writeFileSync('/app/ios/README.md', '# Adding new file in ios dir');
    const diff = await diffFingerprintChangesAsync(
      fingerprint,
      '/app',
      await normalizeOptionsAsync('/app', { debug: true })
    );
    expect(diff).toMatchInlineSnapshot(`
      [
        {
          "afterSource": {
            "debugInfo": {
              "children": [
                {
                  "hash": "46eda97ad0d124535dc1a3568d2eaf41f99918bb",
                  "path": "ios/Podfile",
                },
                {
                  "hash": "7f7817c5b5c47c6750e6b3e63a61b287503b753e",
                  "path": "ios/README.md",
                },
                {
                  "children": [
                    {
                      "hash": "4974dd76ad38e6197508e909b403600743f490f0",
                      "path": "ios/RN070/AppDelegate.h",
                    },
                    {
                      "hash": "7d9a4e955a64a57d06c1c75678665b18a0762a64",
                      "path": "ios/RN070/AppDelegate.mm",
                    },
                    {
                      "hash": "c714a5f52e7f50988841958a78e49fd79eb0ae24",
                      "path": "ios/RN070/Info.plist",
                    },
                    {
                      "hash": "f7a061189213fda2dafb310dbffca48572aa11aa",
                      "path": "ios/RN070/LaunchScreen.storyboard",
                    },
                    {
                      "hash": "8371ca57f1fc1e01dc98147c1eec2757de856ada",
                      "path": "ios/RN070/main.m",
                    },
                  ],
                  "hash": "63554ff4ce2305e36da157666715c0c80af6020b",
                  "path": "ios/RN070",
                },
                {
                  "children": [
                    {
                      "hash": "7ff63b930b59c59959021a137187564fdfc365a5",
                      "path": "ios/RN070.xcodeproj/project.pbxproj",
                    },
                    {
                      "children": [
                        {
                          "children": [
                            {
                              "hash": "74c6ac16f55d298bbf1e868caa98faef8ea246f8",
                              "path": "ios/RN070.xcodeproj/xcshareddata/xcschemes/RN070.xcscheme",
                            },
                          ],
                          "hash": "e53d4edf50654beef7b32fa172a1849cc4ada297",
                          "path": "ios/RN070.xcodeproj/xcshareddata/xcschemes",
                        },
                      ],
                      "hash": "bd2f14dda4566aaa75058c4429508924182254a8",
                      "path": "ios/RN070.xcodeproj/xcshareddata",
                    },
                  ],
                  "hash": "303761ac4e91ecc2bc8dfa5df2232c9ad256e81d",
                  "path": "ios/RN070.xcodeproj",
                },
                {
                  "children": [
                    {
                      "hash": "bc055ab27e4fcaaca1d6bcbefa5c4983fe751d38",
                      "path": "ios/RN070.xcworkspace/contents.xcworkspacedata",
                    },
                  ],
                  "hash": "b4cfe73d0c9589df09250a2391d71368372eaa55",
                  "path": "ios/RN070.xcworkspace",
                },
                {
                  "children": [
                    {
                      "hash": "4239984ce09b6ec99e648d940c44a645b1accf61",
                      "path": "ios/RN070Tests/Info.plist",
                    },
                    {
                      "hash": "7f5bcf69939f7eb989212e3fb65deb221b2471ec",
                      "path": "ios/RN070Tests/RN070Tests.m",
                    },
                  ],
                  "hash": "5b4b7597e5fd27ecf80d9b55d711b497b872cbb6",
                  "path": "ios/RN070Tests",
                },
              ],
              "hash": "a1d299fe057e87bb79dfd0eb6e33cee98d626aa1",
              "path": "ios",
            },
            "filePath": "ios",
            "hash": "a1d299fe057e87bb79dfd0eb6e33cee98d626aa1",
            "reasons": [
              "bareNativeDir",
            ],
            "type": "dir",
          },
          "beforeSource": {
            "debugInfo": {
              "children": [
                {
                  "hash": "46eda97ad0d124535dc1a3568d2eaf41f99918bb",
                  "path": "ios/Podfile",
                },
                {
                  "children": [
                    {
                      "hash": "4974dd76ad38e6197508e909b403600743f490f0",
                      "path": "ios/RN070/AppDelegate.h",
                    },
                    {
                      "hash": "7d9a4e955a64a57d06c1c75678665b18a0762a64",
                      "path": "ios/RN070/AppDelegate.mm",
                    },
                    {
                      "hash": "c714a5f52e7f50988841958a78e49fd79eb0ae24",
                      "path": "ios/RN070/Info.plist",
                    },
                    {
                      "hash": "f7a061189213fda2dafb310dbffca48572aa11aa",
                      "path": "ios/RN070/LaunchScreen.storyboard",
                    },
                    {
                      "hash": "8371ca57f1fc1e01dc98147c1eec2757de856ada",
                      "path": "ios/RN070/main.m",
                    },
                  ],
                  "hash": "63554ff4ce2305e36da157666715c0c80af6020b",
                  "path": "ios/RN070",
                },
                {
                  "children": [
                    {
                      "hash": "7ff63b930b59c59959021a137187564fdfc365a5",
                      "path": "ios/RN070.xcodeproj/project.pbxproj",
                    },
                    {
                      "children": [
                        {
                          "children": [
                            {
                              "hash": "74c6ac16f55d298bbf1e868caa98faef8ea246f8",
                              "path": "ios/RN070.xcodeproj/xcshareddata/xcschemes/RN070.xcscheme",
                            },
                          ],
                          "hash": "e53d4edf50654beef7b32fa172a1849cc4ada297",
                          "path": "ios/RN070.xcodeproj/xcshareddata/xcschemes",
                        },
                      ],
                      "hash": "bd2f14dda4566aaa75058c4429508924182254a8",
                      "path": "ios/RN070.xcodeproj/xcshareddata",
                    },
                  ],
                  "hash": "303761ac4e91ecc2bc8dfa5df2232c9ad256e81d",
                  "path": "ios/RN070.xcodeproj",
                },
                {
                  "children": [
                    {
                      "hash": "bc055ab27e4fcaaca1d6bcbefa5c4983fe751d38",
                      "path": "ios/RN070.xcworkspace/contents.xcworkspacedata",
                    },
                  ],
                  "hash": "b4cfe73d0c9589df09250a2391d71368372eaa55",
                  "path": "ios/RN070.xcworkspace",
                },
                {
                  "children": [
                    {
                      "hash": "4239984ce09b6ec99e648d940c44a645b1accf61",
                      "path": "ios/RN070Tests/Info.plist",
                    },
                    {
                      "hash": "7f5bcf69939f7eb989212e3fb65deb221b2471ec",
                      "path": "ios/RN070Tests/RN070Tests.m",
                    },
                  ],
                  "hash": "5b4b7597e5fd27ecf80d9b55d711b497b872cbb6",
                  "path": "ios/RN070Tests",
                },
              ],
              "hash": "6c3252b4142d8dd7bbebfafba91a42328ecf80c5",
              "path": "ios",
            },
            "filePath": "ios",
            "hash": "6c3252b4142d8dd7bbebfafba91a42328ecf80c5",
            "reasons": [
              "bareNativeDir",
            ],
            "type": "dir",
          },
          "op": "changed",
        },
      ]
    `);
  });
});

describe(diffFingerprints, () => {
  it('should return diff from new items', () => {
    const fingerprint1: Fingerprint = {
      sources: [
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
      ],
      hash: '111',
    };
    const fingerprint2: Fingerprint = {
      sources: [
        { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
        { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
      ],
      hash: '222',
    };
    expect(diffFingerprints(fingerprint1, fingerprint2)).toEqual([
      {
        op: 'added',
        addedSource: { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
      },
      {
        op: 'added',
        addedSource: { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
      },
    ]);
  });

  it('should return diff from deleted items', () => {
    const fingerprint1: Fingerprint = {
      sources: [
        { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
        { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
      ],
      hash: '111',
    };
    const fingerprint2: Fingerprint = {
      sources: [
        { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
      ],
      hash: '222',
    };
    expect(diffFingerprints(fingerprint1, fingerprint2)).toEqual([
      {
        op: 'removed',
        removedSource: { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
      },
    ]);
  });

  it('should return diff from new items - same array size with added/removed ops', () => {
    const fingerprint1: Fingerprint = {
      sources: [
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
        { type: 'contents', id: 'contents2', contents: '2', reasons: [''], hash: 'contents2' },
        { type: 'contents', id: 'contents3', contents: '3', reasons: [''], hash: 'contents3' },
      ],
      hash: '111',
    };
    const fingerprint2: Fingerprint = {
      sources: [
        { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
        { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
        { type: 'contents', id: 'contents1', contents: '1', reasons: [''], hash: 'contents1' },
      ],
      hash: '222',
    };
    expect(diffFingerprints(fingerprint1, fingerprint2)).toEqual([
      {
        op: 'added',
        addedSource: { type: 'file', filePath: 'ios/Podfile', reasons: [''], hash: 'file1' },
      },
      {
        op: 'added',
        addedSource: { type: 'dir', filePath: 'android', reasons: [''], hash: 'dir1' },
      },
      {
        op: 'removed',
        removedSource: {
          type: 'contents',
          id: 'contents2',
          contents: '2',
          reasons: [''],
          hash: 'contents2',
        },
      },
      {
        op: 'removed',
        removedSource: {
          type: 'contents',
          id: 'contents3',
          contents: '3',
          reasons: [''],
          hash: 'contents3',
        },
      },
    ]);
  });
});

describe('function api stability', () => {
  const Fingerprint = require('../index');
  afterEach(() => {
    vol.reset();
  });

  function getCreateFingerprintFixedArgs(): [string, Record<string, any>] {
    // The fixed options and arguments as called by eas-cli
    const FIXED_OPTIONS = {
      platforms: ['android', 'ios'],
      ignorePaths: ['android/**/*', 'ios/**/*'],
      debug: true,
    };
    const PROJECT_ROOT = '/app';
    return [PROJECT_ROOT, FIXED_OPTIONS];
  }

  it('createFingerprintAsync - maintains consistent hash and function signature expected by eas-cli', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const createFingerprintFixedArgs = getCreateFingerprintFixedArgs();
    const fingerprint = await Fingerprint.createFingerprintAsync(...createFingerprintFixedArgs);

    expect(fingerprint).toEqual(
      expect.objectContaining({
        sources: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/file|dir|contents/),
            reasons: expect.arrayContaining([expect.any(String)]),
            hash: expect.any(String),
          }),
        ]),
        hash: expect.any(String),
      })
    );
    fingerprint.sources.forEach((source) => {
      if (source.type === 'file' || source.type === 'dir') {
        expect(source).toEqual(expect.objectContaining({ filePath: expect.any(String) }));
      } else if (source.type === 'contents') {
        expect(source).toEqual(
          expect.objectContaining({ id: expect.any(String), contents: expect.any(String) })
        );
      }
    });
  });

  it('diffFingerprint - accepts output from createFingerprintAsync with stable function signature expected by eas-cli', async () => {
    vol.fromJSON(require('../sourcer/__tests__/fixtures/ExpoManaged47Project.json'));
    const createFingerprintFixedArgs = getCreateFingerprintFixedArgs();
    const fingerprint = await Fingerprint.createFingerprintAsync(...createFingerprintFixedArgs);

    // The fixed arguments as called by eas-cli
    const FIXED_ARGS = [fingerprint, fingerprint];
    expect(Fingerprint.diffFingerprints(...FIXED_ARGS)).toBeDefined();
  });
});
