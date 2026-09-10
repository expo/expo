// @ts-check
/// <reference types="node" />

const { getConfig } = require('expo/config');
const fs = require('node:fs');
const path = require('node:path');

const {
  createFingerprintFileAsync,
  resolveProjectRoot,
  warnFingerprintEmbedFailed,
} = require('./createFingerprintFile');

const cwd = process.cwd();
const possibleProjectRoot = process.argv[2] ?? cwd;
const destinationDir = process.argv[3] ?? cwd;
const platform = process.argv[4];
// The native build scripts pass 'true' for debug builds only.
const embedFingerprint = process.argv[5] === 'true';

const projectRoot = resolveProjectRoot(possibleProjectRoot);

if (embedFingerprint) {
  // Evaluate the app config in development mode, the way the check side does. A build launched
  // from the IDE has no NODE_ENV, which would skip the `.env.development` files.
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
