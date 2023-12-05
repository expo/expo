import get from 'lodash/get';
import zip from 'lodash/zip';

export const fieldPathToSchemaPath = (fieldPath: string) => {
  return zip(fieldPath.split('.').fill('properties'), fieldPath.split('.')).flat().join('.');
};
// Assumption: used only for jsonPointer returned from traverse
export const schemaPointerToFieldPath = (jsonPointer: string) => {
  return jsonPointer
    .split('/')
    .slice(2)
    .filter(e => e !== 'properties')
    .join('.');
};

export const fieldPathToSchema = (schema: object, fieldPath: string) => {
  return get(schema, fieldPathToSchemaPath(fieldPath));
};
