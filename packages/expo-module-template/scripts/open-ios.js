#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') {
  console.error(
    `Error: Xcode is only available on macOS. Cannot open the iOS project on ${process.platform}.`
  );
  process.exit(1);
}

const projectPath = path.join(process.cwd(), 'example', 'ios');
const result = spawnSync('xed', [projectPath], { stdio: 'inherit' });
process.exit(result.status ?? 0);
