/** `lodash.get` */
export function get(obj: any, key: string): any {
  const branches = key.split('.');
  let current: any = obj;
  let branch: string | undefined;
  while ((branch = branches.shift())) {
    if (!(branch in current)) {
      return undefined;
    }
    current = current[branch];
  }
  return current;
}
