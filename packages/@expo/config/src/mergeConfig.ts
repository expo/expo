type ArrayMerge = (target: any[], source: any[]) => any[];

function isMergeable(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const tag = Object.prototype.toString.call(value);
  return (
    tag !== '[object Date]' &&
    tag !== '[object RegExp]' &&
    value.$$typeof !== Symbol.for('react.element')
  );
}

function getEnumerableKeys(value: any): PropertyKey[] {
  // NOTE(@kitten): Exclude __proto__ from both inputs so assignments cannot change the result's prototype.
  return [
    ...Object.keys(value).filter((key) => key !== '__proto__'),
    ...Object.getOwnPropertySymbols(value).filter((key) =>
      Object.prototype.propertyIsEnumerable.call(value, key)
    ),
  ];
}

function hasProperty(value: any, key: PropertyKey): boolean {
  // NOTE(@kitten): Match deepmerge's unboxed `in` check. Boxing primitives can drop keys such
  // as `length` when replacing a string with an object. Throwing proxy checks also mean absent.
  try {
    return key in value;
  } catch {
    return false;
  }
}

export function mergeConfig<T>(target: Partial<T>, source: Partial<T>, arrayMerge?: ArrayMerge): T {
  function clone(value: any): any {
    return isMergeable(value) ? merge(Array.isArray(value) ? [] : {}, value) : value;
  }

  function merge(target: any, source: any): any {
    if (Array.isArray(target) !== Array.isArray(source)) {
      return clone(source);
    }
    if (Array.isArray(source)) {
      return arrayMerge ? arrayMerge(target, source) : target.concat(source).map(clone);
    }

    const result: Record<PropertyKey, any> = {};
    if (isMergeable(target)) {
      for (const key of getEnumerableKeys(target)) {
        result[key] = clone(target[key]);
      }
    }
    for (const key of getEnumerableKeys(source)) {
      // Do not merge inherited or non-enumerable properties from the target.
      if (
        hasProperty(target, key) &&
        !(
          Object.prototype.hasOwnProperty.call(target, key) &&
          Object.prototype.propertyIsEnumerable.call(target, key)
        )
      ) {
        continue;
      }
      result[key] =
        hasProperty(target, key) && isMergeable(source[key])
          ? merge(target[key], source[key])
          : clone(source[key]);
    }
    return result;
  }

  return merge(target, source);
}
