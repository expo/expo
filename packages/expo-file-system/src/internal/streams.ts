import type { FileHandle } from '../File.types';

export class FileSystemReadableStreamSource implements UnderlyingByteSource {
  handle: FileHandle;
  size: number = 1024;
  type = 'bytes' as const;

  constructor(handle: FileHandle) {
    this.handle = handle;
  }

  cancel() {
    this.handle.close();
  }

  async pull(controller: ReadableByteStreamController) {
    const theView = controller.byobRequest?.view;
    if (!theView) {
      const bytes = await this.handle.readBytes(this.size);
      if (bytes.length === 0) {
        controller.close();
        return;
      }
      controller.enqueue(bytes);
      return;
    }

    // TODO: Optimize by adding a native method that can write into a TypedArray at a given offset.
    // `byteLength` is already the size of the region to fill, so `byteOffset` must not be
    // subtracted from it, and `set` takes an offset relative to the view it is called on.
    const bytes = await this.handle.readBytes(theView.byteLength);
    if (bytes.length === 0) {
      controller.close();
      controller.byobRequest.respond(0);
      return;
    }
    new Uint8Array(theView.buffer, theView.byteOffset, theView.byteLength).set(bytes);
    controller.byobRequest.respond(bytes.length);
  }
}

export class FileSystemWritableSink implements UnderlyingSink {
  handle: FileHandle;

  constructor(handle: FileHandle) {
    this.handle = handle;
  }

  abort() {
    this.close();
  }

  close() {
    this.handle.close();
  }

  async write(chunk: Uint8Array) {
    await this.handle.writeBytes(chunk);
  }
}
