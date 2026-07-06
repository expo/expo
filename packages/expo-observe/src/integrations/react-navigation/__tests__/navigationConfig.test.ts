import { getNavigationRouteParams } from '../../navigationConfig';

describe('react-navigation navigation config', () => {
  it('filters configured route param keys', () => {
    expect(
      getNavigationRouteParams(
        { filteredParams: ['userId', 'token', null as unknown as string] },
        { userId: '1', tab: 'posts', token: 'secret' }
      ).routeParams
    ).toEqual({ tab: 'posts' });
  });

  it('returns an empty object when every param is filtered', () => {
    expect(
      getNavigationRouteParams({ filteredParams: ['token'] }, { token: 'secret' }).routeParams
    ).toEqual({});
  });

  it('keeps params by default', () => {
    const params = { userId: '1' };
    expect(getNavigationRouteParams(true, params).routeParams).toBe(params);
  });
});
