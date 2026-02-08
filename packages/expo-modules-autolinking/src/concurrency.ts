export interface Limiter {
  <Arguments extends unknown[], ReturnType>(
    fn: (...args: Arguments) => PromiseLike<ReturnType> | ReturnType,
    ...args: Arguments
  ): Promise<ReturnType>;
}

interface QueueItem {
  resolve(): void;
  next: QueueItem | null;
}

export const createLimiter = (limit: number): Limiter => {
  let running = 0;
  let head: QueueItem | null = null;
  let tail: QueueItem | null = null;

  const enqueue = () =>
    new Promise<void>((resolve) => {
      const item: QueueItem = { resolve, next: null };
      if (tail) {
        tail.next = item;
        tail = item;
      } else {
        head = item;
        tail = item;
      }
    });

  const dequeue = () => {
    if (running < limit && head !== null) {
      const { resolve, next } = head;
      head.next = null;
      head = next;
      if (head === null) {
        tail = null;
      }
      running++;
      resolve();
    }
  };

  return async (fn, ...args) => {
    if (running < limit) {
      running++;
    } else {
      await enqueue();
    }
    try {
      return await fn(...args);
    } finally {
      running--;
      dequeue();
    }
  };
};

export const taskAll = <T, R>(inputs: T[], map: (input: T) => Promise<R>): Promise<R[]> => {
  // NOTE: This doesn't depend on CPU cores, but instead is hard-coded depending on
  // number of concurrent IO-bound tasks. `taskAll` can be called concurrently, and
  // we don't keep track of concurrent `taskAll` calls in expo-modules-autolinking.
  // There's a fixed number of concurrent pending IO operations that Node.js handles
  // nicely. It seems that expo-modules-autolinking behaves nicely when this number
  // is around ~8, but this may be higher if disk + core speed is higher.
  const limiter = createLimiter(8);
  return Promise.all(inputs.map((input) => limiter(map, input)));
};
