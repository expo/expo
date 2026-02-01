// Copyright 2015-present 650 Industries. All rights reserved.

const UINT8ARRAY_TYPE = '__uint8array__';
const ERROR_TYPE = '__error__';

/**
 * Converts an Error object to a plain object with message, stack, and enumerable properties.
 */
export function serializeError(error: Error): Record<string, any> {
  const props: Record<string, any> = {};
  Object.keys(error).forEach((key) => {
    props[key] = (error as any)[key];
  });
  return {
    message: error.message,
    stack: error.stack,
    ...props,
  };
}

/**
 * Reconstructs an Error object from a serialized error object.
 */
export function deserializeError(data: any): Error {
  const error = new Error(data.message !== undefined ? data.message : String(data));
  if (data.stack) {
    error.stack = data.stack;
  }
  // Restore enumerable properties (like 'code')
  Object.keys(data).forEach((key) => {
    if (key !== 'message' && key !== 'stack') {
      (error as any)[key] = data[key];
    }
  });
  return error;
}

interface Uint8ArrayMarker {
  [UINT8ARRAY_TYPE]: true;
  data: number[];
}

interface ErrorMarker {
  [ERROR_TYPE]: true;
  message: string;
  stack?: string;
  [key: string]: any; // Allow additional enumerable properties like 'code'
}

function isUint8ArrayMarker(value: any): value is Uint8ArrayMarker {
  return (
    value !== null &&
    typeof value === 'object' &&
    UINT8ARRAY_TYPE in value &&
    Array.isArray((value as Uint8ArrayMarker).data)
  );
}

function isErrorMarker(value: any): value is ErrorMarker {
  return value !== null && typeof value === 'object' && ERROR_TYPE in value;
}

/**
 * Serializes a value to a string that supports Uint8Arrays and Error objects.
 */
export function serialize(value: any): string {
  return JSON.stringify(value, (_, v) => {
    if (v instanceof Uint8Array) {
      return {
        [UINT8ARRAY_TYPE]: true,
        data: Array.from(v),
      };
    }
    if (v instanceof Error) {
      return {
        [ERROR_TYPE]: true,
        ...serializeError(v),
      };
    }
    return v;
  });
}

/**
 * Deserializes a string to value that supports Uint8Arrays and Error objects.
 */
export function deserialize<T>(json: string): T {
  return JSON.parse(json, (_, value) => {
    if (isUint8ArrayMarker(value)) {
      return new Uint8Array(value.data);
    }
    if (isErrorMarker(value)) {
      // Remove the marker before deserializing
      const { [ERROR_TYPE]: _, ...errorData } = value;
      return deserializeError(errorData);
    }
    return value;
  });
}