import deprecatedModule from './deprecatedModule';
Object.defineProperties(module.exports, {
    Linking: {
        enumerable: true,
        get() {
            deprecatedModule(`import { Linking } from 'expo' -> import * as Linking from 'expo-linking'\n`, 'Linking', 'expo-linking');
            return require('expo-linking');
        },
    },
});
//# sourceMappingURL=deprecated.js.map