#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];
let args = process.argv.slice(2);

// If the command is used like `yarn test plugin`, set the --rootDir option to the `plugin` directory
if (SUBTARGETS.includes(args[0])) {
  const target = args[0];
  const targetDir = path.join(process.cwd(), target);
  const restArgs = args.slice(1);
  args = ['--rootDir', target];

  if (fs.existsSync(path.join(targetDir, 'jest.config.js'))) {
    args.push('--config', `${target}/jest.config.js`);
  }
  args.push(...restArgs);
}

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !args.includes('--watch')
) {
  args.push('--watch');
}

const result = spawnSync('jest', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 0);
