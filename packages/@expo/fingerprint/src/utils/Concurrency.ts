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

export const createLimiter = (limit = 1): Limiter => {
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
