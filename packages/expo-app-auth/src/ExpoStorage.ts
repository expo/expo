import { StorageBackend } from '@openid/appauth';
// import { AsyncStorage } from 'react-native';

let NativeStorage: any;

try {
  NativeStorage = require('@react-native-community/async-storage').default;
} catch (_) {
  NativeStorage = require('react-native').AsyncStorage;
}

/**
 * A universal `StorageBackend` backed by Async Storage.
 */
export class ExpoStorageBackend extends StorageBackend {
  private storage = NativeStorage;

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
