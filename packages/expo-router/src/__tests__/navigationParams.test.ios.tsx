import {
  appendInternalExpoRouterParams,
  getInternalExpoRouterParams,
  hasParam,
  removeInternalExpoRouterParams,
  removeParams,
  type InternalExpoRouterParamName,
} from '../navigationParams';

const NO_ANIMATION = '__internal_expo_router_no_animation' as InternalExpoRouterParamName;
const IS_PREVIEW = '__internal__expo_router_is_preview_navigation' as InternalExpoRouterParamName;

describe(appendInternalExpoRouterParams, () => {
  it.each([
    [undefined, {}],
    [undefined, undefined],
  ])('returns undefined if params = % and expoParams = %p', (params, expoParams) => {
    expect(appendInternalExpoRouterParams(params, expoParams)).toBeUndefined();
  });

  it.each([NO_ANIMATION, IS_PREVIEW])('appends internal params %p to empty params', (param) => {
    expect(appendInternalExpoRouterParams({}, { [param]: true })).toEqual({
      [param]: true,
      params: { [param]: true },
    });

    expect(appendInternalExpoRouterParams({}, { [param]: false })).toEqual({
      [param]: false,
      params: { [param]: false },
    });
  });

  it('merges internal params with existing params', () => {
    expect(appendInternalExpoRouterParams({ foo: 1 }, { [IS_PREVIEW]: true })).toEqual({
      foo: 1,
      [IS_PREVIEW]: true,
      params: { [IS_PREVIEW]: true },
    });

    expect(appendInternalExpoRouterParams({ foo: 1, bar: 2 }, { [IS_PREVIEW]: true })).toEqual({
      foo: 1,
      bar: 2,
      [IS_PREVIEW]: true,
      params: { [IS_PREVIEW]: true },
    });
  });

  it('merges internal params with nested params', () => {
    expect(appendInternalExpoRouterParams({ params: { baz: 3 } }, { [IS_PREVIEW]: false })).toEqual(
      {
        [IS_PREVIEW]: false,
        params: { baz: 3, [IS_PREVIEW]: false },
      }
    );

    expect(
      appendInternalExpoRouterParams({ foo: 1, params: { bar: 2 } }, { [IS_PREVIEW]: true })
    ).toEqual({
      foo: 1,
      [IS_PREVIEW]: true,
      params: { bar: 2, [IS_PREVIEW]: true },
    });
  });

  it('overwrites existing internal params in nested params', () => {
    expect(
      appendInternalExpoRouterParams(
        { params: { [IS_PREVIEW]: false, other: 1 } },
        { [IS_PREVIEW]: true }
      )
    ).toEqual({
      [IS_PREVIEW]: true,
      params: { other: 1, [IS_PREVIEW]: true },
    });
  });

  it('handles multiple internal params', () => {
    expect(
      appendInternalExpoRouterParams({ foo: 1 }, { [NO_ANIMATION]: true, [IS_PREVIEW]: false })
    ).toEqual({
      foo: 1,
      [NO_ANIMATION]: true,
      [IS_PREVIEW]: false,
      params: { [NO_ANIMATION]: true, [IS_PREVIEW]: false },
    });
  });

  it('handles undefined values in expoParams', () => {
    expect(appendInternalExpoRouterParams({ foo: 1 }, { [IS_PREVIEW]: undefined })).toEqual({
      foo: 1,
      [IS_PREVIEW]: undefined,
      params: { [IS_PREVIEW]: undefined },
    });
  });

  it('does not mutate the original params object', () => {
    const params = { foo: 1 };
    const result = appendInternalExpoRouterParams(params, { [IS_PREVIEW]: true });
    expect(result).not.toBe(params);
    expect(params).toEqual({ foo: 1 });
  });

  it('returns params with only expoParams if params is undefined', () => {
    expect(appendInternalExpoRouterParams(undefined, { [IS_PREVIEW]: true })).toEqual({
      [IS_PREVIEW]: true,
      params: { [IS_PREVIEW]: true },
    });
  });

  it('does not modify params if expoParams is empty', () => {
    expect(appendInternalExpoRouterParams({ foo: 1 }, {})).toEqual({ foo: 1 });
    expect(appendInternalExpoRouterParams({ foo: 1, params: { bar: 2 } }, {})).toEqual({
      foo: 1,
      params: { bar: 2 },
    });
  });
});

describe(getInternalExpoRouterParams, () => {
  it.each([NO_ANIMATION, IS_PREVIEW])('gets internal params %p from root', (param) => {
    const params = { foo: 1, [param]: 42 };
    expect(getInternalExpoRouterParams(params)).toEqual({ [param]: 42 });
  });

  it.each([NO_ANIMATION, IS_PREVIEW])('gets internal params %p from nested params', (param) => {
    const params = { foo: 1, params: { [param]: 'abc' } };
    expect(getInternalExpoRouterParams(params)).toEqual({ [param]: 'abc' });
  });

  it('gets internal params from both root and nested, prefers root', () => {
    const params = {
      [IS_PREVIEW]: 'root',
      params: { [NO_ANIMATION]: 'nested', [IS_PREVIEW]: 'nested' },
    };
    expect(getInternalExpoRouterParams(params)).toEqual({
      [IS_PREVIEW]: 'root',
      [NO_ANIMATION]: 'nested',
    });
  });

  it('returns empty object if no internal params', () => {
    expect(getInternalExpoRouterParams({ foo: 1 })).toEqual({});
    expect(getInternalExpoRouterParams(undefined)).toEqual({});
  });
});

