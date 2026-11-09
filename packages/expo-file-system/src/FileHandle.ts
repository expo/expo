import { FileMode, type FileHandleReadWriteOptions } from './File.types';
import type { NativeFileSystemFileHandle } from './internal/NativeFileSystem.types';

/**
 * Provides low-level, random-access read and write operations on a file.
 *
 * Obtain a `FileHandle` by calling [`File.open()`](#openmode) on a `File` instance.
 * The handle maintains an internal byte offset that advances automatically with each
 * read or write. Set the `offset` property to seek to an arbitrary position.
 * Async operations on the same handle run one at a time, in the order they are called.
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
   * The maximum number of bytes that can be read in a single call is limited by the
   * platform's `ArrayBuffer` size: 2 GB (signed 32-bit max) on Android, and the 64-bit
   * limit on iOS. To read larger files, call this method in a loop.
   *
   * @param length The number of bytes to read.
   * @return A promise fulfilled with a `Uint8Array` containing the bytes read.
   */
  readBytes(
    length: number,
    options?: FileHandleReadWriteOptions
  ): Promise<Uint8Array<ArrayBuffer>> {
    const at = options?.at;
    if (at != null) {
      return this.track(async () => new Uint8Array(await this.native.readAt(at, length)));
    }
    return this.enqueue(async () => {
      const start = this.cursor;
      const buffer = await this.native.readAt(start, length);
      this.cursor = start + buffer.byteLength;
      return new Uint8Array(buffer);
    });
  }

  /**
   * Reads up to `length` bytes from the file starting at the current offset, synchronously.
   *
   * Behaves identically to `readBytes` but blocks the JS thread until the data is available.
   *
   * @param length The number of bytes to read.
   * @return A `Uint8Array` containing the bytes read.
   */
  readBytesSync(length: number, options?: FileHandleReadWriteOptions): Uint8Array<ArrayBuffer> {
    this.ensureOpen();
    const at = options?.at;
    const buffer = this.native.readAtSync(at ?? this.cursor, length);
    if (at == null) {
      this.cursor += buffer.byteLength;
    }
    return new Uint8Array(buffer);
  }

  /**
   * Writes the provided bytes to the file at the current offset, then advances the
   * offset by the number of bytes written.
   *
   * @param bytes A `Uint8Array` containing the bytes to write.
   */
  writeBytes(bytes: Uint8Array, options?: FileHandleReadWriteOptions): Promise<void> {
    const at = options?.at;
    return this.enqueue(async () => {
      const end = await this.native.writeAt(at ?? this.cursor, bytes);
      if (at == null) {
        this.cursor = end;
      }
    });
  }

  /**
   * Writes the provided bytes to the file at the current offset synchronously, then
   * advances the offset by the number of bytes written.
   *
   * @param bytes A `Uint8Array` containing the bytes to write.
   */
  writeBytesSync(bytes: Uint8Array, options?: FileHandleReadWriteOptions): void {
    this.ensureOpen();
    const at = options?.at;
    const end = this.native.writeAtSync(at ?? this.cursor, bytes);
    if (at == null) {
      this.cursor = end;
    }
  }

  /**
   * Closes the file handle and releases the underlying file descriptor.
   *
   * After closing, the `offset` and `size` properties return `null`, and any
   * subsequent call to `readBytes`, `readBytesSync`, `writeBytes`, or
   * `writeBytesSync` throws an error.
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
    Promise.allSettled([...this.inFlight]).then(() => this.native.close());
  }

  private ensureOpen(): void {
    if (this.closed) {
      throw new Error('The file handle is closed');
    }
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
