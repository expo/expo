'use strict';

global.__DEV__ = true;

// Workaround undefined ShadowRoot in react-native-web
global.ShadowRoot = function () {};

// Installs the temporary workaround to disable the deprecation warning for `react-test-renderer@19+`.
require('./setup-react-19');
