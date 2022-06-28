import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import * as Updates from '../Updates';
import { getPbxproj } from '../utils/Xcodeproj';

const fsReal = jest.requireActual('fs') as typeof fs;
jest.mock('fs');
jest.mock('resolve-from');

const { silent } = require('resolve-from');

const fixturesPath = path.resolve(__dirname, 'fixtures');
const sampleCodeSigningCertificatePath = path.resolve(fixturesPath, 'codeSigningCertificate.pem');

describe('iOS Updates config', () => {
  beforeEach(() => {
    const resolveFrom = require('resolve-from');
    resolveFrom.silent = silent;
    vol.reset();
  });

  it('sets the correct values in Expo.plist', () => {
    vol.fromJSON({
      '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
    });

    expect(
      Updates.setUpdatesConfig(
        '/app',
        {
          sdkVersion: '37.0.0',
          slug: 'my-app',
          owner: 'owner',
          updates: {
            enabled: false,
            fallbackToCacheTimeout: 2000,
            checkAutomatically: 'ON_ERROR_RECOVERY',
            codeSigningCertificate: 'hello',
            codeSigningMetadata: {
              alg: 'rsa-v1_5-sha256',
              keyid: 'test',
            },
          },
        },
        {} as any,
        'user',
        '0.11.0'
      )
    ).toMatchObject({
      EXUpdatesEnabled: false,
      EXUpdatesURL: 'https://exp.host/@owner/my-app',
      EXUpdatesCheckOnLaunch: 'ERROR_RECOVERY_ONLY',
      EXUpdatesLaunchWaitMs: 2000,
      EXUpdatesSDKVersion: '37.0.0',
      EXUpdatesCodeSigningCertificate: fsReal.readFileSync(
        sampleCodeSigningCertificatePath,
        'utf-8'
      ),
      EXUpdatesCodeSigningMetadata: { alg: 'rsa-v1_5-sha256', keyid: 'test' },
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
