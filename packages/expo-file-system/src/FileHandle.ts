import { FileMode, type FileHandleReadWriteOptions } from './File.types';
import type { NativeFileSystemFileHandle } from './internal/NativeFileSystem.types';

function asUint8View(buffer: ArrayBuffer | ArrayBufferView): Uint8Array {
  return ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
}

/**
 * Provides low-level, random-access read and write operations on a file.
 *
 * Obtain a `FileHandle` by calling [`File.open()`](#openmode) on a `File` instance.
 * The handle maintains an internal byte offset that advances automatically with each
 * read or write. Set the `offset` property to seek to an arbitrary position.
 * Async reads with `at` start at once and can finish in any order. All other async calls,
 * including writes with `at`, run one at a time, in call order.
 *
 * Reads and writes also take `{ at }` to use a byte position instead of the offset. A call with
 * `at` leaves `offset` unchanged. `readInto` and `readIntoSync` fill a caller-supplied buffer, so
 * repeated reads do not allocate a new buffer for the data.
 *
 * Always call `close()` when finished to release the underlying file descriptor.
 * Failing to close a handle may prevent the file from being deleted, moved, or
 * opened by another process.
 *
 * @example
 * ```ts
 * import { File, Paths, FileMode } from 'expo-file-system';
 *
 * const file = new File(Paths.cache, 'data.bin');
 * const handle = file.open(FileMode.ReadOnly);
 *
 * // Read the first 4 bytes (for example, a magic number)
 * const header = handle.readBytesSync(4);
 *
 * // Seek to byte 100 and read 50 bytes
 * handle.offset = 100;
 * const chunk = await handle.readBytes(50);
 *
 * // Read 16 bytes at byte 1000 without moving the offset
 * const other = await handle.readBytes(16, { at: 1000 });
 *
 * handle.close();
 * ```
 */
export class FileHandle {
  private readonly native: NativeFileSystemFileHandle;
  // The only cursor there is. JavaScript is single-threaded, so it cannot race with native I/O.
  private cursor: number;
  private closed = false;
  // Async operations on one handle run one after another, so concurrent calls read consecutive
  // chunks instead of starting from the same offset.
  private queue: Promise<unknown> = Promise.resolve();
  // Async operations, queued or not, that have not settled yet. `close()` waits for them.
  private readonly inFlight = new Set<Promise<unknown>>();

  /**
   * @hidden
   */
  constructor(native: NativeFileSystemFileHandle, mode?: FileMode) {
    this.native = native;
    this.cursor = mode === FileMode.Append ? (native.size ?? 0) : 0;
  }

  /**
   * The current byte offset in the file.
   *
   * Reading or writing advances the offset by the number of bytes processed. Set this
   * property to seek to an arbitrary position before the next read or write. If set to
   * a value greater than the file size, the next write grows the file and fills the gap
   * with zero bytes. In `FileMode.Append` the offset is ignored and every write goes to
   * the end of the file.
   * A negative or non-integer offset makes the next read or write throw a `RangeError`.
   * Setting `offset` while an async operation is still pending has no defined result.
   * Await the operation first.
   *
   * Returns `null` after the handle has been closed.
   */
  get offset(): number | null {
    return this.closed ? null : this.cursor;
  }

  set offset(value: number | null) {
    if (this.closed || value == null) {
      return;
    }
    this.cursor = value;
  }

  /**
   * The total size of the file in bytes, or `null` if the handle has been closed.
   *
   * Reading this property does not change the current offset.
   */
  get size(): number | null {
    return this.closed ? null : this.native.size;
  }

