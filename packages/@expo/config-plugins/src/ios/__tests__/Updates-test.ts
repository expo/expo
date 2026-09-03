import type fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import * as Updates from '../Updates';

const fsReal = jest.requireActual('fs') as typeof fs;
jest.mock('fs');

const fixturesPath = path.resolve(__dirname, 'fixtures');
const sampleCodeSigningCertificatePath = path.resolve(fixturesPath, 'codeSigningCertificate.pem');

describe('iOS Updates config', () => {
  beforeEach(() => {
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
        updates: {
          enabled: false,
          fallbackToCacheTimeout: 2000,
          checkAutomatically: 'ON_ERROR_RECOVERY',
          useEmbeddedUpdate: false,
          codeSigningCertificate: 'hello',
          codeSigningMetadata: {
            alg: 'rsa-v1_5-sha256',
            keyid: 'test',
          },
          requestHeaders: {
            'expo-channel-name': 'test',
            testheader: 'test',
          },
          enableBsdiffPatchSupport: true,
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
      EXUpdatesHasEmbeddedUpdate: false,
      EXUpdatesCodeSigningCertificate: fsReal.readFileSync(
        sampleCodeSigningCertificatePath,
        'utf-8'
      ),
      EXUpdatesCodeSigningMetadata: { alg: 'rsa-v1_5-sha256', keyid: 'test' },
      EXUpdatesRequestHeaders: { 'expo-channel-name': 'test', testheader: 'test' },
      EXUpdatesEnableBsdiffPatchSupport: true,
    });
  });

  it('writes EXUpdatesExcludeFromBackup only when updates.excludeFromBackup is true', async () => {
    const enabled = await Updates.setUpdatesConfigAsync(
      '/app',
      {
        runtimeVersion: '1.0.0',
        slug: 'my-app',
        updates: { url: 'https://u.expo.dev/x', excludeFromBackup: true },
      },
      {} as any,
      '0.11.0'
    );
    expect(enabled).toMatchObject({ EXUpdatesExcludeFromBackup: true });

    const omitted = await Updates.setUpdatesConfigAsync(
      '/app',
      {
        runtimeVersion: '1.0.0',
        slug: 'my-app',
        updates: { url: 'https://u.expo.dev/x' },
      },
      {} as any,
      '0.11.0'
    );
    expect(omitted).not.toHaveProperty('EXUpdatesExcludeFromBackup');
  });
});
