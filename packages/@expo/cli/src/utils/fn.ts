/** `lodash.memoize` */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/** memoizes an async function to prevent subsequent calls that might be invoked before the function has finished resolving. */
export function guardAsync<V, T extends (...args: any[]) => Promise<V>>(fn: T): T {
  let invoked = false;
  let returnValue: V;

  const guard: any = async (...args: any[]): Promise<V> => {
    if (!invoked) {
      invoked = true;
      returnValue = await fn(...args);
    }

    return returnValue;
  };

  return guard;
}
