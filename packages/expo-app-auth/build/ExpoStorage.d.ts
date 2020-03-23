import { StorageBackend } from '@openid/appauth';
/**
 * A universal `StorageBackend` backed by Async Storage.
 */
export declare class ExpoStorageBackend extends StorageBackend {
    private storage;
    getItem(name: string): Promise<string | null>;
    removeItem(name: string): Promise<void>;
    clear(): Promise<void>;
    setItem(name: string, value: string): Promise<void>;
}
