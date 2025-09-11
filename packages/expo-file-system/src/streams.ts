import type { FileHandle } from './ExpoFileSystem.types';

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

  pull(controller: ReadableByteStreamController) {
    const theView = controller.byobRequest?.view;
    if (!theView) {
      const bytes = this.handle.readBytes(this.size);
      if (bytes.length === 0) {
        controller.close();
        return;
      }
      controller.enqueue(bytes);
      return;
    }

    // TODO: Optimize by adding a native method that can write into a TypedArray at a given offset.
    const bytes = this.handle.readBytes(theView.byteLength - theView.byteOffset);
    if (bytes.length === 0) {
      controller.close();
      controller.byobRequest.respond(0);
      return;
    }
    if (theView instanceof Uint8Array) {
      theView.set(bytes, theView.byteOffset);
    } else {
      const array = new Uint8Array(theView.buffer);
      for (let i = 0; i < bytes.length; i++) {
        array[i + (theView.byteOffset ?? 0)] = bytes[i]!;
      }
    }
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

  write(chunk: Uint8Array) {
    this.handle.writeBytes(chunk);
  }
}
