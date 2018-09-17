/**
 * @flow
 * Query representation wrapper
 */
import { utils, events, getLogger, getNativeModule } from 'expo-firebase-app';
import DocumentSnapshot from './DocumentSnapshot';
import FieldPath from './FieldPath';
import QuerySnapshot from './QuerySnapshot';
import { buildNativeArray, buildTypeMap } from './utils/serialize';

import type Firestore from './index';
import type Path from './Path';
import type { MetadataChanges, QueryDirection, QueryOperator } from './types';

const { getAppEventName, SharedEventEmitter } = events;
const { firestoreAutoId, isFunction, isObject } = utils;

const DIRECTIONS: { [QueryDirection]: string } = {
  ASC: 'ASCENDING',
  asc: 'ASCENDING',
  DESC: 'DESCENDING',
  desc: 'DESCENDING',
};

const OPERATORS: { [QueryOperator]: string } = {
  '=': 'EQUAL',
  '==': 'EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
};

type NativeFieldPath = {|
  elements?: string[],
  string?: string,
  type: 'fieldpath' | 'string',
|};
type FieldFilter = {|
  fieldPath: NativeFieldPath,
  operator: string,
  value: any,
|};
type FieldOrder = {|
  direction: string,
  fieldPath: NativeFieldPath,
|};
type QueryOptions = {
  endAt?: any[],
  endBefore?: any[],
  limit?: number,
  offset?: number,
  selectFields?: string[],
  startAfter?: any[],
  startAt?: any[],
};

export type ObserverOnError = Object => void;
export type ObserverOnNext = QuerySnapshot => void;

export type Observer = {
  error?: ObserverOnError,
  next: ObserverOnNext,
};

const buildNativeFieldPath = (fieldPath: string | FieldPath): NativeFieldPath => {
  if (fieldPath instanceof FieldPath) {
    return {
      elements: fieldPath._segments,
      type: 'fieldpath',
    };
  }
  return {
    string: fieldPath,
    type: 'string',
  };
};

/**
 * @class Query
 */
export default class Query {
  _fieldFilters: FieldFilter[];
  _fieldOrders: FieldOrder[];
  _firestore: Firestore;
  _iid: number;
  _queryOptions: QueryOptions;
  _referencePath: Path;

  constructor(
    firestore: Firestore,
    path: Path,
    fieldFilters?: FieldFilter[],
    fieldOrders?: FieldOrder[],
    queryOptions?: QueryOptions
  ) {
    this._fieldFilters = fieldFilters || [];
    this._fieldOrders = fieldOrders || [];
    this._firestore = firestore;
    this._queryOptions = queryOptions || {};
    this._referencePath = path;
  }

  get firestore(): Firestore {
    return this._firestore;
  }

