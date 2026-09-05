// @ts-check
/// <reference types="node" />

const fs = require('node:fs');
const path = require('node:path');

const cwd = process.cwd();
const possibleProjectRoot = process.argv[2] ?? cwd;
const destinationDir = process.argv[3] ?? cwd;

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

const expoEnv = require('@expo/env');
process.env = expoEnv.getOriginalEnv();
const mode = expoEnv.consumeConfigEnvMode();
if (!mode) {
  throw new Error('Must provide a config mode');
}
expoEnv.logLoadedEnv(expoEnv.loadProjectEnv(projectRoot, { mode }));
process.chdir(projectRoot);

const { getConfig } = require('expo/config');
const { exp } = getConfig(projectRoot, {
  isPublicConfig: true,
  skipSDKVersionRequirement: true,
});

fs.writeFileSync(path.join(destinationDir, 'app.config'), JSON.stringify(exp));
