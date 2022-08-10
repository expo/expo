import { moduleNameIsDirectFileReference } from '../plugin-resolver';

describe(moduleNameIsDirectFileReference, () => {
  it('file path', () => {
    expect(moduleNameIsDirectFileReference('./app')).toBe(true);
    expect(moduleNameIsDirectFileReference('~/app')).toBe(true);
    expect(moduleNameIsDirectFileReference('/app')).toBe(true);
    expect(moduleNameIsDirectFileReference('.')).toBe(true);
  });
  it('module', () => {
    expect(moduleNameIsDirectFileReference('app')).toBe(false);
    expect(moduleNameIsDirectFileReference('@expo/app')).toBe(false);
  });
  it('module folder', () => {
    expect(moduleNameIsDirectFileReference('app/')).toBe(true);
    expect(moduleNameIsDirectFileReference('@expo/app/')).toBe(true);
  });
  it('module file', () => {
    expect(moduleNameIsDirectFileReference('app/index.js')).toBe(true);
    expect(moduleNameIsDirectFileReference('@expo/app/index')).toBe(true);
  });
});
