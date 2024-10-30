#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let Fingerprint;
try {
  Fingerprint = require('@expo/fingerprint');
} catch {}
if (!Fingerprint) {
  Fingerprint = require(path.join(__dirname, '..', 'build', 'index'));
}

(async () => {
  const argsWithoutOptions = [];
  const platforms = [];
  const pathsToIgnore = [];
  let shouldAddToIgnore = false;
  let shouldAddToPlatforms = false;
  let isDebug = false;
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--ignore-path') {
      shouldAddToIgnore = true;
    } else if (shouldAddToIgnore) {
      pathsToIgnore.push(arg);
      shouldAddToIgnore = false;
    } else if (arg === '--platform') {
      shouldAddToPlatforms = true;
    } else if (shouldAddToPlatforms) {
      platforms.push(arg);
      shouldAddToPlatforms = false;
    } else if (arg === '--debug') {
      isDebug = true;
    } else {
      argsWithoutOptions.push(arg);
    }
  }

  if (argsWithoutOptions.length !== 3 && argsWithoutOptions.length !== 4) {
    console.log(
      `Usage: ${path.basename(argsWithoutOptions[1])} projectRoot [fingerprintFileToDiff]`
    );
    process.exit(1);
  }

  let comparatorFingerprint;
  if (argsWithoutOptions.length === 4) {
    const comparator = argsWithoutOptions[3];
    try {
      comparatorFingerprint = JSON.parse(fs.readFileSync(comparator));
    } catch (e) {
      console.log(`Unable to diff with fingerprint file ${comparator}: ${e.message}`);
      process.exit(1);
    }
  }

  const projectRoot = argsWithoutOptions[2];

  const options = {
    debug: !!(process.env.DEBUG ?? isDebug),
    useRNCoreAutolinkingFromExpo: process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO
      ? ['1', 'true'].includes(process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO)
      : undefined,
    ...(platforms.length > 0 ? { platforms } : null),
    ...(pathsToIgnore.length > 0 ? { pathsToIgnore } : null),
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
    // console.log(fingerprint.hash);
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();
