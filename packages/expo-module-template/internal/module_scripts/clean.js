#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];
const target = process.argv[2];

if (target && SUBTARGETS.includes(target)) {
  fs.rmSync(path.join(process.cwd(), target, 'build'), { recursive: true, force: true });
} else {
  fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
}
