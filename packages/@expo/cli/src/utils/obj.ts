/** `lodash.get` */
export function get(obj: any, key: string): any | null {
  const branches = key.split('.');
  let current: any = obj;
  let branch: string | undefined;
  while ((branch = branches.shift())) {
    if (!(branch in current)) {
      return null;
    }
    current = current[branch];
  }
  return current;
}

/** `lodash.set` */
export function set(obj: any, key: string, value: any): any | null {
  const branches = key.split('.');
  let current: any = obj;
  let branch: string | undefined;
  while ((branch = branches.shift())) {
    if (branches.length === 0) {
      current[branch] = value;
      return obj;
    }

    if (!(branch in current)) {
      current[branch] = {};
    }

    current = current[branch];
  }
  return null;
}

/** `lodash.pickBy` */
export function pickBy<T>(
  obj: { [key: string]: T },
  predicate: (value: T, key: string) => boolean | undefined
) {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (predicate(value, key)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as { [key: string]: T }
  );
}
