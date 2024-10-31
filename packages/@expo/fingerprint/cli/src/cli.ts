#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

(async () => {
  const Fingerprint = await import('../../build/index.js');

  if (process.argv.length !== 3 && process.argv.length !== 4) {
    console.log(`Usage: ${path.basename(process.argv[1])} projectRoot [fingerprintFileToDiff]`);
    process.exit(1);
  }

  let comparatorFingerprint;
  if (process.argv.length === 4) {
    const comparator = process.argv[3];
    try {
      comparatorFingerprint = JSON.parse(fs.readFileSync(comparator, 'utf-8'));
    } catch (e: any) {
      console.log(`Unable to diff with fingerprint file ${comparator}: ${e.message}`);
      process.exit(1);
    }
  }

  const projectRoot = process.argv[2];

  const options = {
    debug: !!process.env.DEBUG,
    useRNCoreAutolinkingFromExpo: process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO
      ? ['1', 'true'].includes(process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO)
      : undefined,
  };
  try {
    if (comparatorFingerprint) {
      const diff = await Fingerprint.diffFingerprintChangesAsync(
        comparatorFingerprint,
        projectRoot,
        options
      );
      console.log(JSON.stringify(diff, null, 2));
    } else {
      const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot, options);
      console.log(JSON.stringify(fingerprint, null, 2));
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
