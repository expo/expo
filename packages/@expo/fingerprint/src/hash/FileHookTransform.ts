import { Transform, type TransformCallback } from 'stream';

import type { FileHookTransformSource, FileHookTransformFunction } from '../Fingerprint.types';

/**
 * A transform stream that allows to hook into file contents and transform them.
 */
export class FileHookTransform extends Transform {
  constructor(
    private readonly source: FileHookTransformSource,
    private readonly transformFn: FileHookTransformFunction
  ) {
    super();
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    const result = this.transformFn(this.source, chunk, false /* isEndOfFile */, encoding);
    if (result) {
      this.push(result);
    }
    callback();
  }

  _flush(callback: TransformCallback): void {
    const result = this.transformFn(this.source, null, true /* isEndOfFile */, 'utf8');
    if (result) {
      this.push(result);
    }
    callback();
  }
}
