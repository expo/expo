// When users dangerously import a file inside of react-native, it breaks the web alias.
// This is one of the most common, and cryptic web errors that users encounter.
// This conditional side-effect provides a more helpful error message for debugging.
// Use a wrapper `__DEV__` to remove this entire block in production.
if (__DEV__) {
    if (
    // Skip mocking if someone is shimming this value out.
    !('__fbBatchedBridgeConfig' in global)) {
        Object.defineProperty(global, '__fbBatchedBridgeConfig', {
            get() {
                throw new Error("Your web project is importing a module from 'react-native' instead of 'react-native-web'. Learn more: https://expo.fyi/fb-batched-bridge-config-web");
            },
        });
    }
}
//# sourceMappingURL=Expo.fx.web.js.map