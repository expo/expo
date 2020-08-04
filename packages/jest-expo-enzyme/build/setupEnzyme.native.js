"use strict";
// Taken from:
// https://airbnb.io/enzyme/docs/guides/react-native.html
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("react-native");
require("jest-enzyme");
const enzyme_1 = __importDefault(require("enzyme"));
const enzyme_adapter_react_16_1 = __importDefault(require("enzyme-adapter-react-16"));
const serializer_1 = __importDefault(require("./serializer"));
/**
 * Set up DOM in node.js environment for Enzyme to mount to
 */
const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
global.window = window;
global.document = window.document;
global.navigator = {
    userAgent: 'node.js',
};
// @SimenB: This is discouraged by jsdom itself:
// https://github.com/jsdom/jsdom/wiki/Don't-stuff-jsdom-globals-onto-the-Node-global
Object.defineProperties(global, Object.assign(Object.assign({}, Object.getOwnPropertyDescriptors(window)), Object.getOwnPropertyDescriptors(global)));
/**
 * Set up a mock DOM in Node for Enzyme to which to mount
 * and inspect the DOM in tests.
 */
enzyme_1.default.configure({ adapter: new enzyme_adapter_react_16_1.default() });
// @ts-ignore: test types are not available in src/
expect.addSnapshotSerializer(serializer_1.default);
// Mute DOM formatting errors
const originalConsoleError = console.error;
console.error = (message) => {
    if (message.startsWith('Warning:')) {
        return;
    }
    originalConsoleError(message);
};
//# sourceMappingURL=setupEnzyme.native.js.map