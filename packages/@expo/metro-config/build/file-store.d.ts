import UpstreamFileStore from '@expo/metro/metro-cache/stores/FileStore';
export declare class FileStore<T> extends UpstreamFileStore<T> {
    set(key: Buffer, value: any): Promise<void>;
}
