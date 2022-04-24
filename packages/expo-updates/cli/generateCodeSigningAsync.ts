import {
  generateKeyPair,
  generateSelfSignedCodeSigningCertificate,
  convertCertificateToCertificatePEM,
  convertKeyPairToPEM,
} from '@expo/code-signing-certificates';
import assert from 'assert';
import { promises as fs } from 'fs';
import { ensureDir } from 'fs-extra';
import path from 'path';

import { log } from './utils/log';

type Options = {
  certificateValidityDurationYears: number;
  keyOutput: string;
  certificateOutput: string;
  certificateCommonName: string;
};

export async function generateCodeSigningAsync(
  projectRoot: string,
  { certificateValidityDurationYears, keyOutput, certificateOutput, certificateCommonName }: Options
) {
  const validityDurationYears = Math.floor(certificateValidityDurationYears);

  const certificateOutputDir = path.resolve(projectRoot, certificateOutput);
  const keyOutputDir = path.resolve(projectRoot, keyOutput);
  await Promise.all([ensureDir(certificateOutputDir), ensureDir(keyOutputDir)]);

  const [certificateOutputDirContents, keyOutputDirContents] = await Promise.all([
    fs.readdir(certificateOutputDir),
    fs.readdir(keyOutputDir),
  ]);
  assert(certificateOutputDirContents.length === 0, 'Certificate output directory must be empty');
  assert(keyOutputDirContents.length === 0, 'Key output directory must be empty');

  const keyPair = generateKeyPair();
  const validityNotBefore = new Date();
  const validityNotAfter = new Date();
  validityNotAfter.setFullYear(validityNotAfter.getFullYear() + validityDurationYears);
  const certificate = generateSelfSignedCodeSigningCertificate({
    keyPair,
    validityNotBefore,
    validityNotAfter,
    commonName: certificateCommonName,
  });

  const keyPairPEM = convertKeyPairToPEM(keyPair);
  const certificatePEM = convertCertificateToCertificatePEM(certificate);

  await Promise.all([
    fs.writeFile(path.join(keyOutputDir, 'public-key.pem'), keyPairPEM.publicKeyPEM),
    fs.writeFile(path.join(keyOutputDir, 'private-key.pem'), keyPairPEM.privateKeyPEM),
    fs.writeFile(path.join(certificateOutputDir, 'certificate.pem'), certificatePEM),
  ]);

  log(
    `Generated public and private keys output in ${keyOutputDir}. Remember to add them to .gitignore or to encrypt them. (e.g. with git-crypt)`
  );
  log(`Generated code signing certificate output in ${certificateOutputDir}.`);
  log(
    `To automatically configure this project for code signing, run \`yarn expo-updates codesigning:configure --certificate-input-directory=${certificateOutput} --key-input-directory=${keyOutput}\`.`
  );
}
