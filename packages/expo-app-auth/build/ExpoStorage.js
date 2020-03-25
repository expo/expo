import { StorageBackend } from '@openid/appauth';
import { Platform } from 'react-native';
let AsyncStorage;
try {
    if (Platform.OS === 'web') {
        AsyncStorage = require('react-native-web/dist/exports/AsyncStorage').default;
    }
    else {
        AsyncStorage = require('react-native').AsyncStorage;
    }
}
catch (_) {
    AsyncStorage = require('@react-native-community/async-storage').default;
}
/**
 * A universal `StorageBackend` backed by Async Storage.
 */
export class ExpoStorageBackend extends StorageBackend {
    constructor() {
        super(...arguments);
        this.storage = AsyncStorage;
    }
    async getItem(name) {
        const value = await this.storage.getItem(name);
        return value ?? null;
    }
    async removeItem(name) {
        await this.storage.removeItem(name);
    }
    async clear() {
        await this.storage.clear();
    }
    async setItem(name, value) {
        await this.storage.setItem(name, value);
    }
}
//# sourceMappingURL=ExpoStorage.js.map