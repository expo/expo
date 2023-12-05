import { fieldPathToSchemaPath, schemaPointerToFieldPath } from '../src/Util';

describe('Helper function unit tests', () => {
  it('fieldPathToSchemaPath short path', () => {
    expect(fieldPathToSchemaPath('name')).toBe('properties.name');
  });
  it('fieldPathToSchemaPath long property string', () => {
    expect(fieldPathToSchemaPath('app.android.icon')).toBe(
      'properties.app.properties.android.properties.icon'
    );
  });
  it('fieldPathToSchemaPath mixed characters', () => {
    expect(fieldPathToSchemaPath('a23-df34.fef4383')).toBe(
      'properties.a23-df34.properties.fef4383'
    );
  });

  it('schemaPointerToFieldPath', () => {
    expect(schemaPointerToFieldPath('/properties/loading/properties/backgroundImage')).toBe(
      'loading.backgroundImage'
    );
  });
});
