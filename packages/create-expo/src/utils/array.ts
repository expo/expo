export function replaceValue<T>(values: T[], original: T, replacement: T): T[] {
  const index = values.indexOf(original);
  if (index > -1) {
    values[index] = replacement;
  }
  return values;
}
