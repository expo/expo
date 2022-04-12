import {
  convertKeyPairPEMToKeyPair,
  convertCertificatePEMToCertificate,
  validateSelfSignedCertificate,
} from '@expo/code-signing-certificates';
import { getConfig } from '@expo/config';
import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';

import { log } from './utils/log';
import { attemptModification } from './utils/modifyConfigAsync';

type Options = { input?: string };

export async function configureCodeSigningAsync(projectRoot: string, { input }: Options) {
  assert(typeof input === 'string', '--input must be a string');

  const inputDir = path.resolve(projectRoot, input);

  const [certificatePEM, privateKeyPEM, publicKeyPEM] = await Promise.all(
    ['certificate.pem', 'private-key.pem', 'public-key.pem'].map((fname) =>
      fs.readFile(path.join(inputDir, fname), 'utf8')
    )
  );

  const certificate = convertCertificatePEMToCertificate(certificatePEM);
  const keyPair = convertKeyPairPEMToKeyPair({ privateKeyPEM, publicKeyPEM });
  validateSelfSignedCertificate(certificate, keyPair);

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  // TODO(wschurman) type as ExpoConfig['updates'] when typedefs are updated
  const fields: any = {
    codeSigningCertificate: `./${path.relative(projectRoot, inputDir)}/certificate.pem`,
    codeSigningMetadata: {
      keyid: 'main',
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

  log(`Code signing configured for expo-updates (configuration written to app.json)`);
}
