/// <reference types="node" />
import FileStore from 'metro-cache/src/stores/FileStore';
export declare class ExpoMetroFileStore<T> extends FileStore<T> {
    set(key: Buffer, value: any): Promise<void>;
}
