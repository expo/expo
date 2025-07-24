import { requireNativeModule } from 'expo';
import { isTypedArray, normalizedContentType, preprocessOptions, DEFAULT_CHUNK_SIZE, } from './utils';
const NativeBlobModule = requireNativeModule('ExpoBlob');
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        const inputMapping = (v) => {
            if (v instanceof ArrayBuffer) {
                return new Uint8Array(v);
            }
            if (v instanceof ExpoBlob || isTypedArray(v)) {
                return v;
            }
            return String(v);
        };
        const bps = [];
        if (blobParts === undefined) {
            super([], preprocessOptions(options));
        }
        else if (blobParts === null || typeof blobParts !== 'object') {
            throw TypeError();
        }
        else {
            for (const bp of blobParts) {
                bps.push(inputMapping(bp));
            }
            super(bps, preprocessOptions(options));
        }
    }
    slice(start, end, contentType) {
        const normalizedType = normalizedContentType(contentType);
        const slicedBlob = super.slice(start, end, normalizedType);
        Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
        return slicedBlob;
    }
    stream() {
        const self = this;
        let offset = 0;
        let bytesPromise = null;
        return new ReadableStream({
            type: 'bytes',
            async pull(controller) {
                if (!bytesPromise) {
                    bytesPromise = self.bytes();
                }
                const bytes = await bytesPromise;
                if (offset >= bytes.length) {
                    controller.close();
                    return;
                }
                if (controller.byobRequest?.view) {
                    const view = controller.byobRequest.view;
                    const end = Math.min(offset + view.byteLength, bytes.length);
                    const chunk = bytes.subarray(offset, end);
                    view.set(chunk, 0);
                    controller.byobRequest.respond(chunk.length);
                    offset = end;
                    if (offset >= bytes.length) {
                        controller.close();
                    }
                    return;
                }
                const chunkSize = DEFAULT_CHUNK_SIZE;
                const end = Math.min(offset + chunkSize, bytes.length);
                controller.enqueue(bytes.subarray(offset, end));
                offset = end;
            },
        });
    }
    async arrayBuffer() {
        return super
            .bytes()
            .then((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
    toString() {
        return '[object Blob]';
    }
    // Changed the length property to match that of the default js implementation
    static get length() {
        return 0;
    }
}
//# sourceMappingURL=BlobModule.js.map