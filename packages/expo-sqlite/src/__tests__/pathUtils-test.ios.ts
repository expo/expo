import { defaultDatabaseDirectory } from '../SQLiteDatabase';
import { basename, createDatabasePath } from '../pathUtils';

jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

describe(createDatabasePath, () => {
  it('should return :memory: without any changes', () => {
    expect(createDatabasePath(':memory:', undefined)).toBe(':memory:');
  });

  it('should accept undefined directory', () => {
    expect(createDatabasePath('test.db', undefined)).toBe(defaultDatabaseDirectory + '/test.db');
  });

  it('should return correct path when directory is provided', () => {
    expect(createDatabasePath('test.db', '/testDir/')).toBe('/testDir/test.db');
  });

  it('should remove excessive slashes', () => {
    expect(createDatabasePath('/test.db', '/testDir//')).toBe('/testDir/test.db');
  });
});

describe(basename, () => {
  it('should return the basename of a path', () => {
    expect(basename('/test/test.db')).toBe('test.db');
  });

  it('should return the entire string if no slash is present', () => {
    expect(basename('test.db')).toBe('test.db');
  });

  it('should return an empty string for an empty path', () => {
    expect(basename('')).toBe('');
  });

  it('should handle paths ending with a slash', () => {
    expect(basename('/test/')).toBe('');
    expect(basename('/')).toBe('');
    expect(basename('////')).toBe('');
  });

  it('should handle nested directories', () => {
    expect(basename('/foo/bar/baz.db')).toBe('baz.db');
    expect(basename('foo/bar/baz.db')).toBe('baz.db');
    expect(basename('foo/bar/')).toBe('');
  });

  it('should handle just the root slash', () => {
    expect(basename('/')).toBe('');
  });
});
