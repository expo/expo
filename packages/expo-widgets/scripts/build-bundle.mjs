#!/usr/bin/env node

// Build the ExpoWidgets.bundle.
// Use `yarn build:bundle` to run this script.

import spawn from '@expo/spawn-async';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

// NOTE: Modified from expo-constants/expo-updates entrypoint. We cd into the right folder anyway
const possibleProjectRoot = process.argv[2] ?? process.cwd();

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(__dirname);

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = args[index + 1];
  args.splice(index, 2);
  return value ?? fallback;
}

// NODE_BINARY is set for Xcode builds via the `with-node.sh` script.
const nodePath = process.env.NODE_BINARY || 'node';
const cliArgs = argv.slice(3);
const platform = readOption(cliArgs, '--platform', 'ios');
const appBundlePath = readOption(
  cliArgs,
  '--bundle-output',
  path.join(__dirname, '../bundle/build/ExpoWidgets.bundle')
);
const platformEntryPath = path.join(__dirname, `../bundle/index.${platform}.ts`);
const entryFile = fs.existsSync(platformEntryPath)
  ? platformEntryPath
  : path.join(__dirname, '../bundle/index.ts');
const outputDir = path.dirname(appBundlePath);

await fs.promises.mkdir(outputDir, { recursive: true });
await fs.promises.rm(appBundlePath, { force: true });

const result = await spawn(
  nodePath,
  [
    require.resolve('expo/bin/cli'),
    'export:embed',
    '--platform',
    platform,
    '--bundle-output',
    appBundlePath,
    '--entry-file',
    entryFile,
    '--dev',
    'false',
    '--skip-server',
    ...cliArgs,
  ],
  {
    stdio: 'inherit',
    cwd: projectRoot,
    env: {
      ...process.env,
      EXPO_OVERRIDE_METRO_CONFIG: path.join(__dirname, '../metro.config.js'),
    },
  }
);

if (result.error) {
  process.exit(1);
}
