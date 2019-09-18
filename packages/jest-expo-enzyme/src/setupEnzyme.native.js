// Taken from:
// https://airbnb.io/enzyme/docs/guides/react-native.html

import 'react-native';
import 'jest-enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import serializer from './serializer';

/**
 * Set up DOM in node.js environment for Enzyme to mount to
 */
const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// @SimenB: This is discouraged by jsdom itself:
// https://github.com/jsdom/jsdom/wiki/Don't-stuff-jsdom-globals-onto-the-Node-global
global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};

Object.defineProperties(global, {
  ...Object.getOwnPropertyDescriptors(window),
  ...Object.getOwnPropertyDescriptors(global),
});

/**
 * Set up a mock DOM in Node for Enzyme to which to mount
 * and inspect the DOM in tests.
 */
Enzyme.configure({ adapter: new Adapter() });

expect.addSnapshotSerializer(serializer);

// Mute DOM formatting errors
const originalConsoleError = console.error;

console.error = message => {
  if (message.startsWith('Warning:')) {
    return;
  }

  originalConsoleError(message);
};
