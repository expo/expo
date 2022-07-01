'use strict';

global.__DEV__ = true;

// Workaround undefined ShadowRoot in react-native-web
global.ShadowRoot = function () {};
