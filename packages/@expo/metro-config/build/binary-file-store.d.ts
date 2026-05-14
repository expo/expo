import UpstreamFileStore, { type Options } from '@expo/metro/metro-cache/stores/FileStore';
declare class BinaryFileStore<T> extends UpstreamFileStore<T> {
    #private;
    constructor(options: Options);
    prepare(): Promise<void>;
    get(key: Buffer): Promise<T | null | undefined>;
    set(key: Buffer, value: T): Promise<void>;
    clear(): void;
}
export { BinaryFileStore as FileStore };
