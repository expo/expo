// @ts-check
/// <reference types="node" />

const { getConfig } = require('expo/config');
const fs = require('node:fs');
const path = require('node:path');

const { createFingerprintFileAsync } = require('./createFingerprintFile');
const { resolveProjectRoot } = require('./resolveProjectRoot');

const cwd = process.cwd();
const possibleProjectRoot = process.argv[2] ?? cwd;
const destinationDir = process.argv[3] ?? cwd;
const platform = process.argv[4];
// The native build scripts pass 'true' for debug builds only.
const embedFingerprint = process.argv[5] === 'true';
const mode = process.argv[6];

(async () => {
  const projectRoot = resolveProjectRoot(possibleProjectRoot);

  const expoEnv = require('@expo/env');
  process.env = expoEnv.getOriginalEnv();
  expoEnv.logLoadedEnv(expoEnv.loadProjectEnv(projectRoot, { mode }));
  process.chdir(projectRoot);

  const { exp } = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

  fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));

  // Only the fingerprint is optional. A failure above this line must still fail the build.
  await createFingerprintFileAsync(projectRoot, destinationDir, platform, embedFingerprint);
})();
