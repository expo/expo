import path from 'node:path';

import { relativizeJsonPaths, stringifyJsonSorted } from '../Utils';

describe(stringifyJsonSorted, () => {
  it('should support primitive types', () => {
    expect(stringifyJsonSorted(1)).toEqual('1');
    expect(stringifyJsonSorted('s')).toEqual('"s"');
    expect(stringifyJsonSorted(true)).toEqual('true');
    expect(stringifyJsonSorted(false)).toEqual('false');
    expect(stringifyJsonSorted(null)).toEqual('null');
  });

  it('should sort array', () => {
    expect(stringifyJsonSorted([])).toEqual('[]');
    expect(stringifyJsonSorted([2, 'a', 1, false, 6, 4, 5, 's', 3, 0, true, 1, 1])).toEqual(
      '["a","s",0,1,1,1,2,3,4,5,6,false,true]'
    );
  });

  it('should sort object by keys', () => {
    expect(stringifyJsonSorted({})).toEqual('{}');
    expect(stringifyJsonSorted({ c: '1', a: '3', b: '2' })).toEqual('{"a":"3","b":"2","c":"1"}');
    expect(
      stringifyJsonSorted({ c: '1', a: '3', b: '2', nested: { c: '1', a: '3', b: '2' } })
    ).toEqual('{"a":"3","b":"2","c":"1","nested":{"a":"3","b":"2","c":"1"}}');
  });

  it('should support mixed array/object', () => {
    expect(stringifyJsonSorted([{ b: '2' }, { c: '1' }, { a: '3' }])).toEqual(
      '[{"a":"3"},{"b":"2"},{"c":"1"}]'
    );
    expect(stringifyJsonSorted([{ b: '2' }, {}, { a: '3' }, null])).toEqual(
      '[null,{"a":"3"},{"b":"2"},{}]'
    );
    expect(
      stringifyJsonSorted({
        array: [3, 2, 1],
        nestedData: { nestedArray: [{ b: '2' }, { c: '1' }, { a: '3' }] },
      })
    ).toEqual('{"array":[1,2,3],"nestedData":{"nestedArray":[{"a":"3"},{"b":"2"},{"c":"1"}]}}');
  });
});

describe(relativizeJsonPaths, () => {
  const projectRoot = '/Users/username/app';

  it('should relativize absolute paths in a string', () => {
    const absolutePath = path.join(projectRoot, 'src/utils.ts');
    const result = relativizeJsonPaths(absolutePath, projectRoot);
    expect(result).toBe('src/utils.ts');
  });

  it('should relativize absolute paths in an array', () => {
    const absolutePaths = [
      path.join(projectRoot, 'src/utils.ts'),
      path.join(projectRoot, 'assets/test.json'),
    ];
    const result = relativizeJsonPaths(absolutePaths, projectRoot);
    expect(result).toEqual(['src/utils.ts', 'assets/test.json']);
  });

  it('should relativize absolute paths in an object', () => {
    const absolutePaths = {
      file1: path.join(projectRoot, 'src/utils.ts'),
      file2: path.join(projectRoot, 'assets/test.json'),
    };
    const result = relativizeJsonPaths(absolutePaths, projectRoot);
    expect(result).toEqual({
      file1: 'src/utils.ts',
      file2: 'assets/test.json',
    });
  });

  it('should handle nested structures', () => {
    const nestedStructure = {
      files: [
        path.join(projectRoot, 'src/utils.ts'),
        {
          file: path.join(projectRoot, 'assets/test.json'),
        },
      ],
    };
    const result = relativizeJsonPaths(nestedStructure, projectRoot);
    expect(result).toEqual({
      files: [
        'src/utils.ts',
        {
          file: 'assets/test.json',
        },
      ],
    });
  });

  it('should return non-path strings unchanged', () => {
    const nonPathString = 'This is a test string';
    const result = relativizeJsonPaths(nonPathString, projectRoot);
    expect(result).toBe(nonPathString);
  });

  it('should return non-path objects unchanged', () => {
    const nonPathObject = { key: 'value' };
    const result = relativizeJsonPaths(nonPathObject, projectRoot);
    expect(result).toEqual(nonPathObject);
  });

  it('should return non-path arrays unchanged', () => {
    const nonPathArray = ['value1', 'value2'];
    const result = relativizeJsonPaths(nonPathArray, projectRoot);
    expect(result).toEqual(nonPathArray);
  });

  it('should return function unchanged', () => {
    const func = () => {};
    const result = relativizeJsonPaths(func, projectRoot);
    expect(result).toBe(func);
  });
});
