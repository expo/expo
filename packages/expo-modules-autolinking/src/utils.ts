const MAX_SIZE = 5_000;

export function memoize<const Fn extends (input: string, ...args: any[]) => Promise<any>>(fn: Fn) {
  const cache = new Map<string, ReturnType<Fn>>();
  return async (input: string, ...args: any[]) => {
    if (!cache.has(input)) {
      const result = await fn(input, ...args);
      if (cache.size > MAX_SIZE) {
        cache.clear();
      }
      cache.set(input, result);
      return result;
    } else {
      return cache.get(input);
    }
  };
}
