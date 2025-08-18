import {
  appendInternalExpoRouterParams,
  getInternalExpoRouterParams,
  removeInternalExpoRouterParams,
  type InternalExpoRouterParamName,
} from '../navigationParams';

const IS_PREVIEW = '__internal__expo_router_is_preview_navigation' as InternalExpoRouterParamName;

describe(appendInternalExpoRouterParams, () => {
  it.each([
    [undefined, {}],
    [undefined, undefined],
  ])('returns undefined if params = % and expoParams = %p', (params, expoParams) => {
    expect(appendInternalExpoRouterParams(params, expoParams)).toBeUndefined();
  });

  it('appends internal params to empty params', () => {
    expect(appendInternalExpoRouterParams({}, { [IS_PREVIEW]: true })).toEqual({
      [IS_PREVIEW]: true,
      params: { [IS_PREVIEW]: true },
    });

    expect(appendInternalExpoRouterParams({}, { [IS_PREVIEW]: false })).toEqual({
      [IS_PREVIEW]: false,
      params: { [IS_PREVIEW]: false },
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
  it('gets internal params from root', () => {
    const params = { foo: 1, [IS_PREVIEW]: 42 };
    expect(getInternalExpoRouterParams(params)).toEqual({ [IS_PREVIEW]: 42 });
  });

  it('gets internal params from nested params', () => {
    const params = { foo: 1, params: { [IS_PREVIEW]: 'abc' } };
    expect(getInternalExpoRouterParams(params)).toEqual({ [IS_PREVIEW]: 'abc' });
  });

  it('gets internal params from both root and nested, prefers root', () => {
    const params = {
      [IS_PREVIEW]: 'root',
      params: { [IS_PREVIEW]: 'nested' },
    };
    expect(getInternalExpoRouterParams(params)).toEqual({
      [IS_PREVIEW]: 'root',
    });
  });

  it('returns empty object if no internal params', () => {
    expect(getInternalExpoRouterParams({ foo: 1 })).toEqual({});
    expect(getInternalExpoRouterParams(undefined)).toEqual({});
  });
});

describe(removeInternalExpoRouterParams, () => {
  it('removes internal params from root', () => {
    const params = { foo: 1, [IS_PREVIEW]: 3 };
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
      params: { [IS_PREVIEW]: 3, bar: 5 },
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
    const params = { [IS_PREVIEW]: 2 };
    expect(removeInternalExpoRouterParams(params)).toEqual({});
  });

  it('removes "params" key if nested params become empty', () => {
    const params = { foo: 1, params: { [IS_PREVIEW]: 2 } };
    expect(removeInternalExpoRouterParams(params)).toEqual({ foo: 1 });
  });
});
