import deprecatedModule from './deprecatedModule';
Object.defineProperties(module.exports, {
    Updates: {
        enumerable: true,
        get() {
            deprecatedModule(`import { Updates } from 'expo' -> import * as Updates from 'expo-updates'\n`, 'Updates', 'expo-updates', 'Note the breaking changes in the new Updates API: https://docs.expo.io/versions/v37.0.0/sdk/updates/#legacy-api . The legacy API will be removed in SDK 38.');
            return require('./Updates/Updates');
        },
    },
});
//# sourceMappingURL=deprecated.js.map