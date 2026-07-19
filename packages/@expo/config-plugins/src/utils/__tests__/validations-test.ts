import { isValidAndroidAssetName, assertValidAndroidAssetName } from '../validations';

describe(isValidAndroidAssetName, () => {
  it.each([['valid_name'], ['validname'], ['valid123'], ['valid_name_123'], ['a']])(
    'should return true for valid input "%s"',
    (input) => {
      expect(isValidAndroidAssetName(input)).toBe(true);
    }
  );

  it.each([
    [''],
    ['Invalid_Name'],
    ['invalid-name'],
    ['name-and.extension'],
    ['invalid name'],
    ['abstract'],
    ['_'],
    ['1'],
    ['123abc'],
    ['_name'],
  ])('should return false for invalid input "%s"', (input) => {
    expect(isValidAndroidAssetName(input)).toBe(false);
  });
});

describe(assertValidAndroidAssetName, () => {
  it('assertValidAndroidAssetName', () => {
    expect(() => assertValidAndroidAssetName('invalidName')).toThrow();
    expect(() => assertValidAndroidAssetName('abc123')).not.toThrow();
  });
});
