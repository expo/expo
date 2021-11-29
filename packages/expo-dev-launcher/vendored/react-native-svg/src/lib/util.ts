export function pickNotNil(object: { [prop: string]: unknown }) {
  const result: { [prop: string]: unknown } = {};
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      const value = object[key];
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }
  }
  return result;
}

export const idPattern = /#([^)]+)\)?$/;
