// @ts-check
/// <reference types="node" />

const { getConfig } = require('expo/config');
const fs = require('node:fs');
const path = require('node:path');

const {
  createFingerprintFileAsync,
  warnFingerprintEmbedFailed,
} = require('./createFingerprintFile');
const { resolveProjectRoot } = require('./resolveProjectRoot');

const cwd = process.cwd();
const possibleProjectRoot = process.argv[2] ?? cwd;
const destinationDir = process.argv[3] ?? cwd;
const platform = process.argv[4];
// The native build scripts pass 'true' for debug builds only.
const embedFingerprint = process.argv[5] === 'true';

const projectRoot = resolveProjectRoot(possibleProjectRoot);

require('@expo/env').load(projectRoot);
process.chdir(projectRoot);

const { exp } = getConfig(projectRoot, {
  isPublicConfig: true,
  skipSDKVersionRequirement: true,
});

fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));

// Awaited, so the order against process exit is explicit in an Xcode script phase.
(async () => {
  try {
    await createFingerprintFileAsync(projectRoot, destinationDir, platform, embedFingerprint);
  } catch (error) {
    warnFingerprintEmbedFailed(/** @type {Error} */ (error));
  }
})();
