#!/usr/bin/env node
'use strict';
const { spawn } = require('cross-spawn');

spawn(require.resolve('@expo/cli'), process.argv.slice(2), { stdio: 'inherit' }).on(
  'exit',
  (code) => {
    process.exit(code);
  }
);
