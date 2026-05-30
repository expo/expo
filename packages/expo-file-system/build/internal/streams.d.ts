import type { FileHandle } from '../File.types';
export declare class FileSystemReadableStreamSource implements UnderlyingByteSource {
    handle: FileHandle;
    size: number;
    type: "bytes";
    constructor(handle: FileHandle);
    cancel(): void;
    pull(controller: ReadableByteStreamController): Promise<void>;
}
export declare class FileSystemWritableSink implements UnderlyingSink {
    handle: FileHandle;
    constructor(handle: FileHandle);
    abort(): void;
    close(): void;
    write(chunk: Uint8Array): Promise<void>;
}
//# sourceMappingURL=streams.d.ts.map