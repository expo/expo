import { defaultDatabaseDirectory } from '../SQLiteDatabase';
import { createDatabasePath } from '../pathUtils';

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
