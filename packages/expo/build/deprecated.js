import deprecatedModule from './deprecatedModule';
Object.defineProperties(module.exports, {
    Linking: {
        enumerable: true,
        get() {
            deprecatedModule(`import { Linking } from 'expo' -> import * as Linking from 'expo-linking'\n`, 'Linking', 'expo-linking');
            return require('expo-linking');
        },
    },
    Notifications: {
        enumerable: true,
        get() {
            deprecatedModule(`import { Notifications } from 'expo' -> import * as Notifications from 'expo-notifications'\n`, 'Notifications', 'expo-notifications', 'Note the breaking changes in the new Notifications API: https://docs.expo.io/versions/latest/sdk/notifications/ . This legacy API will be removed in SDK 40.');
            return require('./Notifications/Notifications').default;
        },
    },
});
//# sourceMappingURL=deprecated.js.map