#!/usr/bin/env bun

import { existsSync } from 'fs';

const dir = process.env.REVIEW_OUTPUT_DIR;
if (!dir) {
  console.error(
    'REVIEW_OUTPUT_DIR is not set.\n' +
      'Set it to a directory for review output files, e.g.:\n' +
      '  export REVIEW_OUTPUT_DIR=/tmp/code-reviews\n' +
      'Note: /tmp is cleared on restart.'
  );
  process.exit(1);
}
if (!existsSync(dir)) {
  console.error(`REVIEW_OUTPUT_DIR does not exist: ${dir}\nCreate it with: mkdir -p ${dir}`);
  process.exit(1);
}
console.log(dir);
