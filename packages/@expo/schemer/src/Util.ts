export const fieldPathToSchemaPath = (fieldPath: string) => {
  return pathToSegments(fieldPath)
    .map((segment) => `properties.${segment}`)
    .join('.');
};
// Assumption: used only for jsonPointer returned from traverse
export const schemaPointerToFieldPath = (jsonPointer: string) => {
  return jsonPointer
    .split('/')
    .slice(2)
    .filter((error) => error !== 'properties')
    .join('.');
};

export const fieldPathToSchema = (schema: object, fieldPath: string) => {
  return get(schema, fieldPathToSchemaPath(fieldPath));
};

export function pathToSegments(path: string | string[]) {
  return Array.isArray(path) ? path : path.split('.');
}

export function get(object: any, path: string | string[]) {
  const segments = pathToSegments(path);
  const length = segments.length;
  let index = 0;

  while (object != null && index < length) {
    object = object[segments[index++]];
  }

  return index && index === length ? object : undefined;
}
