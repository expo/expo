export function findLastIndex<T>(array: T[], callback: (value: T) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (callback(array[i])) {
      return i;
    }
  }

  return -1;
}
