export function areRouteNamesEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((name) => b.includes(name));
}
