export function debounce<T extends (...args: any[]) => void>(
  func: T,
  duration: number
): T {
  let timeout: ReturnType<typeof setTimeout>;

  return function (this: unknown, ...args) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, duration);
  } as T;
}
