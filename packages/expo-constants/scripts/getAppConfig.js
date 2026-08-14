// @ts-check
/// <reference types="node" />

const { getConfig } = require('expo/config');
const fs = require('node:fs');
const path = require('node:path');

const {
  createFingerprintFileAsync,
  warnFingerprintEmbedFailed,
} = require('./createFingerprintFile');

const cwd = process.cwd();
const possibleProjectRoot = process.argv[2] ?? cwd;
const destinationDir = process.argv[3] ?? cwd;
const platform = process.argv[4];
// The native build scripts pass 'true' for debug builds only — release builds skip the
// fingerprint computation and never ship the file.
const embedFingerprint = process.argv[5] === 'true';

// TODO: Verify we can remove projectRoot validation, now that we no longer
// support React Native <= 62
let projectRoot;
if (fs.existsSync(path.join(possibleProjectRoot, 'package.json'))) {
  projectRoot = possibleProjectRoot;
} else if (fs.existsSync(path.join(possibleProjectRoot, '..', 'package.json'))) {
  projectRoot = path.resolve(possibleProjectRoot, '..');
} else {
  throw new Error(
    `Unable to locate project (no package.json found) at path: ${possibleProjectRoot}`
  );
}

if (embedFingerprint) {
  // The embedded fingerprint must match the check side (`npx expo needs-rebuild` and the dev
  // server), which evaluates the app config in development mode (EXPO_CONFIG_MODE overrides).
  // Builds launched from the IDE have no NODE_ENV, which would skip the .env.development files
  // the check side loads. Only debug builds embed the fingerprint, so development is correct.
  process.env.NODE_ENV =
    process.env.EXPO_CONFIG_MODE === 'production' ? 'production' : 'development';
}
require('@expo/env').load(projectRoot);
process.chdir(projectRoot);

const { exp } = getConfig(projectRoot, {
  isPublicConfig: true,
  skipSDKVersionRequirement: true,
});

fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));

createFingerprintFileAsync(projectRoot, destinationDir, platform, embedFingerprint).catch(
  warnFingerprintEmbedFailed
);
