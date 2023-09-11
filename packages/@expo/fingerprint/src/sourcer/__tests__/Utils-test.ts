import { stringifyJsonSorted } from '../Utils';

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
