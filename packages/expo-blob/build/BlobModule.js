import { requireNativeModule } from 'expo';
import { normalizedContentType } from './utils';
const NativeBlobModule = requireNativeModule('ExpoBlob');
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        super(blobParts?.flat(Infinity) ?? [], options);
    }
    slice(start, end, contentType) {
        const normalizedType = normalizedContentType(contentType);
        const slicedBlob = super.slice(start, end, normalizedType);
        Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
        return slicedBlob;
    }
    stream() {
        const text = super.syncText();
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(text);
        let offset = 0;
        return new ReadableStream({
            pull(controller) {
                if (offset < uint8.length) {
                    controller.enqueue(uint8.subarray(offset));
                    offset = uint8.length;
                }
                else {
                    controller.close();
                }
            },
        });
    }
    async arrayBuffer() {
        return super
            .bytes()
            .then((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
}
//# sourceMappingURL=BlobModule.js.map