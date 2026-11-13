import { ConfigError } from './Errors';

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

export function mergeConfig<T>(target: Partial<T>, source: Partial<T>, arrayMerge?: ArrayMerge): T {
  // NOTE(@kitten): Track active clones only; shared objects in separate branches are valid.
  const ancestors = new WeakSet<object>();

  function clone(value: any): any {
    if (!isMergeable(value)) {
      return value;
    }
    if (ancestors.has(value)) {
      throw new ConfigError(
        'Cannot merge the Expo config because it contains a circular reference. Remove circular references from the config and its modifications.',
        'INVALID_CONFIG'
      );
    }
    ancestors.add(value);
    try {
      return merge(Array.isArray(value) ? [] : Object.create(null), value);
    } finally {
      ancestors.delete(value);
    }
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
      // NOTE(@kitten): Treat inherited target values as absent so own data keys are not dropped or merged into prototypes.
      const hasOwnValue =
        target != null &&
        Object.hasOwn(target, key) &&
        Object.prototype.propertyIsEnumerable.call(target, key);
      result[key] =
        hasOwnValue && isMergeable(source[key])
          ? merge(target[key], source[key])
          : clone(source[key]);
    }
    return result;
  }

  return merge(target, source);
}
