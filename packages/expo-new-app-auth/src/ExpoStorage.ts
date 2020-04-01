import { StorageBackend } from '@openid/appauth';
import { Platform } from 'react-native';

let AsyncStorage: any;

try {
  if (Platform.OS === 'web') {
    AsyncStorage = require('react-native-web/dist/exports/AsyncStorage').default;
  } else {
    AsyncStorage = require('react-native').AsyncStorage;
  }
} catch (_) {
  AsyncStorage = require('@react-native-community/async-storage').default;
}

/**
 * A universal `StorageBackend` backed by Async Storage.
 */
export class ExpoStorageBackend extends StorageBackend {
  private storage = AsyncStorage;

  public async getItem(name: string): Promise<string | null> {
    const value = await this.storage.getItem(name);
    return value ?? null;
  }

  public async removeItem(name: string): Promise<void> {
    await this.storage.removeItem(name);
  }

  public async clear(): Promise<void> {
    await this.storage.clear();
  }

  public async setItem(name: string, value: string): Promise<void> {
    await this.storage.setItem(name, value);
  }
}
