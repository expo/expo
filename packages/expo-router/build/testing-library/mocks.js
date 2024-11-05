/*
 * Optionally enable @testing-library/jest-native/extend-expect. We use this internally for the `toBeOnTheScreen` matcher()
 */
try {
    require('@testing-library/jest-native/extend-expect');
}
catch { }
try {
    require('react-native-gesture-handler/jestSetup');
}
catch { }
try {
    require('react-native-reanimated');
    jest.mock('react-native-reanimated', () => {
        try {
            const Reanimated = require('react-native-reanimated/mock');
            Reanimated.default.call = () => { }; // Override `call` with a no-op if needed
            return Reanimated;
        }
        catch {
            return {};
        }
    });
}
catch { }
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