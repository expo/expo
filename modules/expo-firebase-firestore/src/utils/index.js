/**
 * @flow
 */
import FieldPath from '../FieldPath';
import { utils } from 'expo-firebase-app';
const { isObject, isString } = utils;

const buildFieldPathData = (segments: string[], value: any): Object => {
  if (segments.length === 1) {
    return {
      [segments[0]]: value,
    };
  }
  return {
    [segments[0]]: buildFieldPathData(segments.slice(1), value),
  };
};

// eslint-disable-next-line import/prefer-default-export
export const mergeFieldPathData = (data: Object, segments: string[], value: any): Object => {
  if (segments.length === 1) {
    return {
      ...data,
      [segments[0]]: value,
    };
  }
  if (data[segments[0]]) {
    return {
      ...data,
      [segments[0]]: mergeFieldPathData(data[segments[0]], segments.slice(1), value),
    };
  }
  return {
    ...data,
    [segments[0]]: buildFieldPathData(segments.slice(1), value),
  };
};

export const parseUpdateArgs = (args: any[], methodName: string) => {
  let data = {};
  if (args.length === 1) {
    if (!isObject(args[0])) {
      throw new Error(
        `${methodName} failed: If using a single update argument, it must be an object.`
      );
    }
    [data] = args;
  } else if (args.length % 2 === 1) {
    throw new Error(
      `${methodName} failed: The update arguments must be either a single object argument, or equal numbers of key/value pairs.`
    );
  } else {
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];
      if (isString(key)) {
        data[key] = value;
      } else if (key instanceof FieldPath) {
        data = mergeFieldPathData(data, key._segments, value);
      } else {
        throw new Error(
          `${methodName} failed: Argument at index ${i} must be a string or FieldPath`
        );
      }
    }
  }
  return data;
};
