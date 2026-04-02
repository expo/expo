#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];
const args = process.argv.slice(2);
const target = args[0];

let tscArgs;
if (SUBTARGETS.includes(target)) {
  const targetDir = path.join(process.cwd(), target);
  if (!fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
    console.log(`tsconfig.json not found in ${target}, skipping build for ${target}`);
    process.exit(0);
  }
  tscArgs = ['--build', targetDir, ...args.slice(1)];
} else {
  tscArgs = [...args];
}

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !tscArgs.includes('--watch')
) {
  tscArgs.push('--watch');
}

const result = spawnSync('tsc', tscArgs, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 0);
