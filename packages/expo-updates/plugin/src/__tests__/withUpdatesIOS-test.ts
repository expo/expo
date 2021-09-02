import { IOSConfig } from '@expo/config-plugins';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import * as Updates from '../withUpdatesIOS';

const { getPbxproj } = IOSConfig.XcodeUtils;

const fsReal = jest.requireActual('fs') as typeof fs;
jest.mock('fs');
jest.mock('resolve-from');

const { silent } = require('resolve-from');

describe('iOS Updates config', () => {
  it(`returns correct default values from all getters if no value provided`, () => {
    expect(Updates.getSDKVersion({})).toBe(null);
    expect(Updates.getUpdateUrl({ slug: 'foo' }, null)).toBe(null);
    expect(Updates.getUpdatesCheckOnLaunch({})).toBe('ALWAYS');
    expect(Updates.getUpdatesEnabled({})).toBe(true);
    expect(Updates.getUpdatesTimeout({})).toBe(0);
  });

  it(`returns correct value from all getters if value provided`, () => {
    expect(Updates.getSDKVersion({ sdkVersion: '37.0.0' })).toBe('37.0.0');
    expect(Updates.getUpdateUrl({ slug: 'my-app' }, 'user')).toBe('https://exp.host/@user/my-app');
    expect(Updates.getUpdateUrl({ slug: 'my-app', owner: 'owner' }, 'user')).toBe(
      'https://exp.host/@owner/my-app'
    );
    expect(
      Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } })
    ).toBe('NEVER');
    expect(Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_LOAD' } })).toBe(
      'ALWAYS'
    );
    expect(Updates.getUpdatesEnabled({ updates: { enabled: false } })).toBe(false);
    expect(Updates.getUpdatesTimeout({ updates: { fallbackToCacheTimeout: 2000 } })).toBe(2000);
  });

  it('sets the correct values in Expo.plist', () => {
    expect(
      Updates.setUpdatesConfig(
        {
          sdkVersion: '37.0.0',
          slug: 'my-app',
          owner: 'owner',
          updates: {
            enabled: false,
            fallbackToCacheTimeout: 2000,
            checkAutomatically: 'ON_ERROR_RECOVERY',
          },
        },
        {},
        'user'
      )
    ).toMatchObject({
      EXUpdatesEnabled: false,
      EXUpdatesURL: 'https://exp.host/@owner/my-app',
      EXUpdatesCheckOnLaunch: 'NEVER',
      EXUpdatesLaunchWaitMs: 2000,
      EXUpdatesSDKVersion: '37.0.0',
    });
  });

  describe(Updates.ensureBundleReactNativePhaseContainsConfigurationScript, () => {
    beforeEach(() => {
      vol.reset();
      const resolveFrom = require('resolve-from');
      resolveFrom.silent = silent;
    });

    it("adds create-manifest-ios.sh line to the 'Bundle React Native code and images' build phase ", () => {
      vol.fromJSON(
        {
          'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
            path.join(__dirname, 'fixtures/project-without-create-manifest-ios.pbxproj'),
            'utf-8'
          ),
          'node_modules/expo-updates/scripts/create-manifest-ios.sh': 'whatever',
        },
        '/app'
      );

      const xcodeProject = getPbxproj('/app');
      Updates.ensureBundleReactNativePhaseContainsConfigurationScript('/app', xcodeProject);
      const bundleReactNative = Updates.getBundleReactNativePhase(xcodeProject);
      expect(bundleReactNative.shellScript).toMatchSnapshot();
    });

    it('fixes the path to create-manifest-ios.sh in case of a monorepo', () => {
      // Pseudo node module resolution since actually mocking it could prove challenging.
      // In a yarn workspace, resolve-from would be able to locate a module in any node_module folder if properly linked.
      const resolveFrom = require('resolve-from');
      resolveFrom.silent = (p, a) => {
        return silent(path.join(p, '..'), a);
      };

      vol.fromJSON(
        {
          'workspace/ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
            path.join(
              __dirname,
              'fixtures/project-with-incorrect-create-manifest-ios-path.pbxproj'
            ),
            'utf-8'
          ),
          'node_modules/expo-updates/scripts/create-manifest-ios.sh': 'whatever',
        },
        '/app'
      );
      const xcodeProject = getPbxproj('/app/workspace');
      Updates.ensureBundleReactNativePhaseContainsConfigurationScript(
        '/app/workspace',
        xcodeProject
      );
      const bundleReactNative = Updates.getBundleReactNativePhase(xcodeProject);
      expect(bundleReactNative.shellScript).toMatchSnapshot();
    });
  });
});
