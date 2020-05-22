import deprecatedModule from './deprecatedModule';
Object.defineProperties(module.exports, {
    AR: {
        enumerable: true,
        get() {
            if (__DEV__) {
                setTimeout(() => {
                    console.log('The AR module is deprecated and will be removed from all SDK versions in the Expo client in June. See https://expo.fyi/deprecating-ar for more information.');
                }, 1000);
            }
            return require('./AR');
        },
    },
    Updates: {
        enumerable: true,
        get() {
            deprecatedModule(`import { Updates } from 'expo' -> import * as Updates from 'expo-updates'\n`, 'Updates', 'expo-updates', 'Note the breaking changes in the new Updates API: https://docs.expo.io/versions/v37.0.0/sdk/updates/#legacy-api . The legacy API will be removed in SDK 38.');
            return require('./Updates/Updates');
        },
    },
});
//# sourceMappingURL=deprecated.js.map