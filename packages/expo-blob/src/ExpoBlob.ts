import { requireNativeModule } from 'expo';

import { BlobPart, ExpoBlobModule } from './ExpoBlob.types';
import {
  DEFAULT_CHUNK_SIZE,
  isTypedArray,
  normalizedContentType,
  preprocessOptions,
} from './utils';

const NativeBlobModule = requireNativeModule<ExpoBlobModule>('ExpoBlob');

export class ExpoBlob extends NativeBlobModule.Blob {
  constructor(blobParts?: BlobPart[] | Iterable<any>, options?: BlobPropertyBag) {
    if (!new.target) {
      throw new TypeError("ExpoBlob constructor requires 'new' operator");
    }

    const inputMapping = (blobPart: BlobPart) => {
      if (blobPart instanceof ArrayBuffer) {
        return new Uint8Array(blobPart);
      }
      if (blobPart instanceof ExpoBlob || isTypedArray(blobPart)) {
        return blobPart;
      }
      return String(blobPart);
    };

    const processedBlobParts: BlobPart[] = [];

    if (blobParts === undefined) {
      super([], preprocessOptions(options));
    } else if (blobParts === null || typeof blobParts !== 'object') {
      throw TypeError(
        'ExpoBlob constructor requires blobParts to be a non-null object or undefined'
      );
    } else {
      for (const blobPart of blobParts) {
        processedBlobParts.push(inputMapping(blobPart));
      }
      super(processedBlobParts, preprocessOptions(options));
    }
  }

  slice(start?: number, end?: number, contentType?: string): ExpoBlob {
    const normalizedType = normalizedContentType(contentType);
    const slicedBlob = super.slice(start, end, normalizedType);
    Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
    return slicedBlob as ExpoBlob;
  }

  stream(): ReadableStream {
    const self = this;
    let offset = 0;
    let bytesPromise: Promise<Uint8Array> | null = null;

    return new ReadableStream({
      type: 'bytes',
      async pull(controller: any) {
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

  async arrayBuffer(): Promise<ArrayBuffer> {
    return super
      .bytes()
      .then(
        (bytes: Uint8Array) =>
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
      );
  }

  toString(): string {
    return '[object Blob]';
  }

  // Changed the length property to match that of the default js implementation
  static get length() {
    return 0;
  }
}
