#!/usr/bin/env node
'use strict';

require('../build')(process.argv.slice(2)).catch((error) => {
  // The message already says what failed and what to do; the stack only helps when debugging the CLI itself.
  console.error(process.env.EXPO_DEBUG ? error : `Error: ${error.message}`);
  process.exitCode = 1;
});
