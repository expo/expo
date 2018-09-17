/**
 * @flow
 * FieldValue representation wrapper
 */

export default class FieldValue {
  static delete(): FieldValue {
    return DELETE_FIELD_VALUE;
  }

  static serverTimestamp(): FieldValue {
    return SERVER_TIMESTAMP_FIELD_VALUE;
  }
}

export const DELETE_FIELD_VALUE = new FieldValue();
export const SERVER_TIMESTAMP_FIELD_VALUE = new FieldValue();
