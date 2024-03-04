import {
  convertKeyPairPEMToKeyPair,
  convertCertificatePEMToCertificate,
  validateSelfSignedCertificate,
} from '@expo/code-signing-certificates';
import { ExpoConfig, getConfig } from '@expo/config';
import { promises as fs } from 'fs';
import path from 'path';

import { log } from './utils/log';
import { attemptModification } from './utils/modifyConfigAsync';

type Options = { certificateInput: string; keyInput: string; keyid: string | undefined };

export async function configureCodeSigningAsync(
  projectRoot: string,
  { certificateInput, keyInput, keyid }: Options
) {
  const certificateInputDir = path.resolve(projectRoot, certificateInput);
  const keyInputDir = path.resolve(projectRoot, keyInput);

  const [certificatePEM, privateKeyPEM, publicKeyPEM] = await Promise.all([
    fs.readFile(path.join(certificateInputDir, 'certificate.pem'), 'utf8'),
    fs.readFile(path.join(keyInputDir, 'private-key.pem'), 'utf8'),
    fs.readFile(path.join(keyInputDir, 'public-key.pem'), 'utf8'),
  ]);

  const certificate = convertCertificatePEMToCertificate(certificatePEM);
  const keyPair = convertKeyPairPEMToKeyPair({ privateKeyPEM, publicKeyPEM });
  validateSelfSignedCertificate(certificate, keyPair);

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const fields: ExpoConfig['updates'] = {
    codeSigningCertificate: `./${path.relative(projectRoot, certificateInputDir)}/certificate.pem`,
    codeSigningMetadata: {
      keyid: keyid ?? 'main',
      alg: 'rsa-v1_5-sha256',
    },
  };
  await attemptModification(
    projectRoot,
    {
      updates: {
        ...exp.updates,
        ...fields,
      },
    },
    {
      updates: {
        ...fields,
      },
    }
  );

  log(`Code signing configuration written to app configuration.`);
}
