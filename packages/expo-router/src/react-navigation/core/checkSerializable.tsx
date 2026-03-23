const checkSerializableWithoutCircularReference = (
  o: { [key: string]: any },
  seen: Set<any>,
  location: (string | number)[]
):
  | { serializable: true }
  | {
      serializable: false;
      location: (string | number)[];
      reason: string;
    } => {
  if (
    o === undefined ||
    o === null ||
    typeof o === 'boolean' ||
    typeof o === 'number' ||
    typeof o === 'string'
  ) {
    return { serializable: true };
  }

  if (
    Object.prototype.toString.call(o) !== '[object Object]' &&
    !Array.isArray(o)
  ) {
    return {
      serializable: false,
      location,
      reason: typeof o === 'function' ? 'Function' : String(o),
    };
  }

  if (seen.has(o)) {
    return {
      serializable: false,
      reason: 'Circular reference',
      location,
    };
  }

  seen.add(o);

  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i++) {
      const childResult = checkSerializableWithoutCircularReference(
        o[i],
        new Set<any>(seen),
        [...location, i]
      );

      if (!childResult.serializable) {
        return childResult;
      }
    }
  } else {
    for (const key in o) {
      const childResult = checkSerializableWithoutCircularReference(
        o[key],
        new Set<any>(seen),
        [...location, key]
      );

      if (!childResult.serializable) {
        return childResult;
      }
    }
  }

  return { serializable: true };
};

export function checkSerializable(o: { [key: string]: any }) {
  return checkSerializableWithoutCircularReference(o, new Set<any>(), []);
}
