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

describe(routeToScreen, () => {
  it(`should support overriding getId`, () => {
    const overrideId = `override-${nanoid()}`;
    const screen = routeToScreen(route, { getId: () => overrideId });

    expect(screen.props.getId()).toEqual(overrideId);
  });
});
