// @ts-ignore-next-line: no @types/node
import fs from 'fs/promises';

import { localStorage } from '../WebStorage';

jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

describe('Web Storage API compatibility', () => {
  afterEach(() => {
    localStorage.clear();
  });

  afterAll(async () => {
    await fs.unlink('ExpoSQLiteStorage').catch(() => {});
  });

  it('should return Storage name from `toString`', () => {
    expect(typeof localStorage.toString).toBe('function');
    expect(localStorage.toString()).toBe('[object Storage]');
  });

  it('should return Storage name from `constructor.name`', () => {
    expect(localStorage.constructor.name).toBe('Storage');
  });

  it('should implement all the methods', () => {
    expect(typeof localStorage.clear).toBe('function');
    expect(typeof localStorage.getItem).toBe('function');
    expect(typeof localStorage.key).toBe('function');
    expect(typeof localStorage.length).toBe('number');
    expect(typeof localStorage.removeItem).toBe('function');
    expect(typeof localStorage.setItem).toBe('function');
  });

  it('should support CRUD operations', () => {
    localStorage.setItem('test', 'testValue');
    expect(localStorage.getItem('test')).toBe('testValue');
    expect(localStorage.length).toBe(1);
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
    localStorage.setItem('test', 'testValue2');
    localStorage.clear();
    expect(localStorage.getItem('test')).toBeNull();
    expect(localStorage.length).toBe(0);
    localStorage.setItem('test', 'testValue3');
    expect(localStorage.key(0)).toBe('test');
    localStorage.clear();
  });

  it('should stringify setItem value argument', () => {
    // @ts-expect-error
    localStorage.setItem('key', {
      toString() {
        return 'hello';
      },
    });
    expect(localStorage.getItem('key')).toBe('hello');

    // @ts-expect-error
    localStorage.setItem('key', {
      test() {
        return 'hello';
      },
      valueOf() {
        return 'hello';
      },
    });
    expect(localStorage.getItem('key')).toBe('[object Object]');
  });

  it('should support property accessor', () => {
    localStorage.test = 'testValue';
    expect(localStorage['test']).toBe('testValue');
    expect(localStorage.getItem('test')).toBe('testValue');
    expect('test' in localStorage).toBe(true);
    expect(localStorage.length).toBe(1);
    delete localStorage['test'];
    expect(localStorage.test).toBeUndefined();
  });

  it('should handle method overrides in property accessors', () => {
    localStorage.test = 'testValue';
    expect(localStorage.getItem('test')).toBe('testValue');

    // override getItem
    localStorage.getItem = () => 'override';
    expect(localStorage.getItem('test')).toBe('override');

    // delete overridden getItem should then keep the original getItem
    // @ts-ignore - 'The operand of a 'delete' operator must be optional.'
    delete localStorage.getItem;
    expect(localStorage.test).toBe('testValue');

    // delete built-in getItem is not allowed
    // @ts-ignore - 'The operand of a 'delete' operator must be optional.'
    delete localStorage.getItem;
    expect(localStorage.test).toBe('testValue');
  });

  it('should delete when property is not overridden', () => {
    // https://github.com/expo/expo/pull/38699#discussion_r2274235644
    expect(typeof localStorage.toString).toBe('function');
    expect(localStorage.getItem('toString')).toBeNull();

    localStorage.setItem('toString', 'set-item');
    expect(localStorage.getItem('toString')).toBe('set-item');
    expect(typeof localStorage.toString).toBe('function');

    // @ts-ignore
    localStorage['toString'] = 'property';
    expect(localStorage['toString']).toBe('property');
    expect(localStorage.getItem('toString')).toBe('set-item');

    // @ts-ignore
    delete localStorage['toString'];
    expect(typeof localStorage.toString).toBe('function');
    expect(localStorage.getItem('toString')).toBe('set-item');

    // @ts-ignore
    delete localStorage.toString;
    expect(localStorage.getItem('toString')).toBeNull();
    expect(typeof localStorage.toString).toBe('function');
  });
});
