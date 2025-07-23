import { NativeModule, requireNativeModule, SharedObject } from 'expo';

import { Blob, BlobPart } from './BlobModule.types';
import {
  isTypedArray,
  normalizedContentType,
  preprocessOptions,
  DEFAULT_CHUNK_SIZE,
} from './utils';

declare class NativeBlob extends SharedObject {
  readonly size: number;
  readonly type: string;
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
  slice(start?: number, end?: number, contentType?: string): ExpoBlob;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}

declare class ExpoBlobModule extends NativeModule {
  Blob: typeof NativeBlob;
}

const NativeBlobModule = requireNativeModule<ExpoBlobModule>('ExpoBlob');

export class ExpoBlob extends NativeBlobModule.Blob implements Blob {
  constructor(blobParts?: any[] | Iterable<any>, options?: BlobPropertyBag) {
    const inputMapping = (v: any) => {
      if (v instanceof ArrayBuffer) {
        return new Uint8Array(v);
      }
      if (v instanceof ExpoBlob || isTypedArray(v)) {
        return v;
      }
      return String(v);
    };

    let bps: any[] = [];

    if (blobParts === undefined) {
      super([], preprocessOptions(options));
    } else if (blobParts === null || typeof blobParts !== 'object') {
      throw TypeError();
    } else {
      for (let bp of blobParts) {
        bps.push(inputMapping(bp));
      }
      super(bps, preprocessOptions(options));
    }
  }

  slice(start?: number, end?: number, contentType?: string): ExpoBlob {
    const normalizedType = normalizedContentType(contentType);
    const slicedBlob = super.slice(start, end, normalizedType);
    Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
    return slicedBlob;
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

  async arrayBuffer(): Promise<ArrayBufferLike> {
    return super
      .bytes()
      .then((bytes: Uint8Array) =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      );
  }

  toString(): string {
    return '[object Blob]';
  }
}

Object.defineProperty(ExpoBlob, 'length', {
  value: 0,
  writable: false,
});
