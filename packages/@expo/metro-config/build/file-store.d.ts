/// <reference types="node" />
import UpstreamFileStore from 'metro-cache/src/stores/FileStore';
export declare class FileStore<T> extends UpstreamFileStore<T> {
    set(key: Buffer, value: any): Promise<void>;
}
