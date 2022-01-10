#!/usr/bin/env node

// This script is a workaround for react-native 0.64 unstable podspec checksum for `FBReactNativeSpec`.
// This issue is fixed in newer version: https://github.com/facebook/react-native/commit/bdfe2a51791046c4e6836576e08655431373ed67
// We cherry-picked the commit in our fork. this script just overwrites the patch files from our forked react-native to node_modules.
// After we upgraded react-native, we can just remove this script.

const fs = require('fs');
const path = require('path');
const semver = require('semver');

const EXPO_ROOT = path.resolve(path.join(__dirname, '..', '..'));

const rnVersion = require('react-native/package.json').version;
if (semver.gte(rnVersion, '0.65.0')) {
  console.error(
    `Newer react-native has fixed the unstable checksum issue for \`FBReactNativeSpec.podspec\`. Please remove the ${path.basename(
      __filename
    )} script.`
  );
  process.exit(1);
}

const expoRNRoot = path.join(EXPO_ROOT, 'react-native-lab', 'react-native');
const nodeModulesRNRoot = path.join(EXPO_ROOT, 'node_modules', 'react-native');

// Skip when submodule doesn't checkout
if (!fs.existsSync(path.join(expoRNRoot, 'package.json'))) {
  return;
}

const copyFiles = ['scripts/generate-specs.sh', 'scripts/react_native_pods.rb'];
for (const file of copyFiles) {
  fs.copyFileSync(path.join(expoRNRoot, file), path.join(nodeModulesRNRoot, file));
}
