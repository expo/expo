/**
 * @flow
 * FieldValue representation wrapper
 */

import type { AnyJs } from './utils/any';

export default class FieldValue {
  _type: string;

  _elements: AnyJs[] | any;

  constructor(type: string, elements?: AnyJs[]) {
    this._type = type;
    this._elements = elements;
  }

  get type(): string {
    return this._type;
  }

  get elements(): AnyJs[] {
    return this._elements;
  }

  static delete(): FieldValue {
    return new FieldValue(TypeFieldValueDelete);
  }

  static serverTimestamp(): FieldValue {
    return new FieldValue(TypeFieldValueTimestamp);
  }

  static arrayUnion(...elements: AnyJs[]) {
    return new FieldValue(TypeFieldValueUnion, elements);
  }

  static arrayRemove(...elements: AnyJs[]) {
    return new FieldValue(TypeFieldValueRemove, elements);
  }
}

export const TypeFieldValueDelete = 'delete';
export const TypeFieldValueRemove = 'remove';
export const TypeFieldValueUnion = 'union';
export const TypeFieldValueTimestamp = 'timestamp';
