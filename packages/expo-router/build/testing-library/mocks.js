import '@testing-library/jest-native/extend-expect';
// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    // The mock for `call` immediately calls the callback which is incorrect
    // So we override it with a no-op
    Reanimated.default.call = () => { };
    return Reanimated;
});
// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
export const initialUrlRef = {
    value: '',
};
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
        async getInitialURL() {
            return initialUrlRef.value;
        },
    };
    return module;
});
//# sourceMappingURL=mocks.js.map