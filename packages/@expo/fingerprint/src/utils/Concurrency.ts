export interface Limiter {
  <Arguments extends unknown[], ReturnType>(
    fn: (...args: Arguments) => PromiseLike<ReturnType> | ReturnType,
    ...args: Arguments
  ): Promise<ReturnType>;
}

export const createLimiter = (limit = 4): Limiter => {
  const pending = new Set<Promise<unknown>>();
  return async (fn, ...args) => {
    while (pending.size >= limit) {
      await Promise.race(pending);
    }
    const promise = Promise.resolve(fn(...args)).finally(() => {
      pending.delete(promise);
    });
    pending.add(promise);
    return await promise;
  };
};
