import { composeRow, composeRows, normalizeParams } from '../paramUtils';

describe(normalizeParams, () => {
  it('should accept no params', () => {
    expect(normalizeParams()).toStrictEqual([{}, {}, true]);
  });

  it('should accept variadic empty array', () => {
    expect(normalizeParams(...[])).toStrictEqual([{}, {}, true]);
  });

  it('should accept single primitive param as array', () => {
    expect(normalizeParams(1)).toStrictEqual([{ 0: 1 }, {}, true]);
    expect(normalizeParams('hello')).toStrictEqual([{ 0: 'hello' }, {}, true]);
  });

  it('should accept variadic params', () => {
    expect(normalizeParams(1, 2, 3)).toStrictEqual([{ 0: 1, 1: 2, 2: 3 }, {}, true]);
  });

  it('should accept array params', () => {
    expect(normalizeParams([1, 2, 3])).toStrictEqual([{ 0: 1, 1: 2, 2: 3 }, {}, true]);
  });

  it('should accept object params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' })).toStrictEqual([
      { foo: 'foo', bar: 'bar' },
      {},
      false,
    ]);
  });

  it('should support blob params', () => {
    const blob = new Uint8Array([0x00]);
    const blob2 = new Uint8Array([0x01]);
    expect(normalizeParams(blob)).toStrictEqual([{}, { 0: blob }, true]);
    expect(normalizeParams('hello', blob)).toStrictEqual([{ 0: 'hello' }, { 1: blob }, true]);
    expect(normalizeParams(['hello', blob, 'world', blob2])).toStrictEqual([
      { 0: 'hello', 2: 'world' },
      { 1: blob, 3: blob2 },
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: blob })).toStrictEqual([
      { foo: 'foo' },
      { bar: blob },
      false,
    ]);
  });

  it('special cases - should pass as array params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, 1, 2, 3)).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: 1, 2: 2, 3: 3 },
      {},
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, [1, 2, 3])).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: [1, 2, 3] },
      {},
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, { hello: 'hello' })).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: { hello: 'hello' } },
      {},
      true,
    ]);
  });
});

describe(composeRow, () => {
  it('should compose row', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValues = [1, 'hello', 123];
    expect(composeRow(columnNames, columnValues)).toEqual({
      id: 1,
      value: 'hello',
      intValue: 123,
    });
  });

  it('should throw error when column names and values count mismatch', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValues = [1, 'hello'];
    expect(() => composeRow(columnNames, columnValues)).toThrow();
  });
});

describe(composeRows, () => {
  it('should compose rows', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [
      [1, 'hello', 123],
      [2, 'world', 456],
    ];
    expect(composeRows(columnNames, columnValuesList)).toEqual([
      {
        id: 1,
        value: 'hello',
        intValue: 123,
      },
      {
        id: 2,
        value: 'world',
        intValue: 456,
      },
    ]);
  });

  it('should throw error when column names and values count mismatch', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [[1, 'hello']];
    expect(() => composeRows(columnNames, columnValuesList)).toThrow();
  });

  it('not throw error when column names and values count mismatch only for some partial values', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [
      [1, 'hello', 123],
      [2, 'world'],
    ];
    expect(() => composeRows(columnNames, columnValuesList)).not.toThrow();
    expect(composeRows(columnNames, columnValuesList)).toEqual([
      {
        id: 1,
        value: 'hello',
        intValue: 123,
      },
      {
        id: 2,
        value: 'world',
        intValue: undefined,
      },
    ]);
  });

  it('should return empty array when column values list is empty', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [];
    expect(composeRows(columnNames, columnValuesList)).toEqual([]);
  });
});