  /**
   * Reads up to `length` bytes from the file starting at the current offset.
   *
   * The returned `Uint8Array` may contain fewer than `length` bytes if the end of the
   * file is reached. Returns an empty `Uint8Array` when the offset is already at or
   * past the end of the file. The `offset` advances by the number of bytes actually read.
   *
   * With `options.at`, the call reads from that byte position. It does not use or change `offset`,
   * and it does not wait for earlier calls on the handle. Several reads with `at` can run at the
   * same time and finish in any order.
   *
   * The maximum number of bytes that can be read in a single call is limited by the
   * platform's `ArrayBuffer` size: 2 GB (signed 32-bit max) on Android, and the 64-bit
   * limit on iOS. To read larger files, call this method in a loop.
   *
   * @param length The number of bytes to read.
   * @param options Pass `at` to read from a byte position without using or moving the `offset`.
   * @return A promise fulfilled with a `Uint8Array` containing the bytes read.
   */
  readBytes(
    length: number,
    options?: FileHandleReadWriteOptions
  ): Promise<Uint8Array<ArrayBuffer>> {
    const at = options?.at;
    if (at != null) {
      return this.track(
        async () => new Uint8Array(await this.native.readAt(this.resolvePosition(at), length))
      );
    }
    return this.enqueue(async () => {
      const start = this.resolvePosition(undefined);
      const buffer = await this.native.readAt(start, length);
      this.cursor = start + buffer.byteLength;
      return new Uint8Array(buffer);
    });
  }

  /**
   * Reads up to `length` bytes from the file starting at the current offset, synchronously.
   *
   * Behaves identically to `readBytes` but blocks the JS thread until the data is available.
   * With `options.at`, the call reads from that byte position and leaves `offset` unchanged.
   *
   * @param length The number of bytes to read.
   * @param options Pass `at` to read from a byte position without using or moving the `offset`.
   * @return A `Uint8Array` containing the bytes read.
   */
  readBytesSync(length: number, options?: FileHandleReadWriteOptions): Uint8Array<ArrayBuffer> {
    this.ensureOpen();
    const at = options?.at;
    const buffer = this.native.readAtSync(this.resolvePosition(at), length);
    if (at == null) {
      this.cursor += buffer.byteLength;
    }
    return new Uint8Array(buffer);
  }

  /**
   * Reads bytes from the file into a caller-supplied buffer, and resolves with the number of
   * bytes read.
   *
   * The method fills the buffer from the start of the view and reads at most `byteLength` bytes.
   * It resolves with `0` at or past the end of the file. The rest of the buffer is not changed.
   * Without `options.at`, the read starts at the current `offset` and advances it. With `at`,
   * the call does not use or change `offset` and does not wait for earlier calls on the handle.
   *
   * The method reads into a native buffer and copies the bytes once into the caller's buffer.
   * Use `readIntoSync` to avoid the copy.
   *
   * @param buffer An `ArrayBuffer`, a typed array, or a `DataView` to fill.
   * @param options Pass `at` to read from a byte position without using or moving the `offset`.
   * @return A promise fulfilled with the number of bytes read.
   */
  readInto(
    buffer: ArrayBuffer | ArrayBufferView,
    options?: FileHandleReadWriteOptions
  ): Promise<number> {
    const view = asUint8View(buffer);
    const at = options?.at;
    if (at != null) {
      return this.track(async () => {
        const bytes = await this.native.readAt(this.resolvePosition(at), view.byteLength);
        view.set(new Uint8Array(bytes));
        return bytes.byteLength;
      });
    }
    return this.enqueue(async () => {
      const start = this.resolvePosition(undefined);
      const bytes = await this.native.readAt(start, view.byteLength);
      view.set(new Uint8Array(bytes));
      this.cursor = start + bytes.byteLength;
      return bytes.byteLength;
    });
  }

  /**
   * Reads bytes from the file into a caller-supplied buffer, synchronously, and returns the number
   * of bytes read.
   *
   * Behaves like `readInto` but blocks the JS thread. The method fills the buffer from the start of
   * the view and writes the file data straight into it, with no copy. It returns `0` at or past
   * the end of the file and leaves the rest of the buffer unchanged.
   *
   * > **Note:** On a JavaScript runtime without JS heap access, for example a worklet runtime,
   * > the buffer is not filled. Use `readBytes` there.
   *
   * @param buffer An `ArrayBuffer`, a typed array, or a `DataView` to fill.
   * @param options Pass `at` to read from a byte position without using or moving the `offset`.
   * @return The number of bytes read.
   */
  readIntoSync(
    buffer: ArrayBuffer | ArrayBufferView,
    options?: FileHandleReadWriteOptions
  ): number {
    this.ensureOpen();
    const at = options?.at;
    const count = this.native.readIntoSync(this.resolvePosition(at), asUint8View(buffer));
    if (at == null) {
      this.cursor += count;
    }
    return count;
  }

