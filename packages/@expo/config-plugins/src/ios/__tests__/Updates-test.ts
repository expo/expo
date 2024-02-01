import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import * as Updates from '../Updates';

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

  it('sets the correct values in Expo.plist', async () => {
    vol.fromJSON({
      '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
    });

    const config = await Updates.setUpdatesConfigAsync(
      '/app',
      {
        sdkVersion: '37.0.0',
        runtimeVersion: {
          policy: 'sdkVersion',
        },
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
          requestHeaders: {
            'expo-channel-name': 'test',
            testheader: 'test',
          },
        },
      },
      {} as any,
      '0.11.0'
    );

    expect(config).toMatchObject({
      EXUpdatesEnabled: false,
      EXUpdatesCheckOnLaunch: 'ERROR_RECOVERY_ONLY',
      EXUpdatesLaunchWaitMs: 2000,
      EXUpdatesRuntimeVersion: 'exposdk:37.0.0',
      EXUpdatesCodeSigningCertificate: fsReal.readFileSync(
        sampleCodeSigningCertificatePath,
        'utf-8'
      ),
      EXUpdatesCodeSigningMetadata: { alg: 'rsa-v1_5-sha256', keyid: 'test' },
      EXUpdatesRequestHeaders: { 'expo-channel-name': 'test', testheader: 'test' },
    });
  });
});
