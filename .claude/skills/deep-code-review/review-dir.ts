#!/usr/bin/env bun

import { mkdirSync } from 'fs';

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
try {
  mkdirSync(dir, { recursive: true });
} catch (err) {
  console.error(`Could not create REVIEW_OUTPUT_DIR: ${dir}\n${(err as Error).message}`);
  process.exit(1);
}
console.log(dir);
