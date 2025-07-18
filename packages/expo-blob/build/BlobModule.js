import { requireNativeModule } from "expo";
const NativeBlobModule = requireNativeModule("ExpoBlob");
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        super(blobParts, options);
    }
    slice(start, end, contentType) {
        const slicedBlob = super.slice(start, end, contentType);
        const options = {
            type: slicedBlob.type,
            endings: slicedBlob.endings,
        };
        return new ExpoBlob(slicedBlob, options);
    }
    async text() {
        return Promise.resolve(super.text());
    }
    stream() {
        const text = super.text();
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
}
//# sourceMappingURL=BlobModule.js.map