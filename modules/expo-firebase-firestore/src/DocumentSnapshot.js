/**
 * @flow
 * DocumentSnapshot representation wrapper
 */
import { utils } from 'expo-firebase-app';
import DocumentReference from './DocumentReference';
import FieldPath from './FieldPath';
import Path from './Path';
import { parseNativeMap } from './utils/serialize';

import type Firestore from './';
import type { NativeDocumentSnapshot, SnapshotMetadata } from './types';

const { isObject, deepGet } = utils;

const extractFieldPathData = (data: Object | void, segments: string[]): any => {
  if (!data || !isObject(data)) {
    return undefined;
  }
  const pathValue = data[segments[0]];
  if (segments.length === 1) {
    return pathValue;
  }
  return extractFieldPathData(pathValue, segments.slice(1));
};

/**
 * @class DocumentSnapshot
 */
export default class DocumentSnapshot {
  _data: Object | void;
  _metadata: SnapshotMetadata;
  _ref: DocumentReference;

  constructor(firestore: Firestore, nativeData: NativeDocumentSnapshot) {
    this._data = parseNativeMap(firestore, nativeData.data);
    this._metadata = nativeData.metadata;
    this._ref = new DocumentReference(firestore, Path.fromName(nativeData.path));
  }

  get exists(): boolean {
    return this._data !== undefined;
  }

  get id(): string | null {
    return this._ref.id;
  }

  get metadata(): SnapshotMetadata {
    return this._metadata;
  }

  get ref(): DocumentReference {
    return this._ref;
  }

  data = (): Object | void => this._data;

  get = (fieldPath: string | FieldPath): any => {
    if (fieldPath instanceof FieldPath) {
      return extractFieldPathData(this._data, fieldPath._segments);
    }

    return deepGet(this._data, fieldPath, '.');
  };
}
