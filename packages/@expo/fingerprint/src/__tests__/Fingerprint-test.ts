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
    expect(diff).toMatchInlineSnapshot(`
      [
        {
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
        {
          "contents": "{"name":"react-native","version":"0.74.0-rc.3","description":"A framework for building native apps using React","license":"MIT","repository":{"type":"git","url":"https://github.com/facebook/react-native.git","directory":"packages/react-native"},"homepage":"https://reactnative.dev/","keywords":["react","react-native","android","ios","mobile","cross-platform","app-framework","mobile-development"],"bugs":"https://github.com/facebook/react-native/issues","engines":{"node":">=18"},"bin":"./cli.js","types":"types","jest-junit":{"outputDirectory":"reports/junit","outputName":"js-test-results.xml"},"files":["android","build.gradle.kts","cli.js","flow","gradle.properties","gradle/libs.versions.toml","index.js","interface.js","jest-preset.js","jest","Libraries","LICENSE","local-cli","React-Core.podspec","react-native.config.js","React.podspec","React","!React/Fabric/RCTThirdPartyFabricComponentsProvider.*","ReactAndroid","ReactApple","ReactCommon","README.md","rn-get-polyfills.js","scripts/compose-source-maps.js","scripts/find-node-for-xcode.sh","scripts/generate-codegen-artifacts.js","scripts/generate-provider-cli.js","scripts/generate-specs-cli.js","scripts/codegen","!scripts/codegen/__tests__","!scripts/codegen/__test_fixtures__","scripts/hermes/hermes-utils.js","scripts/hermes/prepare-hermes-for-build.js","scripts/ios-configure-glog.sh","scripts/xcode/with-environment.sh","scripts/native_modules.rb","scripts/node-binary.sh","scripts/packager.sh","scripts/packager-reporter.js","scripts/react_native_pods_utils/script_phases.rb","scripts/react_native_pods_utils/script_phases.sh","scripts/react_native_pods.rb","scripts/cocoapods","!scripts/cocoapods/__tests__","scripts/react-native-xcode.sh","sdks/.hermesversion","sdks/hermes-engine","sdks/hermesc","settings.gradle.kts","src","template.config.js","template","!template/node_modules","!template/package-lock.json","!template/yarn.lock","third-party-podspecs","types"],"scripts":{"prepack":"cp ../../README.md .","featureflags-check":"node ./scripts/featureflags/index.js --verify-unchanged","featureflags-update":"node ./scripts/featureflags/index.js"},"peerDependencies":{"react":"18.2.0"},"dependencies":{"@jest/create-cache-key-function":"^29.6.3","@react-native-community/cli":"13.6.1","@react-native-community/cli-platform-android":"13.6.1","@react-native-community/cli-platform-ios":"13.6.1","@react-native/assets-registry":"0.74.0","@react-native/codegen":"0.74.2","@react-native/community-cli-plugin":"0.74.5","@react-native/gradle-plugin":"0.74.1","@react-native/js-polyfills":"0.74.0","@react-native/normalize-colors":"0.74.1","@react-native/virtualized-lists":"0.74.1","abort-controller":"^3.0.0","anser":"^1.4.9","ansi-regex":"^5.0.0","base64-js":"^1.5.1","chalk":"^4.0.0","event-target-shim":"^5.0.1","flow-enums-runtime":"^0.0.6","invariant":"^2.2.4","jest-environment-node":"^29.6.3","jsc-android":"^250231.0.0","memoize-one":"^5.0.0","metro-runtime":"^0.80.3","metro-source-map":"^0.80.3","mkdirp":"^0.5.1","nullthrows":"^1.1.1","pretty-format":"^26.5.2","promise":"^8.3.0","react-devtools-core":"^5.0.0","react-refresh":"^0.14.0","react-shallow-renderer":"^16.15.0","regenerator-runtime":"^0.13.2","scheduler":"0.24.0-canary-efb381bbf-20230505","stacktrace-parser":"^0.1.10","whatwg-fetch":"^3.0.0","ws":"^6.2.2","yargs":"^17.6.2"},"codegenConfig":{"libraries":[{"name":"FBReactNativeSpec","type":"modules","ios":{},"android":{},"jsSrcsDir":"src"},{"name":"rncore","type":"components","ios":{},"android":{},"jsSrcsDir":"src"}]}}",
          "debugInfo": {
            "hash": "78296bc20724e4d5941cd83d3bbcea6bb10fcbeb",
          },
          "hash": "78296bc20724e4d5941cd83d3bbcea6bb10fcbeb",
          "id": "package:react-native",
          "reasons": [
            "package:react-native",
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
          "contents": "{"start":"expo start","android":"expo start --android","ios":"expo start --ios","web":"expo start --web","postinstall":"echo \\"hello\\""}",
          "debugInfo": {
            "hash": "47f4d7bae018eb17440153f09977113501eace30",
          },
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
      ]
    `);
  });
});
