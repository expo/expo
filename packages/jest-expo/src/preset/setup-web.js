'use strict';

global.__DEV__ = true;

// Workaround undefined ShadowRoot in react-native-web
global.ShadowRoot = function () {};

// Ensure the environment variables from dotenv files are loaded before the first test runs
require('./setup-env').load({ silent: true, prefix: 'EXPO_PUBLIC_' });
