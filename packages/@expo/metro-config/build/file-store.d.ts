import UpstreamFileStore from '@expo/metro/metro-cache/stores/FileStore';
export declare class FileStore<T> extends UpstreamFileStore<T> {
    private readonly _root;
    constructor(options: {
        root: string;
    });
    set(key: Buffer, value: any): Promise<void>;
    clear(): void;
}