  endAt(...snapshotOrVarArgs: any[]): Query {
    const options = {
      ...this._queryOptions,
      endAt: this._buildOrderByOption(snapshotOrVarArgs),
    };

    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  endBefore(...snapshotOrVarArgs: any[]): Query {
    const options = {
      ...this._queryOptions,
      endBefore: this._buildOrderByOption(snapshotOrVarArgs),
    };

    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  get(options?: GetOptions): Promise<QuerySnapshot> {
    if (options) {
      if (!isObject(options)) {
        return Promise.reject(new Error('Query.get failed: First argument must be an object.'));
      } else if (
        options.source &&
        (options.source !== 'default' && options.source !== 'server' && options.source !== 'cache')
      ) {
        return Promise.reject(
          new Error(
            'Query.get failed: GetOptions.source must be one of `default`, `server` or `cache`.'
          )
        );
      }
    }
    return getNativeModule(this._firestore)
      .collectionGet(
        this._referencePath.relativeName,
        this._fieldFilters,
        this._fieldOrders,
        this._queryOptions,
        options
      )
      .then(nativeData => new QuerySnapshot(this._firestore, this, nativeData));
  }

  limit(limit: number): Query {
    // TODO: Validation
    // validate.isInteger('n', n);

    const options = {
      ...this._queryOptions,
      limit,
    };
    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  onSnapshot(
    optionsOrObserverOrOnNext: MetadataChanges | Observer | ObserverOnNext,
    observerOrOnNextOrOnError?: Observer | ObserverOnNext | ObserverOnError,
    onError?: ObserverOnError
  ) {
    let observer: Observer;
    let metadataChanges = {};
    // Called with: onNext, ?onError
    if (isFunction(optionsOrObserverOrOnNext)) {
      if (observerOrOnNextOrOnError && !isFunction(observerOrOnNextOrOnError)) {
        throw new Error('Query.onSnapshot failed: Second argument must be a valid function.');
      }
      // $FlowExpectedError: Not coping with the overloaded method signature
      observer = {
        next: optionsOrObserverOrOnNext,
        error: observerOrOnNextOrOnError,
      };
    } else if (optionsOrObserverOrOnNext && isObject(optionsOrObserverOrOnNext)) {
      // Called with: Observer
      if (optionsOrObserverOrOnNext.next) {
        if (isFunction(optionsOrObserverOrOnNext.next)) {
          if (optionsOrObserverOrOnNext.error && !isFunction(optionsOrObserverOrOnNext.error)) {
            throw new Error('Query.onSnapshot failed: Observer.error must be a valid function.');
          }
          // $FlowExpectedError: Not coping with the overloaded method signature
          observer = {
            next: optionsOrObserverOrOnNext.next,
            error: optionsOrObserverOrOnNext.error,
          };
        } else {
          throw new Error('Query.onSnapshot failed: Observer.next must be a valid function.');
        }
      } else if (
        Object.prototype.hasOwnProperty.call(optionsOrObserverOrOnNext, 'includeMetadataChanges')
      ) {
        metadataChanges = optionsOrObserverOrOnNext;
        // Called with: Options, onNext, ?onError
        if (isFunction(observerOrOnNextOrOnError)) {
          if (onError && !isFunction(onError)) {
            throw new Error('Query.onSnapshot failed: Third argument must be a valid function.');
          }
          // $FlowExpectedError: Not coping with the overloaded method signature
          observer = {
            next: observerOrOnNextOrOnError,
            error: onError,
          };
          // Called with Options, Observer
        } else if (
          observerOrOnNextOrOnError &&
          isObject(observerOrOnNextOrOnError) &&
          observerOrOnNextOrOnError.next
        ) {
          if (isFunction(observerOrOnNextOrOnError.next)) {
            if (observerOrOnNextOrOnError.error && !isFunction(observerOrOnNextOrOnError.error)) {
              throw new Error('Query.onSnapshot failed: Observer.error must be a valid function.');
            }
            observer = {
              next: observerOrOnNextOrOnError.next,
              error: observerOrOnNextOrOnError.error,
            };
          } else {
            throw new Error('Query.onSnapshot failed: Observer.next must be a valid function.');
          }
        } else {
          throw new Error(
            'Query.onSnapshot failed: Second argument must be a function or observer.'
          );
        }
      } else {
        throw new Error(
          'Query.onSnapshot failed: First argument must be a function, observer or options.'
        );
      }
    } else {
      throw new Error('Query.onSnapshot failed: Called with invalid arguments.');
    }
    const listenerId = firestoreAutoId();

    const listener = nativeQuerySnapshot => {
      const querySnapshot = new QuerySnapshot(this._firestore, this, nativeQuerySnapshot);
      observer.next(querySnapshot);
    };

    // Listen to snapshot events
    SharedEventEmitter.addListener(
      getAppEventName(this._firestore, `onQuerySnapshot:${listenerId}`),
      listener
    );

    // Listen for snapshot error events
    if (observer.error) {
      SharedEventEmitter.addListener(
        getAppEventName(this._firestore, `onQuerySnapshotError:${listenerId}`),
        observer.error
      );
    }

    // Add the native listener
    getNativeModule(this._firestore).collectionOnSnapshot(
      this._referencePath.relativeName,
      this._fieldFilters,
      this._fieldOrders,
      this._queryOptions,
      listenerId,
      metadataChanges
    );

    // Return an unsubscribe method
    return this._offCollectionSnapshot.bind(this, listenerId, listener);
  }

  orderBy(fieldPath: string | FieldPath, directionStr?: QueryDirection = 'asc'): Query {
    // TODO: Validation
    // validate.isFieldPath('fieldPath', fieldPath);
    // validate.isOptionalFieldOrder('directionStr', directionStr);

    if (
      this._queryOptions.startAt ||
      this._queryOptions.startAfter ||
      this._queryOptions.endAt ||
      this._queryOptions.endBefore
    ) {
      throw new Error(
        'Cannot specify an orderBy() constraint after calling ' +
          'startAt(), startAfter(), endBefore() or endAt().'
      );
    }

    const newOrder: FieldOrder = {
      direction: DIRECTIONS[directionStr],
      fieldPath: buildNativeFieldPath(fieldPath),
    };
    const combinedOrders = this._fieldOrders.concat(newOrder);
    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      combinedOrders,
      this._queryOptions
    );
  }

  startAfter(...snapshotOrVarArgs: any[]): Query {
    const options = {
      ...this._queryOptions,
      startAfter: this._buildOrderByOption(snapshotOrVarArgs),
    };

    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  startAt(...snapshotOrVarArgs: any[]): Query {
    const options = {
      ...this._queryOptions,
      startAt: this._buildOrderByOption(snapshotOrVarArgs),
    };

    return new Query(
      this.firestore,
      this._referencePath,
      this._fieldFilters,
      this._fieldOrders,
      options
    );
  }

  where(fieldPath: string | FieldPath, opStr: QueryOperator, value: any): Query {
    // TODO: Validation
    // validate.isFieldPath('fieldPath', fieldPath);
    // validate.isFieldFilter('fieldFilter', opStr, value);
    const nativeValue = buildTypeMap(value);
    const newFilter: FieldFilter = {
      fieldPath: buildNativeFieldPath(fieldPath),
      operator: OPERATORS[opStr],
      value: nativeValue,
    };
    const combinedFilters = this._fieldFilters.concat(newFilter);
    return new Query(
      this.firestore,
      this._referencePath,
      combinedFilters,
      this._fieldOrders,
      this._queryOptions
    );
  }

  /**
   * INTERNALS
   */

  _buildOrderByOption(snapshotOrVarArgs: any[]) {
    // TODO: Validation
    let values;
    if (snapshotOrVarArgs.length === 1 && snapshotOrVarArgs[0] instanceof DocumentSnapshot) {
      const docSnapshot: DocumentSnapshot = snapshotOrVarArgs[0];
      values = [];
      for (let i = 0; i < this._fieldOrders.length; i++) {
        const fieldOrder = this._fieldOrders[i];
        if (fieldOrder.fieldPath.type === 'string' && fieldOrder.fieldPath.string) {
          values.push(docSnapshot.get(fieldOrder.fieldPath.string));
        } else if (fieldOrder.fieldPath.fieldpath) {
          const fieldPath = new FieldPath(...fieldOrder.fieldPath.fieldpath);
          values.push(docSnapshot.get(fieldPath));
        }
      }
    } else {
      values = snapshotOrVarArgs;
    }

    return buildNativeArray(values);
  }

  /**
   * Remove query snapshot listener
   * @param listener
   */
  _offCollectionSnapshot(listenerId: string, listener: Function) {
    getLogger(this._firestore).info('Removing onQuerySnapshot listener');
    SharedEventEmitter.removeListener(
      getAppEventName(this._firestore, `onQuerySnapshot:${listenerId}`),
      listener
    );
    SharedEventEmitter.removeListener(
      getAppEventName(this._firestore, `onQuerySnapshotError:${listenerId}`),
      listener
    );
    getNativeModule(this._firestore).collectionOffSnapshot(
      this._referencePath.relativeName,
      this._fieldFilters,
      this._fieldOrders,
      this._queryOptions,
      listenerId
    );
  }
}
