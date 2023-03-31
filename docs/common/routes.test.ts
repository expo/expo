import { isReferencePath } from '~/common/routes';

describe(isReferencePath, () => {
  it('returns true for unversioned pathname', () => {
    expect(isReferencePath('/versions/unversioned')).toBe(true);
  });

  it('returns true for sdk pathname', () => {
    expect(isReferencePath('/versions/latest/sdk/notifications')).toBe(true);
  });

  it('returns true for react-native pathname', () => {
    expect(isReferencePath('/versions/v44.0.0/react-native/stylesheet/')).toBe(true);
  });

  it('returns false for non-versioned pathname', () => {
    expect(isReferencePath('/build-reference/how-tos/')).toBe(false);
  });
});