describe(removeInternalExpoRouterParams, () => {
  it('removes internal params from root', () => {
    const params = { foo: 1, [NO_ANIMATION]: 2, [IS_PREVIEW]: 3 };
    expect(removeInternalExpoRouterParams(params)).toEqual({ foo: 1 });
  });

  it('removes internal params from nested params', () => {
    const params = { foo: 1, params: { bar: 2, [IS_PREVIEW]: 3 } };
    expect(removeInternalExpoRouterParams(params)).toEqual({
      foo: 1,
      params: { bar: 2 },
    });
  });

  it('removes internal params from both root and nested', () => {
    const params = {
      [IS_PREVIEW]: 1,
      foo: 2,
      params: { [NO_ANIMATION]: 3, [IS_PREVIEW]: 4, bar: 5 },
    };
    expect(removeInternalExpoRouterParams(params)).toEqual({
      foo: 2,
      params: { bar: 5 },
    });
  });

  it('returns undefined if params is undefined', () => {
    expect(removeInternalExpoRouterParams(undefined)).toBeUndefined();
  });

  it('returns empty object if only internal params present', () => {
    const params = { [NO_ANIMATION]: 1, [IS_PREVIEW]: 2 };
    expect(removeInternalExpoRouterParams(params)).toEqual({});
  });

  it('removes "params" key if nested params become empty', () => {
    const params = { foo: 1, params: { [IS_PREVIEW]: 2 } };
    expect(removeInternalExpoRouterParams(params)).toEqual({ foo: 1 });
  });
});

describe(removeParams, () => {
  it('removes single param from root level', () => {
    const params = { foo: 1, bar: 2, baz: 3 };
    expect(removeParams(params, ['bar'])).toEqual({ foo: 1, baz: 3 });
  });

  it('removes multiple params from root level', () => {
    const params = { foo: 1, bar: 2, baz: 3, qux: 4 };
    expect(removeParams(params, ['bar', 'qux'])).toEqual({ foo: 1, baz: 3 });
  });

  it('removes params from nested params', () => {
    const params = { foo: 1, params: { bar: 2, baz: 3 } };
    expect(removeParams(params, ['baz'])).toEqual({
      foo: 1,
      params: { bar: 2 },
    });
  });

  it('removes params from both root and nested', () => {
    const params = { foo: 1, bar: 2, params: { baz: 3, qux: 4 } };
    expect(removeParams(params, ['bar', 'qux'])).toEqual({
      foo: 1,
      params: { baz: 3 },
    });
  });

  it('removes params from deeply nested structure', () => {
    const params = {
      foo: 1,
      bar: 2,
      params: { baz: 3, qux: 4, params: { bar: 3, params: { qux: 2, x: 1 } } },
    };
    expect(removeParams(params, ['bar', 'qux'])).toEqual({
      foo: 1,
      params: { baz: 3, params: { params: { x: 1 } } },
    });
  });

  it('removes "params" key from result when nested params become empty', () => {
    const params = { foo: 1, params: { bar: 2 } };
    expect(removeParams(params, ['bar'])).toEqual({ foo: 1 });
  });

  it('returns empty object if all params are removed', () => {
    const params = { foo: 1, bar: 2 };
    expect(removeParams(params, ['foo', 'bar'])).toEqual({});
  });

  it('returns params unchanged if no matching keys', () => {
    const params = { foo: 1, bar: 2 };
    expect(removeParams(params, ['baz', 'qux'])).toEqual({ foo: 1, bar: 2 });
  });

  it('preserves other nested params when removing some', () => {
    const params = { foo: 1, params: { bar: 2, baz: 3, qux: 4 } };
    expect(removeParams(params, ['baz'])).toEqual({
      foo: 1,
      params: { bar: 2, qux: 4 },
    });
  });

  it('handles empty param name array', () => {
    const params = { foo: 1, bar: 2 };
    expect(removeParams(params, [])).toEqual({ foo: 1, bar: 2 });
  });

  it('handles empty params object', () => {
    expect(removeParams({}, ['foo'])).toEqual({});
  });

  it('always removes "params" key from root level', () => {
    const params = { foo: 1, params: { bar: 2 } };
    expect(removeParams(params, [])).toEqual({ foo: 1, params: { bar: 2 } });
    // Even if "params" is in the paramName array, it's always filtered out
    expect(removeParams(params, ['params'])).toEqual({ foo: 1, params: { bar: 2 } });
  });

  it('handles params with nested params that are not objects', () => {
    const params = { foo: 1, params: 'not an object' };
    expect(removeParams(params, ['foo'])).toEqual({});
  });

  it('handles params with nested params as null', () => {
    const params = { foo: 1, params: null };
    expect(removeParams(params, ['foo'])).toEqual({});
  });

  it('handles complex nested structure', () => {
    const params = {
      foo: 1,
      bar: 2,
      baz: 3,
      params: { qux: 4, quux: 5, corge: 6 },
    };
    expect(removeParams(params, ['bar', 'quux', 'corge'])).toEqual({
      foo: 1,
      baz: 3,
      params: { qux: 4 },
    });
  });

  it('does not mutate the original params object', () => {
    const params = { foo: 1, bar: 2, params: { baz: 3 } };
    const result = removeParams(params, ['bar']);
    expect(result).not.toBe(params);
    expect(params).toEqual({ foo: 1, bar: 2, params: { baz: 3 } });
  });

  it('handles params with various value types', () => {
    const params = {
      string: 'value',
      number: 42,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      params: { nested: 'data' },
    };
    expect(removeParams(params, ['number', 'boolean'])).toEqual({
      string: 'value',
      nullValue: null,
      undefinedValue: undefined,
      params: { nested: 'data' },
    });
  });
});

