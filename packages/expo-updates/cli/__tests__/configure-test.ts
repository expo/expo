import {
  convertCertificateToCertificatePEM,
  convertKeyPairToPEM,
  generateKeyPair,
  generateSelfSignedCodeSigningCertificate,
} from '@expo/code-signing-certificates';
import { getConfig } from '@expo/config';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { configureCodeSigningAsync } from '../configureCodeSigningAsync';

jest.mock('fs');

const fsReal = jest.requireActual('fs') as typeof fs;

describe('codesigning:configure', () => {
  afterEach(() => {
    vol.reset();
  });

  describe.each([
    { keyid: undefined, expectedKeyId: 'main' },
    { keyid: 'blah', expectedKeyId: 'blah' },
  ])('with %p', ({ keyid, expectedKeyId }) => {
    it('configures a project with a certificate', async () => {
      const projectRoot = '/wat';

      const keyPair = generateKeyPair();
      const validityNotBefore = new Date();
      const validityNotAfter = new Date();
      validityNotAfter.setFullYear(validityNotAfter.getFullYear() + 1);
      const certificate = generateSelfSignedCodeSigningCertificate({
        keyPair,
        validityNotBefore,
        validityNotAfter,
        commonName: 'hello',
      });

      const keyPairPEM = convertKeyPairToPEM(keyPair);
      const certificatePEM = convertCertificateToCertificatePEM(certificate);

      const expoPackageJson = JSON.stringify({
        name: 'expo',
        version: '40.0.0',
      });

      vol.fromJSON(
        {
          'package.json': JSON.stringify({ dependencies: { expo: '40.0.0' } }),
          'app.json': JSON.stringify({ name: 'test', slug: 'wat', sdkVersion: '40.0.0' }),
          'certificates/certificate.pem': certificatePEM,
          'keys/private-key.pem': keyPairPEM.privateKeyPEM,
          'keys/public-key.pem': keyPairPEM.publicKeyPEM,
          'node_modules/expo/package.json': expoPackageJson,
        },
        projectRoot
      );

      const configBefore = getConfig(projectRoot);
      expect((configBefore.exp.updates as any)?.codeSigningCertificate).toBeUndefined();

      await configureCodeSigningAsync(projectRoot, {
        certificateInput: 'certificates',
        keyInput: 'keys',
        keyid,
      });

      const config = getConfig(projectRoot);
      expect((config.exp.updates as any).codeSigningCertificate).toEqual(
        './certificates/certificate.pem'
      );
      expect((config.exp.updates as any).codeSigningMetadata).toMatchObject({
        keyid: expectedKeyId,
        alg: 'rsa-v1_5-sha256',
      });
    });
  });

  it('validates the certificate', async () => {
    const projectRoot = '/wat';

    const expoPackageJson = JSON.stringify({
      name: 'expo',
      version: '40.0.0',
    });

    const [invalidCertificatePEM, invalidPrivateKeyPEM, invalidPublicKeyPEM] = await Promise.all([
      fsReal.promises.readFile(path.join(__dirname, 'fixtures/invalid-certificate.pem'), 'utf8'),
      fsReal.promises.readFile(path.join(__dirname, 'fixtures/invalid-private-key.pem'), 'utf8'),
      fsReal.promises.readFile(path.join(__dirname, 'fixtures/invalid-public-key.pem'), 'utf8'),
    ]);

    vol.fromJSON(
      {
        'package.json': JSON.stringify({ dependencies: { expo: '40.0.0' } }),
        'app.json': JSON.stringify({ name: 'test', slug: 'wat', sdkVersion: '40.0.0' }),
        'certificates/certificate.pem': invalidCertificatePEM,
        'keys/private-key.pem': invalidPrivateKeyPEM,
        'keys/public-key.pem': invalidPublicKeyPEM,
        'node_modules/expo/package.json': expoPackageJson,
      },
      projectRoot
    );

    const configBefore = getConfig(projectRoot);
    expect((configBefore.exp.updates as any)?.codeSigningCertificate).toBeUndefined();

    await expect(
      configureCodeSigningAsync(projectRoot, {
        certificateInput: 'certificates',
        keyInput: 'keys',
        keyid: undefined,
      })
    ).rejects.toThrow('Certificate validity expired');

    const config = getConfig(projectRoot);
    expect((config.exp.updates as any)?.codeSigningCertificate).toBeUndefined();
    expect((config.exp.updates as any)?.codeSigningMetadata).toBeUndefined();
  });
});
