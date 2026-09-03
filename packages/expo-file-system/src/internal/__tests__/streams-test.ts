import type { FileHandle } from '../../File.types';
import { FileSystemReadableStreamSource } from '../streams';

const CONTENTS = new Uint8Array(64).map((_, index) => index + 1);

/** A handle over an in-memory buffer, reading sequentially like a real file handle. */
function createHandle(contents: Uint8Array = CONTENTS) {
  let position = 0;
  const requestedLengths: number[] = [];
  const handle = {
    readBytes: async (length: number) => {
      requestedLengths.push(length);
      const slice = contents.subarray(position, position + length);
      position += slice.length;
      return new Uint8Array(slice);
    },
    close: () => {},
  };
  return { handle: handle as unknown as FileHandle, requestedLengths };
}

/**
 * A `ReadableByteStreamController` stand-in. `byobRequest.view` covers the region of the
 * caller's buffer the stream still has to fill, which is what the spec hands to `pull`.
 * jsdom has no `ReadableStream`, so the source is driven directly.
 */
function createController(view: ArrayBufferView) {
  const responded: number[] = [];
  const controller = {
    byobRequest: { view, respond: (bytesWritten: number) => responded.push(bytesWritten) },
    close: () => {},
    enqueue: () => {},
  };
  return { controller: controller as unknown as ReadableByteStreamController, responded };
}

describe(FileSystemReadableStreamSource, () => {
  it('fills a BYOB view that starts at a non-zero offset in its buffer', async () => {
    const { handle } = createHandle();
    const view = new Uint8Array(new ArrayBuffer(32), 8, 16);
    const { controller, responded } = createController(view);

    await new FileSystemReadableStreamSource(handle).pull(controller);

    expect(responded).toEqual([16]);
    expect(Array.from(view)).toEqual(Array.from(CONTENTS.subarray(0, 16)));
  });

  it('requests as many bytes as the BYOB view can hold', async () => {
    const { handle, requestedLengths } = createHandle();
    const view = new Uint8Array(new ArrayBuffer(32), 8, 16);
    const { controller } = createController(view);

    await new FileSystemReadableStreamSource(handle).pull(controller);

    expect(requestedLengths).toEqual([16]);
  });

  it('does not write outside the BYOB view', async () => {
    const { handle } = createHandle();
    const buffer = new ArrayBuffer(32);
    const view = new Uint8Array(buffer, 8, 16);
    const { controller } = createController(view);

    await new FileSystemReadableStreamSource(handle).pull(controller);

    const whole = new Uint8Array(buffer);
    expect(Array.from(whole.subarray(0, 8))).toEqual(new Array(8).fill(0));
    expect(Array.from(whole.subarray(24))).toEqual(new Array(8).fill(0));
  });

  it('fills a BYOB view that starts at offset zero', async () => {
    const { handle } = createHandle();
    const view = new Uint8Array(new ArrayBuffer(16));
    const { controller, responded } = createController(view);

    await new FileSystemReadableStreamSource(handle).pull(controller);

    expect(responded).toEqual([16]);
    expect(Array.from(view)).toEqual(Array.from(CONTENTS.subarray(0, 16)));
  });

  it('fills a BYOB view that is not a Uint8Array', async () => {
    const { handle } = createHandle();
    const buffer = new ArrayBuffer(32);
    const view = new Uint16Array(buffer, 8, 8);
    const { controller, responded } = createController(view);

    await new FileSystemReadableStreamSource(handle).pull(controller);

    expect(responded).toEqual([16]);
    expect(Array.from(new Uint8Array(buffer, 8, 16))).toEqual(Array.from(CONTENTS.subarray(0, 16)));
  });

  it('closes the stream when the handle is exhausted', async () => {
    const { handle } = createHandle(new Uint8Array(0));
    const view = new Uint8Array(new ArrayBuffer(32), 8, 16);
    const { controller, responded } = createController(view);
    const close = jest.spyOn(controller, 'close');

    await new FileSystemReadableStreamSource(handle).pull(controller);

    expect(close).toHaveBeenCalled();
    expect(responded).toEqual([0]);
  });
});
