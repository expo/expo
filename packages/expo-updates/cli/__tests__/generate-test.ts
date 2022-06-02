import {
  convertCertificatePEMToCertificate,
  convertKeyPairPEMToKeyPair,
  validateSelfSignedCertificate,
} from '@expo/code-signing-certificates';
import { promises as fs } from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { generateCodeSigningAsync } from '../generateCodeSigningAsync';

jest.mock('fs');

describe('codesigning:generate', () => {
  afterEach(() => {
    vol.reset();
  });

  it('generates a key pair and certificate in a project directory', async () => {
    const projectRoot = '/wat';

    vol.fromJSON(
      {
        'package.json': JSON.stringify({ dependencies: { expo: '40.0.0' } }),
        'app.json': JSON.stringify({ name: 'test', slug: 'wat', sdkVersion: '40.0.0' }),
      },
      projectRoot
    );

    await generateCodeSigningAsync(projectRoot, {
      certificateOutput: 'certificates',
      keyOutput: 'keys',
      certificateValidityDurationYears: 10,
      certificateCommonName: 'hello',
    });

    const keysDir = path.resolve(projectRoot, 'keys');
    const certificateDir = path.resolve(projectRoot, 'certificates');

    const [certificatePEM, privateKeyPEM, publicKeyPEM] = (
      await Promise.all([
        fs.readFile(`${certificateDir}/certificate.pem`),
        fs.readFile(`${keysDir}/private-key.pem`),
        fs.readFile(`${keysDir}/public-key.pem`),
      ])
    ).map((buffer) => buffer.toString());

    expect(certificatePEM).toBeTruthy();
    expect(privateKeyPEM).toBeTruthy();
    expect(publicKeyPEM).toBeTruthy();

    const certificate = convertCertificatePEMToCertificate(certificatePEM);
    const keyPair = convertKeyPairPEMToKeyPair({ privateKeyPEM, publicKeyPEM });

    expect(() => validateSelfSignedCertificate(certificate, keyPair)).not.toThrow();
  });
});