  /**
   * Writes the provided bytes to the file at the current offset, then advances the
   * offset by the number of bytes written.
   *
   * With `options.at`, the call writes at that byte position and leaves `offset` unchanged.
   * If `at` is past the end of the file, the file grows and the gap is filled with zero bytes.
   * In `FileMode.Append` the write ignores `at` and goes to the end of the file. Writes always
   * run in the order they are called.
   *
   * @param bytes An `ArrayBuffer` or a view on one, such as a `Uint8Array` or a `DataView`, containing the
   * bytes to write. A view writes only its own byte range.
   * @param options Pass `at` to write at a byte position without using or moving the `offset`.
   */
  writeBytes(
    bytes: ArrayBuffer | ArrayBufferView,
    options?: FileHandleReadWriteOptions
  ): Promise<void> {
    const view = asUint8View(bytes);
    const at = options?.at;
    return this.enqueue(async () => {
      const end = await this.native.writeAt(this.resolvePosition(at), view);
      if (at == null) {
        this.cursor = end;
      }
    });
  }

  /**
   * Writes the provided bytes to the file at the current offset synchronously, then
   * advances the offset by the number of bytes written.
   *
   * With `options.at`, the call writes at that byte position and leaves `offset` unchanged.
   * If `at` is past the end of the file, the file grows and the gap is filled with zero bytes.
   * In `FileMode.Append` the write ignores `at` and goes to the end of the file.
   *
   * @param bytes An `ArrayBuffer` or a view on one, such as a `Uint8Array` or a `DataView`, containing the
   * bytes to write. A view writes only its own byte range.
   * @param options Pass `at` to write at a byte position without using or moving the `offset`.
   */
  writeBytesSync(bytes: ArrayBuffer | ArrayBufferView, options?: FileHandleReadWriteOptions): void {
    this.ensureOpen();
    const at = options?.at;
    const end = this.native.writeAtSync(this.resolvePosition(at), asUint8View(bytes));
    if (at == null) {
      this.cursor = end;
    }
  }

  /**
   * Closes the file handle and releases the underlying file descriptor.
   *
   * After closing, the `offset` and `size` properties return `null`, and any
   * subsequent call to `readBytes`, `readBytesSync`, `readInto`,
   * `readIntoSync`, `writeBytes`, or `writeBytesSync` throws an error.
   */
  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    if (this.inFlight.size === 0) {
      this.native.close();
      return;
    }
    // An async operation is still running on a native thread. Closing the descriptor under it is
    // unsafe, so the native close waits until every in-flight operation has settled.
    Promise.allSettled([...this.inFlight])
      .then(() => this.native.close())
      .catch(() => {});
  }

  private ensureOpen(): void {
    if (this.closed) {
      throw new Error('The file handle is closed');
    }
  }

  // Native code takes the position as an unsigned integer. A negative, fractional or non-finite
  // number would crash on iOS or silently become 0 on Android, so it is rejected here.
  private resolvePosition(at: number | undefined): number {
    const position = at ?? this.cursor;
    if (!Number.isSafeInteger(position) || position < 0) {
      throw new RangeError(`The position must be a non-negative integer, got ${position}`);
    }
    return position;
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closed) {
      return Promise.reject(new Error('The file handle is closed'));
    }
    const result = this.register(this.queue.then(operation, operation));
    this.queue = result.catch(() => {});
    return result;
  }

  // Runs the operation at once, outside the queue, but still makes `close()` wait for it.
  private track<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closed) {
      return Promise.reject(new Error('The file handle is closed'));
    }
    return this.register(operation());
  }

  private register<T>(promise: Promise<T>): Promise<T> {
    const result = promise.finally(() => {
      this.inFlight.delete(result);
    });
    this.inFlight.add(result);
    return result;
  }
}
