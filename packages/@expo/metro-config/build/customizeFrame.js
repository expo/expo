"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCustomizeFrame = exports.INTERNAL_CALLSITES_REGEX = void 0;
const url_1 = require("url");
// Import only the types here, the values will be imported from the project, at runtime.
exports.INTERNAL_CALLSITES_REGEX = new RegExp([
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    'node_modules/react-devtools-core/.+\\.js$',
    'node_modules/react-refresh/.+\\.js$',
    'node_modules/scheduler/.+\\.js$',
    // Metro replaces `require()` with a different method,
    // we want to omit this method from the stack trace.
    // This is akin to most React tooling.
    '/metro/.*/polyfills/require.js$',
    // Hide frames related to a fast refresh.
    '/metro/.*/lib/bundle-modules/.+\\.js$',
    'node_modules/react-native/Libraries/Utilities/HMRClient.js$',
    'node_modules/eventemitter3/index.js',
    'node_modules/event-target-shim/dist/.+\\.js$',
    // Improve errors thrown by invariant (ex: `Invariant Violation: "main" has not been registered`).
    'node_modules/invariant/.+\\.js$',
    // Remove babel runtime additions
    'node_modules/regenerator-runtime/.+\\.js$',
    // Remove react native setImmediate ponyfill
    'node_modules/promise/setimmediate/.+\\.js$',
    // Babel helpers that implement language features
    'node_modules/@babel/runtime/.+\\.js$',
    // Hide Hermes internal bytecode
    '/InternalBytecode/InternalBytecode\\.js$',
    // Block native code invocations
    `\\[native code\\]`,
    // Hide react-dom (web)
    'node_modules/react-dom/.+\\.js$',
    // Hide node.js evaluation code
    'node_modules/require-from-string/.+\\.js$',
    // Block expo's metro-runtime
    '@expo/metro-runtime/.+\\.ts',
    // Block upstream metro-runtime
    '/metro-runtime/.+\\.js$',
    // Block all whatwg polyfills
    'node_modules/whatwg-.+\\.js$',
    // Hide expo-router warnings which are often wrapping all routes and imports.
    'node_modules/expo-router/build/',
    // No Expo CLI logs
    '/@expo/cli/.+',
    // No context modules as these are virtual
    '.+?ctx=[a-zA-Z0-9]+$',
    // Hide react-native-web warning wrappers. These are most likely related to style deprecations.
    '/react-native-web/dist/.+\\.js$',
].join('|'));
function isUrl(value) {
    try {
        // eslint-disable-next-line no-new
        new url_1.URL(value);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * The default frame processor. This is used to modify the stack traces.
 * This method attempts to collapse all frames that aren't relevant to
 * the user by default.
 */
function getDefaultCustomizeFrame() {
    return (frame) => {
        if (frame.file && isUrl(frame.file)) {
            return {
                ...frame,
                // HACK: This prevents Metro from attempting to read the invalid file URL it sent us.
                lineNumber: null,
                column: null,
                // This prevents the invalid frame from being shown by default.
                collapse: true,
            };
        }
        let collapse = Boolean(frame.file && exports.INTERNAL_CALLSITES_REGEX.test(frame.file));
        if (!collapse) {
            // This represents the first frame of the stacktrace.
            // Often this looks like: `__r(0);`.
            // The URL will also be unactionable in the app and therefore not very useful to the developer.
            if (frame.column === 3 &&
                frame.methodName === 'global code' &&
                frame.file?.match(/^https?:\/\//g)) {
                collapse = true;
            }
        }
        return { ...(frame || {}), collapse };
    };
}
exports.getDefaultCustomizeFrame = getDefaultCustomizeFrame;
//# sourceMappingURL=customizeFrame.js.map