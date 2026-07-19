// Copyright 2015-present 650 Industries. All rights reserved.

const UINT8ARRAY_TYPE = '__uint8array__';

interface Uint8ArrayMarker {
  [UINT8ARRAY_TYPE]: true;
  data: number[];
}

function isUint8ArrayMarker(value: any): value is Uint8ArrayMarker {
  return (
    value !== null &&
    typeof value === 'object' &&
    UINT8ARRAY_TYPE in value &&
    Array.isArray((value as Uint8ArrayMarker).data)
  );
}

/**
 * Serializes a value to a string that supports Uint8Arrays.
 */
export function serialize(value: any): string {
  return JSON.stringify(value, (_, v) => {
    if (v instanceof Uint8Array) {
      return {
        [UINT8ARRAY_TYPE]: true,
        data: Array.from(v),
      };
    }
    return v;
  });
}

/**
 * Deserializes a string to value that supports Uint8Arrays.
 */
export function deserialize<T>(json: string): T {
  return JSON.parse(json, (_, value) => {
    if (isUint8ArrayMarker(value)) {
      return new Uint8Array(value.data);
    }
    return value;
  });
}
