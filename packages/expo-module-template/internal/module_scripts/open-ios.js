#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') {
  console.error(
    `Error: Xcode is only available on macOS. Cannot open the iOS project on ${process.platform}.`
  );
  process.exit(1);
}

const projectPath = path.join(process.cwd(), 'example', 'ios');
const child = spawn('xed', [projectPath], { stdio: 'inherit' });

child.once('error', (error) => {
  console.error(`Error: Failed to open Xcode: ${error.message}`);
  process.exit(1);
});
