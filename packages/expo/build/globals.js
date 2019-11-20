// We make some of the Expo SDK available on a global in order to make it
// possible to augment their libraries with some Expo-specific behavior
// when inside of an environment with the Expo SDK present, but otherwise
// continue to work in any bare React Native app without requiring that
// they install the 'expo' package. We can get rid of this entirely when
// the following RFC has been implemented:
// https://github.com/react-native-community/discussions-and-proposals/issues/120
Object.defineProperties(module.exports, {
    Asset: {
        enumerable: true,
        get() {
            return require('expo-asset').Asset;
        },
    },
    Constants: {
        enumerable: true,
        get() {
            return require('expo-constants').default;
        },
    },
    Font: {
        enumerable: true,
        get() {
            return require('expo-font');
        },
    },
    Icon: {
        enumerable: true,
        get() {
            return require('@expo/vector-icons');
        },
    },
    LinearGradient: {
        enumerable: true,
        get() {
            return require('expo-linear-gradient').LinearGradient;
        },
    },
    SQLite: {
        enumerable: true,
        get() {
            return require('expo-sqlite').SQLite;
        },
    },
});
//# sourceMappingURL=globals.js.map