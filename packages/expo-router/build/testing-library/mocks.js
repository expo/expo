"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
try {
    require('react-native-gesture-handler/jestSetup');
}
catch { }
try {
    require.resolve('react-native-worklets/src/mock');
    jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
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