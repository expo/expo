/** Returns the last index of an item based on a given criteria. */
export function findLastIndex<T>(array: T[], predicate: (item: T) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i;
    }
  }
  return -1;
}

/** Returns a list of items that intersect between two given arrays. */
export function intersecting<T>(a: T[], b: T[]): T[] {
  const [c, d] = a.length > b.length ? [a, b] : [b, a];
  return c.filter((value) => d.includes(value));
}

/** lodash.uniqBy */
export function uniqBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen: { [key: string]: boolean } = {};
  return array.filter((item) => {
    const k = key(item);
    if (seen[k]) {
      return false;
    }
    seen[k] = true;
    return true;
  });
}

/** `lodash.chunk` */
export function chunk(array: any[], size: number): any[][] {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, (index += size)));
  }
  return chunked;
}
