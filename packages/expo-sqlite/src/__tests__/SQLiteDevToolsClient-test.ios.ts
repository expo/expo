import { type DevToolsPluginClient, type getDevToolsPluginClientAsync } from 'expo/devtools';
// @ts-ignore-next-line: no @types/node
import fs from 'fs';

import { openDatabaseAsync, type SQLiteDatabase } from '../SQLiteDatabase';
import {
  closeDevToolsClientAsync,
  registerDatabaseForDevToolsAsync,
  unregisterDatabaseForDevToolsAsync,
} from '../SQLiteDevToolsClient';

const mockDevToolsClient = {
  sendMessage: jest.fn(),
  addMessageListener: jest.fn((method: string, handler: Function) => ({
    remove: jest.fn(),
  })),
  closeAsync: jest.fn(),
} as unknown as DevToolsPluginClient;
const mockGetDevToolsPluginClientAsync = jest.fn() as jest.MockedFunction<
  typeof getDevToolsPluginClientAsync
>;
mockGetDevToolsPluginClientAsync.mockResolvedValue(mockDevToolsClient);
jest.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: mockGetDevToolsPluginClientAsync,
}));
jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

describe('SQLiteDevToolsClient', () => {
  let mockDatabase: SQLiteDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetDevToolsPluginClientAsync.mockResolvedValue(mockDevToolsClient);
    await closeDevToolsClientAsync();
    mockDatabase = await openDatabaseAsync(':memory:');
  });

  afterEach(async () => {
    if (mockDatabase) {
      await mockDatabase.closeAsync();
    }
  });

  it('should initialize devtools client and register database in __DEV__ mode', async () => {
    expect(__DEV__).toBe(true);
    await registerDatabaseForDevToolsAsync(mockDatabase);

    expect(mockGetDevToolsPluginClientAsync).toHaveBeenCalledWith('expo-sqlite', {
      websocketBinaryType: 'arraybuffer',
    });
    expect(mockDevToolsClient.addMessageListener).toHaveBeenCalledWith(
      'listDatabases',
      expect.any(Function)
    );
    expect(mockDevToolsClient.addMessageListener).toHaveBeenCalledWith(
      'getDatabase',
      expect.any(Function)
    );
    expect(mockDevToolsClient.addMessageListener).toHaveBeenCalledWith(
      'executeQuery',
      expect.any(Function)
    );
    expect(mockDevToolsClient.addMessageListener).toHaveBeenCalledWith(
      'listTables',
      expect.any(Function)
    );
    expect(mockDevToolsClient.addMessageListener).toHaveBeenCalledWith(
      'getTableSchema',
      expect.any(Function)
    );
  });

  it('should not initialize in production mode', async () => {
    // @ts-expect-error: __DEV__ is a constant and we force it to false
    __DEV__ = false;

    // Close the database created in beforeEach to clean up the client initialized during its creation
    await mockDatabase.closeAsync();
    await closeDevToolsClientAsync();
    jest.clearAllMocks();
    mockGetDevToolsPluginClientAsync.mockResolvedValue(mockDevToolsClient);

    // Now open a new database with __DEV__ = false
    const testDatabase = await openDatabaseAsync(':memory:');
    await registerDatabaseForDevToolsAsync(testDatabase);

    expect(mockGetDevToolsPluginClientAsync).not.toHaveBeenCalled();

    await testDatabase.closeAsync();

    // @ts-expect-error: __DEV__ is a constant and we restore it to true
    __DEV__ = true;
  });

  it('should handle listDatabases request', async () => {
    try {
      const db1 = await openDatabaseAsync('test1.db');
      const db2 = await openDatabaseAsync('test2.db');

      await registerDatabaseForDevToolsAsync(db1);
      await registerDatabaseForDevToolsAsync(db2);

      const listDatabasesHandler = (
        mockDevToolsClient.addMessageListener as jest.Mock
      ).mock.calls.find((call: any[]) => call[0] === 'listDatabases')?.[1];

      await listDatabasesHandler?.({ requestId: 'req123' });

      expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
        'response',
        expect.objectContaining({
          requestId: 'req123',
          method: 'listDatabases',
          databases: expect.arrayContaining([
            expect.objectContaining({ name: 'test1.db' }),
            expect.objectContaining({ name: 'test2.db' }),
          ]),
        })
      );

      await db1.closeAsync();
      await db2.closeAsync();
    } finally {
      await fs.promises.unlink('test1.db').catch(() => {});
      await fs.promises.unlink('test2.db').catch(() => {});
    }
  });

  it('should handle executeQuery for SELECT queries', async () => {
    await mockDatabase.execAsync('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await mockDatabase.execAsync("INSERT INTO test (name) VALUES ('Alice'), ('Bob')");
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const executeQueryHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'executeQuery')?.[1];

    await executeQueryHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
      query: 'SELECT * FROM test',
      params: [],
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'executeQuery',
        result: expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'Alice' }),
            expect.objectContaining({ name: 'Bob' }),
          ]),
          columns: expect.arrayContaining(['id', 'name']),
        }),
      })
    );
  });

  it('should handle executeQuery for INSERT queries', async () => {
    await mockDatabase.execAsync('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const executeQueryHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'executeQuery')?.[1];

    await executeQueryHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
      query: 'INSERT INTO test (name) VALUES (?)',
      params: ['Charlie'],
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'executeQuery',
        result: expect.objectContaining({
          rows: [],
          columns: [],
          changes: 1,
          lastInsertRowId: expect.any(Number),
        }),
      })
    );
  });

  it('should handle listTables request', async () => {
    await mockDatabase.execAsync('CREATE TABLE users (id INTEGER PRIMARY KEY)');
    await mockDatabase.execAsync('CREATE TABLE posts (id INTEGER PRIMARY KEY)');
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const listTablesHandler = (mockDevToolsClient.addMessageListener as jest.Mock).mock.calls.find(
      (call: any[]) => call[0] === 'listTables'
    )?.[1];

    await listTablesHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'listTables',
        tables: expect.arrayContaining(['users', 'posts']),
      })
    );
  });

  it('should handle getTableSchema request', async () => {
    await mockDatabase.execAsync(
      'CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER)'
    );
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const getTableSchemaHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'getTableSchema')?.[1];

    await getTableSchemaHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
      tableName: 'test',
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'getTableSchema',
        schema: expect.arrayContaining([
          expect.objectContaining({ name: 'id', type: 'INTEGER', pk: 1 }),
          expect.objectContaining({ name: 'name', type: 'TEXT', notnull: 1 }),
          expect.objectContaining({ name: 'age', type: 'INTEGER' }),
        ]),
      })
    );
  });

  it('should reject getTableSchema for non-existent table', async () => {
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const getTableSchemaHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'getTableSchema')?.[1];

    await getTableSchemaHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
      tableName: 'nonexistent',
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'error',
        error: "Table 'nonexistent' not found",
        originalMethod: 'getTableSchema',
      })
    );
  });

  it('should handle errors in executeQuery', async () => {
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const executeQueryHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'executeQuery')?.[1];

    await executeQueryHandler?.({
      requestId: 'req123',
      databasePath: mockDatabase.databasePath,
      query: 'SELECT * FROM nonexistent_table',
      params: [],
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'error',
        error: expect.stringContaining('no such table'),
        originalMethod: 'executeQuery',
      })
    );
  });

  it('should handle database not found errors', async () => {
    await registerDatabaseForDevToolsAsync(mockDatabase);

    const executeQueryHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'executeQuery')?.[1];

    await executeQueryHandler?.({
      requestId: 'req123',
      databasePath: '/nonexistent/path/db.db',
      query: 'SELECT 1',
      params: [],
    });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'error',
        error: 'Database not found',
        originalMethod: 'executeQuery',
      })
    );
  });

  it('should unregister database and remove it from the list', async () => {
    await registerDatabaseForDevToolsAsync(mockDatabase);
    await unregisterDatabaseForDevToolsAsync(mockDatabase);

    const listDatabasesHandler = (
      mockDevToolsClient.addMessageListener as jest.Mock
    ).mock.calls.find((call: any[]) => call[0] === 'listDatabases')?.[1];

    await listDatabasesHandler?.({ requestId: 'req123' });

    expect(mockDevToolsClient.sendMessage).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        requestId: 'req123',
        method: 'listDatabases',
        databases: [],
      })
    );
  });

  it('should not throw in production mode when unregistering', async () => {
    // @ts-expect-error: __DEV__ is a constant and we force it to false
    __DEV__ = false;

    await unregisterDatabaseForDevToolsAsync(mockDatabase);

    expect(mockDevToolsClient.sendMessage).not.toHaveBeenCalled();

    // @ts-expect-error: __DEV__ is a constant and we restore it to true
    __DEV__ = true;
  });
});
