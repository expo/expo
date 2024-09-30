// @ts-ignore-next-line: no @types/node
import fs from 'fs/promises';

import { SQLiteStorage } from '../Storage';

jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

describe('SQLiteStorage asynchronous', () => {
  let storage: SQLiteStorage;

  beforeEach(async () => {
    storage = new SQLiteStorage('TestStorage');
    await storage.clearAsync();
  });

  afterEach(async () => {
    await storage.clearAsync();
    await storage.closeAsync();
  });

  afterAll(async () => {
    await fs.unlink('TestStorage').catch(() => {});
  });

  it('should set and get an item', async () => {
    await storage.setItemAsync('key1', 'value1');
    const value = await storage.getItemAsync('key1');
    expect(value).toBe('value1');
  });

  it('should update item using setItemAsync updater function', async () => {
    await storage.setItemAsync('key1', 'initialValue');
    const updater = jest.fn((prevValue) => `${prevValue}_updated`);
    await storage.setItemAsync('key1', updater);
    const value = await storage.getItemAsync('key1');
    expect(updater).toHaveBeenCalledWith('initialValue');
    expect(value).toBe('initialValue_updated');
  });

  it('should remove an item', async () => {
    await storage.setItemAsync('key1', 'value1');
    const removed = await storage.removeItemAsync('key1');
    expect(removed).toBe(true);
    const value = await storage.getItemAsync('key1');
    expect(value).toBeNull();
  });

  it('should get all keys', async () => {
    await storage.setItemAsync('key1', 'value1');
    await storage.setItemAsync('key2', 'value2');
    const keys = await storage.getAllKeysAsync();
    expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
  });

  it('should clear all items', async () => {
    await storage.setItemAsync('key1', 'value1');
    await storage.setItemAsync('key2', 'value2');
    const cleared = await storage.clearAsync();
    expect(cleared).toBe(true);
    const keys = await storage.getAllKeysAsync();
    expect(keys).toHaveLength(0);
  });
});

describe('SQLiteStorage synchronous', () => {
  let storage: SQLiteStorage;

  beforeEach(() => {
    storage = new SQLiteStorage(':memory:');
    storage.clearSync();
  });

  afterEach(() => {
    storage.clearSync();
    storage.closeSync();
  });

  it('should set and get an item', () => {
    storage.setItemSync('key1', 'value1');
    const value = storage.getItemSync('key1');
    expect(value).toBe('value1');
  });

  it('should update item using setItemSync updater function', () => {
    storage.setItemSync('key1', 'initialValue');
    const updater = jest.fn((prevValue) => `${prevValue}_updated`);
    storage.setItemSync('key1', updater);
    const value = storage.getItemSync('key1');
    expect(updater).toHaveBeenCalledWith('initialValue');
    expect(value).toBe('initialValue_updated');
  });

  it('should remove an item', () => {
    storage.setItemSync('key1', 'value1');
    const removed = storage.removeItemSync('key1');
    expect(removed).toBe(true);
    const value = storage.getItemSync('key1');
    expect(value).toBeNull();
  });

  it('should get all keys', () => {
    storage.setItemSync('key1', 'value1');
    storage.setItemSync('key2', 'value2');
    const keys = storage.getAllKeysSync();
    expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
  });

  it('should clear all items', () => {
    storage.setItemSync('key1', 'value1');
    storage.setItemSync('key2', 'value2');
    const cleared = storage.clearSync();
    expect(cleared).toBe(true);
    const keys = storage.getAllKeysSync();
    expect(keys).toHaveLength(0);
  });
});

describe('react-native-async-storage API compatibility', () => {
  let storage: SQLiteStorage;

  beforeEach(async () => {
    storage = new SQLiteStorage('TestStorage');
    await storage.clearAsync();
  });

  afterEach(async () => {
    await storage.clearAsync();
    await storage.closeAsync();
  });

  afterAll(async () => {
    await fs.unlink('TestStorage').catch(() => {});
  });

  it('should set and get an item', async () => {
    await storage.setItem('key1', 'value1');
    const value = await storage.getItem('key1');
    expect(value).toBe('value1');
  });

  it('should remove an item', async () => {
    await storage.setItem('key1', 'value1');
    await storage.removeItem('key1');
    const value = await storage.getItem('key1');
    expect(value).toBeNull();
  });

  it('should get all keys', async () => {
    await storage.setItem('key1', 'value1');
    await storage.setItem('key2', 'value2');
    const keys = await storage.getAllKeys();
    expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
  });

  it('should clear all items', async () => {
    await storage.setItem('key1', 'value1');
    await storage.setItem('key2', 'value2');
    await storage.clear();
    const keys = await storage.getAllKeys();
    expect(keys).toHaveLength(0);
  });

  it('should merge item', async () => {
    await storage.setItem('key1', JSON.stringify({ a: 1, b: 2 }));
    await storage.mergeItem('key1', JSON.stringify({ b: 3, c: 4 }));
    const value = await storage.getItem('key1');
    expect(value).toBe(JSON.stringify({ a: 1, b: 3, c: 4 }));
  });

  it('should merge item official doc test case', async () => {
    const USER_1 = {
      name: 'Tom',
      age: 20,
      traits: {
        hair: 'black',
        eyes: 'blue',
      },
    };

    const USER_2 = {
      name: 'Sarah',
      age: 21,
      hobby: 'cars',
      traits: {
        eyes: 'green',
      },
    };
    await storage.setItem('@MyApp_user', JSON.stringify(USER_1));
    await storage.mergeItem('@MyApp_user', JSON.stringify(USER_2));
    const currentUser = await storage.getItem('@MyApp_user');
    expect(JSON.parse(currentUser ?? '')).toEqual({
      name: 'Sarah',
      age: 21,
      hobby: 'cars',
      traits: {
        eyes: 'green',
        hair: 'black',
      },
    });
  });

  it('should support multiGet', async () => {
    await storage.setItem('key1', 'value1');
    await storage.setItem('key2', 'value2');
    await storage.setItem('key3', 'value3');

    const result = await storage.multiGet(['key1', 'key2', 'key3']);
    expect(result).toEqual([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);
  });

  it('should support multiSet', async () => {
    await storage.multiSet([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);

    const result = await storage.multiGet(['key1', 'key2', 'key3']);
    expect(result).toEqual([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);
  });

  it('should support multiRemove', async () => {
    await storage.multiSet([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);

    await storage.multiRemove(['key1', 'key2']);

    const result = await storage.multiGet(['key1', 'key2', 'key3']);
    expect(result).toEqual([
      ['key1', null],
      ['key2', null],
      ['key3', 'value3'],
    ]);
  });

  it('should support multiMerge', async () => {
    await storage.multiSet([
      ['key1', JSON.stringify({ a: 1, b: 2 })],
      ['key2', JSON.stringify({ x: 10, y: 20 })],
    ]);

    await storage.multiMerge([
      ['key1', JSON.stringify({ b: 3, c: 4 })],
      ['key2', JSON.stringify({ y: 30, z: 40 })],
    ]);

    const value1 = await storage.getItem('key1');
    const value2 = await storage.getItem('key2');
    expect(value1).toBe(JSON.stringify({ a: 1, b: 3, c: 4 }));
    expect(value2).toBe(JSON.stringify({ x: 10, y: 30, z: 40 }));
  });
});
