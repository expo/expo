export function stringifyIfDate<T extends Date>(date: Date | T): string | T {
  return date instanceof Date ? date.toISOString() : date;
}

type StringifyDates<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

export function stringifyDateValues<T extends Record<string, any>>(obj: T): StringifyDates<T> {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (value != null && typeof value === 'object' && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        return { ...acc, [key]: value.map(stringifyDateValues) };
      }
      return { ...acc, [key]: stringifyDateValues(value) };
    }
    acc[key as keyof T] = stringifyIfDate(value);
    return acc;
  }, {} as StringifyDates<T>);
}
