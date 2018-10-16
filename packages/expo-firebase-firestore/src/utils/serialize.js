/**
 * @flow
 */
import DocumentReference from '../DocumentReference';
import Blob from '../Blob';
import { DOCUMENT_ID } from '../FieldPath';
import { DELETE_FIELD_VALUE, SERVER_TIMESTAMP_FIELD_VALUE } from '../FieldValue';
import GeoPoint from '../GeoPoint';
import Path from '../Path';
import { utils } from 'expo-firebase-app';

import type Firestore from '../';
import type { NativeTypeMap } from '../types';

const { typeOf } = utils;

/*
 * Functions that build up the data needed to represent
 * the different types available within Firestore
 * for transmission to the native side
 */

export const buildNativeMap = (data: Object): { [string]: NativeTypeMap } => {
  const nativeData = {};
  if (data) {
    Object.keys(data).forEach(key => {
      const typeMap = buildTypeMap(data[key]);
      if (typeMap) {
        nativeData[key] = typeMap;
      }
    });
  }
  return nativeData;
};

export const buildNativeArray = (array: Object[]): NativeTypeMap[] => {
  const nativeArray = [];
  if (array) {
    array.forEach(value => {
      const typeMap = buildTypeMap(value);
      if (typeMap) {
        nativeArray.push(typeMap);
      }
    });
  }
  return nativeArray;
};

export const buildTypeMap = (value: any): NativeTypeMap | null => {
  const type = typeOf(value);
  if (value === null || value === undefined || Number.isNaN(value)) {
    return {
      type: 'null',
      value: null,
    };
  }
  if (value === DELETE_FIELD_VALUE) {
    return {
      type: 'fieldvalue',
      value: 'delete',
    };
  }
  if (value === SERVER_TIMESTAMP_FIELD_VALUE) {
    return {
      type: 'fieldvalue',
      value: 'timestamp',
    };
  }
  if (value === DOCUMENT_ID) {
    return {
      type: 'documentid',
      value: null,
    };
  }
  if (type === 'boolean' || type === 'number' || type === 'string') {
    return {
      type,
      value,
    };
  }
  if (type === 'array') {
    return {
      type,
      value: buildNativeArray(value),
    };
  }
  if (type === 'object') {
    if (value instanceof DocumentReference) {
      return {
        type: 'reference',
        value: value.path,
      };
    }
    if (value instanceof GeoPoint) {
      return {
        type: 'geopoint',
        value: {
          latitude: value.latitude,
          longitude: value.longitude,
        },
      };
    }
    if (value instanceof Date) {
      return {
        type: 'date',
        value: value.getTime(),
      };
    }
    if (value instanceof Blob) {
      return {
        type: 'blob',
        value: value.toBase64(),
      };
    }
    return {
      type: 'object',
      value: buildNativeMap(value),
    };
  }
  console.warn(`Unknown data type received ${type}`);
  return null;
};

/*
 * Functions that parse the received from the native
 * side and converts to the correct Firestore JS types
 */

export const parseNativeMap = (
  firestore: Firestore,
  nativeData: { [string]: NativeTypeMap }
): Object | void => {
  let data;
  if (nativeData) {
    data = {};
    Object.keys(nativeData).forEach(key => {
      data[key] = parseTypeMap(firestore, nativeData[key]);
    });
  }
  return data;
};

const parseNativeArray = (firestore: Firestore, nativeArray: NativeTypeMap[]): any[] => {
  const array = [];
  if (nativeArray) {
    nativeArray.forEach(typeMap => {
      array.push(parseTypeMap(firestore, typeMap));
    });
  }
  return array;
};

const parseTypeMap = (firestore: Firestore, typeMap: NativeTypeMap): any => {
  const { type, value } = typeMap;
  if (type === 'null') {
    return null;
  }
  if (type === 'boolean' || type === 'number' || type === 'string') {
    return value;
  }
  if (type === 'array') {
    return parseNativeArray(firestore, value);
  }
  if (type === 'object') {
    return parseNativeMap(firestore, value);
  }
  if (type === 'reference') {
    return new DocumentReference(firestore, Path.fromName(value));
  }
  if (type === 'geopoint') {
    return new GeoPoint(value.latitude, value.longitude);
  }
  if (type === 'date') {
    return new Date(value);
  }
  if (type === 'blob') {
    return Blob.fromBase64String(value);
  }
  console.warn(`Unknown data type received ${type}`);
  return value;
};
