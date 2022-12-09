#!/usr/bin/env node
const path = require('path');

let Fingerprint;
try {
  Fingerprint = require('@expo/fingerprint');
} catch {}
if (!Fingerprint) {
  Fingerprint = require(path.join(__dirname, '..', 'build', 'index'));
}

(async () => {
  if (process.argv.length !== 3) {
    console.log(`Usage: ${path.basename(process.argv[1])} projectRoot`);
    process.exit(1);
  }
  const projectRoot = process.argv[2];

  try {
    const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot);
    console.log(JSON.stringify(fingerprint, null, 2));
    // console.log(fingerprint.hash);
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
