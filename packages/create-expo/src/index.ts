#!/usr/bin/env node
import Debug from 'debug';
import { boolish } from 'getenv';

import { PACKAGE_NAME } from './utils/update-check';

// Set the title of the process
process.title = PACKAGE_NAME;

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('expo:init:*');
} else if (Debug.enabled('expo:init:')) {
  // This enables debug logging in other Expo tooling.
  process.env.EXPO_DEBUG = '1';
}

require('./cli');
