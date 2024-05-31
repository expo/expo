/*
 * Optionally enable @testing-library/jest-native/extend-expect. We use this internally for the `toBeOnTheScreen` matcher()
 */
try {
    require('@testing-library/jest-native/extend-expect');
}
catch { }
// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
    try {
        const Reanimated = require('react-native-reanimated/mock');
        // The mock for `call` immediately calls the callback which is incorrect
        // So we override it with a no-op
        Reanimated.default.call = () => { };
        return Reanimated;
    }
    catch {
        return {};
    }
});
// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('expo-linking', () => {
    const module = {
        ...jest.requireActual('expo-linking'),
        createURL(path) {
            return 'yourscheme://' + path;
        },
        resolveScheme() {
            return 'yourscheme';
        },
        addEventListener() {
            return { remove() { } };
        },
    };
    return module;
});
//# sourceMappingURL=mocks.js.map