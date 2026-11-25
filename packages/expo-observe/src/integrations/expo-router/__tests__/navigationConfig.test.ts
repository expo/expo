import { getNavigationMetricParams, getNavigationRouteParams } from '../../navigationConfig';

describe('expo-router navigation config', () => {
  it('filters configured route and query param keys', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(
      getNavigationRouteParams(
        { filteredParams: ['userId', 'token', 42 as unknown as string] },
        { userId: '1', tab: 'posts', token: circular }
      ).routeParams
    ).toEqual({ tab: 'posts' });
  });

  it('returns an empty object when every param is filtered', () => {
    expect(
      getNavigationRouteParams({ filteredParams: ['userId'] }, { userId: '1' }).routeParams
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

  it('keeps params and URL visible by default', () => {
    const params = { userId: '1' };
    expect(getNavigationRouteParams(true, params).routeParams).toEqual(params);
    expect(getNavigationMetricParams(true, params, '/users/1')).toEqual({
      routeParams: params,
      url: '/users/1',
    });
  });

  it('keeps the URL visible when no route param is filtered', () => {
    expect(
      getNavigationMetricParams({ filteredParams: ['token'] }, { tab: 'posts' }, '/users/1')
    ).toEqual({
      routeParams: { tab: 'posts' },
      url: '/users/1',
    });
  });

  it('hides the URL when a route param is filtered', () => {
    expect(
      getNavigationMetricParams(
        { filteredParams: ['token'] },
        { token: 'secret', tab: 'posts' },
        '/u?token=secret'
      )
    ).toEqual({ routeParams: { tab: 'posts' }, urlHidden: true });
  });

  it('keeps the URL visible when a route param cannot be serialized', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(getNavigationMetricParams(true, { id: '42', circular }, '/users/42')).toEqual({
      routeParams: { id: '42' },
      url: '/users/42',
    });
  });
});
