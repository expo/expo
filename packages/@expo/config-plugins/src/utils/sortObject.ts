export function sortObject<T extends Record<string, any> = Record<string, any>>(
  obj: T,
  compareFn?: (a: string, b: string) => number
): T {
  return Object.keys(obj)
    .sort(compareFn)
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: obj[key],
      }),
      {}
    ) as T;
}

export function sortObjWithOrder<T extends Record<string, any> = Record<string, any>>(
  obj: T,
  order: string[]
): T {
  const sorted = sortWithOrder(Object.keys(obj), order);

  return sorted.reduce(
    (acc, key) => ({
      ...acc,
      [key]: obj[key],
    }),
    {}
  ) as T;
}

export function sortWithOrder(obj: string[], order: string[]): string[] {
  const groupOrder = [...new Set(order.concat(obj))];
  const sorted: string[] = [];

  while (groupOrder.length) {
    const key = groupOrder.shift()!;
    const index = obj.indexOf(key);
    if (index > -1) {
      const [item] = obj.splice(index, 1);
      sorted.push(item);
    }
  }

  return sorted;
}

export const reverseSortString = (a: string, b: string) => {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
};
