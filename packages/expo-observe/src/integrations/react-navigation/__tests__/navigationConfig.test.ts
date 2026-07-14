import { getNavigationRouteParams } from '../../navigationConfig';

describe('react-navigation navigation config', () => {
  it('filters configured route param keys', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(
      getNavigationRouteParams(
        { filteredParams: ['userId', 'token', null as unknown as string] },
        { userId: '1', tab: 'posts', token: circular }
      ).routeParams
    ).toEqual({ tab: 'posts' });
  });

  it('returns an empty object when every param is filtered', () => {
    expect(
      getNavigationRouteParams({ filteredParams: ['token'] }, { token: 'secret' }).routeParams
    ).toEqual({});
  });

  it('omits only route param values that cannot be serialized', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const symbol = Symbol('value');

    expect(
      getNavigationRouteParams(true, {
        id: '42',
        callback: () => {},
        circular,
        nested: { ok: true, callback: () => {} },
        none: null,
        symbol,
        unset: undefined,
      })
    ).toEqual({ routeParams: { id: '42', nested: { ok: true }, none: null } });
  });

  it('keeps params by default', () => {
    const params = { userId: '1' };
    expect(getNavigationRouteParams(true, params).routeParams).toEqual(params);
  });

  it('sets urlHidden when a route param is filtered', () => {
    expect(getNavigationRouteParams({ filteredParams: ['token'] }, { token: 'secret', tab: 'posts' })).toEqual({
      routeParams: { tab: 'posts' },
      urlHidden: true,
    });
  });
});
