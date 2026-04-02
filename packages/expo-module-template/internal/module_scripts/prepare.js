#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];

function run(cmd, args = []) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Clean and build main
fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
run('tsc');

// Clean and build any existing subtargets
for (const target of SUBTARGETS) {
  const targetDir = path.join(process.cwd(), target);
  if (fs.existsSync(targetDir) && fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
    console.log(`Building ${target}`);
    fs.rmSync(path.join(targetDir, 'build'), { recursive: true, force: true });
    run('tsc', ['--build', targetDir]);
  }
}
