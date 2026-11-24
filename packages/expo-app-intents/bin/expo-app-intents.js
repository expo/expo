#!/usr/bin/env node

process.env.EXPO_APP_INTENTS_TEMPLATES_DIR ||= require('path').join(__dirname, '..', 'templates');
require('../cli/build/index.js');
