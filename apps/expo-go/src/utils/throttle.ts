// lodash throttle.
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const remainingTime = wait - (now - lastCallTime);

    if (remainingTime <= 0 || remainingTime > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCallTime = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remainingTime);
    }
  };
}
