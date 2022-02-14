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
      output: 'keys',
      validityDurationYears: 10,
      commonName: 'hello',
    });

    const inputDir = path.resolve(projectRoot, 'keys');

    const [certificatePEM, privateKeyPEM, publicKeyPEM] = (
      await Promise.all(
        ['certificate.pem', 'private-key.pem', 'public-key.pem'].map((fname) =>
          fs.readFile(`${inputDir}/${fname}`)
        )
      )
    ).map((buffer) => buffer.toString());

    expect(certificatePEM).toBeTruthy();
    expect(privateKeyPEM).toBeTruthy();
    expect(publicKeyPEM).toBeTruthy();

    const certificate = convertCertificatePEMToCertificate(certificatePEM);
    const keyPair = convertKeyPairPEMToKeyPair({ privateKeyPEM, publicKeyPEM });

    expect(() => validateSelfSignedCertificate(certificate, keyPair)).not.toThrow();
  });
});
