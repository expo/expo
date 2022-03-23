/** `lodash.memoize` */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache: { [key: string]: any } = {};
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  }) as any;
}
