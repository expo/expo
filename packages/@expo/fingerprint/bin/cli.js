#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

let Fingerprint;
try {
  Fingerprint = require('@expo/fingerprint');
} catch { }
if (!Fingerprint) {
  Fingerprint = require(path.join(__dirname, '..', 'build', 'index'));
}

(async () => {
  if (process.argv.length !== 3 && process.argv.length !== 4) {
    console.log(`Usage: ${path.basename(process.argv[1])} projectRoot [fingerprintFileToDiff]`);
    process.exit(1);
  }

  let comparatorFingerprint;
  if (process.argv.length === 4) {
    const comparator = process.argv[3];
    try {
      comparatorFingerprint = JSON.parse(fs.readFileSync(comparator));
    } catch (e) {
      console.log(`Unable to diff with fingerprint file ${comparator}: ${e.message}`);
      process.exit(1);
    }
  }

  const projectRoot = process.argv[2];

  const options = {
    debug: !!process.env.DEBUG,
  }
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
    // console.log(fingerprint.hash);
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
