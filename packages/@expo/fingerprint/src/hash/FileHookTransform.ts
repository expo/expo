import { Transform, type TransformCallback } from 'stream';

import type { FileHookTransformSource, FileHookTransformFunction } from '../Fingerprint.types';

/**
 * A transform stream that allows to hook into file contents and transform them.
 */
export class FileHookTransform extends Transform {
  private _isTransformed: boolean | undefined = undefined;

  constructor(
    private readonly source: FileHookTransformSource,
    private readonly transformFn: FileHookTransformFunction,
    private readonly debug: boolean | undefined
  ) {
    super();
  }

  /**
   * Indicates whether the file content has been transformed.
   * @returns boolean value if `debug` is true, otherwise the value would be undefined.
   */
  get isTransformed(): boolean | undefined {
    return this._isTransformed;
  }

  //#region - Transform implementations

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    const result = this.transformFn(this.source, chunk, false /* isEndOfFile */, encoding);
    if (this.debug) {
      this._isTransformed ||= chunk !== result;
    }
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

  //#endregion - Transform implementations
}
