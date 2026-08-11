#!/usr/bin/env node

const { logErrorAndExit, runExpoFeedbackAsync } = require('../build/index.js');

runExpoFeedbackAsync().catch(logErrorAndExit);
