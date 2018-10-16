/**
 * @flow
 * FieldPath representation wrapper
 */

/**
 * @class FieldPath
 */
export default class FieldPath {
  _segments: string[];

  constructor(...segments: string[]) {
    // TODO: Validation
    this._segments = segments;
  }

  static documentId(): FieldPath {
    return DOCUMENT_ID;
  }
}

export const DOCUMENT_ID = new FieldPath('__name__');
