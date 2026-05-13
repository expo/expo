#!/usr/bin/env node
'use strict';

// Have to force color support — logs wouldn't have colors when spawned by another process.
// It must be set before `supports-color` (`chalk` dependency) module is imported.
// Respect NO_COLOR convention (https://no-color.org/) — tools like CocoaPods set this
// to prevent ANSI codes from corrupting JSON output parsed by autolinking scripts.
if (!process.env.NO_COLOR) {
  process.env.FORCE_COLOR = 'true';
}

require('../build')(process.argv.slice(2)).catch((error) => {
  // Ensure errors are visible on stderr — without this, unhandled async rejections
  // can cause silent empty stdout, which breaks JSON parsing in CocoaPods/Ruby.
  console.error('expo-modules-autolinking failed:', error);
  process.exitCode = 1;
});
