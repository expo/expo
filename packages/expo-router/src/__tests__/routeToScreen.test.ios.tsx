import { nanoid } from 'nanoid/non-secure';

import { RouteNode } from '../Route';
import { routeToScreen } from '../useScreens';

const route: RouteNode = {
  children: [],
  contextKey: './index.tsx',
  dynamic: null,
  loadRoute: () => ({}),
  route: 'index',
  type: 'route',
};

const pushKeyParam = '__EXPO_ROUTER_key';

describe(routeToScreen, () => {
  it(`should wrap getId and remove internal key param, even when undefined is passed`, () => {
    const screen = routeToScreen(route, { getId: undefined });

    expect(screen.props.getId).toBeTruthy();

    // test wrapper logic of removing key param
    const key = nanoid();
    const params = {
      [pushKeyParam]: key,
    };
    expect(screen.props.getId({ params })).toEqual(key);
    expect(params[pushKeyParam]).toBeFalsy();
  });

  it(`should support overriding getId`, () => {
    const overrideId = `override-${nanoid()}`;
    const screen = routeToScreen(route, { getId: () => overrideId });

    expect(screen.props.getId()).toEqual(overrideId);
  });

  it(`should support overriding getId when push key is present`, () => {
    const overrideId = `override-${nanoid()}`;
    const screen = routeToScreen(route, { getId: () => overrideId });

    const params = {
      [pushKeyParam]: nanoid(),
    };
    expect(screen.props.getId({ params })).toEqual(overrideId);
  });
});
