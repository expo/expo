import type { FileHandle } from './ExpoFileSystem.types';
export declare class FileSystemReadableStreamSource implements UnderlyingByteSource {
    handle: FileHandle;
    size: number;
    type: "bytes";
    constructor(handle: any);
    cancel(): void;
    pull(controller: ReadableByteStreamController): void;
}
export declare class FileSystemWritableSink implements UnderlyingSink {
    handle: FileHandle;
    constructor(handle: any);
    abort(): void;
    close(): void;
    write(chunk: Uint8Array): void;
}
//# sourceMappingURL=streams.d.ts.map