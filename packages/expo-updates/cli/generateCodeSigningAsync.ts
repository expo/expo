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

type Options = { output?: string; validityDurationYears?: number; commonName?: string };

export async function generateCodeSigningAsync(
  projectRoot: string,
  { output, validityDurationYears: validityDurationYearsNumber, commonName }: Options
) {
  assert(typeof output === 'string', '--output must be a string');
  assert(
    typeof validityDurationYearsNumber === 'number',
    '--validity-duration-years must be a number'
  );
  assert(typeof commonName === 'string', '--common-name must be a string');

  const validityDurationYears = Math.floor(validityDurationYearsNumber);

  const outputDir = path.resolve(projectRoot, output);
  await ensureDir(outputDir);

  const isDirectoryEmpty = (await fs.readdir(outputDir)).length === 0;
  assert(isDirectoryEmpty, 'Output directory must be empty');

  const keyPair = generateKeyPair();
  const validityNotBefore = new Date();
  const validityNotAfter = new Date();
  validityNotAfter.setFullYear(validityNotAfter.getFullYear() + validityDurationYears);
  const certificate = generateSelfSignedCodeSigningCertificate({
    keyPair,
    validityNotBefore,
    validityNotAfter,
    commonName,
  });

  const keyPairPEM = convertKeyPairToPEM(keyPair);
  const certificatePEM = convertCertificateToCertificatePEM(certificate);

  await Promise.all([
    fs.writeFile(path.join(outputDir, 'public-key.pem'), keyPairPEM.publicKeyPEM),
    fs.writeFile(path.join(outputDir, 'private-key.pem'), keyPairPEM.privateKeyPEM),
    fs.writeFile(path.join(outputDir, 'certificate.pem'), certificatePEM),
  ]);

  log(`Generated keys and certificates output to ${outputDir}`);
}
