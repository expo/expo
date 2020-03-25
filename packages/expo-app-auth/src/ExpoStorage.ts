import { StorageBackend } from '@openid/appauth';
// import AsyncStorage from '@react-native-community/async-storage';
// import { AsyncStorage } from 'react-native';

let AsyncStorage: any;

try {
  AsyncStorage = require('@react-native-community/async-storage').default;
} catch (_) {
  AsyncStorage = require('react-native').AsyncStorage;
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
