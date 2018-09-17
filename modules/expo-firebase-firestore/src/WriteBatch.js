/**
 * @flow
 * WriteBatch representation wrapper
 */
import { getNativeModule } from 'expo-firebase-app';
import { parseUpdateArgs } from './utils';
import { buildNativeMap } from './utils/serialize';

import type DocumentReference from './DocumentReference';
import type Firestore from './';
import type { SetOptions } from './types';

type DocumentWrite = {
  data?: Object,
  options?: Object,
  path: string,
  type: 'DELETE' | 'SET' | 'UPDATE',
};

/**
 * @class WriteBatch
 */
export default class WriteBatch {
  _firestore: Firestore;
  _writes: DocumentWrite[];

  constructor(firestore: Firestore) {
    this._firestore = firestore;
    this._writes = [];
  }

  commit(): Promise<void> {
    return getNativeModule(this._firestore).documentBatch(this._writes);
  }

  delete(docRef: DocumentReference): WriteBatch {
    // TODO: Validation
    // validate.isDocumentReference('docRef', docRef);
    // validate.isOptionalPrecondition('deleteOptions', deleteOptions);
    this._writes.push({
      path: docRef.path,
      type: 'DELETE',
    });

    return this;
  }

  set(docRef: DocumentReference, data: Object, options?: SetOptions) {
    // TODO: Validation
    // validate.isDocumentReference('docRef', docRef);
    // validate.isDocument('data', data);
    // validate.isOptionalPrecondition('options', writeOptions);
    const nativeData = buildNativeMap(data);
    this._writes.push({
      data: nativeData,
      options,
      path: docRef.path,
      type: 'SET',
    });

    return this;
  }

  update(docRef: DocumentReference, ...args: any[]): WriteBatch {
    // TODO: Validation
    // validate.isDocumentReference('docRef', docRef);
    const data = parseUpdateArgs(args, 'WriteBatch.update');
    this._writes.push({
      data: buildNativeMap(data),
      path: docRef.path,
      type: 'UPDATE',
    });

    return this;
  }
}
