export function throttle<T extends (...args: any[]) => void>(
  func: T,
  duration: number
): T {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function (this: unknown, ...args) {
    if (timeout == null) {
      func.apply(this, args);

      timeout = setTimeout(() => {
        timeout = undefined;
      }, duration);
    }
  } as T;
}