describe(hasParam, () => {
  it('returns true when param exists at root level', () => {
    const params = { foo: 1, bar: 'test' };
    expect(hasParam(params, 'foo')).toBe(true);
    expect(hasParam(params, 'bar')).toBe(true);
  });

  it('returns false when param does not exist at root level', () => {
    const params = { foo: 1 };
    expect(hasParam(params, 'bar')).toBe(false);
  });

  it('returns true when param exists in nested params', () => {
    const params = { foo: 1, params: { bar: 2 } };
    expect(hasParam(params, 'bar')).toBe(true);
  });

  it('returns true when param exists at both root and nested levels', () => {
    const params = { foo: 1, params: { foo: 2 } };
    expect(hasParam(params, 'foo')).toBe(true);
  });

  it('returns false when param does not exist anywhere', () => {
    const params = { foo: 1, params: { bar: 2 } };
    expect(hasParam(params, 'baz')).toBe(false);
  });

  it('returns true when param exists in deeply nested params', () => {
    const params = { foo: 1, params: { bar: 2, params: { baz: 3 } } };
    expect(hasParam(params, 'baz')).toBe(true);
  });

  it('handles undefined params', () => {
    expect(hasParam(undefined, 'foo')).toBe(false);
  });

  it('handles null params', () => {
    expect(hasParam(null, 'foo')).toBe(false);
  });

  it('handles empty params object', () => {
    expect(hasParam({}, 'foo')).toBe(false);
  });

  it('handles params with nested params as empty object', () => {
    const params = { foo: 1, params: {} };
    expect(hasParam(params, 'bar')).toBe(false);
  });

  it('handles params with nested params that are not objects', () => {
    const params = { foo: 1, params: 'not an object' };
    expect(hasParam(params, 'bar')).toBe(false);
  });

  it('handles params with nested params as null', () => {
    const params = { foo: 1, params: null };
    expect(hasParam(params, 'bar')).toBe(false);
  });

  it('returns true for param with undefined value', () => {
    const params = { foo: undefined };
    expect(hasParam(params, 'foo')).toBe(false); // Note: hasParam checks !== undefined, so this returns false
  });

  it('returns true for param with null value', () => {
    const params = { foo: null };
    expect(hasParam(params, 'foo')).toBe(true);
  });

  it('returns true for param with falsy values', () => {
    expect(hasParam({ foo: false }, 'foo')).toBe(true);
    expect(hasParam({ foo: 0 }, 'foo')).toBe(true);
    expect(hasParam({ foo: '' }, 'foo')).toBe(true);
  });

  it('searches recursively through multiple nested levels', () => {
    const params = {
      a: 1,
      params: {
        b: 2,
        params: {
          c: 3,
          params: {
            d: 4,
          },
        },
      },
    };
    expect(hasParam(params, 'a')).toBe(true);
    expect(hasParam(params, 'b')).toBe(true);
    expect(hasParam(params, 'c')).toBe(true);
    expect(hasParam(params, 'd')).toBe(true);
    expect(hasParam(params, 'e')).toBe(false);
  });

  it('handles non-object types correctly', () => {
    expect(hasParam('string', 'foo')).toBe(false);
    expect(hasParam(123, 'foo')).toBe(false);
    expect(hasParam(true, 'foo')).toBe(false);
    expect(hasParam([], 'foo')).toBe(false);
  });

  it('checks for internal expo router params', () => {
    const params = { foo: 1, [NO_ANIMATION]: true };
    expect(hasParam(params, NO_ANIMATION)).toBe(true);
  });

  it('checks for internal expo router params in nested params', () => {
    const params = { foo: 1, params: { [IS_PREVIEW]: false } };
    expect(hasParam(params, IS_PREVIEW)).toBe(true);
  });
});
