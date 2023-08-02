/// <reference types="node" />
export declare class ExpoMetroFileStore<T> {
    private fileStore;
    constructor(options: any);
    get(key: Buffer): Promise<T | null>;
    set(key: Buffer, value: any): Promise<void>;
    clear(): void;
}
