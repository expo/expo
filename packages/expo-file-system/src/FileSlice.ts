import type { File } from './File';
import { FileMode } from './File.types';

const STREAM_CHUNK_SIZE = 64 * 1024;

/**
 * A lazy, range-based slice of a {@link File} that implements the `Blob` interface.
 *
 * Unlike `Blob`, `FileSlice` does not read any data at construction time.
 * The underlying bytes are fetched on demand when a consumption method
 * (`arrayBuffer`, `text`, `bytes`, `stream`) is called, and only the
 * requested byte range is read from disk.
 *
 * Each consumption call opens its own `FileHandle`, so concurrent reads
 * from the same slice (or different slices of the same file) are safe.
 *
 * Calling `slice()` on a `FileSlice` produces a new `FileSlice` with
 * composed offsets -- no data is copied or read.
 */
export class FileSlice implements Blob {
  private readonly source: File;
  private readonly _start: number;
  private readonly _end: number;
  readonly type: string;

  get [Symbol.toStringTag]() {
    return 'Blob';
  }

  constructor(source: File, start: number, end: number, contentType: string) {
    this.source = source;
    this._start = start;
    this._end = Math.max(start, end);
    this.type = contentType;
  }

  get size(): number {
    return this._end - this._start;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.size === 0) {
      return new ArrayBuffer(0);
    }
    const handle = this.source.open(FileMode.ReadOnly);
    try {
      handle.offset = this._start;
      const bytes = await handle.readBytes(this.size);
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
    } finally {
      handle.close();
    }
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this.size === 0) {
      return new Uint8Array(0);
    }
    const handle = this.source.open(FileMode.ReadOnly);
    try {
      handle.offset = this._start;
      const result = await handle.readBytes(this.size);
      return result as Uint8Array<ArrayBuffer>;
    } finally {
      handle.close();
    }
  }

  async text(): Promise<string> {
    const buf = await this.arrayBuffer();
    return new TextDecoder().decode(buf);
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const size = this.size;
    const relStart =
      start == null ? 0 : start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relEnd = end == null ? size : end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    if (relEnd < relStart) {
      relEnd = relStart;
    }
    return new FileSlice(
      this.source,
      this._start + relStart,
      this._start + relEnd,
      contentType ?? this.type
    );
  }

  stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    if (this.size === 0) {
      return new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
    }

    const handle = this.source.open(FileMode.ReadOnly);
    handle.offset = this._start;
    let remaining = this.size;

    return new ReadableStream({
      async pull(controller) {
        try {
          if (remaining <= 0) {
            handle.close();
            controller.close();
            return;
          }
          const toRead = Math.min(STREAM_CHUNK_SIZE, remaining);
          const bytes = await handle.readBytes(toRead);
          remaining -= bytes.length;
          if (bytes.length === 0) {
            handle.close();
            controller.close();
            return;
          }
          controller.enqueue(bytes as Uint8Array<ArrayBuffer>);
        } catch (err) {
          handle.close();
          controller.error(err);
        }
      },
      cancel() {
        handle.close();
      },
    });
  }

  async formData(): ReturnType<Response['formData']> {
    return new Response(await this.arrayBuffer(), {
      headers: this.type ? { 'Content-Type': this.type } : undefined,
    }).formData();
  }

  async json(): Promise<any> {
    return JSON.parse(await this.text());
  }
}
